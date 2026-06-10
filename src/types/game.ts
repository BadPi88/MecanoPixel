export type GameStatus = 'idle' | 'playing' | 'paused' | 'gameOver';

export interface FallingWord {
  id: string;
  text: string;
  x: number;
  y: number;
}

export interface DifficultyTier {
  fallSpeed: number;
  spawnInterval: number;
  wordLengthRange: [number, number];
  tier: number;
}

export interface GameState {
  status: GameStatus;
  score: number;
  lives: number;
  combo: number;
  correctChars: number;
  wordsTyped: number;
  words: FallingWord[];
  input: string;
  startTime: number | null;
  elapsedMs: number;
  showSpeedNotice: boolean;
  maxFallSpeed: number;
  lastTier: number;
  poppingWordId: string | null;
}

export type GameAction =
  | { type: 'START' }
  | { type: 'GO_HOME' }
  | { type: 'RETRY' }
  | { type: 'TOGGLE_PAUSE' }
  | { type: 'TICK'; payload: { deltaMs: number; fallSpeed: number } }
  | { type: 'SPAWN_WORD'; payload: FallingWord }
  | { type: 'TYPE_CHAR'; payload: string }
  | { type: 'BACKSPACE' }
  | { type: 'SUBMIT' }
  | { type: 'WORD_HIT_GROUND'; payload: string }
  | { type: 'SPEED_RAMP'; payload: { fallSpeed: number } }
  | { type: 'CLEAR_POP' }
  | { type: 'HIDE_SPEED_NOTICE' };

export const INITIAL_LIVES = 3;

export const initialGameState: GameState = {
  status: 'idle',
  score: 0,
  lives: INITIAL_LIVES,
  combo: 0,
  correctChars: 0,
  wordsTyped: 0,
  words: [],
  input: '',
  startTime: null,
  elapsedMs: 0,
  showSpeedNotice: false,
  maxFallSpeed: 0,
  lastTier: 0,
  poppingWordId: null,
};
