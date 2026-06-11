import type { DeathCause } from '../types/run';
import type { MetaProgress } from '../services/meta';

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

export interface AchievementDef {
  id: AchievementId;
  title: string;
  description: string;
}

export const ACHIEVEMENT_CATALOG: Record<AchievementId, AchievementDef> = {
  primera_run: {
    id: 'primera_run',
    title: 'PRIMER PASO',
    description: 'Completa tu primera run',
  },
  piso_3: {
    id: 'piso_3',
    title: 'SUBIENDO',
    description: 'Llega al piso 3 en una run',
  },
  piso_5: {
    id: 'piso_5',
    title: 'ASCENSO',
    description: 'Llega al piso 5 en una run',
  },
  piso_10: {
    id: 'piso_10',
    title: 'CIMA',
    description: 'Llega al piso 10 en una run',
  },
  palabras_100: {
    id: 'palabras_100',
    title: 'DEDOS CALIENTES',
    description: 'Escribe 100 palabras en total',
  },
  palabras_500: {
    id: 'palabras_500',
    title: 'MAQUINA DE ESCRIBIR',
    description: 'Escribe 500 palabras en total',
  },
  score_5k: {
    id: 'score_5k',
    title: 'PUNTUADOR',
    description: 'Consigue 5000 puntos en una run',
  },
  score_15k: {
    id: 'score_15k',
    title: 'LEYENDA LOCAL',
    description: 'Consigue 15000 puntos en una run',
  },
  wpm_40: {
    id: 'wpm_40',
    title: 'VELOZ',
    description: 'Alcanza 40 WPM en una run',
  },
  wpm_60: {
    id: 'wpm_60',
    title: 'TURBO',
    description: 'Alcanza 60 WPM en una run',
  },
  ultimate_5: {
    id: 'ultimate_5',
    title: 'ULTIMATE SPAM',
    description: 'Usa 5 ultimates en una run',
  },
  desvios_10: {
    id: 'desvios_10',
    title: 'DEFLECTOR',
    description: 'Desvia 10 letras en una run',
  },
  reliquias_3: {
    id: 'reliquias_3',
    title: 'COLECCIONISTA',
    description: 'Obtiene 3 reliquias en una run',
  },
  jefe_alcanzado: {
    id: 'jefe_alcanzado',
    title: 'CARA A CARA',
    description: 'Llega a un combate de jefe',
  },
  desafio_diario: {
    id: 'desafio_diario',
    title: 'RITUAL DIARIO',
    description: 'Completa el desafio diario',
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
