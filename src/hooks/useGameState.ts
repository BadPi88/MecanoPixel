import { useReducer } from 'react';
import { pickPerkChoices, PERKS_EVERY_N_RAMPS, trimActivePerks } from '../data/perks';
import { pickRandomEvent } from '../data/events';
import { SHOP_ITEMS } from '../data/shop';
import { BONUS_WORD_COINS } from '../data/run';
import {
  initialGameState,
  type FallingWord,
  type GameAction,
  type GameState,
} from '../types/game';
import { MAX_LIVES } from '../types/perks';
import type { ShopItemId } from '../types/run';
import { wordsPerSecondFromSpawnInterval } from '../utils/intensity';
import { calculateRunCoinsFromScore } from '../utils/metaCoins';
import {
  advanceToNextFloor,
  buildFloorClearState,
  getFloorTierOffset,
  shouldCompleteFloor,
} from '../utils/runTransitions';
import { getInitialLives, getRunnerModifiers } from '../utils/runnerModifiers';
import { getBossWord } from '../utils/wordSpawn';
import {
  applyBrokenClockSkip,
  applyPerkSelection,
  calculatePerkWordScore,
  consumePerkCharge,
  expirePerks,
  getEffectiveDifficulty,
  hasPerkWithCharge,
  removePerk,
} from '../utils/perkModifiers';
import { calculateMissPenalty } from '../utils/scoring';
import { createWordId } from './useGameStateHelpers';

export { createWordId } from './useGameStateHelpers';

const GROUND_OFFSET = 48;
const TRAP_PENALTY = 40;
const BOSS_FALL_SPEED = 25;

function initBossWord(state: GameState): FallingWord {
  const tierOffset = getFloorTierOffset(state);
  const text = getBossWord(state.elapsedMs, tierOffset);
  return {
    id: createWordId(),
    text,
    x: 120,
    y: 40,
    kind: 'normal',
  };
}

function applyShopItem(state: GameState, itemId: ShopItemId): GameState | null {
  const item = SHOP_ITEMS.find((i) => i.id === itemId);
  if (!item || state.runCoins < item.price) return null;

  let next: GameState = {
    ...state,
    runCoins: state.runCoins - item.price,
  };

  switch (itemId) {
    case 'heal':
      if (next.lives >= MAX_LIVES) return null;
      next.lives += 1;
      break;
    case 'random_perk': {
      const choices = pickPerkChoices(next.activePerks, 1);
      if (choices.length === 0) return null;
      const perkPartial = applyPerkSelection(next, choices[0]);
      next = { ...next, ...perkPartial, perksHistory: [...next.perksHistory, choices[0]] };
      break;
    }
    case 'purge_all':
      next.words = [];
      break;
    case 'double_buff':
      next.activePerks = trimActivePerks([
        ...next.activePerks.filter((p) => p.id !== 'double_score'),
        { id: 'double_score', expiresAtMs: next.elapsedMs + 20_000 },
      ]);
      break;
    default:
      return null;
  }

  return next;
}

