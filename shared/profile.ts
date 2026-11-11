/**
 * Tipos compartidos frontend/API para perfiles de jugador.
 * Espeja la forma de `MetaProgress` (src/services/meta.ts) sin importar
 * codigo de src en las serverless functions.
 */
export interface ProfileMetaStats {
  runsPlayed: number;
  bestFloor: number;
  totalWords: number;
  bestRunScore: number;
}

export interface ProfileLearningRun {
  id: string;
  date: string;
  wpm: number;
  accuracy: number;
  wordsTyped: number;
  floor: number;
  mistakes: number;
  mistakesByChar?: Record<string, number>;
  ascensionLevel?: number;
  deathCause?: string | null;
  reachedBoss?: boolean;
  runnerId?: string | null;
  relics?: string[];
  weeklyRun?: boolean;
  runSeed?: number;
}

export interface ProfileLearningStats {
  history: ProfileLearningRun[];
  mistakeCounts: Record<string, number>;
}

export interface ProfileDailyMission {
  date: string;
  missionId: string;
  progress: number;
  claimed: boolean;
}

export interface ProfileCosmetics {
  wordPalette: string;
  typingTrail: string;
  leaderboardFrame: string;
  unlockedPalettes: string[];
  unlockedTrails: string[];
  unlockedFrames: string[];
}

export interface ProfileHubUpgrades {
  extraMapOption: boolean;
  safeFirstFloor: boolean;
}

export interface ProfileMeta {
  totalCoins: number;
  unlockedRunners: string[];
  unlockedRelics: string[];
  unlockedGlossaries: string[];
  unlockedAchievements: string[];
  tutorialComplete: boolean;
  seenHints: string[];
  daily: ProfileDailyMission;
  stats: ProfileMetaStats;
  learning?: ProfileLearningStats;
  ascensionUnlocked: boolean;
  maxAscension: number;
  cosmetics: ProfileCosmetics;
  hubUpgrades: ProfileHubUpgrades;
}

