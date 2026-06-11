import { useReducer } from 'react';
import { pickPerkChoices, PERKS_EVERY_N_RAMPS, trimActivePerks } from '../data/perks';
import { pickRandomEvent } from '../data/events';
import { pickRelicChoices } from '../data/relics';
import { SHOP_ITEMS } from '../data/shop';
import { BONUS_WORD_COINS } from '../data/run';
import {
  initialGameState,
  type FallingWord,
  type GameAction,
  type GameState,
  type GameStatus,
} from '../types/game';
import { MAX_LIVES } from '../types/perks';
import type { ShopItemId } from '../types/run';
import type { BossAttackState } from '../types/combat';
import {
  MAX_LETTER_PROJECTILES,
  POS_EFFECT_COOLDOWN_MS,
  ULTIMATE_BACKSPACE_PENALTY,
  ULTIMATE_CLEAN_WORD_BONUS,
  ULTIMATE_MAX_CHARGE,
} from '../types/combat';
import { wordsPerSecondFromSpawnInterval } from '../utils/intensity';
import { calculateRunCoinsFromScore } from '../utils/metaCoins';
import {
  advanceToNextFloor,
  getFloorClearCoins,
  getFloorTierOffset,
  getPostFloorStatus,
  shouldCompleteFloor,
} from '../utils/runTransitions';
import { getInitialLives, getRunnerModifiers } from '../utils/runnerModifiers';
import { getBossWord, morphDisplayText } from '../utils/wordSpawn';
import { applyRelicOnMiss, applyRelicOnSubmit } from '../utils/combatModifiers';
import { hasSynergy } from '../utils/synergyEngine';
import { updateFlowStats } from '../utils/flowDifficulty';
import {
  applyBrokenClockSkip,
  applyPerkSelection,
  calculatePerkWordScore,
  consumePerkCharge,
  expirePerks,
  findLowestWord,
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
const ULTIMATE_CHARGE_PER_CHAR = 1.5;
const ULTIMATE_DEFLECT_BONUS = 5;
const ULTIMATE_FREEZE_MS = 2_000;
const BOSS_BLIND_INTERVAL_MS = 10_000;
const BOSS_BLIND_DURATION_MS = 2_000;
const BOSS_REMAP_DURATION_MS = 15_000;
const BOSS_REMAP_TABLE: Record<string, string> = {
  a: 'z',
  z: 'a',
  s: 'x',
  x: 's',
};
const ADJ_TEMPO_BUFF_MS = 8_000;
const VERB_AOE_FACTOR = 0.7;
const CLEAN_WORD_SCORE_MULT = 1.1;
const PROJECTILE_HEIGHT = 24;

function clampCharge(value: number): number {
  return Math.min(ULTIMATE_MAX_CHARGE, Math.max(0, value));
}

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

/** Configura los ataques de UI del jefe segun el piso. */
function initBossAttack(floor: number, elapsedMs: number): BossAttackState {
  return {
    blind: floor >= 3 && floor !== 6,
    remap: floor >= 6,
    projectiles: floor >= 9,
    startedAtMs: elapsedMs,
    nextBlindAtMs: elapsedMs + BOSS_BLIND_INTERVAL_MS,
    remapUntilMs: floor >= 6 ? elapsedMs + BOSS_REMAP_DURATION_MS : 0,
  };
}

/** Partial de estado al entrar en shop/event/boss tras un piso o reliquia. */
function enterPostFloor(
  state: GameState,
  nextStatus: GameStatus,
): Partial<GameState> {
  if (nextStatus === 'boss') {
    const bossAttack = initBossAttack(state.floor, state.elapsedMs);
    return {
      status: 'boss',
      bossWord: initBossWord(state),
      bossAttack,
      keyRemap: bossAttack.remap ? { ...BOSS_REMAP_TABLE } : null,
      pendingEvent: null,
    };
  }
  if (nextStatus === 'event') {
    return { status: 'event', pendingEvent: pickRandomEvent() };
  }
  return { status: nextStatus, pendingEvent: null };
}

/**
 * Completa el piso actual: monedas, limpieza, y reliquia en pisos pares
 * antes de la pantalla de tienda/evento/jefe.
 */
function completeFloor(state: GameState): GameState {
  const coins = getFloorClearCoins(state);
  const nextStatus = getPostFloorStatus(state.floor);

  const base: GameState = {
    ...state,
    runCoins: state.runCoins + coins,
    words: [],
    letterProjectiles: [],
    input: '',
    rampsThisFloor: 0,
    showSpeedNotice: false,
    backspacesUsedThisWord: 0,
  };

  if (state.floor % 2 === 0) {
    const choices = pickRelicChoices(state.activeRelics);
    if (choices.length > 0) {
      return {
        ...base,
        status: 'relicPick',
        pendingRelicChoice: choices,
        postRelicStatus: nextStatus,
      };
    }
  }

  return { ...base, ...enterPostFloor(base, nextStatus) };
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

/** Efecto de combate segun la categoria gramatical de la palabra escrita. */
function applyPosEffect(state: GameState, word: FallingWord): Partial<GameState> {
  if (!word.pos) return {};
  if (state.elapsedMs - state.lastPosEffectAtMs < POS_EFFECT_COOLDOWN_MS) {
    return {};
  }

  switch (word.pos) {
    case 'verb':
      return {
        lastPosEffectAtMs: state.elapsedMs,
        words: state.words.map((w) =>
          w.id === word.id ? w : { ...w, y: w.y * VERB_AOE_FACTOR },
        ),
      };
    case 'adj':
      return {
        lastPosEffectAtMs: state.elapsedMs,
        tempoBuffUntilMs: state.elapsedMs + ADJ_TEMPO_BUFF_MS,
      };
    case 'noun': {
      const shield = state.activePerks.find((p) => p.id === 'shield');
      const activePerks = shield
        ? state.activePerks.map((p) =>
            p.id === 'shield'
              ? { ...p, charges: Math.min((p.charges ?? 0) + 1, 2) }
              : p,
          )
        : trimActivePerks([...state.activePerks, { id: 'shield' as const, charges: 1 }]);
      return {
        lastPosEffectAtMs: state.elapsedMs,
        activePerks,
      };
    }
    default:
      return {};
  }
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'BEGIN_RUN':
      return {
        ...initialGameState,
        status: 'runnerPick',
      };

    case 'SELECT_RUNNER':
      return {
        ...state,
        runnerId: action.payload,
        status: 'glossaryPick',
      };

    case 'SELECT_GLOSSARY': {
      const runnerId = state.runnerId;
      const lives = getInitialLives(runnerId);
      const trapIgnore = getRunnerModifiers(runnerId).trapIgnoreCharges;
      return {
        ...initialGameState,
        status: 'playing',
        startTime: Date.now(),
        lives,
        runnerId,
        trapIgnoreRemaining: trapIgnore,
        selectedGlossary: action.payload,
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

      const { deltaMs, fallSpeed, groundHeight } = action.payload;
      const deltaSec = deltaMs / 1000;
      const newElapsed = state.elapsedMs + deltaMs;
      let activePerks = expirePerks(state.activePerks, newElapsed);
      const frozen = newElapsed < state.frozenUntilMs;

      let updatedWords = state.words.map((word) => {
        if (word.id === state.poppingWordId) return word;
        let next = word;
        if (!frozen) {
          next = { ...next, y: next.y + fallSpeed * deltaSec };
        }
        if (
          next.modifiers?.includes('shifting') &&
          next.morphAtMs !== undefined &&
          newElapsed >= next.morphAtMs
        ) {
          next = {
            ...next,
            displayText: morphDisplayText(next.text),
            morphAtMs: newElapsed + 3_000,
          };
        }
        return next;
      });

      // Sinergia radar + purga: elimina la palabra mas baja cada 60 s
      let lastPurgeFreeAtMs = state.lastPurgeFreeAtMs;
      if (
        hasSynergy(state, 'radar_purga') &&
        newElapsed - lastPurgeFreeAtMs >= 60_000 &&
        updatedWords.length > 0
      ) {
        const lowest = findLowestWord(updatedWords);
        if (lowest) {
          updatedWords = updatedWords.filter((w) => w.id !== lowest.id);
          lastPurgeFreeAtMs = newElapsed;
        }
      }

      // Proyectiles de letra: mover y resolver impactos contra el suelo
      let lives = state.lives;
      let combo = state.combo;
      let deathCause = state.deathCause;
      const surviving: typeof state.letterProjectiles = [];
      for (const proj of state.letterProjectiles) {
        const newY = frozen ? proj.y : proj.y + proj.vy * deltaSec;
        if (newY >= groundHeight - PROJECTILE_HEIGHT) {
          if (hasPerkWithCharge(activePerks, 'shield')) {
            activePerks = consumePerkCharge(activePerks, 'shield');
          } else {
            lives -= 1;
            combo = 0;
            if (lives <= 0) deathCause = 'projectile';
          }
        } else {
          surviving.push({ ...proj, y: newY });
        }
      }

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
        lives,
        combo,
        deathCause,
        letterProjectiles: surviving,
        lastPurgeFreeAtMs,
        flowStats: updateFlowStats(state.flowStats, newElapsed),
        status: lives <= 0 ? 'gameOver' : state.status,
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

      let inputBlindedUntilMs = state.inputBlindedUntilMs;
      let bossAttack = state.bossAttack;
      let keyRemap = state.keyRemap;

      if (bossAttack) {
        if (bossAttack.blind && newElapsed >= bossAttack.nextBlindAtMs) {
          inputBlindedUntilMs = newElapsed + BOSS_BLIND_DURATION_MS;
          bossAttack = {
            ...bossAttack,
            nextBlindAtMs: bossAttack.nextBlindAtMs + BOSS_BLIND_INTERVAL_MS,
          };
        }
        if (keyRemap && newElapsed >= bossAttack.remapUntilMs) {
          keyRemap = null;
        }
      }

      // Proyectiles tambien caen durante el jefe (pisos 9+)
      const deltaSecProj = deltaSec;
      let lives = state.lives;
      const surviving: typeof state.letterProjectiles = [];
      for (const proj of state.letterProjectiles) {
        const newY = proj.y + proj.vy * deltaSecProj;
        if (newY >= 600 - PROJECTILE_HEIGHT) {
          lives -= 1;
        } else {
          surviving.push({ ...proj, y: newY });
        }
      }

      if (lives <= 0) {
        return {
          ...state,
          lives: 0,
          status: 'gameOver',
          deathCause: 'projectile',
          bossWord: null,
          bossAttack: null,
          keyRemap: null,
          letterProjectiles: [],
        };
      }

      return {
        ...state,
        bossWord,
        elapsedMs: newElapsed,
        inputBlindedUntilMs,
        bossAttack,
        keyRemap,
        lives,
        letterProjectiles: surviving,
      };
    }

    case 'SPAWN_WORD':
      if (state.status !== 'playing') return state;
      return { ...state, words: [...state.words, action.payload] };

    case 'SPAWN_PROJECTILE': {
      const inBossWithProjectiles =
        state.status === 'boss' && state.bossAttack?.projectiles;
      if (state.status !== 'playing' && !inBossWithProjectiles) return state;
      if (state.letterProjectiles.length >= MAX_LETTER_PROJECTILES) return state;
      return {
        ...state,
        letterProjectiles: [...state.letterProjectiles, action.payload],
      };
    }

    case 'TYPE_CHAR': {
      if (state.status !== 'playing' && state.status !== 'boss') return state;
      const char = action.payload.toLowerCase();

      // Desviar proyectil: con el input vacio, teclear su letra lo destruye
      if (state.input === '') {
        const projIndex = state.letterProjectiles.findIndex(
          (p) => p.char === char,
        );
        if (projIndex !== -1) {
          return {
            ...state,
            letterProjectiles: state.letterProjectiles.filter(
              (_, i) => i !== projIndex,
            ),
            deflectedLetters: state.deflectedLetters + 1,
            precisionStreak: state.precisionStreak + 1,
            ultimateCharge: clampCharge(
              state.ultimateCharge +
                ULTIMATE_DEFLECT_BONUS *
                  getRunnerModifiers(state.runnerId).ultimateChargeMult,
            ),
          };
        }
      }

      const newInput = state.input + char;
      const matchesSomething =
        state.status === 'boss'
          ? state.bossWord?.text.startsWith(newInput) ?? false
          : state.words.some(
              (w) => w.kind !== 'trap' && w.text.startsWith(newInput),
            );

      if (matchesSomething) {
        return {
          ...state,
          input: newInput,
          precisionStreak: state.precisionStreak + 1,
          ultimateCharge: clampCharge(
            state.ultimateCharge +
              ULTIMATE_CHARGE_PER_CHAR *
                getRunnerModifiers(state.runnerId).ultimateChargeMult,
          ),
          flowStats: {
            ...state.flowStats,
            windowChars: state.flowStats.windowChars + 1,
          },
        };
      }

      return {
        ...state,
        input: newInput,
        precisionStreak: 0,
        flowStats: {
          ...state.flowStats,
          windowErrors: state.flowStats.windowErrors + 1,
        },
      };
    }

    case 'BACKSPACE':
      if (state.status !== 'playing' && state.status !== 'boss') return state;
      if (!state.input) return state;
      return {
        ...state,
        input: state.input.slice(0, -1),
        precisionStreak: 0,
        ultimateCharge: clampCharge(
          state.ultimateCharge - ULTIMATE_BACKSPACE_PENALTY,
        ),
        backspacesUsedThisWord: state.backspacesUsedThisWord + 1,
        flowStats: {
          ...state.flowStats,
          windowErrors: state.flowStats.windowErrors + 1,
        },
      };

    case 'ULTIMATE_FIRE': {
      if (state.status !== 'playing') return state;
      if (state.ultimateCharge < ULTIMATE_MAX_CHARGE) return state;

      const sorted = [...state.words].sort((a, b) => b.y - a.y);
      const removeCount = Math.ceil(sorted.length / 2);
      const removeIds = new Set(sorted.slice(0, removeCount).map((w) => w.id));

      return {
        ...state,
        words: state.words.filter((w) => !removeIds.has(w.id)),
        letterProjectiles: [],
        frozenUntilMs: Math.max(
          state.frozenUntilMs,
          state.elapsedMs + ULTIMATE_FREEZE_MS,
        ),
        ultimateCharge: 0,
        ultimatesUsed: state.ultimatesUsed + 1,
      };
    }

    case 'SUBMIT': {
      if ((state.status !== 'playing' && state.status !== 'boss') || !state.input)
        return state;

      const trimmed = state.input.trim().toLowerCase();
      const cleanWord = state.backspacesUsedThisWord === 0;

      if (state.status === 'boss' && state.bossWord) {
        if (trimmed !== state.bossWord.text) {
          return {
            ...state,
            input: '',
            combo: 0,
            precisionStreak: 0,
            backspacesUsedThisWord: 0,
            score: Math.max(0, state.score - calculateMissPenalty()),
            flowStats: {
              ...state.flowStats,
              windowErrors: state.flowStats.windowErrors + 2,
            },
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
          backspacesUsedThisWord: 0,
          wordsTyped: state.wordsTyped + 1,
          correctChars: state.correctChars + trimmed.length,
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

        let next: GameState = {
          ...state,
          input: '',
          combo,
          activePerks,
          precisionStreak: 0,
          backspacesUsedThisWord: 0,
          score: Math.max(0, state.score - calculateMissPenalty()),
          flowStats: {
            ...state.flowStats,
            windowErrors: state.flowStats.windowErrors + 2,
          },
        };

        // Tinta Toxica: el fallo explota, limpia pantalla y cuesta 1 vida
        const missResult = applyRelicOnMiss(state);
        if (missResult.purgeAll) {
          const keepCombo = hasSynergy(state, 'tinta_segura');
          const lives = missResult.loseLife ? next.lives - 1 : next.lives;
          next = {
            ...next,
            words: [],
            letterProjectiles: [],
            lives,
            combo: keepCombo ? state.combo : next.combo,
            status: lives <= 0 ? 'gameOver' : next.status,
            deathCause: lives <= 0 ? 'toxic' : next.deathCause,
          };
        }

        return next;
      }

      const matched = state.words[matchIndex];

      if (matched.kind === 'trap') {
        if (state.trapIgnoreRemaining > 0) {
          return {
            ...state,
            input: '',
            backspacesUsedThisWord: 0,
            trapIgnoreRemaining: state.trapIgnoreRemaining - 1,
            words: state.words.filter((w) => w.id !== matched.id),
          };
        }
        return {
          ...state,
          input: '',
          combo: 0,
          precisionStreak: 0,
          backspacesUsedThisWord: 0,
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
          backspacesUsedThisWord: 0,
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

      const comboOverride = hasSynergy(state, 'vocal_codificada')
        ? { from: 2, value: 2 }
        : null;

      let points = calculatePerkWordScore(
        matched.text.length,
        state.combo,
        matched.y,
        groundHeight,
        activePerks,
        state.elapsedMs,
        useSnipe,
        state.runnerId,
        comboOverride,
      );
      if (matched.kind === 'bomb') points *= 2;

      // Reliquias y glosario
      const relicResult = applyRelicOnSubmit(
        state,
        matched,
        points,
        hasSynergy(state, 'fuego_electrico'),
      );
      points = Math.round(points * relicResult.scoreMult) + relicResult.aoeBonus;
      if (cleanWord) points = Math.round(points * CLEAN_WORD_SCORE_MULT);

      const runCoinGain = calculateRunCoinsFromScore(points);
      const runCoins = state.runCoins + Math.round(
        runCoinGain * getRunnerModifiers(state.runnerId).runCoinsMult,
      );

      const burnSet = new Set(relicResult.burnWordIds);
      const wordsAfter = state.words.map((w) =>
        burnSet.has(w.id) ? { ...w, burning: true } : w,
      );

      const posPartial = applyPosEffect(
        { ...state, words: wordsAfter },
        matched,
      );

      return {
        ...state,
        words: wordsAfter,
        ...posPartial,
        input: '',
        combo: state.combo + 1,
        score: state.score + points,
        runCoins,
        correctChars: state.correctChars + matched.text.length,
        wordsTyped: state.wordsTyped + 1,
        poppingWordId: matched.id,
        activePerks: posPartial.activePerks ?? activePerks,
        backspacesUsedThisWord: 0,
        ultimateCharge: clampCharge(
          state.ultimateCharge +
            ((cleanWord ? ULTIMATE_CLEAN_WORD_BONUS : 0) +
              relicResult.extraUltimateCharge) *
              getRunnerModifiers(state.runnerId).ultimateChargeMult,
        ),
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
        precisionStreak: 0,
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

      const next: GameState = {
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
        return completeFloor(next);
      }

      return next;
    }

    case 'BROKEN_CLOCK_SKIP':
      return { ...state, ...applyBrokenClockSkip(state) };

    case 'SELECT_PERK': {
      const partial = applyPerkSelection(state, action.payload);
      const next: GameState = {
        ...state,
        ...partial,
        perksHistory: [...state.perksHistory, action.payload],
        status: 'playing',
        pendingPerkChoice: null,
      };
      if (shouldCompleteFloor(next)) {
        return completeFloor(next);
      }
      return next;
    }

    case 'SELECT_RELIC': {
      if (state.status !== 'relicPick') return state;
      const relicId = action.payload;
      const nextStatus = state.postRelicStatus ?? 'playing';
      const withRelic: GameState = {
        ...state,
        activeRelics: state.activeRelics.includes(relicId)
          ? state.activeRelics
          : [...state.activeRelics, relicId],
        relicsHistory: [...state.relicsHistory, relicId],
        pendingRelicChoice: null,
        postRelicStatus: null,
      };
      return { ...withRelic, ...enterPostFloor(withRelic, nextStatus) };
    }

    case 'BOSS_FAIL':
      return {
        ...state,
        status: 'gameOver',
        deathCause: 'boss',
        bossWord: null,
        bossAttack: null,
        keyRemap: null,
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
