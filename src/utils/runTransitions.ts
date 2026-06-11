import { applyBiomeForFloor } from '../data/biomes';
import { generateMapOptions } from '../data/mapRooms';
import { FLOOR_CLEAR_COINS, RAMPS_PER_FLOOR } from '../data/run';
import type { GameState } from '../types/game';

export function getFloorTierOffset(state: GameState): number {
  return (
    state.difficultyTierOffset +
    Math.max(0, state.floor - 1) +
    state.eliteTierBonus
  );
}

export function shouldCompleteFloor(state: GameState): boolean {
  return state.rampsThisFloor >= RAMPS_PER_FLOOR;
}

export function getFloorClearCoins(state: GameState): number {
  let coins = FLOOR_CLEAR_COINS;
  if (state.runnerId === 'magnate') coins = Math.round(coins * 1.2);
  return coins;
}

export function buildMapPickState(state: GameState): Partial<GameState> {
  return {
    status: 'mapPick',
    mapRoomOptions: generateMapOptions(state.floor, state.runSeed),
    eliteTierBonus: 0,
    words: [],
    input: '',
    letterProjectiles: [],
    rampsThisFloor: 0,
    showSpeedNotice: false,
  };
}

export function finishRoomToCombat(
  state: GameState,
  startMods: Partial<GameState> = {},
): Partial<GameState> {
  return {
    ...advanceToNextFloor(state),
    ...startMods,
    status: 'playing',
    noTrapsNextFloor: false,
    shopOffers: [],
    mapRoomOptions: [],
  };
}

export function advanceToNextFloor(state: GameState): Partial<GameState> {
  const floor = state.floor + 1;
  const biome = applyBiomeForFloor(
    state.biomeId,
    floor,
    state.elapsedMs,
    state.biomeIntroUntilMs,
  );

  return {
    floor,
    ...biome,
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
