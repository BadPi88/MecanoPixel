import type { FallingWord } from '../types/game';
import { FallingWord as FallingWordView } from './FallingWord';

interface BossScreenProps {
  bossWord: FallingWord;
  input: string;
  floor: number;
  areaRef: React.RefObject<HTMLDivElement | null>;
}

export function BossScreen({ bossWord, input, floor, areaRef }: BossScreenProps) {
  const groundHeight = areaRef.current?.clientHeight ?? 500;
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