function applyEventChoice(state: GameState, choice: 'A' | 'B'): GameState {
  const event = state.pendingEvent ?? pickRandomEvent();
  const effect = choice === 'A' ? event.effectA : event.effectB;
  let next: GameState = { ...state };

  switch (effect) {
    case 'speed_ramp':
      next.difficultyTierOffset = Math.max(0, next.difficultyTierOffset - 1);
      break;
    case 'coins_150':
      next.runCoins += 150;
      break;
    case 'coins_80':
      next.runCoins += 80;
      break;
    case 'coins_50':
      next.runCoins += 50;
      break;
    case 'lose_life_rare_perk': {
      if (next.lives > 1) {
        next.lives -= 1;
        const rare = pickPerkChoices(next.activePerks, 1);
        if (rare[0]) {
          const p = applyPerkSelection(next, rare[0]);
          next = { ...next, ...p, perksHistory: [...next.perksHistory, rare[0]] };
        }
        if (next.lives <= 0) {
          next.status = 'gameOver';
          next.deathCause = 'event';
        }
      }
      break;
    }
    case 'no_traps_next':
      next.noTrapsNextFloor = true;
      break;
    case 'nothing':
    default:
      break;
  }

  if (next.status === 'gameOver') {
    return { ...next, pendingEvent: null };
  }

  const advanced = advanceToNextFloor(next);
  return {
    ...next,
    ...advanced,
    noTrapsNextFloor: effect === 'no_traps_next' ? true : next.noTrapsNextFloor,
  };
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'BEGIN_RUN':
      return {
        ...initialGameState,
        status: 'runnerPick',
      };

    case 'SELECT_RUNNER': {
      const runnerId = action.payload;
      const lives = getInitialLives(runnerId);
      const trapIgnore = getRunnerModifiers(runnerId).trapIgnoreCharges;
      return {
        ...initialGameState,
        status: 'playing',
        startTime: Date.now(),
        lives,
        runnerId,
        trapIgnoreRemaining: trapIgnore,
      };
    }

    case 'RETRY':
      return { ...initialGameState, status: 'runnerPick' };

    case 'GO_HOME':
      return { ...initialGameState };

    case 'TOGGLE_PAUSE':
      if (state.status === 'playing') return { ...state, status: 'paused' };
      if (state.status === 'paused') return { ...state, status: 'playing' };
      return state;

    case 'TICK': {
      if (state.status !== 'playing') return state;

      const { deltaMs, fallSpeed } = action.payload;
      const deltaSec = deltaMs / 1000;
      const newElapsed = state.elapsedMs + deltaMs;
      const activePerks = expirePerks(state.activePerks, newElapsed);
      const frozen = newElapsed < state.frozenUntilMs;

      const updatedWords = state.words.map((word) => {
        if (word.id === state.poppingWordId) return word;
        if (frozen) return word;
        return { ...word, y: word.y + fallSpeed * deltaSec };
      });

      const effective = getEffectiveDifficulty(
        newElapsed,
        getFloorTierOffset(state),
        activePerks,
        state.frozenUntilMs,
        state.runnerId,
      );

      return {
        ...state,
        elapsedMs: newElapsed,
        words: updatedWords,
        activePerks,
        maxWordsPerSecond: Math.max(
          state.maxWordsPerSecond,
          wordsPerSecondFromSpawnInterval(effective.spawnInterval),
        ),
      };
    }

    case 'BOSS_TICK': {
      if (state.status !== 'boss' || !state.bossWord) return state;
      const deltaSec = action.payload.deltaMs / 1000;
      const bossWord = {
        ...state.bossWord,
        y: state.bossWord.y + BOSS_FALL_SPEED * deltaSec,
      };
      const newElapsed = state.elapsedMs + action.payload.deltaMs;
      return { ...state, bossWord, elapsedMs: newElapsed };
    }

    case 'SPAWN_WORD':
      if (state.status !== 'playing') return state;
      return { ...state, words: [...state.words, action.payload] };

    case 'TYPE_CHAR':
      if (state.status !== 'playing' && state.status !== 'boss') return state;
      return { ...state, input: state.input + action.payload.toLowerCase() };

    case 'BACKSPACE':
      if (state.status !== 'playing' && state.status !== 'boss') return state;
      return { ...state, input: state.input.slice(0, -1) };

    case 'SUBMIT': {
      if ((state.status !== 'playing' && state.status !== 'boss') || !state.input)
        return state;

      const trimmed = state.input.trim().toLowerCase();

      if (state.status === 'boss' && state.bossWord) {
        if (trimmed !== state.bossWord.text) {
          return {
            ...state,
            input: '',
            combo: 0,
            score: Math.max(0, state.score - calculateMissPenalty()),
          };
        }
        const rareChoices = pickPerkChoices(state.activePerks);
        const rare = rareChoices[0];
        const perkPartial = rare ? applyPerkSelection(state, rare) : {};
        const coins = Math.round(100 * getRunnerModifiers(state.runnerId).runCoinsMult);
        return {
          ...state,
          ...perkPartial,
          runCoins: state.runCoins + coins,
          perksHistory: rare ? [...state.perksHistory, rare] : state.perksHistory,
          bossWord: null,
          input: '',
          ...advanceToNextFloor(state),
        };
      }

      const matchIndex = state.words.findIndex((w) => w.text === trimmed);

      if (matchIndex === -1) {
        let activePerks = state.activePerks;
        let combo = 0;
        if (hasPerkWithCharge(activePerks, 'combo_safe')) {
          activePerks = consumePerkCharge(activePerks, 'combo_safe');
          combo = state.combo;
        } else {
          activePerks = removePerk(activePerks, 'golden_streak');
        }
        return {
          ...state,
          input: '',
          combo,
          activePerks,
          score: Math.max(0, state.score - calculateMissPenalty()),
        };
      }

      const matched = state.words[matchIndex];

      if (matched.kind === 'trap') {
        if (state.trapIgnoreRemaining > 0) {
          return {
            ...state,
            input: '',
            trapIgnoreRemaining: state.trapIgnoreRemaining - 1,
            words: state.words.filter((w) => w.id !== matched.id),
          };
        }
        return {
          ...state,
          input: '',
          combo: 0,
          score: Math.max(0, state.score - TRAP_PENALTY),
          words: state.words.filter((w) => w.id !== matched.id),
          activePerks: removePerk(state.activePerks, 'golden_streak'),
        };
      }

      const groundHeight =
        typeof window !== 'undefined' ? window.innerHeight - GROUND_OFFSET : 600;

      if (matched.kind === 'bonus') {
        const coins = Math.round(
          BONUS_WORD_COINS * getRunnerModifiers(state.runnerId).runCoinsMult,
        );
        return {
          ...state,
          input: '',
          runCoins: state.runCoins + coins,
          words: state.words.filter((w) => w.id !== matched.id),
          poppingWordId: matched.id,
        };
      }

      const topThird = groundHeight / 3;
      const inTop = matched.y < topThird;
      const snipePerk = hasPerkWithCharge(state.activePerks, 'snipe');
      const useSnipe = Boolean(snipePerk && inTop);
      let activePerks = state.activePerks;
      if (useSnipe) activePerks = consumePerkCharge(activePerks, 'snipe');

      let points = calculatePerkWordScore(
        matched.text.length,
        state.combo,
        matched.y,
        groundHeight,
        activePerks,
        state.elapsedMs,
        useSnipe,
        state.runnerId,
      );
      if (matched.kind === 'bomb') points *= 2;

      const runCoinGain = calculateRunCoinsFromScore(points);
      const runCoins = state.runCoins + Math.round(
        runCoinGain * getRunnerModifiers(state.runnerId).runCoinsMult,
      );

      return {
        ...state,
        input: '',
        combo: state.combo + 1,
        score: state.score + points,
        runCoins,
        correctChars: state.correctChars + matched.text.length,
        wordsTyped: state.wordsTyped + 1,
        poppingWordId: matched.id,
        activePerks,
      };
    }

    case 'WORD_HIT_GROUND': {
      if (state.status !== 'playing') return state;
      if (state.poppingWordId === action.payload) return state;
      const word = state.words.find((w) => w.id === action.payload);
      if (!word) return state;

      if (word.kind === 'trap' || word.kind === 'bonus') {
        return {
          ...state,
          words: state.words.filter((w) => w.id !== action.payload),
        };
      }

      if (hasPerkWithCharge(state.activePerks, 'shield')) {
        return {
          ...state,
          combo: 0,
          words: state.words.filter((w) => w.id !== action.payload),
          activePerks: consumePerkCharge(state.activePerks, 'shield'),
        };
      }

      const lifeLoss = word.kind === 'bomb' ? 2 : 1;
      const newLives = state.lives - lifeLoss;
      let words = state.words.filter((w) => w.id !== action.payload);

      if (hasPerkWithCharge(state.activePerks, 'safety_net') && newLives > 0) {
        words = words.map((w) => ({ ...w, y: Math.max(0, w.y - 80) }));
      }

      let activePerks = state.activePerks;
      if (hasPerkWithCharge(activePerks, 'safety_net')) {
        activePerks = consumePerkCharge(activePerks, 'safety_net');
      }
      activePerks = removePerk(activePerks, 'golden_streak');

      return {
        ...state,
        lives: newLives,
        combo: 0,
        words,
        activePerks,
        deathCause: word.kind === 'bomb' ? 'bomb' : 'ground',
        status: newLives <= 0 ? 'gameOver' : state.status,
      };
    }

    case 'SPEED_RAMP': {
      const effective = getEffectiveDifficulty(
        state.elapsedMs,
        getFloorTierOffset(state),
        state.activePerks,
        state.frozenUntilMs,
        state.runnerId,
      );
      const rampsThisFloor = state.rampsThisFloor + 1;
      const rampCount = state.rampCount + 1;
      const offerPerk = rampCount >= PERKS_EVERY_N_RAMPS;

      let next: GameState = {
        ...state,
        maxWordsPerSecond: Math.max(
          state.maxWordsPerSecond,
          wordsPerSecondFromSpawnInterval(effective.spawnInterval),
        ),
        showSpeedNotice: true,
        rampBlockedNotice: false,
        rampsThisFloor,
        rampCount: offerPerk ? 0 : rampCount,
        status: offerPerk ? 'perkPick' : 'playing',
        pendingPerkChoice: offerPerk ? pickPerkChoices(state.activePerks) : null,
      };

      if (!offerPerk && shouldCompleteFloor(next)) {
        const cleared = buildFloorClearState(next);
        if (cleared.status === 'boss') {
          return {
            ...next,
            ...cleared,
            bossWord: initBossWord(next),
          };
        }
        return { ...next, ...cleared };
      }

      return next;
    }

    case 'BROKEN_CLOCK_SKIP':
      return { ...state, ...applyBrokenClockSkip(state) };

    case 'SELECT_PERK': {
      const partial = applyPerkSelection(state, action.payload);
      let next: GameState = {
        ...state,
        ...partial,
        perksHistory: [...state.perksHistory, action.payload],
        status: 'playing',
        pendingPerkChoice: null,
      };
      if (shouldCompleteFloor(next)) {
        const cleared = buildFloorClearState(next);
        if (cleared.status === 'boss') {
          return { ...next, ...cleared, bossWord: initBossWord(next) };
        }
        return { ...next, ...cleared };
      }
      return next;
    }

    case 'BOSS_FAIL':
      return {
        ...state,
        status: 'gameOver',
        deathCause: 'boss',
        bossWord: null,
        input: '',
      };

    case 'SHOP_BUY': {
      const result = applyShopItem(state, action.payload);
      if (!result) return state;
      return result;
    }

    case 'SHOP_LEAVE':
      return {
        ...state,
        ...advanceToNextFloor(state),
        noTrapsNextFloor: false,
      };

    case 'EVENT_CHOICE':
      return applyEventChoice(state, action.payload);

    case 'HIDE_SPEED_NOTICE':
      return { ...state, showSpeedNotice: false, rampBlockedNotice: false };

    case 'CLEAR_POP':
      if (!state.poppingWordId) return state;
      return {
        ...state,
        poppingWordId: null,
        words: state.words.filter((w) => w.id !== state.poppingWordId),
      };

    default:
      return state;
  }
}

export function useGameState() {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  return { state, dispatch };
}

export function findPartialMatch(
  words: FallingWord[],
  input: string,
): FallingWord | null {
  if (!input) return null;
  const lower = input.toLowerCase();
  return words.find(
    (w) => w.kind !== 'trap' && w.text.startsWith(lower),
  ) ?? null;
}
