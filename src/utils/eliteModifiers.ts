import {
  ELITE_COIN_MULT,
  ELITE_FOG_DURATION_MS,
  ELITE_FOG_INTERVAL_MS,
  type EliteModifierId,
} from '../data/eliteModifiers';
import type { GameState } from '../types/game';
import type { SpawnConstraints } from './combatModifiers';

export function getEliteCoinMult(state: GameState): number {
  return state.eliteCoinMult > 1 ? state.eliteCoinMult : 1;
}

export function getEliteSpawnMult(modifierId: EliteModifierId | null): number {
  if (modifierId === 'storm') return 1 / 1.2;
  return 1;
}

export function getEliteTierBonus(modifierId: EliteModifierId | null): number {
  if (modifierId === 'storm') return 1;
  return 0;
}

export function applyEliteSpawnConstraints(
  constraints: SpawnConstraints,
  modifierId: EliteModifierId | null,
): SpawnConstraints {
  if (modifierId === 'cascade') {
    return { ...constraints, maxLen: 5 };
  }
  return constraints;
}

export function tickEliteFog(
  state: GameState,
  elapsedMs: number,
): Partial<GameState> | null {
  if (state.eliteModifierId !== 'fog' || state.status !== 'playing') {
    return null;
  }
  if (state.inputBlindedUntilMs > elapsedMs) return null;

  const lastFog = state.eliteFogLastAtMs ?? 0;
  if (elapsedMs - lastFog < ELITE_FOG_INTERVAL_MS) return null;

  return {
    inputBlindedUntilMs: elapsedMs + ELITE_FOG_DURATION_MS,
    eliteFogLastAtMs: elapsedMs,
  };
}

export const DEFAULT_ELITE_COIN_MULT = ELITE_COIN_MULT;
