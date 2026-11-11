import type { LeaderboardEntry, LeaderboardResponse } from '../types/leaderboard';
import { getSupabase } from './supabaseClient';

interface LeaderboardRow {
  player_name: string;
  score: number;
  wpm: number;
  words_typed: number;
  elapsed_ms: number;
  floor_reached: number;
  runner_id: string | null;
  updated_at: string;
  player_rank: number;
  total_players: number;
  is_you: boolean;
}

export async function fetchSupabaseLeaderboard(
  mode: 'global' | 'daily' | 'weekly',
  challengeKey: string,
): Promise<LeaderboardResponse> {
  const { data, error } = await getSupabase().rpc('leaderboard_top', {
    p_mode: mode,
    p_challenge_key: challengeKey,
  });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as LeaderboardRow[];
  const toEntry = (row: LeaderboardRow): LeaderboardEntry => ({
    playerName: row.player_name,
    score: row.score,
    wpm: row.wpm,
    wordsTyped: row.words_typed,
    elapsedMs: row.elapsed_ms,
    floorReached: row.floor_reached,
    ...(row.runner_id ? { runnerId: row.runner_id } : {}),
    updatedAt: row.updated_at,
  });
  const topRows = rows.filter((row) => row.player_rank <= 10);
  const you = rows.find((row) => row.is_you);
  return {
    top10: topRows.map(toEntry),
    playerRank: you ? Number(you.player_rank) : null,
    playerBest: you ? toEntry(you) : null,
    totalPlayers: rows.length ? Number(rows[0]!.total_players) : 0,
  };
}

export async function submitSupabaseScore(input: {
  mode: 'global' | 'daily' | 'weekly';
  challengeKey: string;
  score: number;
  wpm: number;
  wordsTyped: number;
  elapsedMs: number;
  floorReached?: number;
  runnerId?: string;
}): Promise<{ saved: boolean; rank: number | null }> {
  const { data, error } = await getSupabase().rpc('submit_run_score', {
    p_mode: input.mode,
    p_challenge_key: input.challengeKey,
    p_score: input.score,
    p_wpm: input.wpm,
    p_words_typed: input.wordsTyped,
    p_elapsed_ms: input.elapsedMs,
    p_floor_reached: input.floorReached ?? 0,
    p_runner_id: input.runnerId ?? null,
  });
  if (error) throw new Error(error.message);
  return { saved: Boolean(data), rank: null };
}
