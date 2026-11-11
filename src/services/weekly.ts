import type { WeeklyLeaderboardResponse, SubmitWeeklyScorePayload } from '../types/weekly';
import { getWeeklyChallengeConfig } from '../utils/weeklySeed';
import { fetchSupabaseLeaderboard, submitSupabaseScore } from './supabaseScores';

export async function fetchWeeklyLeaderboard(
  _playerName?: string,
  week?: string,
): Promise<WeeklyLeaderboardResponse> {
  const challenge = getWeeklyChallengeConfig(week);
  const board = await fetchSupabaseLeaderboard('weekly', challenge.week);
  return { ...board, week: challenge.week, challenge };
}

export function submitWeeklyScore(payload: SubmitWeeklyScorePayload): Promise<{ saved: boolean; rank: number | null }> {
  return submitSupabaseScore({ mode: 'weekly', challengeKey: payload.week, ...payload });
}
