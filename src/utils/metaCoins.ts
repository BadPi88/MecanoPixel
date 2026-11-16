export interface MetaCoinsBreakdown {
  floorBase: number;
  scoreBonus: number;
  ascensionMultiplier: number;
  afterAscension: number;
  bossPenalty: number;
  total: number;
}

export function getMetaCoinsBreakdown(
  floor: number,
  score: number,
  bossSkipMultiplier: number,
  ascensionMultiplier: number,
): MetaCoinsBreakdown {
  const floorBase = floor * 50;
  const scoreBonus = score / 100;
  const afterAscension = Math.floor((floorBase + scoreBonus) * ascensionMultiplier);
  const total = Math.floor((floorBase + scoreBonus) * ascensionMultiplier * bossSkipMultiplier);
  return {
    floorBase,
    scoreBonus,
    ascensionMultiplier,
    afterAscension,
    bossPenalty: afterAscension - total,
    total,
  };
}

export function calculateMetaCoinsEarned(
  floor: number,
  score: number,
  mult = 1,
): number {
  return Math.floor((floor * 50 + score / 100) * mult);
}

export function calculateRunCoinsFromScore(points: number): number {
  return Math.floor(points / 25);
}
