import type { RelicId } from '../types/combat';
import { MAX_ACTIVE_RELICS } from '../types/combat';

export interface RelicDefinition {
  id: RelicId;
  name: string;
  description: string;
  /** Estilo de juego que potencia (para UI). */
  archetype: string;
}

export const RELIC_CATALOG: Record<RelicId, RelicDefinition> = {
  reliquia_ignea: {
    id: 'reliquia_ignea',
    name: 'RELIQUIA IGNEA',
    description: 'Palabras con F: +25% score y queman la palabra mas cercana (+20% al escribirla)',
    archetype: 'Piromante',
  },
  diccionario_erudito: {
    id: 'diccionario_erudito',
    name: 'DICCIONARIO ERUDITO',
    description: 'Palabras 8+ letras: x3 score. Palabras de 4 o menos: x0.5',
    archetype: 'Francotirador',
  },
  teclado_cortocircuitado: {
    id: 'teclado_cortocircuitado',
    name: 'TECLADO CORTOCIRCUITADO',
    description: 'Solo palabras de 3-4 letras, caen mas seguido; cada acierto dana palabras vecinas',
    archetype: 'Metralleta',
  },
  tinta_toxica: {
    id: 'tinta_toxica',
    name: 'TINTA TOXICA',
    description: 'Fallar un envio cuesta 1 vida pero explota y limpia toda la pantalla',
    archetype: 'Kamikaze',
  },
  afinacion_vocales: {
    id: 'afinacion_vocales',
    name: 'AFINACION DE VOCALES',
    description: 'Las palabras se muestran sin vocales (escribe la palabra completa)',
    archetype: 'Teclista Letal',
  },
};

export const RELIC_IDS = Object.keys(RELIC_CATALOG) as RelicId[];

export function getRelicDefinition(id: RelicId): RelicDefinition {
  return RELIC_CATALOG[id];
}

/** Elige hasta `count` reliquias no poseidas. Vacio si ya hay 4 activas. */
export function pickRelicChoices(
  activeRelics: RelicId[],
  count = 3,
): RelicId[] {
  if (activeRelics.length >= MAX_ACTIVE_RELICS) return [];

  const available = RELIC_IDS.filter((id) => !activeRelics.includes(id));
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
