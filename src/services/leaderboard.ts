import type { LeaderboardResponse, SubmitScorePayload } from '../types/leaderboard';
import { fetchSupabaseLeaderboard, submitSupabaseScore } from './supabaseScores';

export function fetchLeaderboard(_playerName?: string): Promise<LeaderboardResponse> {
  void _playerName;
  return fetchSupabaseLeaderboard('global', '');
}

export function submitScore(payload: SubmitScorePayload): Promise<{ saved: boolean; rank: number | null }> {
  return submitSupabaseScore({ mode: 'global', challengeKey: '', ...payload });
}

export const PLAYER_NAME_STORAGE_KEY = 'keyrunner:playerName';

export function loadPlayerName(): string {
  try { return localStorage.getItem(PLAYER_NAME_STORAGE_KEY) ?? ''; }
  catch { return ''; }
}

export function savePlayerName(name: string): void {
  try { localStorage.setItem(PLAYER_NAME_STORAGE_KEY, name); }
  catch { /* storage can be unavailable */ }
}
