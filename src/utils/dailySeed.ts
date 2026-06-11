import type { GlossaryId } from '../types/combat';
import type { RunnerId } from '../types/run';

const RUNNER_POOL: RunnerId[] = [
  'veloz',
  'tanque',
  'codificador',
  'fantasma',
  'maestro',
];
const GLOSSARY_POOL: GlossaryId[] = ['general', 'medico', 'tecnico'];

export function getUtcDateString(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function hashDateSeed(date: string): number {
  let hash = 2166136261;
  for (let i = 0; i < date.length; i++) {
    hash ^= date.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export interface DailyChallengeConfig {
  date: string;
  seed: number;
  runnerId: RunnerId;
  glossaryId: GlossaryId;
}

export function getDailyChallengeConfig(
  date = getUtcDateString(),
): DailyChallengeConfig {
  const seed = hashDateSeed(date);
  const runnerId = RUNNER_POOL[seed % RUNNER_POOL.length];
  const glossaryId = GLOSSARY_POOL[(seed >>> 8) % GLOSSARY_POOL.length];
  return { date, seed, runnerId, glossaryId };
}
