export function calculateWordScore(
  wordLength: number,
  combo: number,
  yPosition: number,
  groundHeight: number,
): number {
  const base = wordLength * 10;
  const comboMultiplier = 1 + combo * 0.1;
  const topThird = groundHeight / 3;
  const speedBonus = yPosition < topThird ? 1.5 : 1;

  return Math.round(base * comboMultiplier * speedBonus);
}

export function calculateMissPenalty(): number {
  return 25;
}
