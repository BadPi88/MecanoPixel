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
  rarity?: RelicRarity;
}

export type RelicRarity = 'comun' | 'rara' | 'epica';

const RELIC_RARITY: Record<RelicId, RelicRarity> = {
  reliquia_ignea: 'comun', diccionario_erudito: 'comun', teclado_cortocircuitado: 'rara',
  tinta_toxica: 'rara', afinacion_vocales: 'rara', sello_maldito: 'epica',
  espejo_roto: 'epica', escudo_runico: 'comun', cronometro_veloz: 'rara',
  bolsa_mercader: 'comun', dados_caoticos: 'epica', ancla_gravitatoria: 'rara',
  moneda_ardiente: 'comun', contrato_sangriento: 'epica', teclado_espejo: 'epica',
  maldicion_prisa: 'rara', marca_agua: 'comun', colofon: 'comun',
  glosa_acentuada: 'rara', separador: 'comun', pluma_de_eco: 'comun',
  borrador_compasivo: 'rara',
};

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
  marca_agua: {
    id: 'marca_agua',
    name: 'MARCA DE AGUA',
    description: 'Palabra perfecta: +2 carga ultimate extra',
    archetype: 'Caligrafa',
  },
  colofon: {
    id: 'colofon',
    name: 'COLOFON',
    description: 'Palabras de 8+ letras: +8 run coins',
    archetype: 'Erudito',
  },
  glosa_acentuada: {
    id: 'glosa_acentuada',
    name: 'GLOSA ACENTUADA',
    description: 'Palabras con tilde: +25% score',
    archetype: 'Acentuacion',
  },
  separador: {
    id: 'separador',
    name: 'SEPARADOR',
    description: '+1 carga anti-trampa al inicio de cada piso',
    archetype: 'Defensa',
  },
  pluma_de_eco: {
    id: 'pluma_de_eco',
    name: 'PLUMA DE ECO',
    description: 'Palabra perfecta de 8+ letras: +5 carga ultimate',
    archetype: 'Caligrafa',
  },
  borrador_compasivo: {
    id: 'borrador_compasivo',
    name: 'BORRADOR COMPASIVO',
    description: 'Backspace resta 5 de carga ultimate en vez de 15',
    archetype: 'Control',
  },
};

for (const id of Object.keys(RELIC_CATALOG) as RelicId[]) {
  RELIC_CATALOG[id].rarity = RELIC_RARITY[id];
}

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
  random: () => number = Math.random,
): RelicId[] {
  if (activeRelics.length >= MAX_ACTIVE_RELICS) return [];

  const pool = getUnlockedRelicPool();
  const available = pool.filter((id) => !activeRelics.includes(id));
  const pickCount = bonusReroll
    ? Math.min(count + 1, available.length)
    : Math.min(count, available.length);

  // Pesos mas altos para comunes, dejando las epicas como hallazgos especiales.
  // Reducimos duplicados de arquetipo para que las opciones propongan builds distintas.
  const rarityWeight: Record<RelicRarity, number> = { comun: 5, rara: 2, epica: 0.8 };
  const synergyPartners: Partial<Record<RelicId, RelicId[]>> = {
    tinta_toxica: ['contrato_sangriento'],
    contrato_sangriento: ['tinta_toxica'], dados_caoticos: ['sello_maldito'],
    sello_maldito: ['dados_caoticos'], moneda_ardiente: ['bolsa_mercader'],
    bolsa_mercader: ['moneda_ardiente'], glosa_acentuada: ['marca_agua'],
    marca_agua: ['glosa_acentuada'],
  };
  const remaining = [...available];
  const choices: RelicId[] = [];
  while (choices.length < pickCount && remaining.length > 0) {
    const archetypes = new Set(choices.map((id) => RELIC_CATALOG[id].archetype));
    const weights = remaining.map((id) => {
      const archetypeWeight = archetypes.has(RELIC_CATALOG[id].archetype)
        ? 0.35
        : 1;
      const synergyWeight = activeRelics.some((active) =>
        synergyPartners[active]?.includes(id),
      )
        ? 2.2
        : 1;
      return rarityWeight[RELIC_RARITY[id]] * archetypeWeight * synergyWeight;
    });
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    let roll = random() * total;
    let selectedIndex = weights.length - 1;
    for (let i = 0; i < weights.length; i++) {
      roll -= weights[i];
      if (roll < 0) {
        selectedIndex = i;
        break;
      }
    }
    choices.push(remaining.splice(selectedIndex, 1)[0]);
  }
  return choices;
}
