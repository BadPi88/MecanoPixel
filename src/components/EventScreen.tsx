import type { EventDefinition } from '../data/events';
import { PixelButton } from './PixelButton';

interface EventScreenProps {
  event: EventDefinition;
  floor: number;
  onChoice: (choice: 'A' | 'B') => void;
}

export function EventScreen({ event, floor, onChoice }: EventScreenProps) {
  return (
    <div className="screen screen--event">
      <h1 className="screen__title">EVENTO</h1>
      <p className="screen__subtitle">Piso {floor}</p>

      <div className="event-panel pixel-panel">
        <h2 className="event-panel__title">{event.title}</h2>
        <p className="event-panel__desc">{event.description}</p>
        <div className="event-panel__choices">
          <PixelButton onClick={() => onChoice('A')}>
            A — {event.optionA}
          </PixelButton>
          <PixelButton variant="secondary" onClick={() => onChoice('B')}>
            B — {event.optionB}
          </PixelButton>
        </div>
      </div>
    </div>
  );
}
