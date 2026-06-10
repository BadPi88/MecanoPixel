let wordIdCounter = 0;

export function createWordId(): string {
  wordIdCounter += 1;
  return `word-${wordIdCounter}`;
}
