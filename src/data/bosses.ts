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
  telegraphMs: number;
  telegraphLabel: string;
  phases?: Array<{
    label: string;
    fallSpeedMult: number;
    projectileIntervalMult: number;
  }>;
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
    telegraphMs: 1000,
    telegraphLabel: 'ARCHIVO: IMPACTO',
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
    telegraphMs: 1100,
    telegraphLabel: 'SABOTAJE: IMPACTO',
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
    telegraphMs: 1050,
    telegraphLabel: 'PERFORACION: IMPACTO',
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
    telegraphMs: 1000,
    telegraphLabel: 'DECRETO: IMPACTO',
  },
  cronista: {
    id: 'cronista',
    name: 'EL CRONISTA',
    floorMin: 6,
    theme: 'archivo',
    quote: 'Cada letra anotada es una sentencia.',
    fallSpeed: 28,
    dualWords: false,
    bonusCoins: 140,
    attacks: { blind: true, remap: false, projectiles: false },
    projectileIntervalMult: 1,
    telegraphMs: 1000,
    telegraphLabel: 'CRONICA: IMPACTO',
  },
  devoratexto: {
    id: 'devoratexto',
    name: 'DEVORATEXTO',
    floorMin: 9,
    theme: 'vacuo',
    quote: 'Las letras desaparecen una a una.',
    fallSpeed: 32,
    dualWords: false,
    bonusCoins: 180,
    attacks: { blind: false, remap: false, projectiles: true },
    projectileIntervalMult: 0.9,
    telegraphMs: 1050,
    telegraphLabel: 'MORDISCO: IMPACTO',
  },
  hilandera: {
    id: 'hilandera',
    name: 'LA HILANDERA',
    floorMin: 6,
    theme: 'telar',
    quote: 'Cada hilo termina en una tecla.',
    fallSpeed: 29,
    dualWords: false,
    bonusCoins: 150,
    attacks: { blind: false, remap: true, projectiles: true },
    projectileIntervalMult: 0.8,
    telegraphMs: 1100,
    telegraphLabel: 'HILO TENSO: IMPACTO',
  },
  corrector: {
    id: 'corrector',
    name: 'EL CORRECTOR',
    floorMin: 9,
    theme: 'imprenta',
    quote: 'No hay error que no pueda reescribir.',
    fallSpeed: 33,
    dualWords: false,
    bonusCoins: 190,
    attacks: { blind: true, remap: false, projectiles: true },
    projectileIntervalMult: 0.85,
    telegraphMs: 1100,
    telegraphLabel: 'CORRECCION: IMPACTO',
  },
  indexadora: {
    id: 'indexadora',
    name: 'LA INDEXADORA',
    floorMin: 15,
    theme: 'palimpsesto',
    quote: 'Toda palabra deja una marca. Ninguna escapa al indice.',
    fallSpeed: 27,
    dualWords: true,
    bonusCoins: 260,
    attacks: { blind: true, remap: false, projectiles: true },
    projectileIntervalMult: 1.1,
    telegraphMs: 1200,
    telegraphLabel: 'INDICE: ZONA MARCADA',
    phases: [
      { label: 'FASE 1 — CATALOGAR', fallSpeedMult: 1, projectileIntervalMult: 1.1 },
      { label: 'FASE 2 — REESCRIBIR', fallSpeedMult: 1.25, projectileIntervalMult: 0.65 },
    ],
  },
  mini_guardian: {
    id: 'mini_guardian',
    name: 'GUARDIAN',
    floorMin: 1,
    theme: 'trono',
    quote: 'Un ultimo obstaculo.',
    fallSpeed: 22,
    dualWords: false,
    bonusCoins: 40,
    attacks: { blind: false, remap: false, projectiles: false },
    projectileIntervalMult: 1,
    telegraphMs: 0,
    telegraphLabel: '',
  },
};

function getStandardBossForFloor(floor: number): BossDefinition {
  if (floor >= BOSS_CATALOG.tiranotipo.floorMin) return BOSS_CATALOG.tiranotipo;
  if (floor >= BOSS_CATALOG.perforador.floorMin) return BOSS_CATALOG.perforador;
  if (floor >= BOSS_CATALOG.saboteador.floorMin) return BOSS_CATALOG.saboteador;
  return BOSS_CATALOG.archivista;
}

/** Devuelve el jefe correspondiente al piso (con secretos en ascension 3+). */
export function getBossForFloor(
  floor: number,
  ascensionLevel = 0,
  runSeed = 0,
): BossDefinition {
  const roll = ((runSeed + floor * 31337) >>> 0) % 100;
  if (roll < 25 && floor >= 9 && floor < BOSS_CATALOG.tiranotipo.floorMin) {
    return ascensionLevel >= 3
      ? BOSS_CATALOG.devoratexto
      : BOSS_CATALOG.corrector;
  }
  if (roll < 25 && floor >= 6 && floor < BOSS_CATALOG.perforador.floorMin) {
    return ascensionLevel >= 3
      ? BOSS_CATALOG.cronista
      : BOSS_CATALOG.hilandera;
  }
  return getStandardBossForFloor(floor);
}

export function getMiniBoss(): BossDefinition {
  return BOSS_CATALOG.mini_guardian;
}

export function getBossFallSpeed(bossId: BossId | null, phase = 0): number {
  if (!bossId) return 25;
  const boss = BOSS_CATALOG[bossId];
  return boss.fallSpeed * (boss.phases?.[phase]?.fallSpeedMult ?? 1);
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
  floor = 1,
): FallingWord[] {
  const first = getBossWord(elapsedMs, tierOffset, floor);
  if (!boss.dualWords) {
    return [makeBossFallingWord(first, 120, createId())];
  }

  let second = getBossWord(elapsedMs + 1_000, tierOffset, floor);
  let attempts = 0;
  while (second === first && attempts < 8) {
    second = getBossWord(elapsedMs + 2_000 + attempts * 500, tierOffset, floor);
    attempts += 1;
  }

  return [
    makeBossFallingWord(first, 60, createId()),
    makeBossFallingWord(second, 200, createId()),
  ];
}

export function getBossProjectileIntervalMult(
  bossId: BossId | null,
  phase = 0,
): number {
  if (!bossId) return 1;
  const boss = BOSS_CATALOG[bossId];
  return boss.phases?.[phase]?.projectileIntervalMult ?? boss.projectileIntervalMult;
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
