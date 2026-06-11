import type { GlossaryId, RelicId } from '../types/combat';
import type { RunnerId } from '../types/run';
import { RUNNER_CATALOG } from '../data/runners';
import {
  ACHIEVEMENT_IDS,
  type AchievementId,
  isAchievementMet,
  type RunAchievementStats,
} from '../data/achievements';
import {
  DAILY_MISSION_CATALOG,
  type DailyMissionId,
  getMissionProgressForRun,
  pickMissionForDate,
} from '../data/dailyMissions';
import { getUtcDateString } from '../utils/dailySeed';

const META_KEY = 'keyrunner:meta';

export interface MetaStats {
  runsPlayed: number;
  bestFloor: number;
  totalWords: number;
  bestRunScore: number;
}

export interface DailyMissionState {
  date: string;
  missionId: DailyMissionId;
  progress: number;
  claimed: boolean;
}

export interface MetaProgress {
  totalCoins: number;
  unlockedRunners: RunnerId[];
  unlockedRelics: RelicId[];
  unlockedGlossaries: GlossaryId[];
  unlockedAchievements: AchievementId[];
  tutorialComplete: boolean;
  seenHints: string[];
  daily: DailyMissionState;
  stats: MetaStats;
}

const DEFAULT_RUNNERS: RunnerId[] = ['veloz', 'tanque', 'codificador'];
const DEFAULT_GLOSSARIES: GlossaryId[] = ['general'];

function defaultDailyMission(): DailyMissionState {
  const date = getUtcDateString();
  return {
    date,
    missionId: pickMissionForDate(date),
    progress: 0,
    claimed: false,
  };
}

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
    unlockedAchievements: [],
    tutorialComplete: false,
    seenHints: [],
    daily: defaultDailyMission(),
    stats: { runsPlayed: 0, bestFloor: 0, totalWords: 0, bestRunScore: 0 },
  };
}

export function ensureDailyMission(meta: MetaProgress): MetaProgress {
  const today = getUtcDateString();
  if (meta.daily?.date === today) return meta;
  return {
    ...meta,
    daily: {
      date: today,
      missionId: pickMissionForDate(today),
      progress: 0,
      claimed: false,
    },
  };
}

