export const TRAP_WORDS: string[] = [
  'xefa', 'bruto', 'zaino', 'falso', 'truco', 'senuelo', 'finta', 'engaño',
  'error', 'fallo', 'mito', 'fake', 'trap', 'cebo', 'farsa', 'mentira',
  'iluso', 'vano', 'nulo', 'void', 'spam', 'junk', 'basura', 'ruido',
];

export function getRandomTrapWord(): string {
  return TRAP_WORDS[Math.floor(Math.random() * TRAP_WORDS.length)];
}
