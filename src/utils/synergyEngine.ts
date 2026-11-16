import type { RelicId } from '../types/combat.ts';
import type { GameState } from '../types/game.ts';

export type SynergyId =
  | 'doble_defensa'
  | 'radar_purga'
  | 'fuego_electrico'
  | 'tinta_segura'
  | 'vocal_codificada'
  | 'sangre_toxica'
  | 'caos_maldito'
  | 'mercader_dorado'
  | 'glosa_perfecta'
  | 'ritmo_circuito'
  | 'glosa_pirotecnica'
  | 'mercado_medico';

export interface SynergyDefinition {
  id: SynergyId;
  name: string;
  description: string;
}

export type SynergyContext = Pick<GameState, 'activePerks' | 'perksHistory' | 'activeRelics' | 'selectedGlossary' | 'runnerId'>;

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
  glosa_perfecta: {
    id: 'glosa_perfecta',
    name: 'GLOSA PERFECTA',
    description: 'Palabras con tilde perfectas: +5 carga ultimate',
  },
  ritmo_circuito: {
    id: 'ritmo_circuito',
    name: 'RITMO DE CIRCUITO',
    description: 'Codificador + Tecnico + Cronometro Veloz: +12% score y +10% carga',
  },
  glosa_pirotecnica: {
    id: 'glosa_pirotecnica',
    name: 'GLOSA PIROTECNICA',
    description: 'Veloz + Tecnico + Reliquia Ignea: +20% score en palabras con tilde',
  },
  mercado_medico: {
    id: 'mercado_medico',
    name: 'MERCADO MEDICO',
    description: 'Magnate + Medico + Bolsa Mercader: +25% run coins',
  },
};

export function getActiveSynergies(state: SynergyContext): SynergyId[] {
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

  if (
    state.activeRelics.includes('glosa_acentuada') &&
    state.activeRelics.includes('marca_agua')
  ) result.push('glosa_perfecta');

  if (state.runnerId === 'codificador' && state.selectedGlossary === 'tecnico' && state.activeRelics.includes('cronometro_veloz')) {
    result.push('ritmo_circuito');
  }
  if (state.runnerId === 'veloz' && state.selectedGlossary === 'tecnico' && state.activeRelics.includes('reliquia_ignea')) {
    result.push('glosa_pirotecnica');
  }
  if (state.runnerId === 'magnate' && state.selectedGlossary === 'medico' && state.activeRelics.includes('bolsa_mercader')) {
    result.push('mercado_medico');
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

/** Sinergias que esta reliquia acerca, con el requisito restante resumido. */
export function previewPotentialSynergiesIfRelic(
  state: GameState,
  relicId: RelicId,
): Array<{ id: SynergyId; missing: string }> {
  const withRelic: GameState = {
    ...state,
    activeRelics: state.activeRelics.includes(relicId)
      ? state.activeRelics
      : [...state.activeRelics, relicId],
  };
  const active = new Set(getActiveSynergies(withRelic));
  const candidates: Array<{ id: SynergyId; missing: string }> = [];
  const relics = withRelic.activeRelics;
  const has = (id: RelicId) => relics.includes(id);
  const add = (id: SynergyId, ready: boolean, missing: string) => {
    if (!ready && !active.has(id)) candidates.push({ id, missing });
  };

  add('fuego_electrico', has('reliquia_ignea') && withRelic.selectedGlossary === 'tecnico',
    has('reliquia_ignea') ? 'glosario tecnico' : 'Reliquia Ignea');
  add('tinta_segura', has('tinta_toxica') && withRelic.activePerks.some((p) => p.id === 'combo_safe'),
    has('tinta_toxica') ? 'perk Combo Seguro' : 'Tinta Toxica');
  add('vocal_codificada', has('afinacion_vocales') && withRelic.runnerId === 'codificador',
    has('afinacion_vocales') ? 'runner Codificador' : 'Afinacion de Vocales');
  add('sangre_toxica', has('contrato_sangriento') && has('tinta_toxica'),
    has('contrato_sangriento') ? 'Tinta Toxica' : 'Contrato Sangriento');
  add('caos_maldito', has('dados_caoticos') && has('sello_maldito'),
    has('dados_caoticos') ? 'Sello Maldito' : 'Dados Caoticos');
  add('mercader_dorado', has('moneda_ardiente') && has('bolsa_mercader'),
    has('moneda_ardiente') ? 'Bolsa Mercader' : 'Moneda Ardiente');
  add('glosa_perfecta', has('glosa_acentuada') && has('marca_agua'),
    has('glosa_acentuada') ? 'Marca de Agua' : 'Glosa Acentuada');
  add('ritmo_circuito', has('cronometro_veloz') && withRelic.runnerId === 'codificador' && withRelic.selectedGlossary === 'tecnico',
    has('cronometro_veloz') ? 'runner Codificador y glosario Tecnico' : 'Cronometro Veloz');
  add('glosa_pirotecnica', has('reliquia_ignea') && withRelic.runnerId === 'veloz' && withRelic.selectedGlossary === 'tecnico',
    has('reliquia_ignea') ? 'runner Veloz y glosario Tecnico' : 'Reliquia Ignea');
  add('mercado_medico', has('bolsa_mercader') && withRelic.runnerId === 'magnate' && withRelic.selectedGlossary === 'medico',
    has('bolsa_mercader') ? 'runner Magnate y glosario Medico' : 'Bolsa Mercader');
  return candidates.slice(0, 2);
}
