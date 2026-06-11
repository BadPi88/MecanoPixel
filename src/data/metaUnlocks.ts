import type { RelicId } from '../types/combat';

export type WordPaletteId = 'classic' | 'neon' | 'sepia' | 'ice';
export type TrailId = 'none' | 'sparks' | 'pixels';
export type FrameId = 'default' | 'gold' | 'boss';

export interface CosmeticUnlock {
  id: string;
  kind: 'palette' | 'trail' | 'frame';
  value: WordPaletteId | TrailId | FrameId;
  cost: number;
  label: string;
  description: string;
}

export interface RelicUnlockEntry {
  relicId: RelicId;
  cost: number;
  label: string;
}

export interface HubUpgradeEntry {
  id: 'extraMapOption' | 'safeFirstFloor';
  cost: number;
  label: string;
  description: string;
}

/** Reliquias siempre en el pool inicial. */
export const DEFAULT_UNLOCKED_RELICS: RelicId[] = [
  'reliquia_ignea',
  'diccionario_erudito',
  'teclado_cortocircuitado',
  'tinta_toxica',
];

export const RELIC_UNLOCKS: RelicUnlockEntry[] = [
  { relicId: 'afinacion_vocales', cost: 200, label: 'AFINACION VOCALES' },
  { relicId: 'sello_maldito', cost: 250, label: 'SELLO MALDITO' },
  { relicId: 'espejo_roto', cost: 250, label: 'ESPEJO ROTO' },
  { relicId: 'escudo_runico', cost: 300, label: 'ESCUDO RUNICO' },
  { relicId: 'cronometro_veloz', cost: 280, label: 'CRONOMETRO VELOZ' },
  { relicId: 'bolsa_mercader', cost: 220, label: 'BOLSA MERCADER' },
  { relicId: 'dados_caoticos', cost: 350, label: 'DADOS CAOTICOS' },
  { relicId: 'ancla_gravitatoria', cost: 300, label: 'ANCLA GRAVITATORIA' },
  { relicId: 'moneda_ardiente', cost: 240, label: 'MONEDA ARDIENTE' },
  { relicId: 'contrato_sangriento', cost: 400, label: 'CONTRATO SANGRIENTO' },
  { relicId: 'teclado_espejo', cost: 320, label: 'TECLADO ESPEJO' },
  { relicId: 'maldicion_prisa', cost: 300, label: 'MALDICION PRISA' },
];

export const COSMETIC_UNLOCKS: CosmeticUnlock[] = [
  {
    id: 'palette_neon',
    kind: 'palette',
    value: 'neon',
    cost: 250,
    label: 'PALETA NEON',
    description: 'Palabras en tonos cyan y magenta',
  },
  {
    id: 'palette_sepia',
    kind: 'palette',
    value: 'sepia',
    cost: 200,
    label: 'PALETA SEPIA',
    description: 'Tonos vintage de biblioteca',
  },
  {
    id: 'palette_ice',
    kind: 'palette',
    value: 'ice',
    cost: 300,
    label: 'PALETA HIELO',
    description: 'Azules frios en las palabras',
  },
  {
    id: 'trail_sparks',
    kind: 'trail',
    value: 'sparks',
    cost: 280,
    label: 'RASTRO CHISPAS',
    description: 'Particulas al teclear',
  },
  {
    id: 'trail_pixels',
    kind: 'trail',
    value: 'pixels',
    cost: 280,
    label: 'RASTRO PIXEL',
    description: 'Cuadrados al escribir',
  },
  {
    id: 'frame_gold',
    kind: 'frame',
    value: 'gold',
    cost: 400,
    label: 'MARCO DORADO',
    description: 'Marco dorado en el leaderboard',
  },
  {
    id: 'frame_boss',
    kind: 'frame',
    value: 'boss',
    cost: 500,
    label: 'MARCO JEFE',
    description: 'Marco rojo de villano',
  },
];

export const HUB_UPGRADES: HubUpgradeEntry[] = [
  {
    id: 'extraMapOption',
    cost: 350,
    label: '+1 OPCION MAPA',
    description: 'Una sala extra al elegir ruta',
  },
  {
    id: 'safeFirstFloor',
    cost: 300,
    label: 'PISO 1 SEGURO',
    description: 'Sin trampas en el primer piso de cada run',
  },
];
