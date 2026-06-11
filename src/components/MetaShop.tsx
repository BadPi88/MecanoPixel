import { useState } from 'react';
import { RunnerSprite } from '../assets/runnerSprites';
import { RUNNER_CATALOG, UNLOCK_STAT_LABELS } from '../data/runners';
import {
  loadMeta,
  META_UNLOCKS,
  unlockGlossary,
  type MetaProgress,
  type MetaUnlockEntry,
} from '../services/meta';
import { PixelButton } from './PixelButton';

interface MetaShopProps {
  onMetaChange?: (meta: MetaProgress) => void;
}

export function MetaShop({ onMetaChange }: MetaShopProps) {
  const [meta, setMeta] = useState(loadMeta);

  const handleUnlock = (entry: MetaUnlockEntry) => {
    const updated = unlockGlossary(entry.glossary, entry.cost);
    if (updated) {
      setMeta(updated);
      onMetaChange?.(updated);
    }
  };

  const milestoneRunners = Object.values(RUNNER_CATALOG).filter(
    (runner) => runner.unlock !== undefined,
  );

  return (
    <div className="meta-shop">
      <div className="meta-shop__header">
        <span className="meta-shop__coins">{meta.totalCoins} meta coins</span>
        <span className="meta-shop__stat">
          Mejor piso: {meta.stats.bestFloor || '—'}
        </span>
      </div>

      <h3 className="meta-shop__section-title">PERSONAJES — juega para desbloquear</h3>
      <ul className="meta-shop__list">
        {milestoneRunners.map((runner) => {
          const unlock = runner.unlock!;
          const owned = meta.unlockedRunners.includes(runner.id);
          const progress = Math.min(meta.stats[unlock.stat], unlock.threshold);
          return (
            <li key={runner.id} className="meta-shop__item pixel-panel">
              <RunnerSprite
                runnerId={runner.id}
                size={40}
                className={owned ? '' : 'runner-sprite--locked'}
              />
              <div className="meta-shop__item-info">
                <span className="meta-shop__item-name">
                  {runner.name}
                  <span className="meta-shop__item-kind"> [RUNNER]</span>
                </span>
                <span className="meta-shop__item-desc">
                  {runner.description}
                </span>
                {!owned && (
                  <span className="unlock-progress" aria-hidden="true">
                    <span
                      className="unlock-progress__fill"
                      style={{
                        width: `${(progress / unlock.threshold) * 100}%`,
                      }}
                    />
                  </span>
                )}
              </div>
              {owned ? (
                <span className="meta-shop__owned">DESBLOQUEADO</span>
              ) : (
                <span className="meta-shop__milestone">
                  {UNLOCK_STAT_LABELS[unlock.stat]}
                  <br />
                  {progress}/{unlock.threshold}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      <h3 className="meta-shop__section-title">GLOSARIOS — meta coins</h3>
      <ul className="meta-shop__list">
        {META_UNLOCKS.map((entry) => {
          const owned = meta.unlockedGlossaries.includes(entry.glossary);
          const canBuy = !owned && meta.totalCoins >= entry.cost;
          return (
            <li key={entry.glossary} className="meta-shop__item pixel-panel">
              <div className="meta-shop__item-info">
                <span className="meta-shop__item-name">
                  {entry.label}
                  <span className="meta-shop__item-kind"> [GLOSARIO]</span>
                </span>
                <span className="meta-shop__item-desc">{entry.description}</span>
              </div>
              {owned ? (
                <span className="meta-shop__owned">DESBLOQUEADO</span>
              ) : (
                <PixelButton
                  disabled={!canBuy}
                  onClick={() => handleUnlock(entry)}
                >
                  {entry.cost} coins
                </PixelButton>
              )}
            </li>
          );
        })}
      </ul>

      <div className="meta-shop__stats pixel-panel">
        <p>Runs: {meta.stats.runsPlayed}</p>
        <p>Palabras totales: {meta.stats.totalWords}</p>
      </div>
    </div>
  );
}
