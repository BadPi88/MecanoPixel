export type PerkId =
  | 'shield'
  | 'extra_life'
  | 'combo_safe'
  | 'safety_net'
  | 'double_score'
  | 'golden_streak'
  | 'snipe'
  | 'breath'
  | 'freeze'
  | 'broken_clock'
  | 'purge'
  | 'radar';

export type PerkCategory = 'defense' | 'score' | 'tempo' | 'utility';
export type PerkRarity = 'common' | 'uncommon';

export interface PerkDefinition {
  id: PerkId;
  name: string;
  description: string;
  category: PerkCategory;
  rarity: PerkRarity;
}

export interface ActivePerk {
  id: PerkId;
  /** Tiempo de juego (elapsedMs) en que expira; solo perks con duracion. */
  expiresAtMs?: number;
  /** Usos restantes; perks consumibles. */
  charges?: number;
}

export const MAX_ACTIVE_PERKS = 4;
export const MAX_LIVES = 5;
