export const TRAP_WORDS: string[] = [
  'xefa', 'bruto', 'zaino', 'falso', 'truco', 'senuelo', 'finta', 'engaño',
  'error', 'fallo', 'mito', 'fake', 'trap', 'cebo', 'farsa', 'mentira',
  'iluso', 'vano', 'nulo', 'void', 'spam', 'junk', 'basura', 'ruido',
];

export function getRandomTrapWord(random: () => number = Math.random): string {
  return TRAP_WORDS[Math.min(TRAP_WORDS.length - 1, Math.floor(random() * TRAP_WORDS.length))];
}
