import type { GlossaryId } from '../types/combat';
import type { RunnerId } from '../types/run';

const WEEKLY_RUNNERS: RunnerId[] = ['veloz', 'tanque', 'codificador', 'fantasma', 'maestro'];
const WEEKLY_GLOSSARIES: GlossaryId[] = ['general', 'medico', 'tecnico'];

export function getUtcWeekId(date = new Date()): string {
  const monday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const offset = (monday.getUTCDay() + 6) % 7;
  monday.setUTCDate(monday.getUTCDate() - offset);
  return monday.toISOString().slice(0, 10);
}

export function hashWeekSeed(week: string): number {
  let hash = 2166136261;
  for (const char of `keyrunner-week-${week}`) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function getWeeklyChallengeConfig(week = getUtcWeekId()) {
  const seed = hashWeekSeed(week);
  return {
    week,
    seed,
    runnerId: WEEKLY_RUNNERS[seed % WEEKLY_RUNNERS.length]!,
    glossaryId: WEEKLY_GLOSSARIES[(seed >>> 8) % WEEKLY_GLOSSARIES.length]!,
    ascensionLevel: 1,
  };
}
