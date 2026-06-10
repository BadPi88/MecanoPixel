import { useState } from 'react';
import {
  loadMeta,
  META_UNLOCKS,
  unlockRunner,
  type MetaProgress,
} from '../services/meta';
import type { RunnerId } from '../types/run';
import { PixelButton } from './PixelButton';

interface MetaShopProps {
  onMetaChange?: (meta: MetaProgress) => void;
}

export function MetaShop({ onMetaChange }: MetaShopProps) {
  const [meta, setMeta] = useState(loadMeta);

  const handleUnlock = (runnerId: RunnerId, cost: number) => {
    const updated = unlockRunner(runnerId, cost);
    if (updated) {
      setMeta(updated);
      onMetaChange?.(updated);
    }
  };

  return (
    <div className="meta-shop">
      <div className="meta-shop__header">
        <span className="meta-shop__coins">{meta.totalCoins} meta coins</span>
        <span className="meta-shop__stat">
          Mejor piso: {meta.stats.bestFloor || '—'}
        </span>
      </div>

      <ul className="meta-shop__list">
        {META_UNLOCKS.map((unlock) => {
          const id = unlock.runner!;
          const owned = meta.unlockedRunners.includes(id);
          const canBuy = !owned && meta.totalCoins >= unlock.cost;
          return (
            <li key={id} className="meta-shop__item pixel-panel">
              <div className="meta-shop__item-info">
                <span className="meta-shop__item-name">{unlock.label}</span>
                <span className="meta-shop__item-desc">{unlock.description}</span>
              </div>
              {owned ? (
                <span className="meta-shop__owned">DESBLOQUEADO</span>
              ) : (
                <PixelButton
                  disabled={!canBuy}
                  onClick={() => handleUnlock(id, unlock.cost)}
                >
                  {unlock.cost} coins
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
