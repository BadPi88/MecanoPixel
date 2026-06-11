import type { RunnerId } from '../types/run';

/** Stat de meta-progresion que desbloquea un runner. */
export type UnlockStat = 'runsPlayed' | 'totalWords' | 'bestFloor';

export interface RunnerUnlock {
  stat: UnlockStat;
  threshold: number;
}

export const UNLOCK_STAT_LABELS: Record<UnlockStat, string> = {
  runsPlayed: 'RUNS',
  totalWords: 'PALABRAS',
  bestFloor: 'PISO',
};

export interface RunnerDefinition {
  id: RunnerId;
  name: string;
  description: string;
  defaultUnlocked: boolean;
  unlock?: RunnerUnlock;
}

export const RUNNER_CATALOG: Record<RunnerId, RunnerDefinition> = {
  veloz: {
    id: 'veloz',
    name: 'VELOZ',
    description: '+15% score en palabras cortas (5 letras o menos)',
    defaultUnlocked: true,
  },
  tanque: {
    id: 'tanque',
    name: 'TANQUE',
    description: '+1 vida, ritmo sube 10% mas rapido',
    defaultUnlocked: true,
  },
  codificador: {
    id: 'codificador',
    name: 'CODIFICADOR',
    description: 'Combo x1.5 desde combo 3',
    defaultUnlocked: true,
  },
  fantasma: {
    id: 'fantasma',
    name: 'FANTASMA',
    description: 'Ignora la primera trampa que escribas',
    defaultUnlocked: false,
    unlock: { stat: 'runsPlayed', threshold: 5 },
  },
  magnate: {
    id: 'magnate',
    name: 'MAGNATE',
    description: '+20% monedas de run',
    defaultUnlocked: false,
    unlock: { stat: 'totalWords', threshold: 1500 },
  },
  centinela: {
    id: 'centinela',
    name: 'CENTINELA',
    description: 'Las palabras caen un 8% mas lento',
    defaultUnlocked: false,
    unlock: { stat: 'runsPlayed', threshold: 15 },
  },
  alquimista: {
    id: 'alquimista',
    name: 'ALQUIMISTA',
    description: '+8% de probabilidad de palabras bonus',
    defaultUnlocked: false,
    unlock: { stat: 'bestFloor', threshold: 5 },
  },
  maestro: {
    id: 'maestro',
    name: 'MAESTRO',
    description: 'El ultimate carga un 25% mas rapido',
    defaultUnlocked: false,
    unlock: { stat: 'totalWords', threshold: 5000 },
  },
};
