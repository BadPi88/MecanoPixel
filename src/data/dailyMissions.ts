export type DailyMissionId =
  | 'palabras_25'
  | 'piso_2'
  | 'ultimate_1'
  | 'score_1000'
  | 'desvios_5';

export interface DailyMissionDef {
  id: DailyMissionId;
  label: string;
  target: number;
  reward: number;
}

export const DAILY_MISSION_CATALOG: Record<DailyMissionId, DailyMissionDef> = {
  palabras_25: {
    id: 'palabras_25',
    label: 'Escribe 25 palabras en una run',
    target: 25,
    reward: 50,
  },
  piso_2: {
    id: 'piso_2',
    label: 'Llega al piso 2',
    target: 2,
    reward: 75,
  },
  ultimate_1: {
    id: 'ultimate_1',
    label: 'Usa 1 ultimate en una run',
    target: 1,
    reward: 60,
  },
  score_1000: {
    id: 'score_1000',
    label: 'Consigue 1000 puntos en una run',
    target: 1000,
    reward: 80,
  },
  desvios_5: {
    id: 'desvios_5',
    label: 'Desvia 5 letras en una run',
    target: 5,
    reward: 55,
  },
};

export const DAILY_MISSION_IDS = Object.keys(
  DAILY_MISSION_CATALOG,
) as DailyMissionId[];

export function pickMissionForDate(date: string): DailyMissionId {
  let hash = 0;
  for (let i = 0; i < date.length; i++) {
    hash = (hash * 31 + date.charCodeAt(i)) >>> 0;
  }
  const index = hash % DAILY_MISSION_IDS.length;
  return DAILY_MISSION_IDS[index];
}

export function getMissionProgressForRun(
  missionId: DailyMissionId,
  run: {
    wordsTyped: number;
    floor: number;
    ultimatesUsed: number;
    score: number;
    deflectedLetters: number;
  },
): number {
  switch (missionId) {
    case 'palabras_25':
      return run.wordsTyped;
    case 'piso_2':
      return run.floor;
    case 'ultimate_1':
      return run.ultimatesUsed;
    case 'score_1000':
      return run.score;
    case 'desvios_5':
      return run.deflectedLetters;
    default:
      return 0;
  }
}
