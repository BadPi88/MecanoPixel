import type { EliteModifierId } from './eliteModifiers';
import { FLOORS_PER_BIOME } from './biomes';
import { createSeededRandom } from '../utils/random';

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
  layer: number;
  eliteModifier?: EliteModifierId;
  previewHidden?: boolean;
  /** Nodo del arbol al que corresponde esta opcion. */
  nodeId: string;
}

export interface ActMapNode {
  id: string;
  layer: number;
  type: MapRoomType;
  children: string[];
  parentId: string | null;
  eliteModifier?: EliteModifierId;
  previewHidden: boolean;
}

export interface ActMapGraph {
  actIndex: number;
  nodes: ActMapNode[];
  startNodeId: string;
  bossNodeId: string;
}

const ROOM_META: Record<
  MapRoomType,
  Pick<MapRoomOption, 'type' | 'label' | 'description' | 'icon'>
> = {
  shop: {
    type: 'shop',
    label: 'TIENDA',
    description: 'Compra una mejora; el precio se muestra antes de entrar',
    icon: '$',
  },
  event: {
    type: 'event',
    label: 'EVENTO',
    description: 'Evento: compara sus dos efectos antes de elegir',
    icon: '?',
  },
  treasure: {
    type: 'treasure',
    label: 'TESORO',
    description: 'Elige 1 reliquia para cambiar tu build',
    icon: '*',
  },
  elite: {
    type: 'elite',
    label: 'ELITE',
    description: 'Combate de riesgo alto; +50% monedas y modificador',
    icon: '!',
  },
  rest: {
    type: 'rest',
    label: 'DESCANSO',
    description: 'Recupera 1 vida si no estas al maximo',
    icon: '+',
  },
  boss: {
    type: 'boss',
    label: 'JEFE',
    description: 'Jefe obligatorio del acto; gran recompensa',
    icon: 'X',
  },
};

const ELITE_MODIFIERS: EliteModifierId[] = ['fog', 'storm', 'cascade'];

function pickOne<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

export function getActIndexForFloor(floor: number): number {
  return Math.floor((Math.max(floor, 1) - 1) / FLOORS_PER_BIOME);
}

/** Genera un arbol ramificado de 5 capas por acto (capas 0-3 salas, capa 4 jefe). */
export function generateActMap(actIndex: number, runSeed: number): ActMapGraph {
  const rand = createSeededRandom((runSeed + actIndex * 9973) >>> 0);
  const nodes: ActMapNode[] = [];
  const fillerTypes: MapRoomType[] = [
    'shop',
    'event',
    'treasure',
    'elite',
    'rest',
  ];

  const startId = `act${actIndex}-L0`;
  nodes.push({
    id: startId,
    layer: 0,
    type: 'rest',
    children: [],
    parentId: null,
    previewHidden: false,
  });

  let prevLayerIds = [startId];

  for (let layer = 1; layer <= 3; layer++) {
    const nextLayerIds: string[] = [];
    for (let parentIdx = 0; parentIdx < prevLayerIds.length; parentIdx++) {
      const parentId = prevLayerIds[parentIdx];
      const parent = nodes.find((n) => n.id === parentId)!;
      const siblingTypes =
        layer === 3
          ? ['elite', pickOne(fillerTypes.filter((type) => type !== 'elite'), rand)] as const
          : (() => {
              const first = pickOne(fillerTypes, rand);
              const second = pickOne(
                fillerTypes.filter((type) => type !== first),
                rand,
              );
              return [first, second] as const;
            })();

      for (let branch = 0; branch < 2; branch++) {
        const type = siblingTypes[branch];

        const nodeId = `act${actIndex}-L${layer}-${parentIdx}-${branch}`;
        const eliteModifier = type === 'elite'
          ? pickOne(ELITE_MODIFIERS, rand)
          : undefined;

        const previewHidden = layer >= 2;

        nodes.push({
          id: nodeId,
          layer,
          type,
          children: [],
          parentId,
          eliteModifier,
          previewHidden,
        });

        parent.children.push(nodeId);
        nextLayerIds.push(nodeId);
      }
    }

    prevLayerIds = nextLayerIds;
  }

  const bossId = `act${actIndex}-BOSS`;
  for (const id of prevLayerIds) {
    const parent = nodes.find((n) => n.id === id)!;
    parent.children.push(bossId);
  }

  nodes.push({
    id: bossId,
    layer: 4,
    type: 'boss',
    children: [],
    parentId: prevLayerIds[0],
    previewHidden: false,
  });

  return { actIndex, nodes, startNodeId: startId, bossNodeId: bossId };
}

