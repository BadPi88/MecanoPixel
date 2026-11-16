import { describe, expect, it } from 'vitest';
import { replayRun } from '../src/engine/replay';
import { getDefaultMeta } from '../src/services/meta';

describe('replay autoritativo', () => {
  it('rechaza secuencias de eventos alteradas', () => {
    const result = replayRun([
      { sequence: 1, elapsedMs: 0, action: { type: 'BEGIN_RUN', payload: { runSeed: 7 } } },
    ], { runSeed: 7, score: 0, wordsTyped: 0, correctChars: 0, elapsedMs: 0 }, getDefaultMeta());
    expect(result).toEqual({ valid: false, reason: 'event_order' });
  });

  it('rechaza eventos no soportados antes de tocar el estado', () => {
    const result = replayRun([
      { sequence: 0, elapsedMs: 0, action: { type: 'ADMIN_SET_SCORE', payload: 999_999 } },
    ], { runSeed: 7, score: 999_999, wordsTyped: 0, correctChars: 0, elapsedMs: 0 }, getDefaultMeta());
    expect(result).toEqual({ valid: false, reason: 'event_order' });
  });
});
