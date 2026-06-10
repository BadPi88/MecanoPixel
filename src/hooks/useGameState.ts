import { useReducer } from 'react';
import { PERKS_EVERY_N_RAMPS, pickPerkChoices } from '../data/perks';
import {
  INITIAL_LIVES,
  initialGameState,
  type FallingWord,
  type GameAction,
  type GameState,
} from '../types/game';
import { wordsPerSecondFromSpawnInterval } from '../utils/intensity';
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

const GROUND_OFFSET = 48;

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START':
      return {
        ...initialGameState,
        status: 'playing',
        startTime: Date.now(),
        lives: INITIAL_LIVES,
      };

    case 'RETRY':
      return {
        ...initialGameState,
        status: 'playing',
        startTime: Date.now(),
        lives: INITIAL_LIVES,
      };

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
        state.difficultyTierOffset,
        activePerks,
        state.frozenUntilMs,
      );
      const wps = wordsPerSecondFromSpawnInterval(effective.spawnInterval);

      return {
        ...state,
        elapsedMs: newElapsed,
        words: updatedWords,
        activePerks,
        maxWordsPerSecond: Math.max(state.maxWordsPerSecond, wps),
      };
    }

    case 'SPAWN_WORD':
      if (state.status !== 'playing') return state;
      return {
        ...state,
        words: [...state.words, action.payload],
      };

    case 'TYPE_CHAR':
      if (state.status !== 'playing') return state;
      return {
        ...state,
        input: state.input + action.payload.toLowerCase(),
      };

    case 'BACKSPACE':
      if (state.status !== 'playing') return state;
      return {
        ...state,
        input: state.input.slice(0, -1),
      };

    case 'SUBMIT': {
      if (state.status !== 'playing' || !state.input) return state;

      const trimmed = state.input.trim().toLowerCase();
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
      const groundHeight =
        typeof window !== 'undefined' ? window.innerHeight - GROUND_OFFSET : 600;
      const topThird = groundHeight / 3;
      const inTop = matched.y < topThird;
      const snipePerk = hasPerkWithCharge(state.activePerks, 'snipe');
      const useSnipe = Boolean(snipePerk && inTop);

      let activePerks = state.activePerks;
      if (useSnipe) {
        activePerks = consumePerkCharge(activePerks, 'snipe');
      }

      const points = calculatePerkWordScore(
        matched.text.length,
        state.combo,
        matched.y,
        groundHeight,
        activePerks,
        state.elapsedMs,
        useSnipe,
      );

      return {
        ...state,
        input: '',
        combo: state.combo + 1,
        score: state.score + points,
        correctChars: state.correctChars + matched.text.length,
        wordsTyped: state.wordsTyped + 1,
        poppingWordId: matched.id,
        activePerks,
      };
    }

    case 'WORD_HIT_GROUND': {
      if (state.status !== 'playing') return state;
      if (state.poppingWordId === action.payload) return state;
      if (!state.words.some((w) => w.id === action.payload)) return state;

      if (hasPerkWithCharge(state.activePerks, 'shield')) {
        return {
          ...state,
          combo: 0,
          words: state.words.filter((w) => w.id !== action.payload),
          activePerks: consumePerkCharge(state.activePerks, 'shield'),
        };
      }

      const newLives = state.lives - 1;
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
        status: newLives <= 0 ? 'gameOver' : state.status,
      };
    }

    case 'SPEED_RAMP': {
      const effective = getEffectiveDifficulty(
        state.elapsedMs,
        state.difficultyTierOffset,
        state.activePerks,
        state.frozenUntilMs,
      );
      const wps = wordsPerSecondFromSpawnInterval(effective.spawnInterval);
      const rampCount = state.rampCount + 1;
      const offerPerk = rampCount >= PERKS_EVERY_N_RAMPS;

      return {
        ...state,
        maxWordsPerSecond: Math.max(state.maxWordsPerSecond, wps),
        showSpeedNotice: true,
        rampBlockedNotice: false,
        rampCount: offerPerk ? 0 : rampCount,
        status: offerPerk ? 'perkPick' : 'playing',
        pendingPerkChoice: offerPerk
          ? pickPerkChoices(state.activePerks)
          : null,
      };
    }

    case 'BROKEN_CLOCK_SKIP':
      return {
        ...state,
        ...applyBrokenClockSkip(state),
      };

    case 'SELECT_PERK':
      return {
        ...state,
        ...applyPerkSelection(state, action.payload),
      };

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

let wordIdCounter = 0;

export function createWordId(): string {
  wordIdCounter += 1;
  return `word-${wordIdCounter}`;
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
  return words.find((w) => w.text.startsWith(lower)) ?? null;
}
