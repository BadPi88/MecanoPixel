import type { GlossaryId, RelicId } from '../types/combat';
import type { RunnerId } from '../types/run';
import { RUNNER_CATALOG } from '../data/runners';

const META_KEY = 'keyrunner:meta';

export interface MetaStats {
  runsPlayed: number;
  bestFloor: number;
  totalWords: number;
}

export interface MetaProgress {
  totalCoins: number;
  unlockedRunners: RunnerId[];
  unlockedRelics: RelicId[];
  unlockedGlossaries: GlossaryId[];
  stats: MetaStats;
}

const DEFAULT_RUNNERS: RunnerId[] = ['veloz', 'tanque', 'codificador'];
const DEFAULT_GLOSSARIES: GlossaryId[] = ['general'];

export interface MetaUnlockEntry {
  kind: 'glossary';
  glossary: GlossaryId;
  cost: number;
  label: string;
  description: string;
}

export const META_UNLOCKS: MetaUnlockEntry[] = [
  {
    kind: 'glossary',
    glossary: 'medico',
    cost: 400,
    label: 'GLOSARIO MEDICO',
    description: 'Veneno: palabras 7+ letras dan +30% score',
  },
  {
    kind: 'glossary',
    glossary: 'tecnico',
    cost: 600,
    label: 'GLOSARIO TECNICO',
    description: 'Electrico: +1 ultimate por palabra; sinergia con Reliquia Ignea',
  },
];

export function getDefaultMeta(): MetaProgress {
  return {
    totalCoins: 0,
    unlockedRunners: [...DEFAULT_RUNNERS],
    unlockedRelics: [],
    unlockedGlossaries: [...DEFAULT_GLOSSARIES],
    stats: { runsPlayed: 0, bestFloor: 0, totalWords: 0 },
  };
}

export function loadMeta(): MetaProgress {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return getDefaultMeta();
    const parsed = JSON.parse(raw) as Partial<MetaProgress> & {
      /** Campo legado (renombrado a unlockedRelics). */
      unlockedPerks?: string[];
    };
    return {
      ...getDefaultMeta(),
      ...parsed,
      unlockedRunners: [
        ...new Set([...DEFAULT_RUNNERS, ...(parsed.unlockedRunners ?? [])]),
      ],
      unlockedRelics: (parsed.unlockedRelics ??
        parsed.unlockedPerks ??
        []) as RelicId[],
      unlockedGlossaries: [
        ...new Set([
          ...DEFAULT_GLOSSARIES,
          ...(parsed.unlockedGlossaries ?? []),
        ]),
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

/**
 * Compara las stats acumuladas con los hitos del catalogo y devuelve los
 * runners que acaban de cumplir su condicion (sin mutar `meta`).
 */
export function evaluateRunnerUnlocks(meta: MetaProgress): RunnerId[] {
  return Object.values(RUNNER_CATALOG)
    .filter(
      (runner) =>
        runner.unlock !== undefined &&
        !meta.unlockedRunners.includes(runner.id) &&
        meta.stats[runner.unlock.stat] >= runner.unlock.threshold,
    )
    .map((runner) => runner.id);
}

export interface RunEndResult {
  meta: MetaProgress;
  newlyUnlockedRunners: RunnerId[];
}

export function recordRunEnd(
  floor: number,
  wordsTyped: number,
  metaCoinsEarned: number,
): RunEndResult {
  const meta = loadMeta();
  meta.totalCoins += metaCoinsEarned;
  meta.stats.runsPlayed += 1;
  meta.stats.bestFloor = Math.max(meta.stats.bestFloor, floor);
  meta.stats.totalWords += wordsTyped;
  const newlyUnlockedRunners = evaluateRunnerUnlocks(meta);
  meta.unlockedRunners.push(...newlyUnlockedRunners);
  saveMeta(meta);
  return { meta, newlyUnlockedRunners };
}

export function unlockGlossary(
  glossaryId: GlossaryId,
  cost: number,
): MetaProgress | null {
  const meta = loadMeta();
  if (meta.unlockedGlossaries.includes(glossaryId)) return meta;
  if (meta.totalCoins < cost) return null;
  meta.totalCoins -= cost;
  meta.unlockedGlossaries.push(glossaryId);
  saveMeta(meta);
  return meta;
}

/**
 * Fusiona el progreso local con el de un perfil remoto: union de desbloqueos
 * y maximo por cada contador. Vuelve a evaluar hitos sobre el resultado.
 */
export function mergeMetaProgress(
  a: MetaProgress,
  b: MetaProgress,
): MetaProgress {
  const merged: MetaProgress = {
    totalCoins: Math.max(a.totalCoins, b.totalCoins),
    unlockedRunners: [
      ...new Set([...a.unlockedRunners, ...b.unlockedRunners]),
    ],
    unlockedRelics: [...new Set([...a.unlockedRelics, ...b.unlockedRelics])],
    unlockedGlossaries: [
      ...new Set([...a.unlockedGlossaries, ...b.unlockedGlossaries]),
    ],
    stats: {
      runsPlayed: Math.max(a.stats.runsPlayed, b.stats.runsPlayed),
      bestFloor: Math.max(a.stats.bestFloor, b.stats.bestFloor),
      totalWords: Math.max(a.stats.totalWords, b.stats.totalWords),
    },
  };
  merged.unlockedRunners.push(...evaluateRunnerUnlocks(merged));
  return merged;
}
