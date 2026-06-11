import type { GlossaryId, RelicId } from '../types/combat';
import type { FallingWord, GameState } from '../types/game';

/** Restricciones de spawn impuestas por reliquias activas. */
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

export function stripVowels(text: string): string {
  const stripped = text.replace(/[aeiou]/g, '');
  return stripped.length > 0 ? stripped : text;
}

export interface SubmitRelicResult {
  scoreMult: number;
  extraUltimateCharge: number;
  /** Palabras a marcar como quemadas (ids). */
  burnWordIds: string[];
  /** Bonus AOE plano de score (cortocircuitado). */
  aoeBonus: number;
}

/**
 * Efectos de reliquias y glosario al enviar una palabra correcta.
 * Funcion pura: devuelve multiplicadores y efectos a aplicar.
 */
export function applyRelicOnSubmit(
  state: GameState,
  word: FallingWord,
  basePoints: number,
  burnPropagates: boolean,
): SubmitRelicResult {
  const relics = state.activeRelics;
  const len = word.text.length;
  let scoreMult = 1;
  let extraUltimateCharge = 0;
  const burnWordIds: string[] = [];
  let aoeBonus = 0;

  if (relics.includes('sello_maldito')) {
    scoreMult *= 2;
  }

  if (relics.includes('diccionario_erudito')) {
    if (len >= 8) scoreMult *= 3;
    else if (len <= 4) scoreMult *= 0.5;
  }

  if (relics.includes('reliquia_ignea') && word.text.includes('f')) {
    scoreMult *= 1.25;
    const others = state.words
      .filter((w) => w.id !== word.id && w.kind !== 'trap' && !w.burning)
      .sort(
        (a, b) => Math.abs(a.x - word.x) - Math.abs(b.x - word.x),
      );
    const burnCount = burnPropagates ? 2 : 1;
    for (const target of others.slice(0, burnCount)) {
      burnWordIds.push(target.id);
    }
  }

  if (word.burning) {
    scoreMult *= 1.2;
  }

  if (relics.includes('teclado_cortocircuitado')) {
    const neighbors = state.words.filter(
      (w) => w.id !== word.id && w.kind !== 'trap' && Math.abs(w.x - word.x) < 150,
    );
    aoeBonus = Math.round(
      basePoints * 0.15 * Math.min(neighbors.length, 3),
    );
  }

  scoreMult *= getGlossaryScoreMult(
    state.selectedGlossary,
    len,
    state.floor,
  );

  if (state.selectedGlossary === 'tecnico' && state.status !== 'boss') {
    extraUltimateCharge += 1;
  }

  return { scoreMult, extraUltimateCharge, burnWordIds, aoeBonus };
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

/** Carga extra de ultimate por caracter durante combate de jefe (glosario tecnico). */
export function getBossUltimateChargePerChar(
  glossary: GlossaryId,
  status: GameState['status'],
): number {
  if (glossary === 'tecnico' && status === 'boss') return 3;
  return 0;
}

export interface MissRelicResult {
  loseLife: boolean;
  purgeAll: boolean;
}

/** Tinta Toxica: fallar un envio cuesta vida pero limpia la pantalla. */
export function applyRelicOnMiss(state: GameState): MissRelicResult {
  if (state.activeRelics.includes('tinta_toxica') && state.words.length > 0) {
    return { loseLife: true, purgeAll: true };
  }
  return { loseLife: false, purgeAll: false };
}
