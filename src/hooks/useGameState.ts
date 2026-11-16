import { useCallback, useEffect, useReducer, useRef } from 'react';
import { gameReducer } from '../engine/gameReducer';
import { initialGameState, type GameAction, type GameState } from '../types/game';
import type { RunReplayEvent } from '../../shared/runReplay';

/** Adaptador React fino; la transición de estado vive en el motor puro. */
export function useGameState() {
  const [state, baseDispatch] = useReducer(gameReducer, initialGameState);
  const stateRef = useRef<GameState>(state);
  const replayRef = useRef<RunReplayEvent[]>([]);
  const recordingRef = useRef(false);

  useEffect(() => { stateRef.current = state; }, [state]);

  const dispatch = useCallback((action: GameAction) => {
    if (action.type === 'BEGIN_RUN') {
      replayRef.current = [];
      recordingRef.current = action.payload?.rankedRun !== undefined && action.payload.rankedRun !== null;
    }
    if (recordingRef.current) {
      const current = stateRef.current;
      const elapsedMs = action.type === 'TICK' || action.type === 'BOSS_TICK'
        ? current.elapsedMs + action.payload.deltaMs
        : current.elapsedMs;
      const loggedAction: unknown = action.type === 'BEGIN_RUN'
        ? { ...action, payload: { ...action.payload, rankedRun: undefined } }
        : action;
      replayRef.current.push({
        sequence: replayRef.current.length,
        elapsedMs,
        action: loggedAction,
      });
    }
    baseDispatch(action);
    if (action.type === 'GO_HOME' || action.type === 'VICTORY_HOME') recordingRef.current = false;
  }, []);

  const getReplayEvents = useCallback(() => replayRef.current.slice(), []);
  return { state, dispatch, getReplayEvents };
}

export { findPartialMatch } from '../engine/gameReducer';
export { gameReducer } from '../engine/gameReducer';
export { createWordId } from '../engine/gameIds';
