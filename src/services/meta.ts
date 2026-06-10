import type { PerkId } from '../types/perks';
import type { RunnerId } from '../types/run';

const META_KEY = 'keyrunner:meta';

export interface MetaStats {
  runsPlayed: number;
  bestFloor: number;
  totalWords: number;
}

export interface MetaProgress {
  totalCoins: number;
  unlockedRunners: RunnerId[];
  unlockedPerks: PerkId[];
  stats: MetaStats;
}

const DEFAULT_RUNNERS: RunnerId[] = ['veloz', 'tanque', 'codificador'];

export const META_UNLOCKS: {
  runner?: RunnerId;
  perk?: PerkId;
  cost: number;
  label: string;
  description: string;
}[] = [
  {
    runner: 'fantasma',
    cost: 500,
    label: 'FANTASMA',
    description: 'Ignora 1 trampa por run',
  },
  {
    runner: 'magnate',
    cost: 800,
    label: 'MAGNATE',
    description: '+20% monedas de run',
  },
];

export function getDefaultMeta(): MetaProgress {
  return {
    totalCoins: 0,
    unlockedRunners: [...DEFAULT_RUNNERS],
    unlockedPerks: [],
    stats: { runsPlayed: 0, bestFloor: 0, totalWords: 0 },
  };
}

export function loadMeta(): MetaProgress {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return getDefaultMeta();
    const parsed = JSON.parse(raw) as MetaProgress;
    return {
      ...getDefaultMeta(),
      ...parsed,
      unlockedRunners: [
        ...new Set([...DEFAULT_RUNNERS, ...(parsed.unlockedRunners ?? [])]),
      ],
      stats: { ...getDefaultMeta().stats, ...parsed.stats },
    };
  } catch {
    return getDefaultMeta();
  }
}

export function saveMeta(meta: MetaProgress): void {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch {
    // ignore
  }
}

export function addMetaCoins(amount: number): MetaProgress {
  const meta = loadMeta();
  meta.totalCoins += amount;
  saveMeta(meta);
  return meta;
}

export function recordRunEnd(
  floor: number,
  wordsTyped: number,
  metaCoinsEarned: number,
): MetaProgress {
  const meta = loadMeta();
  meta.totalCoins += metaCoinsEarned;
  meta.stats.runsPlayed += 1;
  meta.stats.bestFloor = Math.max(meta.stats.bestFloor, floor);
  meta.stats.totalWords += wordsTyped;
  saveMeta(meta);
  return meta;
}

export function unlockRunner(runnerId: RunnerId, cost: number): MetaProgress | null {
  const meta = loadMeta();
  if (meta.unlockedRunners.includes(runnerId)) return meta;
  if (meta.totalCoins < cost) return null;
  meta.totalCoins -= cost;
  meta.unlockedRunners.push(runnerId);
  saveMeta(meta);
  return meta;
}
