import type { AchievementId } from '../data/achievements';
import type { GlossaryId, RelicId } from '../types/combat';
import type { RunnerId } from '../types/run';
import type { ProfileMeta } from '../types/profile';
import { pickMissionForDate } from '../data/dailyMissions';
import { getUtcDateString } from '../utils/dailySeed';
import {
  getDefaultMeta,
  loadMeta,
  mergeMetaProgress,
  saveMeta,
  type MetaProgress,
} from './meta';
import { getSupabase } from './supabaseClient';

const SESSION_KEY = 'keyrunner:session';

export interface ProfileSession {
  playerName: string;
  email: string;
}

export function loadSession(): ProfileSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ProfileSession>;
    if (
      typeof parsed.playerName !== 'string'
    ) {
      return null;
    }
    return { playerName: parsed.playerName, email: typeof parsed.email === 'string' ? parsed.email : '' };
  } catch {
    return null;
  }
}

function saveSession(session: ProfileSession): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // ignore
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

function toProfileMeta(meta: MetaProgress): ProfileMeta {
  return {
    totalCoins: meta.totalCoins,
    unlockedRunners: meta.unlockedRunners,
    unlockedRelics: meta.unlockedRelics,
    unlockedGlossaries: meta.unlockedGlossaries,
    unlockedAchievements: meta.unlockedAchievements,
    tutorialComplete: meta.tutorialComplete,
    seenHints: meta.seenHints,
    daily: { ...meta.daily },
    stats: { ...meta.stats },
    learning: {
      history: [...meta.learning.history],
      mistakeCounts: { ...meta.learning.mistakeCounts },
    },
    ascensionUnlocked: meta.ascensionUnlocked,
    maxAscension: meta.maxAscension,
    cosmetics: { ...meta.cosmetics },
    hubUpgrades: { ...meta.hubUpgrades },
  };
}

function fromProfileMeta(meta: ProfileMeta): MetaProgress {
  const defaults = getDefaultMeta();
  const today = getUtcDateString();
  return {
    totalCoins: meta.totalCoins,
    unlockedRunners: [
      ...new Set([
        ...defaults.unlockedRunners,
        ...(meta.unlockedRunners as RunnerId[]),
      ]),
    ],
    unlockedRelics: meta.unlockedRelics as RelicId[],
    unlockedGlossaries: [
      ...new Set([
        ...defaults.unlockedGlossaries,
        ...(meta.unlockedGlossaries as GlossaryId[]),
      ]),
    ],
    unlockedAchievements: [
      ...(meta.unlockedAchievements ?? defaults.unlockedAchievements),
    ] as AchievementId[],
    tutorialComplete: meta.tutorialComplete ?? false,
    seenHints: [...(meta.seenHints ?? [])],
    daily: meta.daily
      ? {
          date: meta.daily.date ?? today,
          missionId: (meta.daily.missionId ??
            pickMissionForDate(today)) as MetaProgress['daily']['missionId'],
          progress: meta.daily.progress ?? 0,
          claimed: meta.daily.claimed ?? false,
        }
      : defaults.daily,
    stats: { ...defaults.stats, ...meta.stats },
    learning: {
      history: [...(meta.learning?.history ?? defaults.learning.history)].slice(-30).map((run) => ({
        ...run,
        mistakesByChar: { ...(run.mistakesByChar ?? {}) },
      })),
      mistakeCounts: { ...defaults.learning.mistakeCounts, ...(meta.learning?.mistakeCounts ?? {}) },
    },
    ascensionUnlocked: meta.ascensionUnlocked ?? defaults.ascensionUnlocked,
    maxAscension: meta.maxAscension ?? defaults.maxAscension,
    cosmetics: {
      wordPalette:
        (meta.cosmetics?.wordPalette as MetaProgress['cosmetics']['wordPalette']) ??
        defaults.cosmetics.wordPalette,
      typingTrail:
        (meta.cosmetics?.typingTrail as MetaProgress['cosmetics']['typingTrail']) ??
        defaults.cosmetics.typingTrail,
      leaderboardFrame:
        (meta.cosmetics?.leaderboardFrame as MetaProgress['cosmetics']['leaderboardFrame']) ??
        defaults.cosmetics.leaderboardFrame,
      unlockedPalettes: [
        ...new Set([
          ...defaults.cosmetics.unlockedPalettes,
          ...(meta.cosmetics?.unlockedPalettes ?? []),
        ]),
      ] as MetaProgress['cosmetics']['unlockedPalettes'],
      unlockedTrails: [
        ...new Set([
          ...defaults.cosmetics.unlockedTrails,
          ...(meta.cosmetics?.unlockedTrails ?? []),
        ]),
      ] as MetaProgress['cosmetics']['unlockedTrails'],
      unlockedFrames: [
        ...new Set([
          ...defaults.cosmetics.unlockedFrames,
          ...(meta.cosmetics?.unlockedFrames ?? []),
        ]),
      ] as MetaProgress['cosmetics']['unlockedFrames'],
    },
    hubUpgrades: {
      ...defaults.hubUpgrades,
      ...meta.hubUpgrades,
    },
  };
}

