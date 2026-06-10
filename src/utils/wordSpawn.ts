import { getRandomWord } from '../data/dictionary';
import { getRandomTrapWord } from '../data/traps';
import type { WordKind } from '../types/run';

export interface SpawnRates {
  trap: number;
  bomb: number;
  bonus: number;
}

export function getSpawnRatesForFloor(
  floor: number,
  noTrapsNextFloor: boolean,
): SpawnRates {
  if (floor <= 1 || noTrapsNextFloor) {
    return { trap: 0, bomb: floor >= 2 ? 0.05 : 0, bonus: 0.08 };
  }
  const trap = Math.min(0.08 + floor * 0.02, 0.15);
  const bomb = Math.min(0.04 + floor * 0.01, 0.1);
  const bonus = 0.1;
  return { trap, bomb, bonus };
}

export function rollWordKind(rates: SpawnRates): WordKind {
  const roll = Math.random();
  if (roll < rates.trap) return 'trap';
  if (roll < rates.trap + rates.bomb) return 'bomb';
  if (roll < rates.trap + rates.bomb + rates.bonus) return 'bonus';
  return 'normal';
}

export function getWordTextForKind(
  kind: WordKind,
  elapsedMs: number,
  tierOffset: number,
): string {
  if (kind === 'trap') return getRandomTrapWord();
  if (kind === 'bonus') {
    const words = ['oro', 'gema', 'luck', 'premio', 'bonus'];
    return words[Math.floor(Math.random() * words.length)];
  }
  return getRandomWord(elapsedMs, tierOffset);
}

export function getBossWord(elapsedMs: number, tierOffset: number): string {
  for (let len = 14; len >= 10; len--) {
    const word = getRandomWord(elapsedMs, tierOffset);
    if (word.length >= len - 2) return word;
  }
  return getRandomWord(elapsedMs, tierOffset);
}
