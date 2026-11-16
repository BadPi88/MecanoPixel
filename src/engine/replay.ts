import { getBiomeSpeedMult } from '../utils/biomeModifiers.ts';
import { getEliteSpawnMult } from '../utils/eliteModifiers.ts';
import { getRelicFallSpeedMult } from '../utils/combatModifiers.ts';
import { getFloorTierOffset } from '../utils/runTransitions.ts';
import { shouldSkipTrapsOnFloor } from '../utils/hubModifiers.ts';
import { getRunnerModifiers } from '../utils/runnerModifiers.ts';
import { getEffectiveDifficulty } from '../utils/perkModifiers.ts';
import {
  decorateSpawn,
  getOracleRateMult,
  getSpawnRatesForFloor,
  getWordTextForKind,
  rollWordKind,
} from '../utils/wordSpawn.ts';
import { createSeededRandom } from './rng.ts';
import { setMetaOverride, type MetaProgress } from '../services/meta.ts';
import { gameReducer } from './gameReducer.ts';
import { getDifficultyTier } from '../utils/difficulty.ts';
import { initialGameState, type FallingWord, type GameAction, type GameState } from '../types/game.ts';
import type { RunReplayEvent } from '../../shared/runReplay';

export interface ReplayExpectation {
  mode: 'global' | 'daily' | 'weekly';
  challengeKey: string;
  runSeed: number;
  score: number;
  wordsTyped: number;
  correctChars: number;
  elapsedMs: number;
}

export type ReplayResult =
  | { valid: true; state: GameState }
  | { valid: false; reason: string };

