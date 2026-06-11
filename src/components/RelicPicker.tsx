import { getRelicDefinition } from '../data/relics';
import type { RelicId } from '../types/combat';
import type { GameState } from '../types/game';
import {
  previewSynergiesIfRelic,
  SYNERGY_CATALOG,
} from '../utils/synergyEngine';

interface RelicPickerProps {
  choices: RelicId[];
  state: GameState;
  onSelect: (id: RelicId) => void;
}

export function RelicPicker({ choices, state, onSelect }: RelicPickerProps) {
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
            const previewSynergies = previewSynergiesIfRelic(state, id);
            return (
              <button
                key={id}
                type="button"
                className={`perk-card relic-card ${relic.cursed ? 'relic-card--cursed' : ''}`}
                onClick={() => onSelect(id)}
              >
                <span className="perk-card__key">{index + 1}</span>
                <span className="perk-card__name">{relic.name}</span>
                <span className="relic-card__archetype">
                  {relic.cursed ? 'MALDITA — ' : ''}
                  {relic.archetype}
                </span>
                <span className="perk-card__desc">{relic.description}</span>
                {previewSynergies.length > 0 && (
                  <span className="relic-card__synergies">
                    {previewSynergies.map((synId) => (
                      <span key={synId} className="relic-card__synergy-chip">
                        {SYNERGY_CATALOG[synId].name}
                      </span>
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <p className="perk-picker__hint">
          Pulsa {choices.map((_, i) => i + 1).join(', ')}
        </p>
      </div>
    </div>
  );
}
