let wordIdCounter = 0;

/** Genera IDs efímeros para entidades visuales; no afecta al azar de gameplay. */
export function createWordId(): string {
  wordIdCounter += 1;
  return `word-${wordIdCounter}`;
}