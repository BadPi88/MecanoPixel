export type EliteModifierId = 'fog' | 'storm' | 'cascade';

export interface EliteModifierDef {
  id: EliteModifierId;
  label: string;
  description: string;
}

export const ELITE_MODIFIER_CATALOG: Record<EliteModifierId, EliteModifierDef> = {
  fog: {
    id: 'fog',
    label: 'NIEBLA',
    description: 'Ceguera 1.5s cada 8s',
  },
  storm: {
    id: 'storm',
    label: 'TORMENTA',
    description: 'Spawn x1.2 y +1 tier',
  },
  cascade: {
    id: 'cascade',
    label: 'CASCADA',
    description: 'Solo palabras de 5 letras o menos',
  },
};

export const ELITE_COIN_MULT = 1.5;

export const ELITE_FOG_INTERVAL_MS = 8_000;
export const ELITE_FOG_DURATION_MS = 1_500;
