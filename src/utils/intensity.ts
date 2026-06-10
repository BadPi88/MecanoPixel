import { getDifficultyTier } from './difficulty';

/** Palabras nuevas que aparecen por segundo según el intervalo de spawn. */
export function wordsPerSecondFromSpawnInterval(spawnIntervalMs: number): number {
  return 1000 / spawnIntervalMs;
}

export function wordsPerSecondFromElapsed(
  elapsedMs: number,
  tierOffset = 0,
  spawnIntervalMult = 1,
): number {
  const { spawnInterval } = getDifficultyTier(elapsedMs, tierOffset);
  return wordsPerSecondFromSpawnInterval(spawnInterval * spawnIntervalMult);
}

/** Texto legible para cualquier jugador, p. ej. "1.4 pal/s". */
export function formatWordsPerSecond(wps: number): string {
  if (wps <= 0) return '0 pal/s';
  const rounded = Math.round(wps * 10) / 10;
  return `${rounded} pal/s`;
}

export function formatPeakIntensity(wps: number): {
  value: string;
  hint: string;
} {
  return {
    value: formatWordsPerSecond(wps),
    hint: 'palabras nuevas por segundo',
  };
}
