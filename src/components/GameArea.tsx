import type { RefObject } from 'react';
import type { FallingWord as FallingWordType } from '../types/game';
import { FallingWord } from './FallingWord';

interface GameAreaProps {
  areaRef: RefObject<HTMLDivElement | null>;
  words: FallingWordType[];
  input: string;
  poppingWordId: string | null;
  onPopEnd: () => void;
}

export function GameArea({
  areaRef,
  words,
  input,
  poppingWordId,
  onPopEnd,
}: GameAreaProps) {
  const groundHeight = areaRef.current?.clientHeight ?? 500;
  const lowerInput = input.toLowerCase();

  return (
    <div className="game-area" ref={areaRef}>
      {words.map((word) => {
        const isPartialMatch =
          lowerInput.length > 0 && word.text.startsWith(lowerInput);
        return (
          <FallingWord
            key={word.id}
            word={word}
            groundHeight={groundHeight}
            isPartialMatch={isPartialMatch}
            isPopping={poppingWordId === word.id}
            onPopEnd={onPopEnd}
          />
        );
      })}
      <div className="game-area__ground" aria-hidden="true">
        <div className="game-area__ground-bricks" />
      </div>
    </div>
  );
}
