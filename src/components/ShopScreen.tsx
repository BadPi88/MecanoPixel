import { getShopItem } from '../data/shop';
import type { ShopItemId } from '../types/run';
import { MAX_LIVES } from '../types/perks';
import { PixelButton } from './PixelButton';

interface ShopScreenProps {
  runCoins: number;
  lives: number;
  offers: ShopItemId[];
  onBuy: (itemId: ShopItemId) => void;
  onLeave: () => void;
  floor: number;
}

export function ShopScreen({
  runCoins,
  lives,
  offers,
  onBuy,
  onLeave,
  floor,
}: ShopScreenProps) {
  return (
    <div className="screen screen--shop">
      <h1 className="screen__title">TIENDA</h1>
      <p className="screen__subtitle">
        Piso {floor} completado — {runCoins} run coins
      </p>

      <div className="shop-grid">
        {offers.map((offerId) => {
          const item = getShopItem(offerId);
          if (!item) return null;
          const disabled =
            runCoins < item.price ||
            (item.id === 'heal' && lives >= MAX_LIVES) ||
            (item.id === 'random_perk' && lives < 1);
          return (
            <button
              key={item.id}
              type="button"
              className="shop-item pixel-panel"
              disabled={disabled}
              onClick={() => onBuy(item.id)}
            >
              <span className="shop-item__name">{item.name}</span>
              <span className="shop-item__desc">{item.description}</span>
              <span className="shop-item__price">{item.price} coins</span>
            </button>
          );
        })}
      </div>

      <PixelButton onClick={onLeave}>CONTINUAR</PixelButton>
    </div>
  );
}
