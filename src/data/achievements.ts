import type { RelicId } from '../types/combat';
import type { DeathCause } from '../types/run';
import type { MetaProgress } from '../services/meta';
import type { FrameId, TrailId, WordPaletteId } from './metaUnlocks';

export type AchievementId =
  | 'primera_run'
  | 'piso_3'
  | 'piso_5'
  | 'piso_10'
  | 'palabras_100'
  | 'palabras_500'
  | 'score_5k'
  | 'score_15k'
  | 'wpm_40'
  | 'wpm_60'
  | 'ultimate_5'
  | 'desvios_10'
  | 'reliquias_3'
  | 'jefe_alcanzado'
  | 'desafio_diario';

export type AchievementReward =
  | { kind: 'meta_coins'; amount: number }
  | { kind: 'relic'; relicId: RelicId }
  | { kind: 'palette'; palette: WordPaletteId }
  | { kind: 'trail'; trail: TrailId }
  | { kind: 'frame'; frame: FrameId }
  | { kind: 'ascension'; level: number };

export interface AchievementDef {
  id: AchievementId;
  title: string;
  description: string;
  reward?: AchievementReward;
}

export const ACHIEVEMENT_CATALOG: Record<AchievementId, AchievementDef> = {
  primera_run: {
    id: 'primera_run',
    title: 'PRIMER PASO',
    description: 'Completa tu primera run',
    reward: { kind: 'meta_coins', amount: 50 },
  },
  piso_3: {
    id: 'piso_3',
    title: 'SUBIENDO',
    description: 'Llega al piso 3 en una run',
    reward: { kind: 'meta_coins', amount: 75 },
  },
  piso_5: {
    id: 'piso_5',
    title: 'ASCENSO',
    description: 'Llega al piso 5 en una run',
    reward: { kind: 'relic', relicId: 'bolsa_mercader' },
  },
  piso_10: {
    id: 'piso_10',
    title: 'CIMA',
    description: 'Llega al piso 10 en una run',
    reward: { kind: 'ascension', level: 1 },
  },
  palabras_100: {
    id: 'palabras_100',
    title: 'DEDOS CALIENTES',
    description: 'Escribe 100 palabras en total',
    reward: { kind: 'meta_coins', amount: 100 },
  },
  palabras_500: {
    id: 'palabras_500',
    title: 'MAQUINA DE ESCRIBIR',
    description: 'Escribe 500 palabras en total',
    reward: { kind: 'meta_coins', amount: 200 },
  },
  score_5k: {
    id: 'score_5k',
    title: 'PUNTUADOR',
    description: 'Consigue 5000 puntos en una run',
    reward: { kind: 'meta_coins', amount: 80 },
  },
  score_15k: {
    id: 'score_15k',
    title: 'LEYENDA LOCAL',
    description: 'Consigue 15000 puntos en una run',
    reward: { kind: 'ascension', level: 2 },
  },
  wpm_40: {
    id: 'wpm_40',
    title: 'VELOZ',
    description: 'Alcanza 40 WPM en una run',
    reward: { kind: 'meta_coins', amount: 60 },
  },
  wpm_60: {
    id: 'wpm_60',
    title: 'TURBO',
    description: 'Alcanza 60 WPM en una run',
    reward: { kind: 'palette', palette: 'neon' },
  },
  ultimate_5: {
    id: 'ultimate_5',
    title: 'ULTIMATE SPAM',
    description: 'Usa 5 ultimates en una run',
    reward: { kind: 'trail', trail: 'sparks' },
  },
  desvios_10: {
    id: 'desvios_10',
    title: 'DEFLECTOR',
    description: 'Desvia 10 letras en una run',
    reward: { kind: 'meta_coins', amount: 70 },
  },
  reliquias_3: {
    id: 'reliquias_3',
    title: 'COLECCIONISTA',
    description: 'Obtiene 3 reliquias en una run',
    reward: { kind: 'relic', relicId: 'cronometro_veloz' },
  },
  jefe_alcanzado: {
    id: 'jefe_alcanzado',
    title: 'CARA A CARA',
    description: 'Llega a un combate de jefe',
    reward: { kind: 'relic', relicId: 'escudo_runico' },
  },
  desafio_diario: {
    id: 'desafio_diario',
    title: 'RITUAL DIARIO',
    description: 'Completa el desafio diario',
    reward: { kind: 'frame', frame: 'gold' },
  },
};

export const ACHIEVEMENT_IDS = Object.keys(
  ACHIEVEMENT_CATALOG,
) as AchievementId[];

export interface RunAchievementStats {
  floor: number;
  score: number;
  wordsTyped: number;
  wpm: number;
  ultimatesUsed: number;
  deflectedLetters: number;
  relicsCollected: number;
  dailyRun: boolean;
  deathCause: DeathCause | null;
  reachedBoss: boolean;
  victory?: boolean;
}

export function isAchievementMet(
  id: AchievementId,
  meta: MetaProgress,
  run: RunAchievementStats,
): boolean {
  switch (id) {
    case 'primera_run':
      return meta.stats.runsPlayed >= 1;
    case 'piso_3':
      return run.floor >= 3;
    case 'piso_5':
      return run.floor >= 5;
    case 'piso_10':
      return run.floor >= 10;
    case 'palabras_100':
      return meta.stats.totalWords >= 100;
    case 'palabras_500':
      return meta.stats.totalWords >= 500;
    case 'score_5k':
      return run.score >= 5000;
    case 'score_15k':
      return run.score >= 15000;
    case 'wpm_40':
      return run.wpm >= 40;
    case 'wpm_60':
      return run.wpm >= 60;
    case 'ultimate_5':
      return run.ultimatesUsed >= 5;
    case 'desvios_10':
      return run.deflectedLetters >= 10;
    case 'reliquias_3':
      return run.relicsCollected >= 3;
    case 'jefe_alcanzado':
      return run.reachedBoss;
    case 'desafio_diario':
      return run.dailyRun && run.score > 0;
    default:
      return false;
  }
}

export function applyAchievementReward(
  meta: MetaProgress,
  id: AchievementId,
): MetaProgress {
  const reward = ACHIEVEMENT_CATALOG[id].reward;
  if (!reward) return meta;

  switch (reward.kind) {
    case 'meta_coins':
      meta.totalCoins += reward.amount;
      break;
    case 'relic':
      if (!meta.unlockedRelics.includes(reward.relicId)) {
        meta.unlockedRelics.push(reward.relicId);
      }
      break;
    case 'palette':
      if (!meta.cosmetics.unlockedPalettes.includes(reward.palette)) {
        meta.cosmetics.unlockedPalettes.push(reward.palette);
      }
      break;
    case 'trail':
      if (!meta.cosmetics.unlockedTrails.includes(reward.trail)) {
        meta.cosmetics.unlockedTrails.push(reward.trail);
      }
      break;
    case 'frame':
      if (!meta.cosmetics.unlockedFrames.includes(reward.frame)) {
        meta.cosmetics.unlockedFrames.push(reward.frame);
      }
      break;
    case 'ascension':
      meta.ascensionUnlocked = true;
      meta.maxAscension = Math.max(meta.maxAscension, reward.level);
      break;
    default:
      break;
  }
  return meta;
}
