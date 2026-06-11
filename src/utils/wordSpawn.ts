import { getRandomWord } from '../data/dictionary';
import { getRandomTrapWord } from '../data/traps';
import type { GlossaryId, RelicId, WordModifier } from '../types/combat';
import type { WordKind } from '../types/run';
import { getWordPOS } from './posHeuristics';
import { getSpawnConstraints, stripVowels } from './combatModifiers';

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
  glossary: GlossaryId = 'general',
  relics: RelicId[] = [],
): string {
  if (kind === 'trap') return getRandomTrapWord();
  if (kind === 'bonus') {
    const words = ['oro', 'gema', 'luck', 'premio', 'bonus'];
    return words[Math.floor(Math.random() * words.length)];
  }
  const constraints = getSpawnConstraints(relics);
  return getRandomWord(elapsedMs, tierOffset, {
    glossary,
    minLen: constraints.minLen,
    maxLen: constraints.maxLen,
  });
}

function shuffleText(text: string): string {
  const chars = text.split('');
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  const result = chars.join('');
  return result === text && text.length > 1 ? shuffleText(text) : result;
}

export interface SpawnDecoration {
  displayText?: string;
  modifiers?: WordModifier[];
  pos: ReturnType<typeof getWordPOS>;
  morphAtMs?: number;
}

/** Probabilidad de anagrama por piso (sube con la profundidad). */
function getAnagramRate(floor: number): number {
  if (floor < 2) return 0;
  return Math.min(0.1 + (floor - 2) * 0.02, 0.25);
}

/** Probabilidad de palabra cambiante por piso. */
function getShiftingRate(floor: number): number {
  if (floor < 3) return 0;
  return Math.min(0.08 + (floor - 3) * 0.02, 0.2);
}

/**
 * Decora una palabra recien generada: POS, anagrama/cambiante segun piso
 * y texto sin vocales si la reliquia esta activa.
 */
export function decorateSpawn(
  kind: WordKind,
  text: string,
  floor: number,
  elapsedMs: number,
  relics: RelicId[],
): SpawnDecoration {
  const pos = getWordPOS(text);

  if (kind !== 'normal' || text.length < 4) {
    return { pos };
  }

  const constraints = getSpawnConstraints(relics);
  const modifiers: WordModifier[] = [];
  let displayText: string | undefined;
  let morphAtMs: number | undefined;

  const roll = Math.random();
  if (roll < getAnagramRate(floor)) {
    modifiers.push('anagram');
    displayText = shuffleText(text);
  } else if (roll < getAnagramRate(floor) + getShiftingRate(floor)) {
    modifiers.push('shifting');
    displayText = shuffleText(text);
    morphAtMs = elapsedMs + 3_000;
  }

  if (constraints.vowelless && modifiers.length === 0) {
    modifiers.push('vowelless');
    displayText = stripVowels(text);
  }

  return {
    pos,
    modifiers: modifiers.length > 0 ? modifiers : undefined,
    displayText,
    morphAtMs,
  };
}

/** Re-baraja el texto mostrado de una palabra cambiante. */
export function morphDisplayText(targetText: string): string {
  return shuffleText(targetText);
}

export function getBossWord(elapsedMs: number, tierOffset: number): string {
  for (let len = 14; len >= 10; len--) {
    const word = getRandomWord(elapsedMs, tierOffset);
    if (word.length >= len - 2) return word;
  }
  return getRandomWord(elapsedMs, tierOffset);
}
