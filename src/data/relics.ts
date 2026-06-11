import type { RelicId } from '../types/combat';
import { MAX_ACTIVE_RELICS } from '../types/combat';

export interface RelicDefinition {
  id: RelicId;
  name: string;
  description: string;
  /** Estilo de juego que potencia (para UI). */
  archetype: string;
  /** Reliquia con efecto negativo o riesgo elevado. */
  cursed?: boolean;
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
  sello_maldito: {
    id: 'sello_maldito',
    name: 'SELLO MALDITO',
    description: 'x2 score en todo, pero las trampas aparecen el doble de seguido',
    archetype: 'Apostador',
    cursed: true,
  },
  espejo_roto: {
    id: 'espejo_roto',
    name: 'ESPEJO ROTO',
    description: 'Todas las palabras normales se muestran como anagrama',
    archetype: 'Ilusionista',
    cursed: true,
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
  bonusReroll = false,
): RelicId[] {
  if (activeRelics.length >= MAX_ACTIVE_RELICS) return [];

  const available = RELIC_IDS.filter((id) => !activeRelics.includes(id));
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  if (bonusReroll) {
    shuffled.sort(() => Math.random() - 0.5);
  }
  const pickCount = bonusReroll
    ? Math.min(count + 1, shuffled.length)
    : Math.min(count, shuffled.length);
  return shuffled.slice(0, pickCount);
}
