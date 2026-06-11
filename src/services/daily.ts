import type {
  DailyLeaderboardResponse,
  SubmitDailyScorePayload,
} from '../types/daily';
import { getDailyChallengeConfig } from '../utils/dailySeed';

export async function fetchDailyLeaderboard(
  playerName?: string,
  date?: string,
): Promise<DailyLeaderboardResponse> {
  const params = new URLSearchParams();
  if (date) params.set('date', date);
  if (playerName) params.set('playerName', playerName);
  const qs = params.toString();

  const res = await fetch(`/api/daily${qs ? `?${qs}` : ''}`);
  if (!res.ok) {
    const fallback = getDailyChallengeConfig(date);
    return {
      date: fallback.date,
      challenge: {
        date: fallback.date,
        seed: fallback.seed,
        runnerId: fallback.runnerId,
        glossaryId: fallback.glossaryId,
      },
      top10: [],
      playerRank: null,
      playerBest: null,
      totalPlayers: 0,
    };
  }
  return res.json() as Promise<DailyLeaderboardResponse>;
}

export async function submitDailyScore(
  payload: SubmitDailyScorePayload,
): Promise<{ saved: boolean; rank: number | null }> {
  const res = await fetch('/api/daily', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? 'No se pudo guardar el desafio diario');
  }

  return res.json() as Promise<{ saved: boolean; rank: number | null }>;
}
