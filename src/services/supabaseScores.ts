import type { LeaderboardEntry, LeaderboardResponse } from '../types/leaderboard';
import type { RunVerification } from '../../shared/leaderboard';
import { getSupabase } from './supabaseClient';

const PENDING_SCORES_KEY = 'keyrunner:pendingScores';
let retryAttempt = 0;
let retryTimer: number | null = null;
let isFlushing = false;
interface ScoreSubmission {
  mode: 'global' | 'daily' | 'weekly';
  challengeKey: string;
  playerName: string;
  score: number;
  wpm: number;
  wordsTyped: number;
  elapsedMs: number;
  floorReached?: number;
  runnerId?: string;
  verification?: RunVerification;
}
interface PendingScore { id: string; payload: ScoreSubmission }

function readPendingScores(): PendingScore[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(PENDING_SCORES_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed as PendingScore[] : [];
  } catch { return []; }
}

function persistPendingScores(scores: PendingScore[]): void {
  try { localStorage.setItem(PENDING_SCORES_KEY, JSON.stringify(scores)); }
  catch { /* El modo privado puede bloquear el almacenamiento local. */ }
}

function enqueueScore(payload: ScoreSubmission): void {
  const existing = readPendingScores();
  existing.push({ id: crypto.randomUUID(), payload });
  persistPendingScores(existing.slice(-30));
}

function scheduleRetry(): void {
  if (typeof window === 'undefined' || retryTimer !== null) return;
  const delay = Math.min(60_000, 1_000 * 2 ** Math.min(retryAttempt, 6));
  retryAttempt += 1;
  retryTimer = window.setTimeout(() => {
    retryTimer = null;
    void flushPendingScores();
  }, delay);
}

async function sendScore(payload: ScoreSubmission): Promise<void> {
  const { error } = await getSupabase().functions.invoke('submit-score', { body: payload });
  if (error) throw new Error(error.message);
}

export async function flushPendingScores(): Promise<void> {
  if (isFlushing || (typeof navigator !== 'undefined' && !navigator.onLine)) return;
  const pending = readPendingScores();
  if (pending.length === 0) return;
  isFlushing = true;
  const remaining: PendingScore[] = [];
  try {
    for (const item of pending) {
      try { await sendScore(item.payload); }
      catch { remaining.push(item); }
    }
    persistPendingScores(remaining);
    if (remaining.length > 0) scheduleRetry();
    else retryAttempt = 0;
  } finally {
    isFlushing = false;
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => { void flushPendingScores(); });
  window.setTimeout(() => { void flushPendingScores(); }, 1_000);
}

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
  playerName: string;
  verification?: RunVerification;
}): Promise<{ saved: boolean; rank: number | null }> {
  const payload: ScoreSubmission = input;
  try {
    if (typeof navigator !== 'undefined' && !navigator.onLine) throw new Error('offline');
    await sendScore(payload);
    return { saved: true, rank: null };
  } catch {
    enqueueScore(payload);
    scheduleRetry();
    return { saved: false, rank: null };
  }
}
