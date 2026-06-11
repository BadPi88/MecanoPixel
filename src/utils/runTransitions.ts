import { applyBiomeForFloor } from '../data/biomes';
import { FLOOR_CLEAR_COINS, RAMPS_PER_FLOOR } from '../data/run';
import type { GameState } from '../types/game';
import { getEffectiveAscensionTierOffset } from './ascensionModifiers';
import { getEliteCoinMult, getEliteTierBonus } from './eliteModifiers';
import { buildActMapChoices, initActMapIfNeeded } from './mapAct';
import { getBiomeGameplayMod } from './biomeModifiers';

export function getFloorTierOffset(state: GameState): number {
  return (
    state.difficultyTierOffset +
    Math.max(0, state.floor - 1) +
    state.eliteTierBonus +
    getEliteTierBonus(state.eliteModifierId) +
    getEffectiveAscensionTierOffset(state)
  );
}

export function shouldCompleteFloor(state: GameState): boolean {
  return state.rampsThisFloor >= RAMPS_PER_FLOOR;
}

export function getFloorClearCoins(state: GameState): number {
  let coins = FLOOR_CLEAR_COINS;
  if (state.runnerId === 'magnate') coins = Math.round(coins * 1.2);
  coins = Math.round(coins * getEliteCoinMult(state));
  return coins;
}

export function buildMapPickState(state: GameState): Partial<GameState> {
  const actInit = initActMapIfNeeded(state);
  const merged = { ...state, ...actInit };
  const { mapRoomOptions, actMap } = buildActMapChoices(merged);

  const tronoMod = getBiomeGameplayMod(merged.biomeId);
  const pendingMiniBoss =
    tronoMod.tronoMiniBossChance > 0 &&
    merged.floor % 3 !== 0 &&
    Math.random() < tronoMod.tronoMiniBossChance;

  return {
    ...actInit,
    status: 'mapPick',
    actMap,
    mapRoomOptions,
    eliteTierBonus: 0,
    eliteModifierId: null,
    eliteCoinMult: 1,
    eliteFogLastAtMs: 0,
    pendingMiniBoss,
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
