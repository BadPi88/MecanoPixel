import type { BossAttackState, BossId } from '../types/combat';
import type { FallingWord } from '../types/game';
import { getBossWord } from '../utils/wordSpawn';

export const BOSS_REMAP_TABLE: Record<string, string> = {
  a: 'z',
  z: 'a',
  s: 'x',
  x: 's',
};

export const BOSS_BLIND_INTERVAL_MS = 10_000;
export const BOSS_BLIND_DURATION_MS = 2_000;
export const BOSS_REMAP_DURATION_MS = 15_000;

export interface BossDefinition {
  id: BossId;
  name: string;
  floorMin: number;
  theme: string;
  quote: string;
  fallSpeed: number;
  dualWords: boolean;
  bonusCoins: number;
  attacks: {
    blind: boolean;
    remap: boolean;
    projectiles: boolean;
  };
  /** Multiplicador del intervalo de spawn de proyectiles (<1 = mas frecuentes). */
  projectileIntervalMult: number;
}

export const BOSS_CATALOG: Record<BossId, BossDefinition> = {
  archivista: {
    id: 'archivista',
    name: 'EL ARCHIVISTA',
    floorMin: 3,
    theme: 'biblioteca',
    quote: 'Cada palabra queda archivada... para siempre.',
    fallSpeed: 25,
    dualWords: false,
    bonusCoins: 80,
    attacks: { blind: true, remap: false, projectiles: false },
    projectileIntervalMult: 1,
  },
  saboteador: {
    id: 'saboteador',
    name: 'EL SABOTEADOR',
    floorMin: 6,
    theme: 'fabrica',
    quote: 'Tus teclas ya no obedecen, operario.',
    fallSpeed: 25,
    dualWords: false,
    bonusCoins: 120,
    attacks: { blind: false, remap: true, projectiles: true },
    projectileIntervalMult: 0.65,
  },
  perforador: {
    id: 'perforador',
    name: 'EL PERFORADOR',
    floorMin: 9,
    theme: 'vacuo',
    quote: 'El vacio perfora hasta el ultimo caracter.',
    fallSpeed: 35,
    dualWords: false,
    bonusCoins: 160,
    attacks: { blind: false, remap: false, projectiles: true },
    projectileIntervalMult: 1,
  },
  tiranotipo: {
    id: 'tiranotipo',
    name: 'LA TIRANOTIPO',
    floorMin: 12,
    theme: 'trono',
    quote: 'Dos decretos caen a la vez. Alterna o perece.',
    fallSpeed: 30,
    dualWords: true,
    bonusCoins: 200,
    attacks: { blind: true, remap: true, projectiles: true },
    projectileIntervalMult: 0.8,
  },
};

/** Devuelve el jefe correspondiente al piso actual. */
export function getBossForFloor(floor: number): BossDefinition {
  if (floor >= BOSS_CATALOG.tiranotipo.floorMin) return BOSS_CATALOG.tiranotipo;
  if (floor >= BOSS_CATALOG.perforador.floorMin) return BOSS_CATALOG.perforador;
  if (floor >= BOSS_CATALOG.saboteador.floorMin) return BOSS_CATALOG.saboteador;
  return BOSS_CATALOG.archivista;
}

export function getBossFallSpeed(bossId: BossId | null): number {
  if (!bossId) return 25;
  return BOSS_CATALOG[bossId].fallSpeed;
}

/** Configura ataques de UI del jefe desde el catalogo. */
export function initBossAttackFromCatalog(
  boss: BossDefinition,
  elapsedMs: number,
): BossAttackState {
  return {
    bossId: boss.id,
    blind: boss.attacks.blind,
    remap: boss.attacks.remap,
    projectiles: boss.attacks.projectiles,
    startedAtMs: elapsedMs,
    nextBlindAtMs: elapsedMs + BOSS_BLIND_INTERVAL_MS,
    remapUntilMs: boss.attacks.remap ? elapsedMs + BOSS_REMAP_DURATION_MS : 0,
  };
}

function makeBossFallingWord(
  text: string,
  x: number,
  id: string,
): FallingWord {
  return {
    id,
    text,
    x,
    y: 40,
    kind: 'normal',
  };
}

/** Genera palabras del jefe (una o dos para Tiranotipo). */
export function initBossWords(
  boss: BossDefinition,
  elapsedMs: number,
  tierOffset: number,
  createId: () => string,
): FallingWord[] {
  const first = getBossWord(elapsedMs, tierOffset);
  if (!boss.dualWords) {
    return [makeBossFallingWord(first, 120, createId())];
  }

  let second = getBossWord(elapsedMs + 1_000, tierOffset);
  let attempts = 0;
  while (second === first && attempts < 8) {
    second = getBossWord(elapsedMs + 2_000 + attempts * 500, tierOffset);
    attempts += 1;
  }

  return [
    makeBossFallingWord(first, 60, createId()),
    makeBossFallingWord(second, 200, createId()),
  ];
}

export function getBossProjectileIntervalMult(bossId: BossId | null): number {
  if (!bossId) return 1;
  return BOSS_CATALOG[bossId].projectileIntervalMult;
}

/** Progreso de HP del jefe (0-100) segun input y fase dual. */
export function getBossHpPercent(
  input: string,
  bossWords: FallingWord[],
  activeBossWordIndex: number,
): number {
  if (bossWords.length === 0) return 0;
  const totalChars = bossWords.reduce((sum, w) => sum + w.text.length, 0);
  if (totalChars === 0) return 0;

  let typed = 0;
  for (let i = 0; i < activeBossWordIndex; i++) {
    typed += bossWords[i]!.text.length;
  }
  typed += input.length;

  return Math.min(100, Math.round((typed / totalChars) * 100));
}
