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
import { applyAchievementReward } from '../data/achievements';
import {
  DEFAULT_UNLOCKED_RELICS,
  type FrameId,
  type TrailId,
  type WordPaletteId,
} from '../data/metaUnlocks';

const META_KEY = 'keyrunner:meta';

export interface MetaCosmetics {
  wordPalette: WordPaletteId;
  typingTrail: TrailId;
  leaderboardFrame: FrameId;
  unlockedPalettes: WordPaletteId[];
  unlockedTrails: TrailId[];
  unlockedFrames: FrameId[];
}

export interface MetaHubUpgrades {
  extraMapOption: boolean;
  safeFirstFloor: boolean;
}

export interface MetaStats {
  runsPlayed: number;
  bestFloor: number;
  totalWords: number;
  bestRunScore: number;
}

export interface LearningRun {
  id: string;
  date: string;
  wpm: number;
  accuracy: number;
  wordsTyped: number;
  floor: number;
  mistakes: number;
  mistakesByChar: Record<string, number>;
}

export interface LearningStats {
  history: LearningRun[];
  mistakeCounts: Record<string, number>;
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
  learning: LearningStats;
  ascensionUnlocked: boolean;
  maxAscension: number;
  cosmetics: MetaCosmetics;
  hubUpgrades: MetaHubUpgrades;
}

function defaultCosmetics(): MetaCosmetics {
  return {
    wordPalette: 'classic',
    typingTrail: 'none',
    leaderboardFrame: 'default',
    unlockedPalettes: ['classic'],
    unlockedTrails: ['none'],
    unlockedFrames: ['default'],
  };
}

