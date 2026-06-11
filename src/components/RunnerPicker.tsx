import { RunnerSprite } from '../assets/runnerSprites';
import { RUNNER_CATALOG, UNLOCK_STAT_LABELS } from '../data/runners';
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
          const unlock = runner.unlock;
          const progress = unlock
            ? Math.min(meta.stats[unlock.stat], unlock.threshold)
            : 0;
          return (
            <button
              key={runner.id}
              type="button"
              className={`runner-card pixel-panel ${unlocked ? '' : 'runner-card--locked'}`}
              disabled={!unlocked}
              onClick={() => onSelect(runner.id)}
            >
              <RunnerSprite
                runnerId={runner.id}
                size={56}
                className={`runner-card__sprite ${
                  unlocked ? '' : 'runner-sprite--locked'
                }`}
              />
              <span className="runner-card__name">{runner.name}</span>
              <span className="runner-card__desc">{runner.description}</span>
              {!unlocked && unlock && (
                <span className="runner-card__lock">
                  <span className="runner-card__lock-label">
                    {UNLOCK_STAT_LABELS[unlock.stat]} {progress}/
                    {unlock.threshold}
                  </span>
                  <span className="unlock-progress" aria-hidden="true">
                    <span
                      className="unlock-progress__fill"
                      style={{
                        width: `${(progress / unlock.threshold) * 100}%`,
                      }}
                    />
                  </span>
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
