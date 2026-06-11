import { BOSS_EVERY_N_FLOORS, FLOOR_CLEAR_COINS, RAMPS_PER_FLOOR } from '../data/run';
import type { GameState, GameStatus } from '../types/game';
import { pickRandomEvent } from '../data/events';

export function getFloorTierOffset(state: GameState): number {
  return state.difficultyTierOffset + Math.max(0, state.floor - 1);
}

export function shouldCompleteFloor(state: GameState): boolean {
  return state.rampsThisFloor >= RAMPS_PER_FLOOR;
}

export function getPostFloorStatus(floor: number): GameStatus {
  if (floor % BOSS_EVERY_N_FLOORS === 0) return 'boss';
  return floor % 2 === 1 ? 'shop' : 'event';
}

export function getFloorClearCoins(state: GameState): number {
  let coins = FLOOR_CLEAR_COINS;
  if (state.runnerId === 'magnate') coins = Math.round(coins * 1.2);
  return coins;
}

export function buildFloorClearState(state: GameState): Partial<GameState> {
  const coins = getFloorClearCoins(state);
  const nextStatus = getPostFloorStatus(state.floor);

  return {
    runCoins: state.runCoins + coins,
    words: [],
    input: '',
    status: nextStatus,
    pendingEvent: nextStatus === 'event' ? pickRandomEvent(state) : null,
    rampsThisFloor: 0,
    showSpeedNotice: false,
  };
}

export function advanceToNextFloor(state: GameState): Partial<GameState> {
  return {
    floor: state.floor + 1,
    rampsThisFloor: 0,
    status: 'playing',
    bossId: null,
    bossWord: null,
    bossWords: [],
    bossPhase: 0,
    activeBossWordIndex: 0,
    bossAttack: null,
    keyRemap: null,
    inputBlindedUntilMs: 0,
    letterProjectiles: [],
    words: [],
    input: '',
    pendingEvent: null,
    backspacesUsedThisWord: 0,
  };
}
