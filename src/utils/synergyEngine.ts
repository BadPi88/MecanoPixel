import type { RelicId } from '../types/combat';
import type { GameState } from '../types/game';

export type SynergyId =
  | 'doble_defensa'
  | 'radar_purga'
  | 'fuego_electrico'
  | 'tinta_segura'
  | 'vocal_codificada';

export interface SynergyDefinition {
  id: SynergyId;
  name: string;
  description: string;
}

export const SYNERGY_CATALOG: Record<SynergyId, SynergyDefinition> = {
  doble_defensa: {
    id: 'doble_defensa',
    name: 'DOBLE DEFENSA',
    description: 'Escudo con 2 cargas',
  },
  radar_purga: {
    id: 'radar_purga',
    name: 'RADAR + PURGA',
    description: 'Purga gratis cada 60 s mientras el radar este activo',
  },
  fuego_electrico: {
    id: 'fuego_electrico',
    name: 'FUEGO ELECTRICO',
    description: 'La quemadura ignea se propaga a 2 palabras',
  },
  tinta_segura: {
    id: 'tinta_segura',
    name: 'TINTA SEGURA',
    description: 'La explosion toxica no rompe el combo',
  },
  vocal_codificada: {
    id: 'vocal_codificada',
    name: 'VOCAL CODIFICADA',
    description: 'Combo x2 desde combo 2',
  },
};

export function getActiveSynergies(state: GameState): SynergyId[] {
  const result: SynergyId[] = [];

  const radarActive = state.activePerks.some((p) => p.id === 'radar');
  const hasPurgeHistory = state.perksHistory.includes('purge');
  if (radarActive && hasPurgeHistory) result.push('radar_purga');

  if (
    state.activeRelics.includes('reliquia_ignea') &&
    state.selectedGlossary === 'tecnico'
  ) {
    result.push('fuego_electrico');
  }

  if (
    state.activeRelics.includes('tinta_toxica') &&
    state.activePerks.some((p) => p.id === 'combo_safe')
  ) {
    result.push('tinta_segura');
  }

  if (
    state.activeRelics.includes('afinacion_vocales') &&
    state.runnerId === 'codificador'
  ) {
    result.push('vocal_codificada');
  }

  return result;
}

export function hasSynergy(state: GameState, id: SynergyId): boolean {
  return getActiveSynergies(state).includes(id);
}

/** Sinergias que se activarian al elegir esta reliquia (preview en picker). */
export function previewSynergiesIfRelic(
  state: GameState,
  relicId: RelicId,
): SynergyId[] {
  const current = getActiveSynergies(state);
  const withRelic: GameState = {
    ...state,
    activeRelics: state.activeRelics.includes(relicId)
      ? state.activeRelics
      : [...state.activeRelics, relicId],
  };
  return getActiveSynergies(withRelic).filter((id) => !current.includes(id));
}
