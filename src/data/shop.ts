import type { ShopItemId } from '../types/run';

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
];
