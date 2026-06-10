import { useReducer } from 'react';
import {
  INITIAL_LIVES,
  initialGameState,
  type FallingWord,
  type GameAction,
  type GameState,
} from '../types/game';
import { calculateMissPenalty, calculateWordScore } from '../utils/scoring';

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

      const updatedWords = state.words.map((word) => {
        if (word.id === state.poppingWordId) return word;
        return { ...word, y: word.y + fallSpeed * deltaSec };
      });

      return {
        ...state,
        elapsedMs: newElapsed,
        words: updatedWords,
        maxFallSpeed: Math.max(state.maxFallSpeed, fallSpeed),
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
        return {
          ...state,
          input: '',
          combo: 0,
          score: Math.max(0, state.score - calculateMissPenalty()),
        };
      }

      const matched = state.words[matchIndex];
      const groundHeight =
        typeof window !== 'undefined' ? window.innerHeight - GROUND_OFFSET : 600;
      const points = calculateWordScore(
        matched.text.length,
        state.combo,
        matched.y,
        groundHeight,
      );

      return {
        ...state,
        input: '',
        combo: state.combo + 1,
        score: state.score + points,
        correctChars: state.correctChars + matched.text.length,
        wordsTyped: state.wordsTyped + 1,
        poppingWordId: matched.id,
      };
    }

    case 'WORD_HIT_GROUND': {
      if (state.status !== 'playing') return state;
      if (state.poppingWordId === action.payload) return state;
      if (!state.words.some((w) => w.id === action.payload)) return state;

      const newLives = state.lives - 1;
      return {
        ...state,
        lives: newLives,
        combo: 0,
        words: state.words.filter((w) => w.id !== action.payload),
        status: newLives <= 0 ? 'gameOver' : state.status,
      };
    }

    case 'SPEED_RAMP': {
      const { fallSpeed } = action.payload;
      return {
        ...state,
        maxFallSpeed: Math.max(state.maxFallSpeed, fallSpeed),
        showSpeedNotice: true,
      };
    }

    case 'HIDE_SPEED_NOTICE':
      return { ...state, showSpeedNotice: false };

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
