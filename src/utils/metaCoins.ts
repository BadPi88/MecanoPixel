export function calculateMetaCoinsEarned(floor: number, score: number): number {
  return Math.floor(floor * 50 + score / 100);
}

export function calculateRunCoinsFromScore(points: number): number {
  return Math.floor(points / 25);
}
