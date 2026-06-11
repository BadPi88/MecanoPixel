import { RUNNER_CATALOG } from '../data/runners';
import { RELIC_CATALOG } from '../data/relics';
import { GLOSSARY_CATALOG } from '../data/glossaries';
import type { GlossaryId, RelicId } from '../types/combat';
import type { DeathCause, RunnerId } from '../types/run';
import { formatPeakIntensity } from './intensity';
import { formatTime } from './wpm';

export interface RunSummaryInput {
  playerName: string;
  title: string;
  score: number;
  floor: number;
  wpm: number;
  wordsTyped: number;
  elapsedMs: number;
  maxWordsPerSecond: number;
  runCoins: number;
  metaCoinsEarned: number;
  runnerId: RunnerId | null;
  glossary: GlossaryId;
  relics: RelicId[];
  synergyNames: string[];
  ultimatesUsed: number;
  deflectedLetters: number;
  deathCause: DeathCause | null;
  dailyRun: boolean;
}

const DEATH_LABELS: Record<NonNullable<DeathCause>, string> = {
  ground: 'palabra al suelo',
  bomb: 'explosion de bomba',
  boss: 'jefe',
  event: 'pacto mortal',
  toxic: 'tinta toxica',
  projectile: 'letra perforante',
};

export function generateRunTitle(input: RunSummaryInput): string {
  if (input.dailyRun) return 'DESAFIO DIARIO';
  if (input.floor >= 10) return 'ASCENSO LEGENDARIO';
  if (input.floor >= 5) return 'RUN SOLIDA';
  if (input.wpm >= 60) return 'TURBO RUN';
  if (input.deathCause === 'boss') return 'CAIDA ANTE EL JEFE';
  if (input.floor <= 1) return 'PRIMEROS PASOS';
  return 'RUN TERMINADA';
}

export function buildRunSummaryText(input: RunSummaryInput): string {
  const title = input.title || generateRunTitle(input);
  const peak = formatPeakIntensity(input.maxWordsPerSecond);
  const runner = input.runnerId
    ? RUNNER_CATALOG[input.runnerId].name
    : 'Sin runner';
  const glossary = GLOSSARY_CATALOG[input.glossary].name;
  const relics =
    input.relics.length > 0
      ? input.relics.map((id) => RELIC_CATALOG[id].name).join(', ')
      : 'ninguna';
  const synergies =
    input.synergyNames.length > 0 ? input.synergyNames.join(', ') : 'ninguna';
  const death = input.deathCause
    ? DEATH_LABELS[input.deathCause]
    : 'desconocida';

  const lines = [
    `KEY RUNNER — ${title}`,
    `${input.playerName || 'Jugador'}`,
    '',
    `Piso ${input.floor} · Score ${input.score} · ${input.wpm} WPM`,
    `Palabras ${input.wordsTyped} · Tiempo ${formatTime(input.elapsedMs)}`,
    `Run coins ${input.runCoins} · Meta +${input.metaCoinsEarned}`,
    `Runner: ${runner} · Glosario: ${glossary}`,
    `Reliquias: ${relics}`,
    `Sinergias: ${synergies}`,
    `Ultimates ${input.ultimatesUsed} · Desvios ${input.deflectedLetters}`,
    `Ritmo max: ${peak.value} (${peak.hint})`,
    `Caida: ${death}`,
  ];

  if (input.dailyRun) {
    lines.push('', 'Modo: Desafio diario');
  }

  return lines.join('\n');
}
