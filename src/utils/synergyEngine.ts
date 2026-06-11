import type { RelicId } from '../types/combat';
import type { GameState } from '../types/game';

export type SynergyId =
  | 'doble_defensa'
  | 'radar_purga'
  | 'fuego_electrico'
  | 'tinta_segura'
  | 'vocal_codificada'
  | 'sangre_toxica'
  | 'caos_maldito'
  | 'mercader_dorado';

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
  sangre_toxica: {
    id: 'sangre_toxica',
    name: 'SANGRE TOXICA',
    description: 'Contrato sangriento no pierde combo al explotar',
  },
  caos_maldito: {
    id: 'caos_maldito',
    name: 'CAOS MALDITO',
    description: 'Dados caoticos nunca bajan de x1',
  },
  mercader_dorado: {
    id: 'mercader_dorado',
    name: 'MERCADER DORADO',
    description: 'Moneda ardiente x2 run coins en bonus',
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

  if (
    state.activeRelics.includes('contrato_sangriento') &&
    state.activeRelics.includes('tinta_toxica')
  ) {
    result.push('sangre_toxica');
  }

  if (
    state.activeRelics.includes('dados_caoticos') &&
    state.activeRelics.includes('sello_maldito')
  ) {
    result.push('caos_maldito');
  }

  if (
    state.activeRelics.includes('moneda_ardiente') &&
    state.activeRelics.includes('bolsa_mercader')
  ) {
    result.push('mercader_dorado');
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
