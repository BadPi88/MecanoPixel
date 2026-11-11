import type { ActivePerk, PerkDefinition, PerkId } from '../types/perks';
import { MAX_ACTIVE_PERKS } from '../types/perks';

export const PERKS_EVERY_N_RAMPS = 3;

export const PERK_CATALOG: Record<PerkId, PerkDefinition> = {
  shield: {
    id: 'shield',
    name: 'ESCUDO',
    description: 'La proxima palabra al suelo no quita vida',
    category: 'defense',
    rarity: 'common',
  },
  extra_life: {
    id: 'extra_life',
    name: 'VIDA EXTRA',
    description: '+1 vida (max 5)',
    category: 'defense',
    rarity: 'uncommon',
  },
  combo_safe: {
    id: 'combo_safe',
    name: 'COMBO SEGURO',
    description: 'El proximo fallo no rompe el combo',
    category: 'defense',
    rarity: 'common',
  },
  safety_net: {
    id: 'safety_net',
    name: 'RED SEGURIDAD',
    description: 'Al perder vida, las palabras suben',
    category: 'defense',
    rarity: 'uncommon',
  },
  double_score: {
    id: 'double_score',
    name: 'DOBLE SCORE',
    description: 'x2 puntos durante 15 s',
    category: 'score',
    rarity: 'uncommon',
  },
  golden_streak: {
    id: 'golden_streak',
    name: 'RACHA DORADA',
    description: 'Con combo 5+: +50% puntos',
    category: 'score',
    rarity: 'rare',
  },
  snipe: {
    id: 'snipe',
    name: 'SNIPE',
    description: 'Proxima palabra arriba vale x3',
    category: 'score',
    rarity: 'common',
  },
  breath: {
    id: 'breath',
    name: 'RESPIRO',
    description: '-30% caida y menos palabras 20 s',
    category: 'tempo',
    rarity: 'common',
  },
  freeze: {
    id: 'freeze',
    name: 'CONGELAR',
    description: 'Las palabras no caen 4 s',
    category: 'tempo',
    rarity: 'uncommon',
  },
  broken_clock: {
    id: 'broken_clock',
    name: 'RELOJ ROTO',
    description: 'Bloquea la proxima subida de ritmo',
    category: 'tempo',
    rarity: 'uncommon',
  },
  purge: {
    id: 'purge',
    name: 'PURGA',
    description: 'Elimina la palabra mas baja',
    category: 'utility',
    rarity: 'common',
  },
  radar: {
    id: 'radar',
    name: 'RADAR',
    description: 'Marca la palabra mas peligrosa 25 s',
    category: 'utility',
    rarity: 'common',
  },
  phoenix: {
    id: 'phoenix',
    name: 'FENIX',
    description: 'Revive una vez al llegar a 0 vidas',
    category: 'defense',
    rarity: 'legendary',
  },
  time_warp: {
    id: 'time_warp',
    name: 'DISTORSION',
    description: 'Congela todo 8 s',
    category: 'tempo',
    rarity: 'legendary',
  },
  word_drought: {
    id: 'word_drought',
    name: 'SEQUÍA',
    description: 'Max 2 palabras en pantalla 25 s',
    category: 'utility',
    rarity: 'legendary',
  },
  chaos_roll: {
    id: 'chaos_roll',
    name: 'CAOS',
    description: 'Proximas 5 palabras: tipo aleatorio',
    category: 'score',
    rarity: 'legendary',
  },
};

const COMMON_IDS: PerkId[] = [
  'shield',
  'combo_safe',
  'purge',
  'radar',
  'breath',
  'snipe',
];

const UNCOMMON_IDS: PerkId[] = [
  'extra_life',
  'double_score',
  'freeze',
  'broken_clock',
  'safety_net',
];

const RARE_IDS: PerkId[] = ['golden_streak'];

const LEGENDARY_IDS: PerkId[] = [
  'phoenix',
  'time_warp',
  'word_drought',
  'chaos_roll',
];

function pickOne<T>(arr: T[], random: () => number): T {
  return arr[Math.min(arr.length - 1, Math.floor(random() * arr.length))];
}

function isPerkBlocked(id: PerkId, active: ActivePerk[]): boolean {
  return active.some((p) => p.id === id);
}

export function pickPerkChoices(
  activePerks: ActivePerk[],
  count = 3,
  floor = 1,
  ascensionLevel = 0,
  random: () => number = Math.random,
): PerkId[] {
  const chosen = new Set<PerkId>();
  const canLegendary = floor >= 6 || ascensionLevel >= 2;

  const filterPool = (ids: PerkId[]) =>
    ids.filter((id) => !isPerkBlocked(id, activePerks));

  const availableLegendary = canLegendary ? filterPool(LEGENDARY_IDS) : [];
  const availableRare = filterPool(RARE_IDS);
  const availableUncommon = filterPool(UNCOMMON_IDS);
  const availableCommon = filterPool(COMMON_IDS);

  const pool = [
    ...availableCommon,
    ...availableUncommon,
    ...availableRare,
    ...availableLegendary,
  ];

  if (pool.length === 0) {
    return (['shield', 'breath', 'purge'] as PerkId[]).slice(0, count);
  }

  if (availableLegendary.length > 0 && random() < 0.12) {
    chosen.add(pickOne(availableLegendary, random));
  } else if (availableRare.length > 0 && random() < 0.2) {
    chosen.add(pickOne(availableRare, random));
  } else if (availableUncommon.length > 0 && random() < 0.35) {
    chosen.add(pickOne(availableUncommon, random));
  }

  while (chosen.size < count) {
    const candidates = pool.filter((id) => !chosen.has(id));
    if (candidates.length === 0) break;
    chosen.add(pickOne(candidates, random));
  }

  return Array.from(chosen).slice(0, count);
}

export function getPerkDefinition(id: PerkId): PerkDefinition {
  return PERK_CATALOG[id];
}

export function trimActivePerks(perks: ActivePerk[]): ActivePerk[] {
  if (perks.length <= MAX_ACTIVE_PERKS) return perks;
  return perks.slice(perks.length - MAX_ACTIVE_PERKS);
}