export function nodeToOption(
  node: ActMapNode,
  floor: number,
  revealPreview: boolean,
): MapRoomOption {
  const meta = ROOM_META[node.type];
  let description = meta.description;
  if (node.type === 'elite' && node.eliteModifier) {
    description = `${meta.description} (${node.eliteModifier.toUpperCase()})`;
  }
  return {
    id: `map-${floor}-${node.id}`,
    nodeId: node.id,
    layer: node.layer,
    type: node.type,
    label: meta.label,
    description: node.previewHidden && !revealPreview
      ? 'Ruta oculta hasta llegar a esa bifurcacion'
      : description,
    icon: meta.icon,
    eliteModifier: node.eliteModifier,
    previewHidden: node.previewHidden && !revealPreview,
  };
}

export function getNodeById(
  graph: ActMapGraph,
  nodeId: string,
): ActMapNode | undefined {
  return graph.nodes.find((n) => n.id === nodeId);
}

export function getChildNodes(
  graph: ActMapGraph,
  nodeId: string,
): ActMapNode[] {
  const node = getNodeById(graph, nodeId);
  if (!node) return [];
  return node.children
    .map((id) => getNodeById(graph, id))
    .filter((n): n is ActMapNode => n !== undefined);
}

/** Opciones tras completar combate: hijos del nodo actual en el arbol. */
export function getMapChoicesFromAct(
  graph: ActMapGraph,
  currentNodeId: string | null,
  floor: number,
  bossSkippedPending: boolean,
  maxChoices: number,
): MapRoomOption[] {
  if (bossSkippedPending) {
    const boss = getNodeById(graph, graph.bossNodeId);
    if (boss) return [nodeToOption(boss, floor, true)];
  }

  const fromId = currentNodeId ?? graph.startNodeId;
  const children = getChildNodes(graph, fromId);

  if (children.length === 0) {
    const boss = getNodeById(graph, graph.bossNodeId);
    return boss ? [nodeToOption(boss, floor, true)] : [];
  }

  const isActEndFloor = floor % FLOORS_PER_BIOME === 0;
  let pool = children;

  if (isActEndFloor && !bossSkippedPending) {
    const boss = getNodeById(graph, graph.bossNodeId);
    const nonBoss = children.filter((c) => c.type !== 'boss');
    if (boss && nonBoss.length > 0) {
      pool = [...nonBoss.slice(0, maxChoices - 1), boss].slice(0, maxChoices);
    }
  }

  const reveal = !bossSkippedPending;
  return pool
    .slice(0, maxChoices)
    .map((n) => nodeToOption(n, floor, reveal));
}

/** Vista completa del arbol para la UI (con preview oculto a 2+ capas). */
export function getActMapDisplayNodes(
  graph: ActMapGraph,
  currentNodeId: string | null,
  floor: number,
): MapRoomOption[] {
  const currentLayer =
    currentNodeId !== null
      ? (getNodeById(graph, currentNodeId)?.layer ?? 0)
      : 0;

  return graph.nodes
    .filter((n) => n.layer > 0)
    .map((n) => {
      const layersAhead = n.layer - currentLayer;
      const hide = layersAhead >= 2;
      return nodeToOption(n, floor, !hide);
    });
}
