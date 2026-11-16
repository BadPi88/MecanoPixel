/** Ajustes compartidos de balance para que el tuning no quede disperso. */
export const GAME_BALANCE = {
  scoreMultiplierHardCap: 8,
  minimumSpawnIntervalMs: 500,
  maximumFallSpeed: 320,
  shieldChargeHardCap: 2,
  shop: { offerCount: 4, rerollBaseCost: 90 },
  combat: { ultimateChargeCap: 100, projectileCap: 5 },
  economy: { bonusWordCoins: 15, eliteCoinMultiplier: 1.5 },
} as const;

export type GameBalance = typeof GAME_BALANCE;
