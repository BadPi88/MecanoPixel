/** Generador reproducible de Mulberry32 para desafíos, runs y pruebas. */
export function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 0x1_0000_0000;
  };
}

export function randomIndex(length: number, random: () => number = Math.random): number {
  if (length <= 0) return -1;
  return Math.min(length - 1, Math.floor(random() * length));
}
