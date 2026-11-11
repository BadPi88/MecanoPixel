export type WordKind = 'normal' | 'trap' | 'bomb' | 'bonus' | 'oracle';

export type RunnerId =
  | 'veloz'
  | 'tanque'
  | 'codificador'
  | 'fantasma'
  | 'magnate'
  | 'centinela'
  | 'alquimista'
  | 'maestro';

export type DeathCause =
  | 'ground'
  | 'bomb'
  | 'boss'
  | 'event'
  | 'toxic'
  | 'projectile'
  | null;

export type ShopItemId =
  | 'heal'
  | 'random_perk'
  | 'purge_all'
  | 'double_buff'
  | 'reroll_relic'
  | 'run_shield'
  | 'freeze_floor'
  | 'coin_boost'
  | 'tier_calm'
  | 'speed_trade';

export type EventEffect =
  | 'speed_ramp'
  | 'coins_150'
  | 'coins_120'
  | 'coins_100'
  | 'coins_80'
  | 'coins_60'
  | 'coins_50'
  | 'coins_200'
  | 'lose_life_rare_perk'
  | 'lose_life'
  | 'no_traps_next'
  | 'nothing'
  | 'tier_up'
  | 'tier_up_coins_100'
  | 'tier_down'
  | 'heal_one'
  | 'trap_shield_3'
  | 'curse_perk'
  | 'combo_buff'
  | 'lose_coins_half'
  | 'coins_200_lose_life';

export type EventId =
  | 'speed_for_coins'
  | 'life_for_perk'
  | 'no_traps'
  | 'nothing'
  | 'duplicar_ritmo'
  | 'curandero'
  | 'escudo_trampas'
  | 'perk_maldito'
  | 'biblioteca'
  | 'mercader_oscuro'
  | 'combo_ofrenda'
  | 'reliquia_espejismo'
  | 'margen_roto'
  | 'tinta_dorada'
  | 'margen_protegido'
  | 'borrador_vivo'
  | 'eco_de_tinta'
  | 'pagina_inestable'
  | 'nota_deudora'
  | 'glosa_perdida';
