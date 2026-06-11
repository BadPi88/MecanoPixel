import { loadMeta } from '../services/meta';
import type { RelicId } from '../types/combat';
import { MAX_ACTIVE_RELICS } from '../types/combat';
import { DEFAULT_UNLOCKED_RELICS } from './metaUnlocks';

export interface RelicDefinition {
  id: RelicId;
  name: string;
  description: string;
  archetype: string;
  cursed?: boolean;
}

export const RELIC_CATALOG: Record<RelicId, RelicDefinition> = {
  reliquia_ignea: {
    id: 'reliquia_ignea',
    name: 'RELIQUIA IGNEA',
    description: 'Palabras con F: +25% score y queman la palabra mas cercana',
    archetype: 'Piromante',
  },
  diccionario_erudito: {
    id: 'diccionario_erudito',
    name: 'DICCIONARIO ERUDITO',
    description: 'Palabras 8+ letras: x3. Palabras 4 o menos: x0.5',
    archetype: 'Francotirador',
  },
  teclado_cortocircuitado: {
    id: 'teclado_cortocircuitado',
    name: 'TECLADO CORTOCIRCUITADO',
    description: 'Solo 3-4 letras; acierto dana vecinas',
    archetype: 'Metralleta',
  },
  tinta_toxica: {
    id: 'tinta_toxica',
    name: 'TINTA TOXICA',
    description: 'Fallar envio: -1 vida pero limpia pantalla',
    archetype: 'Kamikaze',
  },
  afinacion_vocales: {
    id: 'afinacion_vocales',
    name: 'AFINACION DE VOCALES',
    description: 'Palabras sin vocales en pantalla',
    archetype: 'Teclista Letal',
  },
  sello_maldito: {
    id: 'sello_maldito',
    name: 'SELLO MALDITO',
    description: 'x2 score, trampas x2',
    archetype: 'Apostador',
    cursed: true,
  },
  espejo_roto: {
    id: 'espejo_roto',
    name: 'ESPEJO ROTO',
    description: 'Anagramas forzados',
    archetype: 'Ilusionista',
    cursed: true,
  },
  escudo_runico: {
    id: 'escudo_runico',
    name: 'ESCUDO RUNICO',
    description: '+2 cargas anti-trampa al inicio de cada piso',
    archetype: 'Tanque',
  },
  cronometro_veloz: {
    id: 'cronometro_veloz',
    name: 'CRONOMETRO VELOZ',
    description: 'Ultimate carga +25% por letra correcta',
    archetype: 'Speed',
  },
  bolsa_mercader: {
    id: 'bolsa_mercader',
    name: 'BOLSA MERCADER',
    description: 'Tienda -20% precio',
    archetype: 'Economia',
  },
  dados_caoticos: {
    id: 'dados_caoticos',
    name: 'DADOS CAOTICOS',
    description: 'Score x0.7-1.8 aleatorio por palabra',
    archetype: 'Caos',
  },
  ancla_gravitatoria: {
    id: 'ancla_gravitatoria',
    name: 'ANCLA GRAVITATORIA',
    description: 'Caida -12%, score -8%',
    archetype: 'Tanque',
  },
  moneda_ardiente: {
    id: 'moneda_ardiente',
    name: 'MONEDA ARDIENTE',
    description: 'Palabras bonus dan +8 run coins',
    archetype: 'Economia',
  },
  contrato_sangriento: {
    id: 'contrato_sangriento',
    name: 'CONTRATO SANGRIENTO',
    description: 'x1.5 score, -1 vida cada 3 pisos',
    archetype: 'Maldito',
    cursed: true,
  },
  teclado_espejo: {
    id: 'teclado_espejo',
    name: 'TECLADO ESPEJO',
    description: 'Texto mostrado invertido',
    archetype: 'Maldito',
    cursed: true,
  },
  maldicion_prisa: {
    id: 'maldicion_prisa',
    name: 'MALDICION PRISA',
    description: 'Combo a 0 si tardas >4s en una palabra',
    archetype: 'Maldito',
    cursed: true,
  },
};

export const RELIC_IDS = Object.keys(RELIC_CATALOG) as RelicId[];

export function getRelicDefinition(id: RelicId): RelicDefinition {
  return RELIC_CATALOG[id];
}

export function getUnlockedRelicPool(): RelicId[] {
  const meta = loadMeta();
  return RELIC_IDS.filter(
    (id) =>
      DEFAULT_UNLOCKED_RELICS.includes(id) ||
      meta.unlockedRelics.includes(id),
  );
}

export function pickRelicChoices(
  activeRelics: RelicId[],
  count = 3,
  bonusReroll = false,
): RelicId[] {
  if (activeRelics.length >= MAX_ACTIVE_RELICS) return [];

  const pool = getUnlockedRelicPool();
  const available = pool.filter((id) => !activeRelics.includes(id));
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  if (bonusReroll) shuffled.sort(() => Math.random() - 0.5);
  const pickCount = bonusReroll
    ? Math.min(count + 1, shuffled.length)
    : Math.min(count, shuffled.length);
  return shuffled.slice(0, pickCount);
}
