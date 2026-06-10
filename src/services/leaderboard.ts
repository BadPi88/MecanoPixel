import type {
  LeaderboardResponse,
  SubmitScorePayload,
} from '../types/leaderboard';

export async function fetchLeaderboard(
  playerName?: string,
): Promise<LeaderboardResponse> {
  const params = playerName
    ? `?playerName=${encodeURIComponent(playerName)}`
    : '';

  const res = await fetch(`/api/leaderboard${params}`);
  if (!res.ok) {
    throw new Error('No se pudo cargar el leaderboard');
  }
  return res.json() as Promise<LeaderboardResponse>;
}

export async function submitScore(
  payload: SubmitScorePayload,
): Promise<{ saved: boolean; rank: number | null }> {
  const res = await fetch('/api/scores', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? 'No se pudo guardar la puntuacion');
  }

  return res.json() as Promise<{ saved: boolean; rank: number | null }>;
}

export const PLAYER_NAME_STORAGE_KEY = 'keyrunner:playerName';

export function loadPlayerName(): string {
  try {
    return localStorage.getItem(PLAYER_NAME_STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

export function savePlayerName(name: string): void {
  try {
    localStorage.setItem(PLAYER_NAME_STORAGE_KEY, name);
  } catch {
    // ignore
  }
}
