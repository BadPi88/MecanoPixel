import { describe, expect, it } from 'vitest';
import { getActiveSynergies } from '../src/utils/synergyEngine';
import { initialGameState } from '../src/types/game';

describe('cross-build synergies', () => {
  it('unlocks the three added runner, glossary, and relic combinations', () => {
    expect(getActiveSynergies({
      ...initialGameState,
      runnerId: 'codificador',
      selectedGlossary: 'tecnico',
      activeRelics: ['cronometro_veloz'],
    })).toContain('ritmo_circuito');
    expect(getActiveSynergies({
      ...initialGameState,
      runnerId: 'veloz',
      selectedGlossary: 'tecnico',
      activeRelics: ['reliquia_ignea'],
    })).toContain('glosa_pirotecnica');
    expect(getActiveSynergies({
      ...initialGameState,
      runnerId: 'magnate',
      selectedGlossary: 'medico',
      activeRelics: ['bolsa_mercader'],
    })).toContain('mercado_medico');
  });
});
