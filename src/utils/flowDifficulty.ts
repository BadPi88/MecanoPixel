import type { FlowStats } from '../types/combat';

const UPDATE_INTERVAL_MS = 10_000;
const EMA_ALPHA = 0.3;
/** El flow suaviza picos; la progresion por pisos conserva la curva principal. */
const SPAWN_STEP_DOWN = 0.97;
const SPAWN_STEP_UP = 1.03;
const SPEED_STEP_UP = 1.02;
const SPEED_STEP_DOWN = 0.98;
const SPAWN_MULT_MIN = 0.9;
const SPAWN_MULT_MAX = 1.1;
const SPEED_MULT_MIN = 0.94;
const SPEED_MULT_MAX = 1.06;
const PROGRESSION_RATE_MIN = 0.8;
const PROGRESSION_RATE_MAX = 1.2;
const PROGRESSION_RATE_STEP = 0.05;
const PROGRESSION_RATE_RECOVERY = 0.02;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Actualiza las estadisticas de flow cada 10 s. Ajusta los multiplicadores
 * para mantener al jugador en la zona (tasa de error objetivo 8-15%).
 */
export function updateFlowStats(
  stats: FlowStats,
  elapsedMs: number,
): FlowStats {
  if (stats.lastUpdateMs === 0) {
    return { ...stats, lastUpdateMs: elapsedMs };
  }
  if (elapsedMs - stats.lastUpdateMs < UPDATE_INTERVAL_MS) {
    return stats;
  }

  const minutes = (elapsedMs - stats.lastUpdateMs) / 60_000;
  const wpm = minutes > 0 ? stats.windowChars / 5 / minutes : 0;
  const totalEvents = stats.windowChars + stats.windowErrors;
  const errorRate =
    totalEvents > 0 ? stats.windowErrors / totalEvents : stats.emaErrorRate;

  const emaWpm = stats.emaWpm * (1 - EMA_ALPHA) + wpm * EMA_ALPHA;
  const emaErrorRate =
    stats.emaErrorRate * (1 - EMA_ALPHA) + errorRate * EMA_ALPHA;

  let spawnMult = stats.spawnMult;
  let speedMult = stats.speedMult;
  let progressionRate = stats.progressionRate;

  if (emaErrorRate < 0.05 && emaWpm >= 45) {
    spawnMult *= SPAWN_STEP_DOWN;
    speedMult *= SPEED_STEP_UP;
    progressionRate = Math.min(
      PROGRESSION_RATE_MAX,
      progressionRate + PROGRESSION_RATE_STEP,
    );
  } else if (emaErrorRate > 0.2 || (emaWpm < 25 && emaErrorRate > 0.12)) {
    spawnMult *= SPAWN_STEP_UP;
    speedMult *= SPEED_STEP_DOWN;
    progressionRate = Math.max(
      PROGRESSION_RATE_MIN,
      progressionRate - PROGRESSION_RATE_STEP,
    );
  } else if (progressionRate > 1) {
    progressionRate = Math.max(1, progressionRate - PROGRESSION_RATE_RECOVERY);
  } else if (progressionRate < 1) {
    progressionRate = Math.min(1, progressionRate + PROGRESSION_RATE_RECOVERY);
  }

  return {
    emaWpm,
    emaErrorRate,
    progressionRate,
    spawnMult: clamp(spawnMult, SPAWN_MULT_MIN, SPAWN_MULT_MAX),
    speedMult: clamp(speedMult, SPEED_MULT_MIN, SPEED_MULT_MAX),
    windowChars: 0,
    windowErrors: 0,
    lastUpdateMs: elapsedMs,
  };
}
