import {
  generateActMap,
  getActIndexForFloor,
  getMapChoicesFromAct,
  type ActMapGraph,
} from '../data/mapRooms';
import { getMapChoiceCount } from './hubModifiers';
import type { GameState } from '../types/game';

export function initActMapIfNeeded(state: GameState): Partial<GameState> {
  const actIndex = getActIndexForFloor(state.floor);
  if (state.actMap && state.actIndex === actIndex) {
    return {};
  }
  const actMap = generateActMap(actIndex, state.runSeed);
  return {
    actIndex,
    actMap,
    actMapNodeId: actMap.startNodeId,
  };
}

export function buildActMapChoices(state: GameState): {
  mapRoomOptions: import('../data/mapRooms').MapRoomOption[];
  actMap: ActMapGraph;
} {
  const actIndex = getActIndexForFloor(state.floor);
  let actMap = state.actMap;
  if (!actMap || state.actIndex !== actIndex) {
    actMap = generateActMap(actIndex, state.runSeed);
  }

  const maxChoices = getMapChoiceCount(state.dailyRun);
  const options = getMapChoicesFromAct(
    actMap,
    state.actMapNodeId,
    state.floor,
    state.bossSkippedPending,
    maxChoices,
  );

  return { mapRoomOptions: options, actMap };
}

export function advanceActMapNode(
  _actMap: ActMapGraph,
  chosenNodeId: string,
): string {
  return chosenNodeId;
}
