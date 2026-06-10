import { SHOP_ITEMS } from '../data/shop';
import type { ShopItemId } from '../types/run';
import { PixelButton } from './PixelButton';

interface ShopScreenProps {
  runCoins: number;
  lives: number;
  onBuy: (itemId: ShopItemId) => void;
  onLeave: () => void;
  floor: number;
}

export function ShopScreen({
  runCoins,
  lives,
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
        {SHOP_ITEMS.map((item) => {
          const disabled =
            runCoins < item.price || (item.id === 'heal' && lives >= 5);
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
