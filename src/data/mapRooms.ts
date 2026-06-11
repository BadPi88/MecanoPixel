import { BOSS_EVERY_N_FLOORS } from './run';

export type MapRoomType =
  | 'shop'
  | 'event'
  | 'treasure'
  | 'elite'
  | 'rest'
  | 'boss';

export interface MapRoomOption {
  id: string;
  type: MapRoomType;
  label: string;
  description: string;
  icon: string;
}

const ROOM_META: Record<
  MapRoomType,
  Pick<MapRoomOption, 'type' | 'label' | 'description' | 'icon'>
> = {
  shop: {
    type: 'shop',
    label: 'TIENDA',
    description: 'Compra mejoras con run coins',
    icon: '$',
  },
  event: {
    type: 'event',
    label: 'EVENTO',
    description: 'Decision con riesgo o recompensa',
    icon: '?',
  },
  treasure: {
    type: 'treasure',
    label: 'TESORO',
    description: 'Elige una reliquia',
    icon: '*',
  },
  elite: {
    type: 'elite',
    label: 'ELITE',
    description: 'Combate duro: +1 tier de dificultad',
    icon: '!',
  },
  rest: {
    type: 'rest',
    label: 'DESCANSO',
    description: 'Recupera 1 vida si hay hueco',
    icon: '+',
  },
  boss: {
    type: 'boss',
    label: 'JEFE',
    description: 'Enfrenta al villano del tramo',
    icon: 'X',
  },
};

function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function shuffle<T>(items: T[], rand: () => number): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Genera 3 salas elegibles tras completar un piso de combate. */
export function generateMapOptions(
  floor: number,
  runSeed: number,
): MapRoomOption[] {
  const rand = seededRandom((runSeed + floor * 7919) >>> 0);
  const isBossFloor = floor % BOSS_EVERY_N_FLOORS === 0;

  const fillers: MapRoomType[] = ['shop', 'event', 'treasure', 'elite', 'rest'];
  const shuffledFillers = shuffle(fillers, rand);

  const picked: MapRoomType[] = isBossFloor ? ['boss'] : [];

  for (const type of shuffledFillers) {
    if (picked.length >= 3) break;
    if (!picked.includes(type)) picked.push(type);
  }

  while (picked.length < 3) {
    const fallback = shuffledFillers[picked.length % shuffledFillers.length];
    picked.push(fallback);
  }

  return shuffle(picked.slice(0, 3), rand).map((type, index) => ({
    id: `map-${floor}-${type}-${index}`,
    ...ROOM_META[type],
  }));
}
