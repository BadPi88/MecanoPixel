import { getPerkDefinition } from '../data/perks';
import type { ActivePerk } from '../types/perks';

interface PerkBarProps {
  activePerks: ActivePerk[];
  elapsedMs: number;
}

export function PerkBar({ activePerks, elapsedMs }: PerkBarProps) {
  if (activePerks.length === 0) return null;

  return (
    <div className="perk-bar" aria-label="Perks activos">
      {activePerks.map((perk) => {
        const def = getPerkDefinition(perk.id);
        let status = '';
        if (perk.charges !== undefined) {
          status = `x${perk.charges}`;
        } else if (perk.expiresAtMs !== undefined) {
          const left = Math.max(0, perk.expiresAtMs - elapsedMs);
          status = `${Math.ceil(left / 1000)}s`;
        } else {
          status = 'ON';
        }

        return (
          <span
            key={perk.id}
            className={`perk-bar__chip perk-bar__chip--${def.category}`}
            title={def.description}
          >
            <span className="perk-bar__name">{def.name}</span>
            <span className="perk-bar__status">{status}</span>
          </span>
        );
      })}
    </div>
  );
}
