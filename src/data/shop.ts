import type { ShopItemId } from '../types/run';
import { createSeededRandom } from '../utils/random';

export interface ShopItem {
  id: ShopItemId;
  name: string;
  description: string;
  price: number;
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'heal',
    name: 'CURACION',
    description: '+1 vida',
    price: 80,
  },
  {
    id: 'random_perk',
    name: 'PERK ALEATORIO',
    description: 'Perk comun gratis',
    price: 120,
  },
  {
    id: 'purge_all',
    name: 'PURGA TOTAL',
    description: 'Borra todas las palabras',
    price: 60,
  },
  {
    id: 'double_buff',
    name: 'BUFF x2',
    description: 'Doble score 20 s',
    price: 100,
  },
  {
    id: 'reroll_relic',
    name: 'REROLL RELIQUIA',
    description: 'Regenera la proxima eleccion de reliquia',
    price: 90,
  },
  {
    id: 'run_shield',
    name: 'ESCUDO DE RUN',
    description: '+3 cargas anti-trampa',
    price: 70,
  },
  {
    id: 'freeze_floor',
    name: 'CONGELAR PISO',
    description: '3 s sin caida al empezar el piso',
    price: 85,
  },
  {
    id: 'coin_boost',
    name: 'MONEDAS x1.5',
    description: '+50% run coins en el proximo piso',
    price: 110,
  },
  {
    id: 'tier_calm',
    name: 'CALMA',
    description: '-1 nivel de ritmo permanente',
    price: 95,
  },
  {
    id: 'speed_trade',
    name: 'APUESTA RAPIDA',
    description: '+80 coins y +1 nivel de ritmo',
    price: 50,
  },
];

/** Elige 4 ofertas distintas deterministas por piso y semilla. */
export function pickShopOffers(floor: number, seed: number): ShopItemId[] {
  const rng = createSeededRandom(floor * 10_007 + seed);
  const pool = [...SHOP_ITEMS];
  const offers: ShopItemId[] = [];
  const count = Math.min(4, pool.length);

  while (offers.length < count && pool.length > 0) {
    const idx = Math.floor(rng() * pool.length);
    offers.push(pool[idx].id);
    pool.splice(idx, 1);
  }

  return offers;
}

export function getShopItem(id: ShopItemId): ShopItem | undefined {
  return SHOP_ITEMS.find((i) => i.id === id);
}
