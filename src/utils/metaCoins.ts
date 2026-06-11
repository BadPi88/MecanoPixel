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
