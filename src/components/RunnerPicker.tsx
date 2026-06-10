import { RUNNER_CATALOG } from '../data/runners';
import { loadMeta } from '../services/meta';
import type { RunnerId } from '../types/run';
import { PixelButton } from './PixelButton';

interface RunnerPickerProps {
  onSelect: (runnerId: RunnerId) => void;
  onBack: () => void;
}

export function RunnerPicker({ onSelect, onBack }: RunnerPickerProps) {
  const meta = loadMeta();
  const runners = Object.values(RUNNER_CATALOG);

  return (
    <div className="screen screen--runner-pick">
      <h1 className="screen__title">ELIGE RUNNER</h1>
      <p className="screen__subtitle">Cada uno cambia tu estilo de run</p>

      <div className="runner-grid">
        {runners.map((runner) => {
          const unlocked = meta.unlockedRunners.includes(runner.id);
          return (
            <button
              key={runner.id}
              type="button"
              className={`runner-card pixel-panel ${unlocked ? '' : 'runner-card--locked'}`}
              disabled={!unlocked}
              onClick={() => onSelect(runner.id)}
            >
              <span className="runner-card__name">{runner.name}</span>
              <span className="runner-card__desc">{runner.description}</span>
              {!unlocked && runner.metaCost && (
                <span className="runner-card__lock">
                  {runner.metaCost} meta coins
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
