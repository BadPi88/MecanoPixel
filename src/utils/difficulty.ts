import type { DifficultyTier } from '../types/game';

export const SPEED_RAMP_INTERVAL_MS = 20_000;
export const BASE_FALL_SPEED = 40;
export const SPEED_INCREMENT = 5;
export const MAX_FALL_SPEED = 240;
export const BASE_SPAWN_INTERVAL = 2500;
export const SPAWN_DECREMENT = 50;
export const MIN_SPAWN_INTERVAL = 700;

export function getDifficultyTier(
  elapsedMs: number,
  tierOffset = 0,
): DifficultyTier {
  const rawTier = Math.floor(elapsedMs / SPEED_RAMP_INTERVAL_MS);
  const tier = Math.max(0, rawTier - tierOffset);

  const fallSpeed = Math.min(
    BASE_FALL_SPEED + tier * SPEED_INCREMENT,
    MAX_FALL_SPEED,
  );

  const spawnInterval = Math.max(
    BASE_SPAWN_INTERVAL - tier * SPAWN_DECREMENT,
    MIN_SPAWN_INTERVAL,
  );

  const minLen = Math.min(3 + Math.floor(tier / 6), 6);
  const maxLen = Math.min(5 + Math.floor(tier / 3), 10);

  return {
    fallSpeed,
    spawnInterval,
    wordLengthRange: [minLen, maxLen],
    tier,
  };
}
