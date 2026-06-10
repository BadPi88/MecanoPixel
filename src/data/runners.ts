import type { RunnerId } from '../types/run';

export interface RunnerDefinition {
  id: RunnerId;
  name: string;
  description: string;
  defaultUnlocked: boolean;
  metaCost?: number;
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
    metaCost: 500,
  },
  magnate: {
    id: 'magnate',
    name: 'MAGNATE',
    description: '+20% monedas de run',
    defaultUnlocked: false,
    metaCost: 800,
  },
};
