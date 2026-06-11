import { useState } from 'react';
import { RunnerSprite } from '../assets/runnerSprites';
import { RELIC_CATALOG } from '../data/relics';
import {
  COSMETIC_UNLOCKS,
  HUB_UPGRADES,
  RELIC_UNLOCKS,
} from '../data/metaUnlocks';
import { RUNNER_CATALOG, UNLOCK_STAT_LABELS } from '../data/runners';
import {
  loadMeta,
  purchaseCosmetic,
  purchaseHubUpgrade,
  unlockRelicMeta,
  type MetaProgress,
} from '../services/meta';
import { PixelButton } from './PixelButton';

interface MetaShopProps {
  onMetaChange?: (meta: MetaProgress) => void;
}

export function MetaShop({ onMetaChange }: MetaShopProps) {
  const [meta, setMeta] = useState(loadMeta);

  const refresh = (updated: MetaProgress | null) => {
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
                <span className="meta-shop__item-desc">{runner.description}</span>
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

      <h3 className="meta-shop__section-title">RELIQUIAS — meta coins</h3>
      <ul className="meta-shop__list">
        {RELIC_UNLOCKS.map((entry) => {
          const owned = meta.unlockedRelics.includes(entry.relicId);
          const def = RELIC_CATALOG[entry.relicId];
          return (
            <li key={entry.relicId} className="meta-shop__item pixel-panel">
              <div className="meta-shop__item-info">
                <span className="meta-shop__item-name">{entry.label}</span>
                <span className="meta-shop__item-desc">{def.description}</span>
              </div>
              {owned ? (
                <span className="meta-shop__owned">DESBLOQUEADO</span>
              ) : (
                <PixelButton
                  disabled={meta.totalCoins < entry.cost}
                  onClick={() =>
                    refresh(unlockRelicMeta(entry.relicId, entry.cost))
                  }
                >
                  {entry.cost} coins
                </PixelButton>
              )}
            </li>
          );
        })}
      </ul>

      <h3 className="meta-shop__section-title">COSMETICOS</h3>
      <ul className="meta-shop__list">
        {COSMETIC_UNLOCKS.map((entry) => {
          const list =
            entry.kind === 'palette'
              ? meta.cosmetics.unlockedPalettes
              : entry.kind === 'trail'
                ? meta.cosmetics.unlockedTrails
                : meta.cosmetics.unlockedFrames;
          const owned = list.includes(entry.value as never);
          return (
            <li key={entry.id} className="meta-shop__item pixel-panel">
              <div className="meta-shop__item-info">
                <span className="meta-shop__item-name">{entry.label}</span>
                <span className="meta-shop__item-desc">{entry.description}</span>
              </div>
              <PixelButton
                disabled={!owned && meta.totalCoins < entry.cost}
                onClick={() =>
                  refresh(
                    purchaseCosmetic(entry.kind, entry.value, entry.cost),
                  )
                }
              >
                {owned ? 'EQUIPADO' : `${entry.cost} coins`}
              </PixelButton>
            </li>
          );
        })}
      </ul>

      <h3 className="meta-shop__section-title">MEJORAS HUB</h3>
      <ul className="meta-shop__list">
        {HUB_UPGRADES.map((entry) => {
          const owned = meta.hubUpgrades[entry.id];
          return (
            <li key={entry.id} className="meta-shop__item pixel-panel">
              <div className="meta-shop__item-info">
                <span className="meta-shop__item-name">{entry.label}</span>
                <span className="meta-shop__item-desc">{entry.description}</span>
              </div>
              {owned ? (
                <span className="meta-shop__owned">ACTIVO</span>
              ) : (
                <PixelButton
                  disabled={meta.totalCoins < entry.cost}
                  onClick={() =>
                    refresh(purchaseHubUpgrade(entry.id, entry.cost))
                  }
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
        {meta.ascensionUnlocked && (
          <p>Ascension max: {meta.maxAscension}</p>
        )}
      </div>
    </div>
  );
}
