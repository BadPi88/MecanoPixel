import type { DailyLeaderboardResponse, SubmitDailyScorePayload } from '../types/daily';
import { getDailyChallengeConfig } from '../utils/dailySeed';
import { fetchSupabaseLeaderboard, submitSupabaseScore, type ScoreSubmitResult } from './supabaseScores';

export async function fetchDailyLeaderboard(
  _playerName?: string,
  date?: string,
): Promise<DailyLeaderboardResponse> {
  const challenge = getDailyChallengeConfig(date);
  const board = await fetchSupabaseLeaderboard('daily', challenge.date);
  return { ...board, date: challenge.date, challenge };
}

export function submitDailyScore(payload: SubmitDailyScorePayload): Promise<ScoreSubmitResult> {
  return submitSupabaseScore({ mode: 'daily', challengeKey: payload.date, ...payload });
}
