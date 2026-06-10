import type { RunnerId } from '../types/run';
import { INITIAL_LIVES } from '../types/game';
import { MAX_LIVES } from '../types/perks';

export interface RunnerModifiers {
  initialLivesBonus: number;
  fallSpeedMult: number;
  shortWordScoreMult: number;
  comboMultFrom: number;
  comboMultValue: number;
  runCoinsMult: number;
  trapIgnoreCharges: number;
}

export function getRunnerModifiers(runnerId: RunnerId | null): RunnerModifiers {
  const base: RunnerModifiers = {
    initialLivesBonus: 0,
    fallSpeedMult: 1,
    shortWordScoreMult: 1,
    comboMultFrom: 99,
    comboMultValue: 1,
    runCoinsMult: 1,
    trapIgnoreCharges: 0,
  };

  switch (runnerId) {
    case 'veloz':
      return { ...base, shortWordScoreMult: 1.15 };
    case 'tanque':
      return { ...base, initialLivesBonus: 1, fallSpeedMult: 1.1 };
    case 'codificador':
      return { ...base, comboMultFrom: 3, comboMultValue: 1.5 };
    case 'fantasma':
      return { ...base, trapIgnoreCharges: 1 };
    case 'magnate':
      return { ...base, runCoinsMult: 1.2 };
    default:
      return base;
  }
}

export function getInitialLives(runnerId: RunnerId | null): number {
  const mods = getRunnerModifiers(runnerId);
  return Math.min(INITIAL_LIVES + mods.initialLivesBonus, MAX_LIVES);
}