function defaultHubUpgrades(): MetaHubUpgrades {
  return { extraMapOption: false, safeFirstFloor: false };
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
    unlockedRelics: [...DEFAULT_UNLOCKED_RELICS],
    unlockedGlossaries: [...DEFAULT_GLOSSARIES],
    unlockedAchievements: [],
    tutorialComplete: false,
    seenHints: [],
    daily: defaultDailyMission(),
    stats: { runsPlayed: 0, bestFloor: 0, totalWords: 0, bestRunScore: 0 },
    learning: { history: [], mistakeCounts: {} },
    ascensionUnlocked: false,
    maxAscension: 0,
    cosmetics: defaultCosmetics(),
    hubUpgrades: defaultHubUpgrades(),
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
      learning: {
        history: Array.isArray(parsed.learning?.history) ? parsed.learning.history.slice(-30) : [],
        mistakeCounts: parsed.learning?.mistakeCounts ?? {},
      },
      ascensionUnlocked: parsed.ascensionUnlocked ?? false,
      maxAscension: parsed.maxAscension ?? 0,
      cosmetics: {
        ...defaultCosmetics(),
        ...parsed.cosmetics,
        unlockedPalettes: [
          ...new Set<WordPaletteId>([
            'classic',
            ...((parsed.cosmetics?.unlockedPalettes ?? []) as WordPaletteId[]),
          ]),
        ],
        unlockedTrails: [
          ...new Set<TrailId>([
            'none',
            ...((parsed.cosmetics?.unlockedTrails ?? []) as TrailId[]),
          ]),
        ],
        unlockedFrames: [
          ...new Set<FrameId>([
            'default',
            ...((parsed.cosmetics?.unlockedFrames ?? []) as FrameId[]),
          ]),
        ],
      },
      hubUpgrades: {
        ...defaultHubUpgrades(),
        ...parsed.hubUpgrades,
      },
      unlockedRelics: [
        ...new Set([
          ...DEFAULT_UNLOCKED_RELICS,
          ...((parsed.unlockedRelics ??
            parsed.unlockedPerks ??
            []) as RelicId[]),
        ]),
      ],
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
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('keyrunner:meta-changed', { detail: meta }));
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
    wpm?: number;
    accuracy?: number;
    mistakes?: number;
    mistakesByChar?: Record<string, number>;
  },
): RunEndResult {
  let meta = loadMeta();
  meta.totalCoins += metaCoinsEarned;
  meta.stats.runsPlayed += 1;
  meta.stats.bestFloor = Math.max(meta.stats.bestFloor, floor);
  meta.stats.totalWords += wordsTyped;
  meta.stats.bestRunScore = Math.max(meta.stats.bestRunScore, runStats.score);
  const runDate = new Date().toISOString();
  meta.learning.history = [
    ...meta.learning.history,
    {
      id: `${runDate}-${runStats.score}-${wordsTyped}`,
      date: runDate,
      wpm: Math.round(runStats.wpm ?? 0),
      accuracy: Math.round(runStats.accuracy ?? 100),
      wordsTyped,
      floor,
      mistakes: runStats.mistakes ?? 0,
      mistakesByChar: { ...(runStats.mistakesByChar ?? {}) },
    },
  ].slice(-30);
  meta.learning.mistakeCounts = {};
  for (const run of meta.learning.history) {
    for (const [char, count] of Object.entries(run.mistakesByChar)) {
      const safeChar = char.slice(0, 2);
      meta.learning.mistakeCounts[safeChar] = (meta.learning.mistakeCounts[safeChar] ?? 0) + count;
    }
  }

  const achievementRun: RunAchievementStats = {
    floor,
    wordsTyped,
    ...runStats,
  };

  const newlyUnlockedAchievements = evaluateAchievements(meta, achievementRun);
  for (const id of newlyUnlockedAchievements) {
    meta.unlockedAchievements.push(id);
    meta = applyAchievementReward(meta, id);
  }

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

export function unlockRelicMeta(
  relicId: RelicId,
  cost: number,
): MetaProgress | null {
  const meta = loadMeta();
  if (meta.unlockedRelics.includes(relicId)) return meta;
  if (meta.totalCoins < cost) return null;
  meta.totalCoins -= cost;
  meta.unlockedRelics.push(relicId);
  saveMeta(meta);
  return meta;
}

export function purchaseCosmetic(
  kind: 'palette' | 'trail' | 'frame',
  value: WordPaletteId | TrailId | FrameId,
  cost: number,
): MetaProgress | null {
  const meta = loadMeta();
  const key =
    kind === 'palette'
      ? 'unlockedPalettes'
      : kind === 'trail'
        ? 'unlockedTrails'
        : 'unlockedFrames';
  const list = meta.cosmetics[key] as (typeof value)[];
  if (list.includes(value as never)) {
    if (kind === 'palette') meta.cosmetics.wordPalette = value as WordPaletteId;
    if (kind === 'trail') meta.cosmetics.typingTrail = value as TrailId;
    if (kind === 'frame')
      meta.cosmetics.leaderboardFrame = value as FrameId;
    saveMeta(meta);
    return meta;
  }
  if (meta.totalCoins < cost) return null;
  meta.totalCoins -= cost;
  list.push(value as never);
  if (kind === 'palette') meta.cosmetics.wordPalette = value as WordPaletteId;
  if (kind === 'trail') meta.cosmetics.typingTrail = value as TrailId;
  if (kind === 'frame') meta.cosmetics.leaderboardFrame = value as FrameId;
  saveMeta(meta);
  return meta;
}

export function purchaseHubUpgrade(
  id: 'extraMapOption' | 'safeFirstFloor',
  cost: number,
): MetaProgress | null {
  const meta = loadMeta();
  if (meta.hubUpgrades[id]) return meta;
  if (meta.totalCoins < cost) return null;
  meta.totalCoins -= cost;
  meta.hubUpgrades[id] = true;
  saveMeta(meta);
  return meta;
}

export function recordVictory(): MetaProgress {
  const meta = loadMeta();
  meta.ascensionUnlocked = true;
  meta.maxAscension = Math.max(meta.maxAscension, 1);
  saveMeta(meta);
  return meta;
}

export function unlockAscensionLevel(level: number): MetaProgress {
  const meta = loadMeta();
  meta.maxAscension = Math.max(meta.maxAscension, level);
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
    learning: mergeLearning(a.learning, b.learning),
    ascensionUnlocked: a.ascensionUnlocked || b.ascensionUnlocked,
    maxAscension: Math.max(a.maxAscension, b.maxAscension),
    cosmetics: {
      wordPalette: a.cosmetics?.wordPalette ?? b.cosmetics?.wordPalette ?? 'classic',
      typingTrail: a.cosmetics?.typingTrail ?? b.cosmetics?.typingTrail ?? 'none',
      leaderboardFrame:
        a.cosmetics?.leaderboardFrame ??
        b.cosmetics?.leaderboardFrame ??
        'default',
      unlockedPalettes: [
        ...new Set([
          ...(a.cosmetics?.unlockedPalettes ?? []),
          ...(b.cosmetics?.unlockedPalettes ?? []),
        ]),
      ] as WordPaletteId[],
      unlockedTrails: [
        ...new Set([
          ...(a.cosmetics?.unlockedTrails ?? []),
          ...(b.cosmetics?.unlockedTrails ?? []),
        ]),
      ] as TrailId[],
      unlockedFrames: [
        ...new Set([
          ...(a.cosmetics?.unlockedFrames ?? []),
          ...(b.cosmetics?.unlockedFrames ?? []),
        ]),
      ] as FrameId[],
    },
    hubUpgrades: {
      extraMapOption:
        a.hubUpgrades?.extraMapOption || b.hubUpgrades?.extraMapOption,
      safeFirstFloor:
        a.hubUpgrades?.safeFirstFloor || b.hubUpgrades?.safeFirstFloor,
    },
  };
  merged.unlockedRunners.push(...evaluateRunnerUnlocks(merged));
  return ensureDailyMission(merged);
}

function mergeLearning(a: LearningStats, b: LearningStats): LearningStats {
  const history = [...new Map([...a.history, ...b.history].map((run) => [run.id, run])).values()]
    .sort((x, y) => x.date.localeCompare(y.date)).slice(-30);
  const mistakeCounts: Record<string, number> = {};
  for (const run of history) {
    for (const [char, count] of Object.entries(run.mistakesByChar ?? {})) {
      mistakeCounts[char] = (mistakeCounts[char] ?? 0) + count;
    }
  }
  return { history, mistakeCounts };
}
