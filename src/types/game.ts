import type { EventDefinition } from '../data/events';
import type { ActivePerk, PerkId } from './perks';
import type { DeathCause, RunnerId, ShopItemId, WordKind } from './run';
import type {
  BossAttackState,
  BossId,
  FlowStats,
  GlossaryId,
  LetterProjectile,
  RelicId,
  WordModifier,
  WordPOS,
} from './combat';
import { INITIAL_FLOW_STATS } from './combat';

export type GameStatus =
  | 'idle'
  | 'runnerPick'
  | 'glossaryPick'
  | 'playing'
  | 'paused'
  | 'perkPick'
  | 'relicPick'
  | 'shop'
  | 'event'
  | 'boss'
  | 'oraclePick'
  | 'gameOver';

export interface FallingWord {
  id: string;
  /** Texto objetivo que hay que teclear para acertar. */
  text: string;
  /** Texto mostrado si difiere del objetivo (anagrama, sin vocales). */
  displayText?: string;
  x: number;
  y: number;
  kind: WordKind;
  pos?: WordPOS;
  modifiers?: WordModifier[];
  /** Marca visual de quemadura (Reliquia Ignea); +score al escribirla. */
  burning?: boolean;
  /** Proximo instante de mutacion para palabras 'shifting'. */
  morphAtMs?: number;
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
  rampBlockedNotice: boolean;
  maxWordsPerSecond: number;
  lastTier: number;
  poppingWordId: string | null;
  activePerks: ActivePerk[];
  pendingPerkChoice: PerkId[] | null;
  difficultyTierOffset: number;
  frozenUntilMs: number;
  rampCount: number;
  floor: number;
  runnerId: RunnerId | null;
  runCoins: number;
  rampsThisFloor: number;
  noTrapsNextFloor: boolean;
  trapIgnoreRemaining: number;
  pendingEvent: EventDefinition | null;
  /** Ofertas rotativas de la tienda del piso actual. */
  shopOffers: ShopItemId[];
  /** Multiplicador de run coins durante el proximo piso (tienda). */
  nextFloorCoinMult: number;
  /** Regenerar opciones en la proxima eleccion de reliquia. */
  relicRerollPending: boolean;
  /** Milisegundos de congelacion al iniciar el proximo piso. */
  freezeNextFloorMs: number;
  bossId: BossId | null;
  /** Palabra activa del jefe (objetivo actual de tipeo). */
  bossWord: FallingWord | null;
  /** Todas las palabras del encuentro (1 o 2 en Tiranotipo). */
  bossWords: FallingWord[];
  /** Fase del jefe: 0 = primera palabra, 1 = segunda en dual. */
  bossPhase: number;
  activeBossWordIndex: number;
  deathCause: DeathCause;
  perksHistory: PerkId[];
  lastPurgeFreeAtMs: number;
  // --- Combate por tipeo ---
  precisionStreak: number;
  ultimateCharge: number;
  ultimatesUsed: number;
  backspacesUsedThisWord: number;
  // --- Reliquias ---
  activeRelics: RelicId[];
  relicsHistory: RelicId[];
  pendingRelicChoice: RelicId[] | null;
  /** Estado al que volver tras elegir reliquia (shop/event/boss). */
  postRelicStatus: GameStatus | null;
  // --- Enemigos especiales ---
  letterProjectiles: LetterProjectile[];
  deflectedLetters: number;
  // --- Ataques de UI del jefe ---
  inputBlindedUntilMs: number;
  keyRemap: Record<string, string> | null;
  bossAttack: BossAttackState | null;
  // --- Glosarios y POS ---
  selectedGlossary: GlossaryId;
  tempoBuffUntilMs: number;
  lastPosEffectAtMs: number;
  // --- Flow adaptativo ---
  flowStats: FlowStats;
  /** Run del desafio diario (runner/glosario fijados por fecha UTC). */
  dailyRun: boolean;
  /** Llego a al menos un combate de jefe en esta run. */
  reachedBoss: boolean;
  /** Palabra oraculo pendiente de recompensa (score vs carga). */
  oracleRewardWord: FallingWord | null;
}

export type GameAction =
  | { type: 'BEGIN_RUN'; payload?: { dailyRun?: boolean } }
  | { type: 'GO_HOME' }
  | { type: 'RETRY' }
  | { type: 'SELECT_RUNNER'; payload: RunnerId }
  | { type: 'SELECT_GLOSSARY'; payload: GlossaryId }
  | { type: 'TOGGLE_PAUSE' }
  | {
      type: 'TICK';
      payload: { deltaMs: number; fallSpeed: number; groundHeight: number };
    }
  | { type: 'SPAWN_WORD'; payload: FallingWord }
  | { type: 'SPAWN_PROJECTILE'; payload: LetterProjectile }
  | { type: 'TYPE_CHAR'; payload: string }
  | { type: 'BACKSPACE' }
  | { type: 'SUBMIT' }
  | { type: 'ULTIMATE_FIRE' }
  | { type: 'WORD_HIT_GROUND'; payload: string }
  | { type: 'SPEED_RAMP'; payload: { fallSpeed: number } }
  | { type: 'BROKEN_CLOCK_SKIP' }
  | { type: 'SELECT_PERK'; payload: PerkId }
  | { type: 'SELECT_RELIC'; payload: RelicId }
  | { type: 'SHOP_BUY'; payload: import('./run').ShopItemId }
  | { type: 'SHOP_LEAVE' }
  | { type: 'EVENT_CHOICE'; payload: 'A' | 'B' }
  | { type: 'BOSS_TICK'; payload: { deltaMs: number } }
  | { type: 'BOSS_FAIL' }
  | { type: 'CLEAR_POP' }
  | { type: 'HIDE_SPEED_NOTICE' }
  | { type: 'ORACLE_CHOICE'; payload: 'score' | 'charge' };

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
  rampBlockedNotice: false,
  maxWordsPerSecond: 0,
  lastTier: 0,
  poppingWordId: null,
  activePerks: [],
  pendingPerkChoice: null,
  difficultyTierOffset: 0,
  frozenUntilMs: 0,
  rampCount: 0,
  floor: 1,
  runnerId: null,
  runCoins: 0,
  rampsThisFloor: 0,
  noTrapsNextFloor: false,
  trapIgnoreRemaining: 0,
  pendingEvent: null,
  shopOffers: [],
  nextFloorCoinMult: 1,
  relicRerollPending: false,
  freezeNextFloorMs: 0,
  bossId: null,
  bossWord: null,
  bossWords: [],
  bossPhase: 0,
  activeBossWordIndex: 0,
  deathCause: null,
  perksHistory: [],
  lastPurgeFreeAtMs: 0,
  precisionStreak: 0,
  ultimateCharge: 0,
  ultimatesUsed: 0,
  backspacesUsedThisWord: 0,
  activeRelics: [],
  relicsHistory: [],
  pendingRelicChoice: null,
  postRelicStatus: null,
  letterProjectiles: [],
  deflectedLetters: 0,
  inputBlindedUntilMs: 0,
  keyRemap: null,
  bossAttack: null,
  selectedGlossary: 'general',
  tempoBuffUntilMs: 0,
  lastPosEffectAtMs: 0,
  flowStats: INITIAL_FLOW_STATS,
  dailyRun: false,
  reachedBoss: false,
  oracleRewardWord: null,
};