export interface LoginResult {
  created: boolean;
  meta: MetaProgress;
  session: ProfileSession | null;
  needsEmailConfirmation: boolean;
}

async function readRemoteMeta(userId: string): Promise<{ playerName: string; meta: MetaProgress }> {
  const { data, error } = await getSupabase()
    .from('player_profiles')
    .select('display_name, meta')
    .eq('user_id', userId)
    .single();
  if (error) throw new Error(error.message);
  return { playerName: data.display_name as string, meta: fromProfileMeta(data.meta as ProfileMeta) };
}

export async function loginOrRegister(
  playerName: string,
  email: string,
  password: string,
  action: 'register' | 'login',
): Promise<LoginResult> {
  const client = getSupabase();
  const local = loadMeta();
  if (action === 'register') {
    const { data, error } = await client.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { display_name: playerName.trim(), initial_meta: toProfileMeta(local) },
      },
    });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('No se pudo crear la cuenta');
    if (!data.session) return { created: true, meta: local, session: null, needsEmailConfirmation: true };
    const remote = await readRemoteMeta(data.user.id);
    saveMeta(mergeMetaProgress(local, remote.meta));
    const session: ProfileSession = { playerName: remote.playerName, email: data.user.email ?? email };
    saveSession(session);
    return { created: true, meta: loadMeta(), session, needsEmailConfirmation: false };
  }

  const { data, error } = await client.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  if (error) throw new Error('Correo o contrasena incorrectos');
  if (!data.user) throw new Error('No se pudo iniciar sesion');
  const remote = await readRemoteMeta(data.user.id);
  saveMeta(remote.meta);
  const session: ProfileSession = { playerName: remote.playerName, email: data.user.email ?? email };
  saveSession(session);
  return { created: false, meta: remote.meta, session, needsEmailConfirmation: false };
}

export async function restoreProfileSession(): Promise<ProfileSession | null> {
  const { data, error } = await getSupabase().auth.getUser();
  if (error || !data.user) { clearSession(); return null; }
  const remote = await readRemoteMeta(data.user.id);
  saveMeta(remote.meta);
  const session: ProfileSession = { playerName: remote.playerName, email: data.user.email ?? '' };
  saveSession(session);
  return session;
}

export async function updateProfilePassword(password: string): Promise<void> {
  const { error } = await getSupabase().auth.updateUser({ password });
  if (error) throw new Error(error.message);
}

export async function sendPasswordReset(email: string): Promise<void> {
  const { error } = await getSupabase().auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: `${window.location.origin}/recover-password`,
  });
  if (error) throw new Error(error.message);
}

export function subscribeToAuthEvents(callback: (event: string) => void): () => void {
  const { data } = getSupabase().auth.onAuthStateChange((event) => callback(event));
  return () => data.subscription.unsubscribe();
}

export async function logoutProfile(): Promise<void> {
  await getSupabase().auth.signOut();
  clearSession();
}

/**
 * Sube el progreso al perfil activo (fire-and-forget). Sin sesion no hace nada.
 */
export async function syncMetaToProfile(meta: MetaProgress): Promise<void> {
  try {
    const client = getSupabase();
    const { data } = await client.auth.getUser();
    if (!data.user) return;
    const { error } = await client.from('player_profiles').update({
      meta: toProfileMeta(meta), updated_at: new Date().toISOString(),
    }).eq('user_id', data.user.id);
    if (error) throw error;
  } catch {
    // Sin conexion o API no configurada: el progreso local sigue siendo la fuente.
  }
}
