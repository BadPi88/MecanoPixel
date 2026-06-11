import type { GlossaryId, RelicId } from '../types/combat';
import type { FallingWord, GameState } from '../types/game';
import { getBiomeBonusScoreMult } from './biomeModifiers';

export interface SpawnConstraints {
  minLen?: number;
  maxLen?: number;
  spawnIntervalMult: number;
  vowelless: boolean;
}

export function getSpawnConstraints(relics: RelicId[]): SpawnConstraints {
  const constraints: SpawnConstraints = {
    spawnIntervalMult: 1,
    vowelless: false,
  };

  if (relics.includes('teclado_cortocircuitado')) {
    constraints.minLen = 3;
    constraints.maxLen = 4;
    constraints.spawnIntervalMult = 1 / 1.4;
  }

  if (relics.includes('afinacion_vocales')) {
    constraints.vowelless = true;
  }

  return constraints;
}

export function getRelicFallSpeedMult(relics: RelicId[]): number {
  if (relics.includes('ancla_gravitatoria')) return 0.88;
  return 1;
}

export function getRelicScoreMult(relics: RelicId[]): number {
  if (relics.includes('ancla_gravitatoria')) return 0.92;
  return 1;
}

export function getShopPriceMult(relics: RelicId[]): number {
  if (relics.includes('bolsa_mercader')) return 0.8;
  return 1;
}

export function stripVowels(text: string): string {
  const stripped = text.replace(/[aeiou]/g, '');
  return stripped.length > 0 ? stripped : text;
}

export function reverseText(text: string): string {
  return text.split('').reverse().join('');
}

export interface SubmitRelicResult {
  scoreMult: number;
  extraUltimateCharge: number;
  burnWordIds: string[];
  aoeBonus: number;
  bonusRunCoins: number;
}

export function applyRelicOnSubmit(
  state: GameState,
  word: FallingWord,
  basePoints: number,
  burnPropagates: boolean,
): SubmitRelicResult {
  const relics = state.activeRelics;
  const len = word.text.length;
  let scoreMult = getRelicScoreMult(relics);
  let extraUltimateCharge = 0;
  const burnWordIds: string[] = [];
  let aoeBonus = 0;
  let bonusRunCoins = 0;

  if (relics.includes('sello_maldito')) scoreMult *= 2;
  if (relics.includes('contrato_sangriento')) scoreMult *= 1.5;

  if (relics.includes('dados_caoticos')) {
    scoreMult *= 0.7 + Math.random() * 1.1;
  }

  if (relics.includes('diccionario_erudito')) {
    if (len >= 8) scoreMult *= 3;
    else if (len <= 4) scoreMult *= 0.5;
  }

  if (relics.includes('reliquia_ignea') && word.text.includes('f')) {
    scoreMult *= 1.25;
    const others = state.words
      .filter((w) => w.id !== word.id && w.kind !== 'trap' && !w.burning)
      .sort((a, b) => Math.abs(a.x - word.x) - Math.abs(b.x - word.x));
    const burnCount = burnPropagates ? 2 : 1;
    for (const target of others.slice(0, burnCount)) {
      burnWordIds.push(target.id);
    }
  }

  if (word.burning) scoreMult *= 1.2;

  if (relics.includes('teclado_cortocircuitado')) {
    const neighbors = state.words.filter(
      (w) =>
        w.id !== word.id &&
        w.kind !== 'trap' &&
        Math.abs(w.x - word.x) < 150,
    );
    aoeBonus = Math.round(basePoints * 0.15 * Math.min(neighbors.length, 3));
  }

  scoreMult *= getGlossaryScoreMult(
    state.selectedGlossary,
    len,
    state.floor,
  );

  if (word.kind === 'bonus') {
    scoreMult *= getBiomeBonusScoreMult(state.biomeId);
    if (relics.includes('moneda_ardiente')) bonusRunCoins += 8;
  }

  if (state.selectedGlossary === 'tecnico' && state.status !== 'boss') {
    extraUltimateCharge += 1;
  }

  if (relics.includes('cronometro_veloz')) {
    extraUltimateCharge = Math.round(extraUltimateCharge * 1.25);
  }

  return { scoreMult, extraUltimateCharge, burnWordIds, aoeBonus, bonusRunCoins };
}

function getGlossaryScoreMult(
  glossary: GlossaryId,
  wordLength: number,
  floor: number,
): number {
  if (glossary === 'medico' && floor % 2 === 0 && wordLength >= 7) {
    return 1.3;
  }
  return 1;
}

export function getBossUltimateChargePerChar(
  glossary: GlossaryId,
  status: GameState['status'],
  relics: RelicId[],
): number {
  let base = glossary === 'tecnico' && status === 'boss' ? 3 : 0;
  if (relics.includes('cronometro_veloz') && base > 0) {
    base = Math.round(base * 1.25);
  }
  return base;
}

export function getUltimateChargePerChar(relics: RelicId[]): number {
  return relics.includes('cronometro_veloz') ? 1.25 : 1;
}

export interface MissRelicResult {
  loseLife: boolean;
  purgeAll: boolean;
}

export function applyRelicOnMiss(state: GameState): MissRelicResult {
  if (state.activeRelics.includes('tinta_toxica') && state.words.length > 0) {
    return { loseLife: true, purgeAll: true };
  }
  return { loseLife: false, purgeAll: false };
}

export function getTrapShieldOnFloorStart(relics: RelicId[]): number {
  return relics.includes('escudo_runico') ? 2 : 0;
}
