import type { LeaderboardEntry } from './leaderboard.js';

export interface DailyChallengeInfo {
  date: string;
  seed: number;
  runnerId: string;
  glossaryId: string;
}

export interface DailyLeaderboardResponse {
  date: string;
  challenge: DailyChallengeInfo;
  top10: LeaderboardEntry[];
  playerRank: number | null;
  playerBest: LeaderboardEntry | null;
  totalPlayers: number;
}

export interface SubmitDailyScorePayload {
  playerName: string;
  date: string;
  score: number;
  wpm: number;
  wordsTyped: number;
  elapsedMs: number;
  floorReached?: number;
  runnerId?: string;
}
