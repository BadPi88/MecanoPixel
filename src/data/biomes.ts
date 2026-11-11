/** Zonas visuales de la run (cada 3 pisos). */
export type BiomeId = 'scriptorium' | 'fabrica' | 'abismo' | 'trono' | 'palimpsesto';

export const FLOORS_PER_BIOME = 3;

export interface BiomeDefinition {
  id: BiomeId;
  name: string;
  /** Texto del banner al entrar en la zona. */
  enterLabel: string;
  floorMin: number;
}

export const BIOME_CATALOG: Record<BiomeId, BiomeDefinition> = {
  scriptorium: {
    id: 'scriptorium',
    name: 'SCRIPTORIUM',
    enterLabel: 'SCRIPTORIUM — archivos del primer piso',
    floorMin: 1,
  },
  fabrica: {
    id: 'fabrica',
    name: 'FABRICA',
    enterLabel: 'FABRICA — maquinas y circuitos',
    floorMin: 4,
  },
  abismo: {
    id: 'abismo',
    name: 'ABISMO',
    enterLabel: 'ABISMO — el vacio perfora',
    floorMin: 7,
  },
  trono: {
    id: 'trono',
    name: 'TRONO',
    enterLabel: 'TRONO — la tirania de las teclas',
    floorMin: 10,
  },
  palimpsesto: {
    id: 'palimpsesto',
    name: 'EL PALIMPSESTO',
    enterLabel: 'PALIMPSESTO — las palabras borradas regresan',
    floorMin: 13,
  },
};

const BIOME_ORDER: BiomeId[] = [
  'scriptorium',
  'fabrica',
  'abismo',
  'trono',
  'palimpsesto',
];

export function getBiomeForFloor(floor: number): BiomeId {
  const index = Math.min(
    Math.floor((Math.max(floor, 1) - 1) / FLOORS_PER_BIOME),
    BIOME_ORDER.length - 1,
  );
  return BIOME_ORDER[index];
}

const BIOME_INTRO_MS = 2_500;

/** Actualiza bioma al subir de piso; dispara banner si cambia la zona. */
export function applyBiomeForFloor(
  prevBiomeId: BiomeId,
  floor: number,
  elapsedMs: number,
  prevIntroUntilMs: number,
): { biomeId: BiomeId; biomeIntroUntilMs: number } {
  const biomeId = getBiomeForFloor(floor);
  if (biomeId === prevBiomeId) {
    return { biomeId, biomeIntroUntilMs: prevIntroUntilMs };
  }
  return { biomeId, biomeIntroUntilMs: elapsedMs + BIOME_INTRO_MS };
}
