import { useReducer } from 'react';
import { gameReducer } from '../engine/gameReducer';
import { initialGameState } from '../types/game';

/** Adaptador React fino; la transición de estado vive en el motor puro. */
export function useGameState() {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  return { state, dispatch };
}

export { findPartialMatch } from '../engine/gameReducer';
export { createWordId } from '../engine/gameIds';