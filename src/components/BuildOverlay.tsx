import { BIOME_CATALOG, type BiomeId } from '../data/biomes';
import { ASCENSION_LEVELS } from '../data/ascension';
import {
  ELITE_MODIFIER_CATALOG,
  type EliteModifierId,
} from '../data/eliteModifiers';
import { PERK_CATALOG } from '../data/perks';
import { RELIC_CATALOG } from '../data/relics';
import type { RelicId } from '../types/combat';
import type { ActivePerk, PerkId } from '../types/perks';
import { SYNERGY_CATALOG, type SynergyId } from '../utils/synergyEngine';
import { PixelButton } from './PixelButton';

interface BuildOverlayProps {
  activeRelics: RelicId[];
  activePerks: ActivePerk[];
  perksHistory: PerkId[];
  synergyIds: SynergyId[];
  biomeId: BiomeId;
  eliteModifierId: EliteModifierId | null;
  ascensionLevel: number;
  bossSkippedPending: boolean;
  onClose: () => void;
}

export function BuildOverlay({
  activeRelics,
  activePerks,
  perksHistory,
  synergyIds,
  biomeId,
  eliteModifierId,
  ascensionLevel,
  bossSkippedPending,
  onClose,
}: BuildOverlayProps) {
  return (
    <div className="build-overlay" role="dialog" aria-modal="true">
      <div className="build-overlay__panel pixel-panel">
        <h2 className="build-overlay__title">TU BUILD</h2>

        <section className="build-overlay__section">
          <h3>RELIQUIAS</h3>
          {activeRelics.length === 0 ? (
            <p className="build-overlay__empty">Ninguna</p>
          ) : (
            <ul>
              {activeRelics.map((id) => (
                <li key={id}>
                  <strong>{RELIC_CATALOG[id].name}</strong> —{' '}
                  {RELIC_CATALOG[id].description}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="build-overlay__section">
          <h3>PERKS ACTIVOS</h3>
          <ul>
            {activePerks.map((p) => (
              <li key={p.id}>{PERK_CATALOG[p.id].name}</li>
            ))}
          </ul>
          {perksHistory.length > 0 && (
            <p className="build-overlay__history">
              Historial:{' '}
              {perksHistory.map((id) => PERK_CATALOG[id].name).join(', ')}
            </p>
          )}
        </section>

        {synergyIds.length > 0 && (
          <section className="build-overlay__section">
            <h3>SINERGIAS</h3>
            <ul>
              {synergyIds.map((id) => (
                <li key={id}>{SYNERGY_CATALOG[id].name}</li>
              ))}
            </ul>
          </section>
        )}

        <section className="build-overlay__section">
          <h3>MODIFICADORES</h3>
          <ul>
            <li>Zona: {BIOME_CATALOG[biomeId].name}</li>
            {eliteModifierId && (
              <li>Elite: {ELITE_MODIFIER_CATALOG[eliteModifierId].label}</li>
            )}
            {ascensionLevel > 0 && (
              <li>
                {ASCENSION_LEVELS[ascensionLevel]?.label ??
                  `ASC ${ascensionLevel}`}
              </li>
            )}
            {bossSkippedPending && (
              <li className="build-overlay__warn">Jefe evitado (debuff)</li>
            )}
          </ul>
        </section>

        <PixelButton onClick={onClose}>CERRAR (I)</PixelButton>
      </div>
    </div>
  );
}
