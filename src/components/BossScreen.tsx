import type { FallingWord } from '../types/game';
import type { BossAttackState } from '../types/combat';
import { useElementHeight } from '../hooks/useElementHeight';
import { FallingWord as FallingWordView } from './FallingWord';

interface BossScreenProps {
  bossWord: FallingWord;
  input: string;
  floor: number;
  areaRef: React.RefObject<HTMLDivElement | null>;
  bossAttack: BossAttackState | null;
  remapActive: boolean;
}

export function BossScreen({
  bossWord,
  input,
  floor,
  areaRef,
  bossAttack,
  remapActive,
}: BossScreenProps) {
  const groundHeight = useElementHeight(areaRef);
  const lowerInput = input.toLowerCase();
  const isPartialMatch =
    lowerInput.length > 0 && bossWord.text.startsWith(lowerInput);

  return (
    <div className="boss-overlay">
      <div className="boss-header">
        <h2 className="boss-header__title">JEFE — PISO {floor}</h2>
        <p className="boss-header__hint">
          Escribe la palabra antes de que toque el suelo
        </p>
        {bossAttack && (
          <div className="boss-header__attacks">
            {bossAttack.blind && (
              <span className="boss-header__attack">CEGUERA</span>
            )}
            {remapActive && (
              <span className="boss-header__attack boss-header__attack--remap">
                TECLAS A-Z / S-X INTERCAMBIADAS
              </span>
            )}
            {bossAttack.projectiles && (
              <span className="boss-header__attack">PROYECTILES</span>
            )}
          </div>
        )}
      </div>
      <div className="boss-area">
        <FallingWordView
          word={bossWord}
          groundHeight={groundHeight}
          isPartialMatch={isPartialMatch}
          isPopping={false}
          onPopEnd={() => {}}
        />
      </div>
    </div>
  );
}
