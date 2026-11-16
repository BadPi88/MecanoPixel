export interface LeaderboardEntry {
  playerName: string;
  score: number;
  wpm: number;
  wordsTyped: number;
  elapsedMs: number;
  floorReached?: number;
  runnerId?: string;
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
  floorReached?: number;
  runnerId?: string;
  verification?: RunVerification;
}

export interface RunVerification {
  runSeed: number;
  correctChars: number;
  correctKeyPresses: number;
  mistakes: number;
  defeatedAtMs: number[];
  relics: string[];
}
