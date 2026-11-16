import type { GameState } from '../types/game.ts';
import type { MetaHubUpgrades } from '../services/meta.ts';

export interface HubModifiers {
  extraMapOption: boolean;
  safeFirstFloor: boolean;
}

export function getHubModifiers(hubUpgrades: MetaHubUpgrades): HubModifiers {
  return {
    extraMapOption: hubUpgrades.extraMapOption,
    safeFirstFloor: hubUpgrades.safeFirstFloor,
  };
}

export function shouldSkipTrapsOnFloor(state: GameState): boolean {
  if (state.noTrapsNextFloor) return true;
  const hub = getHubModifiers(state.hubUpgrades);
  if (hub.safeFirstFloor && state.floor === 1) return true;
  return false;
}

export function getMapChoiceCount(dailyRun: boolean, hubUpgrades: MetaHubUpgrades): number {
  if (dailyRun) return 3;
  const hub = getHubModifiers(hubUpgrades);
  return hub.extraMapOption ? 4 : 3;
}
