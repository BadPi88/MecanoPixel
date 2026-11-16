import { reduceCombatAction } from './reducers/combatReducer.ts';
import { reduceBossAction } from './reducers/bossReducer.ts';
import { reduceProgressionAction } from './reducers/progressionReducer.ts';
import { reduceSessionAction } from './reducers/sessionReducer.ts';
import type { FallingWord, GameAction, GameState } from '../types/game.ts';
export { createWordId } from './gameIds.ts';

export function gameReducer(state: GameState, action: GameAction): GameState {

  const handlers = [reduceCombatAction, reduceBossAction, reduceProgressionAction, reduceSessionAction];
  for (const handler of handlers) {
    const result = handler(state, action);
    if (result !== null) return result;
  }
  switch (action.type) {

    case 'TOGGLE_BUILD_OVERLAY':
      return { ...state, showBuildOverlay: !state.showBuildOverlay };

    default:
      return state;
  }
}


export function findPartialMatch(
  words: FallingWord[],
  input: string,
): FallingWord | null {
  if (!input) return null;
  const lower = input.toLowerCase();
  return words.find(
    (w) => w.kind !== 'trap' && w.text.startsWith(lower),
  ) ?? null;
}
