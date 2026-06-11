import type { GameState } from '../types/game';
import type { SpawnRates } from './wordSpawn';

export function getAscensionTrapMult(ascensionLevel: number): number {
  if (ascensionLevel >= 1) return 1.15;
  return 1;
}

export function getAscensionTierBonus(ascensionLevel: number): number {
  if (ascensionLevel >= 4) return 1;
  return 0;
}

export function getAscensionBossAttackMult(ascensionLevel: number): number {
  if (ascensionLevel >= 3) return 0.85;
  return 1;
}

export function getAscensionMetaCoinsMult(ascensionLevel: number): number {
  if (ascensionLevel >= 5) return 1.25;
  return 1;
}

export function applyAscensionToSpawnRates(
  rates: SpawnRates,
  ascensionLevel: number,
): SpawnRates {
  const trapMult = getAscensionTrapMult(ascensionLevel);
  return {
    ...rates,
    trap: Math.min(rates.trap * trapMult, 0.35),
  };
}

export function getAscensionInitialLivesPenalty(ascensionLevel: number): number {
  return ascensionLevel >= 2 ? 1 : 0;
}

export function canRollSecretBoss(ascensionLevel: number): boolean {
  return ascensionLevel >= 3;
}

export function shouldUseSecretBoss(
  ascensionLevel: number,
  runSeed: number,
  floor: number,
): boolean {
  if (!canRollSecretBoss(ascensionLevel)) return false;
  const roll = ((runSeed + floor * 31337) >>> 0) % 100;
  return roll < 25;
}

export function getEffectiveAscensionTierOffset(state: GameState): number {
  return getAscensionTierBonus(state.ascensionLevel);
}
