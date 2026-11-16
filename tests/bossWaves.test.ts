import { describe, expect, it } from 'vitest';
import { BOSS_CATALOG, initBossWords } from '../src/data/bosses';
import { createSeededRandom } from '../src/engine/rng';
import { gameReducer } from '../src/engine/gameReducer';
import { initialGameState } from '../src/types/game';

describe('boss wave encounters', () => {
  it('builds three themed Tiranotipo waves and a final execution word deterministically', () => {
    const createWords = () => {
      let nextId = 0;
      return initBossWords(BOSS_CATALOG.tiranotipo, 0, 0, () => `word-${nextId++}`, 12, createSeededRandom(17));
    };
    const words = createWords();
    expect(words.map((word) => word.text)).toEqual(createWords().map((word) => word.text));
    expect(words).toHaveLength(13);
    expect(words.slice(0, 4).map((word) => word.text)).toEqual(['tecla', 'pulso', 'ritmo', 'clave']);
    expect(words.at(-1)?.text).toBe('victoria');
  });

  it('requires the Archivista seals before its archive word chain', () => {
    let nextId = 0;
    const words = initBossWords(BOSS_CATALOG.archivista, 0, 0, () => `word-${nextId++}`, 3, createSeededRandom(19));
    expect(words.length).toBeGreaterThan(2);
    expect(words.slice(0, 2).every((word) => word.modifiers?.includes('sealed'))).toBe(true);
    expect(words.slice(2).every((word) => !word.modifiers?.includes('sealed'))).toBe(true);
  });

  it('moves only the active word during a sequential boss wave', () => {
    const state = {
      ...initialGameState,
      status: 'boss' as const,
      bossId: 'tiranotipo' as const,
      bossWord: { id: 'active', text: 'tecla', x: 0, y: 40, kind: 'normal' as const },
      bossWords: [
        { id: 'active', text: 'tecla', x: 0, y: 40, kind: 'normal' as const },
        { id: 'next', text: 'pulso', x: 0, y: 40, kind: 'normal' as const },
        { id: 'later', text: 'ritmo', x: 0, y: 40, kind: 'normal' as const },
      ],
    };
    const next = gameReducer(state, { type: 'BOSS_TICK', payload: { deltaMs: 1_000, groundHeight: 552 } });
    expect(next.bossWords[0]?.y).toBeGreaterThan(40);
    expect(next.bossWords[1]?.y).toBe(40);
    expect(next.bossWords[2]?.y).toBe(40);
  });

  it('keeps the Tiranotipo encounter alive through the execution word', () => {
    const bossWords = ['tecla', 'pulso', 'ritmo', 'clave', 'codigo', 'patron', 'memoria', 'senal', 'dictado', 'dominio', 'control', 'tiranotipo', 'victoria']
      .map((text, index) => ({ id: `word-${index}`, text, x: 0, y: 40, kind: 'normal' as const }));
    let state = {
      ...initialGameState,
      status: 'boss' as const,
      floor: 12,
      bossId: 'tiranotipo' as const,
      bossWord: bossWords[0]!,
      bossWords,
    };
    for (let index = 0; index < bossWords.length; index += 1) {
      for (const char of bossWords[index]!.text) state = gameReducer(state, { type: 'TYPE_CHAR', payload: char });
      state = gameReducer(state, { type: 'SUBMIT' });
      if (index < bossWords.length - 1) {
        expect(state.status).toBe('boss');
        expect(state.activeBossWordIndex).toBe(index + 1);
      }
    }
    expect(state.status).toBe('victory');
  });
});
