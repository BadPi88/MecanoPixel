import type { GlossaryId, RelicId } from '../types/combat';
import type { RunnerId } from '../types/run';
import type { ProfileMeta, ProfilePayload, ProfileResponse } from '../types/profile';
import {
  getDefaultMeta,
  loadMeta,
  mergeMetaProgress,
  saveMeta,
  type MetaProgress,
} from './meta';

const SESSION_KEY = 'keyrunner:session';

export interface ProfileSession {
  playerName: string;
  pin: string;
}

export function loadSession(): ProfileSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ProfileSession>;
    if (
      typeof parsed.playerName !== 'string' ||
      typeof parsed.pin !== 'string'
    ) {
      return null;
    }
    return { playerName: parsed.playerName, pin: parsed.pin };
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
    stats: { ...meta.stats },
  };
}

function fromProfileMeta(meta: ProfileMeta): MetaProgress {
  const defaults = getDefaultMeta();
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
    stats: { ...defaults.stats, ...meta.stats },
  };
}

async function postProfile(payload: ProfilePayload): Promise<ProfileResponse> {
  const res = await fetch('/api/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? 'Error de perfil');
  }

  return res.json() as Promise<ProfileResponse>;
}

export interface LoginResult {
  created: boolean;
  meta: MetaProgress;
}

/**
 * Entra al perfil (o lo crea si no existe) y fusiona el progreso del servidor
 * con el local. El resultado fusionado se guarda en localStorage y se sube
 * al servidor para que ambos lados queden iguales.
 */
export async function loginOrRegister(
  playerName: string,
  pin: string,
): Promise<LoginResult> {
  const local = loadMeta();
  const response = await postProfile({
    playerName,
    pin,
    action: 'auth',
    meta: toProfileMeta(local),
  });

  const merged = response.meta
    ? mergeMetaProgress(local, fromProfileMeta(response.meta))
    : local;

  saveMeta(merged);
  saveSession({ playerName, pin });

  if (!response.created) {
    // El servidor tenia datos previos: subir la fusion para igualar.
    void postProfile({
      playerName,
      pin,
      action: 'save',
      meta: toProfileMeta(merged),
    }).catch(() => undefined);
  }

  return { created: response.created, meta: merged };
}

/**
 * Sube el progreso al perfil activo (fire-and-forget). Sin sesion no hace nada.
 */
export async function syncMetaToProfile(meta: MetaProgress): Promise<void> {
  const session = loadSession();
  if (!session) return;
  try {
    await postProfile({
      playerName: session.playerName,
      pin: session.pin,
      action: 'save',
      meta: toProfileMeta(meta),
    });
  } catch {
    // Sin conexion o API no configurada: el progreso local sigue siendo la fuente.
  }
}
