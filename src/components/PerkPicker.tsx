import { getPerkDefinition } from '../data/perks';
import type { PerkId } from '../types/perks';
interface PerkPickerProps {
  choices: PerkId[];
  onSelect: (id: PerkId) => void;
}

const CATEGORY_CLASS: Record<string, string> = {
  defense: 'perk-card--defense',
  score: 'perk-card--score',
  tempo: 'perk-card--tempo',
  utility: 'perk-card--utility',
};

export function PerkPicker({ choices, onSelect }: PerkPickerProps) {
  return (
    <div className="perk-picker-overlay" role="dialog" aria-modal="true">
      <div className="perk-picker pixel-panel">
        <h2 className="perk-picker__title">¡MAS RAPIDO!</h2>
        <p className="perk-picker__subtitle">3 subidas de ritmo — elige un perk</p>
        <div className="perk-picker__grid">
          {choices.map((id, index) => {
            const perk = getPerkDefinition(id);
            return (
              <button
                key={id}
                type="button"
                className={`perk-card ${CATEGORY_CLASS[perk.category] ?? ''} perk-card--${perk.rarity}`}
                onClick={() => onSelect(id)}
              >
                <span className="perk-card__key">{index + 1}</span>
                <span className="perk-card__name">
                  {perk.name}
                  {perk.rarity === 'legendary' && (
                    <span className="perk-card__rarity"> ★</span>
                  )}
                </span>
                <span className="perk-card__desc">{perk.description}</span>
              </button>
            );
          })}
        </div>
        <p className="perk-picker__hint">Pulsa 1, 2 o 3</p>
      </div>
    </div>
  );
}
