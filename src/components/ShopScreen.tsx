import { getShopItem } from '../data/shop';
import type { ShopItemId } from '../types/run';
import { MAX_LIVES } from '../types/perks';
import { PixelButton } from './PixelButton';
import { RELIC_CATALOG } from '../data/relics';
import type { RelicId, WordPOS } from '../types/combat';

interface ShopScreenProps {
  runCoins: number;
  lives: number;
  offers: ShopItemId[];
  onBuy: (itemId: ShopItemId) => void;
  onLeave: () => void;
  floor: number;
  activeRelics: RelicId[];
  rerollCount: number;
  glossaryLevels: Record<WordPOS, number>;
  onReroll: () => void;
  onSellRelic: (id: RelicId) => void;
  onUpgradeGlossary: (pos: WordPOS) => void;
}

export function ShopScreen({
  runCoins,
  lives,
  offers,
  onBuy,
  onLeave,
  floor,
  activeRelics,
  rerollCount,
  glossaryLevels,
  onReroll,
  onSellRelic,
  onUpgradeGlossary,
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

      <section className="shop-choices pixel-panel" aria-label="Servicios de tienda">
        <h2 className="screen__panel-title">SERVICIOS</h2>
        <PixelButton variant="secondary" disabled={runCoins < [50, 75, 100][Math.min(rerollCount, 2)]} onClick={onReroll}>
          CAMBIAR OFERTAS · {[50, 75, 100][Math.min(rerollCount, 2)]} COINS
        </PixelButton>
        <div className="shop-choices__upgrades">
          {(['verb', 'adj', 'noun'] as const).map((pos) => (
            <PixelButton key={pos} variant="secondary" disabled={glossaryLevels[pos] >= 3 || runCoins < 100 + glossaryLevels[pos] * 75} onClick={() => onUpgradeGlossary(pos)}>
              MEJORAR {pos === 'verb' ? 'VERBOS' : pos === 'adj' ? 'ADJETIVOS' : 'SUSTANTIVOS'} · NIV {glossaryLevels[pos]} · {100 + glossaryLevels[pos] * 75}
            </PixelButton>
          ))}
        </div>
        {activeRelics.length > 0 && (
          <div className="shop-choices__relics">
            <p className="shop-item__desc">Sacrifica una reliquia para liberar espacio y recibir 40 coins.</p>
            {activeRelics.map((id) => (
              <PixelButton key={id} variant="secondary" onClick={() => onSellRelic(id)}>
                SACRIFICAR {RELIC_CATALOG[id].name} · +40
              </PixelButton>
            ))}
          </div>
        )}
      </section>

      <PixelButton onClick={onLeave}>CONTINUAR</PixelButton>
    </div>
  );
}
