export interface LeaderboardEntry {
  playerName: string;
  score: number;
  wpm: number;
  wordsTyped: number;
  elapsedMs: number;
  updatedAt: string;
}

export interface LeaderboardResponse {
  top10: LeaderboardEntry[];
  playerRank: number | null;
  playerBest: LeaderboardEntry | null;
  totalPlayers: number;
}

export interface SubmitScorePayload {
  playerName: string;
  score: number;
  wpm: number;
  wordsTyped: number;
  elapsedMs: number;
}
