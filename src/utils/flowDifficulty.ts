import type { FlowStats } from '../types/combat';

const UPDATE_INTERVAL_MS = 10_000;
const EMA_ALPHA = 0.3;
/** Limites de ajuste por tick para evitar saltos bruscos (<15%). */
const SPAWN_STEP_DOWN = 0.92;
const SPAWN_STEP_UP = 1.08;
const SPEED_STEP_UP = 1.05;
const SPEED_STEP_DOWN = 0.95;
const SPAWN_MULT_MIN = 0.75;
const SPAWN_MULT_MAX = 1.25;
const SPEED_MULT_MIN = 0.8;
const SPEED_MULT_MAX = 1.2;

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

  if (emaErrorRate < 0.05 && emaWpm >= 45) {
    spawnMult *= SPAWN_STEP_DOWN;
    speedMult *= SPEED_STEP_UP;
  } else if (emaErrorRate > 0.2 || (emaWpm < 25 && emaErrorRate > 0.12)) {
    spawnMult *= SPAWN_STEP_UP;
    speedMult *= SPEED_STEP_DOWN;
  }

  return {
    emaWpm,
    emaErrorRate,
    spawnMult: clamp(spawnMult, SPAWN_MULT_MIN, SPAWN_MULT_MAX),
    speedMult: clamp(speedMult, SPEED_MULT_MIN, SPEED_MULT_MAX),
    windowChars: 0,
    windowErrors: 0,
    lastUpdateMs: elapsedMs,
  };
}
