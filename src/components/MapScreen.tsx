import type { ActMapGraph, MapRoomOption } from '../data/mapRooms';
import { getActMapDisplayNodes } from '../data/mapRooms';

interface MapScreenProps {
  floor: number;
  options: MapRoomOption[];
  actMap: ActMapGraph | null;
  actMapNodeId: string | null;
  bossSkippedPending: boolean;
  onPick: (roomId: string) => void;
}

export function MapScreen({
  floor,
  options,
  actMap,
  actMapNodeId,
  bossSkippedPending,
  onPick,
}: MapScreenProps) {
  const treeNodes = actMap
    ? getActMapDisplayNodes(actMap, actMapNodeId, floor)
    : options;

  return (
    <div className="screen screen--map">
      <h1 className="screen__title">MAPA</h1>
      <p className="screen__subtitle">
        Piso {floor} completado — elige tu ruta
      </p>

      {bossSkippedPending && (
        <p className="map-warning pixel-panel">
          JEFE OBLIGATORIO — evitaste al villano
        </p>
      )}

      {actMap && (
        <div className="map-tree" aria-hidden>
          {[1, 2, 3, 4].map((layer) => (
            <div key={layer} className="map-tree__row">
              {treeNodes
                .filter((n) => n.layer === layer)
                .map((node) => (
                  <span
                    key={node.nodeId}
                    className={`map-tree__node map-tree__node--${node.type}${
                      node.previewHidden ? ' map-tree__node--hidden' : ''
                    }${
                      actMapNodeId === node.nodeId
                        ? ' map-tree__node--current'
                        : ''
                    }`}
                  >
                    {node.previewHidden ? '?' : node.icon}
                  </span>
                ))}
            </div>
          ))}
          <div className="map-tree__row">
            <span className="map-tree__node map-tree__node--boss">X</span>
          </div>
        </div>
      )}

      <div className="map-grid" role="list">
        {options.map((room, index) => (
          <button
            key={room.id}
            type="button"
            className={`map-room map-room--${room.type} pixel-panel`}
            onClick={() => onPick(room.id)}
            role="listitem"
          >
            <span className="map-room__key">{index + 1}</span>
            <span className="map-room__icon" aria-hidden>
              {room.previewHidden ? '?' : room.icon}
            </span>
            <span className="map-room__label">
              {room.previewHidden ? '???' : room.label}
            </span>
            <span className="map-room__desc">{room.description}</span>
          </button>
        ))}
      </div>

      <p className="map-hint">Pulsa 1, 2, 3 o 4 para elegir</p>
    </div>
  );
}
