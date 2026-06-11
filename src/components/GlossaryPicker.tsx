import { GLOSSARY_CATALOG } from '../data/glossaries';
import { loadMeta } from '../services/meta';
import type { GlossaryId } from '../types/combat';
import { PixelButton } from './PixelButton';

interface GlossaryPickerProps {
  onSelect: (glossaryId: GlossaryId) => void;
  onBack: () => void;
}

export function GlossaryPicker({ onSelect, onBack }: GlossaryPickerProps) {
  const meta = loadMeta();
  const glossaries = Object.values(GLOSSARY_CATALOG);

  return (
    <div className="screen screen--glossary-pick">
      <h1 className="screen__title">ELIGE GLOSARIO</h1>
      <p className="screen__subtitle">El diccionario define tu elemento</p>

      <div className="runner-grid">
        {glossaries.map((glossary) => {
          const unlocked = meta.unlockedGlossaries.includes(glossary.id);
          return (
            <button
              key={glossary.id}
              type="button"
              className={`glossary-card runner-card pixel-panel ${
                unlocked ? '' : 'runner-card--locked'
              }`}
              disabled={!unlocked}
              onClick={() => onSelect(glossary.id)}
            >
              <span className="runner-card__name">{glossary.name}</span>
              <span className="runner-card__desc">{glossary.description}</span>
              {!unlocked && (
                <span className="runner-card__lock">
                  {glossary.metaCost} meta coins
                </span>
              )}
            </button>
          );
        })}
      </div>

      <PixelButton variant="secondary" onClick={onBack}>
        VOLVER
      </PixelButton>
    </div>
  );
}
