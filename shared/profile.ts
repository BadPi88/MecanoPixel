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
  ascensionUnlocked: boolean;
  maxAscension: number;
  cosmetics: ProfileCosmetics;
  hubUpgrades: ProfileHubUpgrades;
}

export type ProfileAction = 'auth' | 'save';

export interface ProfilePayload {
  playerName: string;
  pin: string;
  action: ProfileAction;
  /** Meta a guardar (action 'save') o semilla al registrar (action 'auth'). */
  meta?: ProfileMeta;
}

export interface ProfileResponse {
  /** true si el perfil se acaba de crear en esta peticion. */
  created: boolean;
  meta: ProfileMeta | null;
}
