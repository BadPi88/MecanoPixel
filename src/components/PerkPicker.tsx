import { useRef } from 'react';
import { getPerkDefinition } from '../data/perks';
import type { PerkId } from '../types/perks';
import { useDialogFocus } from '../hooks/useDialogFocus';
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
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(dialogRef);
  return (
    <div className="perk-picker-overlay" role="dialog" aria-modal="true" aria-labelledby="perk-picker-title" ref={dialogRef}>
      <div className="perk-picker pixel-panel">
        <h2 className="perk-picker__title" id="perk-picker-title">¡MAS RAPIDO!</h2>
        <p className="perk-picker__subtitle">3 subidas de ritmo — elige un perk</p>
        <div className="perk-picker__grid">
          {choices.map((id) => {
            const perk = getPerkDefinition(id);
            return (
              <button
                key={id}
                type="button"
                className={`perk-card ${CATEGORY_CLASS[perk.category] ?? ''} perk-card--${perk.rarity}`}
                onClick={() => onSelect(id)}
              >
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
        <p className="perk-picker__hint">Usa Tab para recorrer las opciones y Enter para elegir, o haz clic.</p>
      </div>
    </div>
  );
}
