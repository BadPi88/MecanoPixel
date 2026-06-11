import { loadMeta } from '../services/meta';
import type { GameState } from '../types/game';

export interface HubModifiers {
  extraMapOption: boolean;
  safeFirstFloor: boolean;
}

export function getHubModifiers(): HubModifiers {
  const meta = loadMeta();
  return {
    extraMapOption: meta.hubUpgrades?.extraMapOption ?? false,
    safeFirstFloor: meta.hubUpgrades?.safeFirstFloor ?? false,
  };
}

export function shouldSkipTrapsOnFloor(state: GameState): boolean {
  if (state.noTrapsNextFloor) return true;
  const hub = getHubModifiers();
  if (hub.safeFirstFloor && state.floor === 1) return true;
  return false;
}

export function getMapChoiceCount(dailyRun: boolean): number {
  if (dailyRun) return 3;
  const hub = getHubModifiers();
  return hub.extraMapOption ? 4 : 3;
}
