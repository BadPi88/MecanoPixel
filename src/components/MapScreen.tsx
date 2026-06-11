import type { MapRoomOption } from '../data/mapRooms';

interface MapScreenProps {
  floor: number;
  options: MapRoomOption[];
  onPick: (roomId: string) => void;
}

export function MapScreen({ floor, options, onPick }: MapScreenProps) {
  return (
    <div className="screen screen--map">
      <h1 className="screen__title">MAPA</h1>
      <p className="screen__subtitle">
        Piso {floor} completado — elige tu ruta
      </p>

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
              {room.icon}
            </span>
            <span className="map-room__label">{room.label}</span>
            <span className="map-room__desc">{room.description}</span>
          </button>
        ))}
      </div>

      <p className="map-hint">Pulsa 1, 2 o 3 para elegir</p>
    </div>
  );
}
