import { getRelicDefinition } from '../data/relics';
import type { RelicId } from '../types/combat';

interface RelicPickerProps {
  choices: RelicId[];
  onSelect: (id: RelicId) => void;
}

export function RelicPicker({ choices, onSelect }: RelicPickerProps) {
  return (
    <div className="perk-picker-overlay" role="dialog" aria-modal="true">
      <div className="perk-picker pixel-panel">
        <h2 className="perk-picker__title perk-picker__title--relic">
          RELIQUIA
        </h2>
        <p className="perk-picker__subtitle">
          Piso completado — elige una reliquia de build
        </p>
        <div className="perk-picker__grid">
          {choices.map((id, index) => {
            const relic = getRelicDefinition(id);
            return (
              <button
                key={id}
                type="button"
                className="perk-card relic-card"
                onClick={() => onSelect(id)}
              >
                <span className="perk-card__key">{index + 1}</span>
                <span className="perk-card__name">{relic.name}</span>
                <span className="relic-card__archetype">{relic.archetype}</span>
                <span className="perk-card__desc">{relic.description}</span>
              </button>
            );
          })}
        </div>
        <p className="perk-picker__hint">Pulsa 1, 2 o 3</p>
      </div>
    </div>
  );
}
