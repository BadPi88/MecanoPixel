import type { LeaderboardEntry } from './leaderboard.js';

export interface WeeklyChallengeInfo {
  week: string;
  seed: number;
  runnerId: string;
  glossaryId: string;
  ascensionLevel: number;
}

export interface WeeklyLeaderboardResponse {
  week: string;
  challenge: WeeklyChallengeInfo;
  top10: LeaderboardEntry[];
  playerRank: number | null;
  playerBest: LeaderboardEntry | null;
  totalPlayers: number;
}

export interface SubmitWeeklyScorePayload {
  playerName: string;
  week: string;
  score: number;
  wpm: number;
  wordsTyped: number;
  elapsedMs: number;
  floorReached?: number;
  runnerId?: string;
}