const ACTION_TYPES = new Set([
  'BEGIN_RUN', 'SELECT_RUNNER', 'SELECT_GLOSSARY', 'TOGGLE_PAUSE', 'TICK',
  'SPAWN_WORD', 'SPAWN_PROJECTILE', 'TYPE_CHAR', 'BACKSPACE', 'SUBMIT',
  'ULTIMATE_FIRE', 'WORD_HIT_GROUND', 'BOSS_TICK', 'BOSS_FAIL', 'SPEED_RAMP',
  'BROKEN_CLOCK_SKIP', 'SELECT_PERK', 'SELECT_RELIC', 'SHOP_BUY', 'SHOP_LEAVE',
  'PICK_ROOM', 'EVENT_CHOICE', 'HIDE_SPEED_NOTICE', 'CLEAR_POP',
  'TOGGLE_BUILD_OVERLAY', 'CONTINUE_ENDLESS', 'VICTORY_HOME', 'ORACLE_CHOICE',
  'BOSS_TELEGRAPH',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseAction(value: unknown): GameAction | null {
  if (!isRecord(value) || typeof value.type !== 'string' || !ACTION_TYPES.has(value.type)) return null;
  return value as unknown as GameAction;
}

function sameJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function expectedWord(state: GameState): Omit<FallingWord, 'id' | 'x'> {
  const tierOffset = getFloorTierOffset(state);
  const rates = getSpawnRatesForFloor(
    state.floor,
    shouldSkipTrapsOnFloor(state),
    state.activeRelics,
    state.biomeId,
    state.ascensionLevel,
  );
  rates.bonus += getRunnerModifiers(state.runnerId).bonusChanceBonus;
  const random = createSeededRandom(
    (state.runSeed + Math.imul(state.spawnCount + 1, 0x9e3779b9)) >>> 0,
  );
  const kind = rollWordKind(rates, getOracleRateMult(state.biomeId), state.chaosRollRemaining > 0, random);
  const text = getWordTextForKind(
    kind,
    state.difficultyElapsedMs,
    tierOffset,
    state.selectedGlossary,
    state.activeRelics,
    state.floor,
    random,
  );
  const decoration = decorateSpawn(
    kind,
    text,
    state.floor,
    state.elapsedMs,
    state.activeRelics,
    state.biomeId,
    state.bossId === 'devoratexto',
    random,
  );
  return {
    text,
    y: -36,
    kind,
    pos: decoration.pos,
    displayText: decoration.displayText,
    modifiers: decoration.modifiers,
    morphAtMs: decoration.morphAtMs,
  };
}

function validSpawn(state: GameState, action: GameAction): boolean {
  if (action.type !== 'SPAWN_WORD') return false;
  const expected = expectedWord(state);
  return action.payload.id.length > 0 && Number.isFinite(action.payload.x) &&
    action.payload.x >= 0 && action.payload.x <= 4096 &&
    sameJson({ ...action.payload, id: undefined, x: undefined }, expected);
}

function validProjectile(state: GameState, action: GameAction): boolean {
  if (action.type !== 'SPAWN_PROJECTILE') return false;
  const random = createSeededRandom(
    (state.runSeed + Math.imul(state.projectileCount + 1, 0x85ebca6b)) >>> 0,
  );
  random(); // Position uses the first draw; width is presentation-only.
  const expectedChar = ['q', 'x', 'j', 'z', 'k', 'w', 'b', 'v'][Math.floor(random() * 8)];
  const expectedVy = 60 + random() * 30;
  return action.payload.id.length > 0 && action.payload.char === expectedChar &&
    Math.abs(action.payload.vy - expectedVy) < 1e-8 &&
    Number.isFinite(action.payload.x) && action.payload.x >= 0 && action.payload.x <= 4096 &&
    action.payload.y === -24;
}

function validTick(state: GameState, action: GameAction): boolean {
  if (action.type !== 'TICK') return false;
  const delta = action.payload.deltaMs;
  if (!Number.isFinite(delta) || delta <= 0 || delta > 1_000 ||
    !Number.isFinite(action.payload.groundHeight) ||
    action.payload.groundHeight < 400 || action.payload.groundHeight > 1_600) return false;
  const nextElapsed = state.elapsedMs + delta;
  const nextDifficultyElapsed = state.difficultyElapsedMs + delta * state.flowStats.progressionRate;
  const effective = getEffectiveDifficulty(
    nextElapsed,
    getFloorTierOffset(state),
    state.activePerks,
    state.frozenUntilMs,
    state.runnerId,
    {
      difficultyElapsedMs: nextDifficultyElapsed,
      tempoBuffUntilMs: state.tempoBuffUntilMs,
      flowSpawnMult: state.flowStats.spawnMult,
      flowSpeedMult: state.flowStats.speedMult,
      relicFallMult: getRelicFallSpeedMult(state.activeRelics),
      biomeSpeedMult: getBiomeSpeedMult(state.biomeId),
      eliteSpawnMult: getEliteSpawnMult(state.eliteModifierId),
    },
  );
  return Math.abs(action.payload.fallSpeed - effective.fallSpeed) < 1e-6;
}

function checkEvent(
  state: GameState,
  action: GameAction,
  nextTick: GameAction | null,
  groundHeight: number,
  progression: MetaProgress,
): boolean {
  if (action.type === 'BEGIN_RUN') return state.status === 'idle';
  if (action.type === 'SELECT_RUNNER') return state.status === 'runnerPick' && progression.unlockedRunners.includes(action.payload);
  if (action.type === 'SELECT_GLOSSARY') return state.status === 'glossaryPick' && progression.unlockedGlossaries.includes(action.payload);
  if (action.type === 'SELECT_PERK') return state.pendingPerkChoice?.includes(action.payload) ?? false;
  if (action.type === 'SELECT_RELIC') return state.pendingRelicChoice?.includes(action.payload) ?? false;
  if (action.type === 'SHOP_BUY') return state.status === 'shop' && state.shopOffers.includes(action.payload);
  if (action.type === 'PICK_ROOM') return state.status === 'mapPick' && state.mapRoomOptions.some((option) => option.id === action.payload);
  if (action.type === 'EVENT_CHOICE') return state.status === 'event' && (action.payload === 'A' || action.payload === 'B');
  if (action.type === 'ORACLE_CHOICE') return state.status === 'oraclePick' && (action.payload === 'score' || action.payload === 'charge');
  if (action.type === 'CONTINUE_ENDLESS') return state.status === 'victory';
  if (action.type === 'SPAWN_WORD') return state.status === 'playing' && validSpawn(state, action);
  if (action.type === 'SPAWN_PROJECTILE') return state.status === 'playing' && validProjectile(state, action);
  if (action.type === 'TICK') return state.status === 'playing' && validTick(state, action);
  if (action.type === 'TYPE_CHAR' || action.type === 'BACKSPACE' || action.type === 'SUBMIT') {
    return state.status === 'playing' || state.status === 'boss';
  }
  if (action.type === 'TOGGLE_PAUSE') return state.status === 'playing' || state.status === 'paused';
  if (action.type === 'BOSS_TICK') {
    return Number.isFinite(action.payload.deltaMs) && action.payload.deltaMs > 0 && action.payload.deltaMs <= 1_000;
  }
  if (action.type === 'WORD_HIT_GROUND') {
    const word = state.words.find((item) => item.id === action.payload);
    return Boolean(word && Number.isFinite(groundHeight) && word.y >= groundHeight - 36);
  }
  if (action.type === 'BOSS_FAIL') {
    const active = state.bossWords.slice(state.activeBossWordIndex);
    return state.status === 'boss' && Number.isFinite(groundHeight) && active.length > 0 &&
      active.some((word) => word.y >= groundHeight - 40);
  }
  if (action.type === 'SPEED_RAMP' || action.type === 'BROKEN_CLOCK_SKIP') {
    if (!nextTick || nextTick.type !== 'TICK') return false;
    const nextDifficulty = state.difficultyElapsedMs + nextTick.payload.deltaMs * state.flowStats.progressionRate;
    const currentTier = getDifficultyTier(state.difficultyElapsedMs, getFloorTierOffset(state)).tier;
    const nextTier = getDifficultyTier(nextDifficulty, getFloorTierOffset(state)).tier;
    if (nextTier <= currentTier) return false;
    const shouldSkip = state.activePerks.some((perk) => perk.id === 'broken_clock' && (perk.charges ?? 0) > 0);
    if (action.type === 'BROKEN_CLOCK_SKIP') return shouldSkip;
    if (shouldSkip) return false;
    const effective = getEffectiveDifficulty(
      state.elapsedMs,
      getFloorTierOffset(state),
      state.activePerks,
      state.frozenUntilMs,
      state.runnerId,
      {
        difficultyElapsedMs: nextDifficulty,
        tempoBuffUntilMs: state.tempoBuffUntilMs,
        flowSpawnMult: state.flowStats.spawnMult,
        flowSpeedMult: state.flowStats.speedMult,
        relicFallMult: getRelicFallSpeedMult(state.activeRelics),
        biomeSpeedMult: getBiomeSpeedMult(state.biomeId),
        eliteSpawnMult: getEliteSpawnMult(state.eliteModifierId),
      },
    );
    return action.type === 'SPEED_RAMP' &&
      Math.abs(action.payload.fallSpeed - effective.fallSpeed) < 1e-6 &&
      Math.abs(action.payload.spawnInterval - effective.spawnInterval) < 1e-6;
  }
  if (action.type === 'BOSS_TELEGRAPH') {
    return state.status === 'boss' && Number.isFinite(action.payload.x) &&
      action.payload.x >= 0 && action.payload.x <= 4096 &&
      action.payload.untilMs >= state.elapsedMs;
  }
  return true;
}

export function replayRun(
  events: RunReplayEvent[],
  expected: ReplayExpectation,
  progression: MetaProgress,
): ReplayResult {
  if (events.length === 0 || events.length > 250_000) return { valid: false, reason: 'event_count' };
  setMetaOverride(progression);
  try {
    let state: GameState = initialGameState;
    let lastElapsedMs = -1;
    let groundHeight = Number.NaN;
    for (let index = 0; index < events.length; index += 1) {
      const event = events[index]!;
      const action = parseAction(event.action);
      if (!action || event.sequence !== index || !Number.isFinite(event.elapsedMs) ||
        event.elapsedMs < lastElapsedMs || event.elapsedMs > expected.elapsedMs + 1_000) {
        return { valid: false, reason: 'event_order' };
      }
      const nextAction = index + 1 < events.length ? parseAction(events[index + 1]!.action) : null;
      if (!checkEvent(state, action, nextAction, groundHeight, progression)) return { valid: false, reason: 'event_invalid' };
      if (action.type === 'TICK') groundHeight = action.payload.groundHeight;
      state = gameReducer(state, action);
      lastElapsedMs = event.elapsedMs;
    }
    if (state.runSeed !== expected.runSeed || state.score !== expected.score ||
      state.wordsTyped !== expected.wordsTyped || state.correctChars !== expected.correctChars ||
      state.dailyRun !== (expected.mode === 'daily') || state.weeklyRun !== (expected.mode === 'weekly') ||
      (expected.mode === 'weekly' && state.challengeWeek !== expected.challengeKey) ||
      state.elapsedMs !== expected.elapsedMs || (state.status !== 'gameOver' && state.status !== 'victory')) {
      return { valid: false, reason: 'result_mismatch' };
    }
    return { valid: true, state };
  } catch {
    return { valid: false, reason: 'replay_error' };
  } finally {
    setMetaOverride(null);
  }
}