export function loadMeta(): MetaProgress {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return getDefaultMeta();
    const parsed = JSON.parse(raw) as Partial<MetaProgress> & {
      unlockedPerks?: string[];
    };
    const merged: MetaProgress = {
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
      unlockedAchievements: [...(parsed.unlockedAchievements ?? [])] as AchievementId[],
      seenHints: [...(parsed.seenHints ?? [])],
      tutorialComplete: parsed.tutorialComplete ?? false,
      daily: parsed.daily
        ? {
            date: parsed.daily.date ?? getUtcDateString(),
            missionId: (parsed.daily.missionId ??
              pickMissionForDate(getUtcDateString())) as DailyMissionId,
            progress: parsed.daily.progress ?? 0,
            claimed: parsed.daily.claimed ?? false,
          }
        : defaultDailyMission(),
      stats: { ...getDefaultMeta().stats, ...parsed.stats },
    };
    return ensureDailyMission(merged);
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

export function markHintSeen(hintId: string): void {
  const meta = loadMeta();
  if (meta.seenHints.includes(hintId)) return;
  meta.seenHints.push(hintId);
  saveMeta(meta);
}

export function markTutorialComplete(): void {
  const meta = loadMeta();
  if (meta.tutorialComplete) return;
  meta.tutorialComplete = true;
  saveMeta(meta);
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

export function evaluateAchievements(
  meta: MetaProgress,
  run: RunAchievementStats,
): AchievementId[] {
  return ACHIEVEMENT_IDS.filter(
    (id) =>
      !meta.unlockedAchievements.includes(id) && isAchievementMet(id, meta, run),
  );
}

function updateDailyMission(
  meta: MetaProgress,
  run: {
    wordsTyped: number;
    floor: number;
    ultimatesUsed: number;
    score: number;
    deflectedLetters: number;
  },
): { meta: MetaProgress; missionReward: number } {
  const refreshed = ensureDailyMission(meta);
  const mission = DAILY_MISSION_CATALOG[refreshed.daily.missionId];
  const runProgress = getMissionProgressForRun(refreshed.daily.missionId, run);
  refreshed.daily.progress = Math.max(refreshed.daily.progress, runProgress);

  let missionReward = 0;
  if (
    !refreshed.daily.claimed &&
    refreshed.daily.progress >= mission.target
  ) {
    refreshed.daily.claimed = true;
    missionReward = mission.reward;
    refreshed.totalCoins += missionReward;
  }

  return { meta: refreshed, missionReward };
}

export interface RunEndResult {
  meta: MetaProgress;
  newlyUnlockedRunners: RunnerId[];
  newlyUnlockedAchievements: AchievementId[];
  dailyMissionReward: number;
}

export function recordRunEnd(
  floor: number,
  wordsTyped: number,
  metaCoinsEarned: number,
  runStats: Omit<RunAchievementStats, 'floor' | 'wordsTyped'> & {
    reachedBoss: boolean;
  },
): RunEndResult {
  let meta = loadMeta();
  meta.totalCoins += metaCoinsEarned;
  meta.stats.runsPlayed += 1;
  meta.stats.bestFloor = Math.max(meta.stats.bestFloor, floor);
  meta.stats.totalWords += wordsTyped;
  meta.stats.bestRunScore = Math.max(meta.stats.bestRunScore, runStats.score);

  const achievementRun: RunAchievementStats = {
    floor,
    wordsTyped,
    ...runStats,
  };

  const newlyUnlockedAchievements = evaluateAchievements(meta, achievementRun);
  meta.unlockedAchievements.push(...newlyUnlockedAchievements);

  const newlyUnlockedRunners = evaluateRunnerUnlocks(meta);
  meta.unlockedRunners.push(...newlyUnlockedRunners);

  const dailyResult = updateDailyMission(meta, {
    wordsTyped,
    floor,
    ultimatesUsed: runStats.ultimatesUsed,
    score: runStats.score,
    deflectedLetters: runStats.deflectedLetters,
  });
  meta = dailyResult.meta;

  saveMeta(meta);
  return {
    meta,
    newlyUnlockedRunners,
    newlyUnlockedAchievements,
    dailyMissionReward: dailyResult.missionReward,
  };
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

function mergeDailyMission(
  a: DailyMissionState,
  b: DailyMissionState,
): DailyMissionState {
  const today = getUtcDateString();
  if (a.date === today && b.date !== today) return a;
  if (b.date === today && a.date !== today) return b;
  if (a.date !== b.date) {
    return a.date > b.date ? a : b;
  }
  const mission = DAILY_MISSION_CATALOG[a.missionId];
  const progress = Math.max(a.progress, b.progress);
  const claimed = a.claimed || b.claimed;
  return {
    date: a.date,
    missionId: a.missionId,
    progress: Math.min(progress, mission.target),
    claimed,
  };
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
    unlockedAchievements: [
      ...new Set([...a.unlockedAchievements, ...b.unlockedAchievements]),
    ],
    tutorialComplete: a.tutorialComplete || b.tutorialComplete,
    seenHints: [...new Set([...a.seenHints, ...b.seenHints])],
    daily: mergeDailyMission(a.daily, b.daily),
    stats: {
      runsPlayed: Math.max(a.stats.runsPlayed, b.stats.runsPlayed),
      bestFloor: Math.max(a.stats.bestFloor, b.stats.bestFloor),
      totalWords: Math.max(a.stats.totalWords, b.stats.totalWords),
      bestRunScore: Math.max(a.stats.bestRunScore, b.stats.bestRunScore),
    },
  };
  merged.unlockedRunners.push(...evaluateRunnerUnlocks(merged));
  return ensureDailyMission(merged);
}
