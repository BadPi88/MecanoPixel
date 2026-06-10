export type WordKind = 'normal' | 'trap' | 'bomb' | 'bonus';

export type RunnerId =
  | 'veloz'
  | 'tanque'
  | 'codificador'
  | 'fantasma'
  | 'magnate';

export type DeathCause =
  | 'ground'
  | 'bomb'
  | 'boss'
  | 'event'
  | null;

export type ShopItemId = 'heal' | 'random_perk' | 'purge_all' | 'double_buff';

export type EventId =
  | 'speed_for_coins'
  | 'life_for_perk'
  | 'no_traps'
  | 'nothing';
