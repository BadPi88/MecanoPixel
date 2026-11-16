export type RankedRunMode = 'global' | 'daily' | 'weekly';

/** Ticket firmado por Supabase antes de iniciar una partida competitiva. */
export interface RankedRunTicket {
  runId: string;
  token: string;
  runSeed: number;
  rulesVersion: number;
  mode: RankedRunMode;
  challengeKey: string;
  issuedAtMs: number;
}

/** Acción serializada en orden; elapsedMs es el reloj lógico de la run. */
export interface RunReplayEvent {
  sequence: number;
  elapsedMs: number;
  action: unknown;
}

export interface StartRankedRunRequest {
  mode: RankedRunMode;
  challengeKey: string;
}

export interface StartRankedRunResponse extends RankedRunTicket {
  progression: {
    unlockedRelics: string[];
    unlockedRunners: string[];
    unlockedGlossaries: string[];
    maxAscension: number;
    hubUpgrades: { extraMapOption: boolean; safeFirstFloor: boolean };
  };
}
