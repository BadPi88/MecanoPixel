import type { ActivePerk, PerkDefinition, PerkId } from '../types/perks';
import { MAX_ACTIVE_PERKS } from '../types/perks';

/** Cada cuantas subidas de ritmo se ofrece elegir un perk. */
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
    rarity: 'uncommon',
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
  'golden_streak',
  'safety_net',
];

function pickOne<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function isPerkBlocked(id: PerkId, active: ActivePerk[]): boolean {
  return active.some((p) => p.id === id);
}

export function pickPerkChoices(activePerks: ActivePerk[], count = 3): PerkId[] {
  const chosen = new Set<PerkId>();
  const availableCommon = COMMON_IDS.filter(
    (id) => !isPerkBlocked(id, activePerks),
  );
  const availableUncommon = UNCOMMON_IDS.filter(
    (id) => !isPerkBlocked(id, activePerks),
  );

  const pool = [...availableCommon, ...availableUncommon];
  if (pool.length === 0) {
    const fallback: PerkId[] = ['shield', 'breath', 'purge'];
    return fallback.slice(0, count);
  }

  const uncommonPick =
    availableUncommon.length > 0 && Math.random() < 0.35
      ? pickOne(availableUncommon)
      : null;

  if (uncommonPick) chosen.add(uncommonPick);

  while (chosen.size < count) {
    const candidates = pool.filter((id) => !chosen.has(id));
    if (candidates.length === 0) break;
    chosen.add(pickOne(candidates));
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
