/**
 * Tipos compartidos frontend/API para perfiles de jugador.
 * Espeja la forma de `MetaProgress` (src/services/meta.ts) sin importar
 * codigo de src en las serverless functions.
 */
export interface ProfileMetaStats {
  runsPlayed: number;
  bestFloor: number;
  totalWords: number;
}

export interface ProfileMeta {
  totalCoins: number;
  unlockedRunners: string[];
  unlockedRelics: string[];
  unlockedGlossaries: string[];
  stats: ProfileMetaStats;
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
