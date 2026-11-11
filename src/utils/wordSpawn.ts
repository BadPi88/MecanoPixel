import type { BiomeId } from '../data/biomes';
import { getRandomWord } from '../data/dictionary';
import { getRandomTrapWord } from '../data/traps';
import type { GlossaryId, RelicId, WordModifier } from '../types/combat';
import type { WordKind } from '../types/run';
import { applyAscensionToSpawnRates } from './ascensionModifiers';
import {
  applyBiomeToSpawnRates,
  getBiomeAnagramRateMult,
  getBiomeOracleRateMult,
} from './biomeModifiers';
import {
  getSpawnConstraints,
  reverseText,
  stripVowels,
} from './combatModifiers';
import { getWordPOS } from './posHeuristics';

export const ORACLE_SPAWN_RATE = 0.03;

export interface SpawnRates {
  trap: number;
  bomb: number;
  bonus: number;
}

export function getSpawnRatesForFloor(
  floor: number,
  noTrapsNextFloor: boolean,
  relics: RelicId[] = [],
  biomeId: BiomeId = 'scriptorium',
  ascensionLevel = 0,
): SpawnRates {
  let rates: SpawnRates;
  if (floor <= 1 || noTrapsNextFloor) {
    rates = { trap: 0, bomb: floor >= 2 ? 0.05 : 0, bonus: 0.08 };
  } else {
    const trap = Math.min(0.08 + floor * 0.02, 0.15);
    const bomb = Math.min(0.04 + floor * 0.01, 0.1);
    rates = { trap, bomb, bonus: 0.1 };
  }

  if (relics.includes('sello_maldito')) {
    rates = { ...rates, trap: Math.min(rates.trap * 2, 0.3) };
  }

  rates = applyBiomeToSpawnRates(rates, biomeId);
  rates = applyAscensionToSpawnRates(rates, ascensionLevel);
  return rates;
}

export function rollWordKind(
  rates: SpawnRates,
  oracleMult = 1,
  chaosMode = false,
): WordKind {
  if (chaosMode) {
    const kinds: WordKind[] = ['normal', 'trap', 'bomb', 'bonus', 'oracle'];
    return kinds[Math.floor(Math.random() * kinds.length)];
  }

  const oracleRate = ORACLE_SPAWN_RATE * oracleMult;
  const roll = Math.random();
  if (roll < oracleRate) return 'oracle';
  if (roll < oracleRate + rates.trap) return 'trap';
  if (roll < oracleRate + rates.trap + rates.bomb) return 'bomb';
  if (roll < oracleRate + rates.trap + rates.bomb + rates.bonus) {
    return 'bonus';
  }
  return 'normal';
}

export function getWordTextForKind(
  kind: WordKind,
  elapsedMs: number,
  tierOffset: number,
  glossary: GlossaryId = 'general',
  relics: RelicId[] = [],
  floor = 1,
): string {
  if (kind === 'trap') return getRandomTrapWord();
  if (kind === 'oracle') {
    const oracleWords = ['oraculo', 'vision', 'augurio', 'profecia', 'destino'];
    return oracleWords[Math.floor(Math.random() * oracleWords.length)];
  }
  if (kind === 'bonus') {
    const words = ['oro', 'gema', 'luck', 'premio', 'bonus'];
    return words[Math.floor(Math.random() * words.length)];
  }
  const constraints = getSpawnConstraints(relics);
  return getRandomWord(elapsedMs, tierOffset, {
    glossary,
    minLen: constraints.minLen,
    maxLen: constraints.maxLen,
    floor,
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

function getAnagramRate(floor: number, biomeId: BiomeId): number {
  if (floor < 2) return 0;
  return Math.min(
    (0.1 + (floor - 2) * 0.02) * getBiomeAnagramRateMult(biomeId),
    0.35,
  );
}

function getShiftingRate(floor: number, devoratexto = false): number {
  if (floor < 3 && !devoratexto) return 0;
  const base = devoratexto ? 0.35 : 0.08 + (floor - 3) * 0.02;
  return Math.min(base, devoratexto ? 0.5 : 0.2);
}

export function decorateSpawn(
  kind: WordKind,
  text: string,
  floor: number,
  elapsedMs: number,
  relics: RelicId[],
  biomeId: BiomeId = 'scriptorium',
  devoratextoBoss = false,
): SpawnDecoration {
  const pos = getWordPOS(text);

  if ((kind !== 'normal' && kind !== 'oracle') || text.length < 4) {
    return { pos };
  }

  const constraints = getSpawnConstraints(relics);
  const modifiers: WordModifier[] = [];
  let displayText: string | undefined;
  let morphAtMs: number | undefined;

  if (relics.includes('teclado_espejo')) {
    modifiers.push('reversed');
    displayText = reverseText(text);
    return { pos, modifiers, displayText };
  }

  const forceAnagram = relics.includes('espejo_roto');
  const anagramRate = getAnagramRate(floor, biomeId);
  const shiftingRate = getShiftingRate(floor, devoratextoBoss);

  const roll = Math.random();
  if (forceAnagram || roll < anagramRate) {
    modifiers.push('anagram');
    displayText = shuffleText(text);
  } else if (roll < anagramRate + shiftingRate) {
    modifiers.push('shifting');
    displayText = shuffleText(text);
    morphAtMs = elapsedMs + (devoratextoBoss ? 1_500 : 3_000);
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

export function morphDisplayText(targetText: string): string {
  return shuffleText(targetText);
}

export function getBossWord(
  elapsedMs: number,
  tierOffset: number,
  floor = 1,
): string {
  for (let len = 14; len >= 10; len--) {
    const word = getRandomWord(elapsedMs, tierOffset, { floor });
    if (word.length >= len - 2) return word;
  }
  return getRandomWord(elapsedMs, tierOffset, { floor });
}

export function getOracleRateMult(biomeId: BiomeId): number {
  return getBiomeOracleRateMult(biomeId);
}
