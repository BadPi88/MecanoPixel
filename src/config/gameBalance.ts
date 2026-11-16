/** Ajustes compartidos de balance para que el tuning no quede disperso. */
export const GAME_BALANCE = {
  scoreMultiplierHardCap: 8,
  scoreMultiplierSoftCap: 3,
  minimumSpawnIntervalMs: 500,
  maximumFallSpeed: 320,
  shieldChargeHardCap: 2,
  shop: { offerCount: 4, rerollBaseCost: 90 },
  combat: { ultimateChargeCap: 100, projectileCap: 5 },
  typing: {
    trapPenalty: 40,
    ultimateChargePerChar: 1.5,
    ultimateDeflectBonus: 5,
    ultimateFreezeMs: 2_000,
    adjacentTempoBuffMs: 8_000,
    verbAoeFactor: 0.7,
    cleanWordScoreMultiplier: 1.1,
    projectileHeight: 24,
    oracleScoreBase: 50,
    oracleScorePerChar: 10,
    oracleChargeReward: 35,
  },
  boss: { blindIntervalMs: 10_000, blindDurationMs: 2_000 },
  economy: { bonusWordCoins: 15, eliteCoinMultiplier: 1.5 },
} as const;

export type GameBalance = typeof GAME_BALANCE;

/** Suaviza el crecimiento de sinergias sin reducir builds por debajo del soft cap. */
export function applyDiminishingReturns(value: number): number {
  const soft = GAME_BALANCE.scoreMultiplierSoftCap;
  const hard = GAME_BALANCE.scoreMultiplierHardCap;
  if (value <= soft) return value;
  return Math.min(hard, soft + (hard - soft) * (1 - Math.exp(-(value - soft) / (hard - soft))));
}
