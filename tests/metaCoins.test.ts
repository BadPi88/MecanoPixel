import { describe, expect, it } from 'vitest';
import { calculateMetaCoinsEarned, getMetaCoinsBreakdown } from '../src/utils/metaCoins';

describe('meta coin breakdown', () => {
  it('explains floor, score, ascension, and skipped-boss penalty without changing the reward', () => {
    const breakdown = getMetaCoinsBreakdown(8, 1_234, 0.7, 1.25);
    expect(breakdown).toEqual({
      floorBase: 400,
      scoreBonus: 12.34,
      ascensionMultiplier: 1.25,
      afterAscension: 515,
      bossPenalty: 155,
      total: 360,
    });
    expect(breakdown.total).toBe(calculateMetaCoinsEarned(8, 1_234, 0.7 * 1.25));
  });
});
