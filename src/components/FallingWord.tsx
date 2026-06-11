import { useEffect } from 'react';
import type { FallingWord as FallingWordType } from '../types/game';

interface FallingWordProps {
  word: FallingWordType;
  groundHeight: number;
  isPartialMatch: boolean;
  isRadarTarget?: boolean;
  isPopping: boolean;
  onPopEnd: () => void;
}

function getDangerLevel(y: number, groundHeight: number): 'safe' | 'warn' | 'danger' {
  const ratio = y / groundHeight;
  if (ratio < 0.5) return 'safe';
  if (ratio < 0.75) return 'warn';
  return 'danger';
}

/** Simbolo no dependiente de color para identificar el tipo de palabra. */
const KIND_SYMBOLS: Record<string, string> = {
  trap: '!',
  bomb: '*',
  bonus: '+',
};

const POS_SYMBOLS: Record<string, string> = {
  verb: 'V',
  adj: 'A',
  noun: 'S',
};

export function FallingWord({
  word,
  groundHeight,
  isPartialMatch,
  isRadarTarget = false,
  isPopping,
  onPopEnd,
}: FallingWordProps) {
  const danger = getDangerLevel(word.y, groundHeight);

  useEffect(() => {
    if (!isPopping) return;
    const timer = setTimeout(onPopEnd, 200);
    return () => clearTimeout(timer);
  }, [isPopping, onPopEnd]);

  const kindClass =
    word.kind !== 'normal' ? `falling-word--kind-${word.kind}` : '';
  const isAnagram = word.modifiers?.includes('anagram');
  const isShifting = word.modifiers?.includes('shifting');
  const isVowelless = word.modifiers?.includes('vowelless');

  const kindSymbol = KIND_SYMBOLS[word.kind];
  const posSymbol =
    word.kind === 'normal' && word.pos ? POS_SYMBOLS[word.pos] : null;

  return (
    <div
      className={[
        'falling-word',
        `falling-word--${danger}`,
        kindClass,
        isPartialMatch ? 'falling-word--match' : '',
        isRadarTarget ? 'falling-word--radar' : '',
        isPopping ? 'falling-word--pop' : '',
        word.burning ? 'falling-word--burning' : '',
        isAnagram ? 'falling-word--anagram' : '',
        isShifting ? 'falling-word--shifting' : '',
        isVowelless ? 'falling-word--vowelless' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ left: word.x, top: word.y }}
    >
      {kindSymbol && (
        <span className="falling-word__kind-symbol">{kindSymbol}</span>
      )}
      {posSymbol && (
        <span className="falling-word__pos-symbol">{posSymbol}·</span>
      )}
      {word.displayText ?? word.text}
      {(isAnagram || isShifting) && (
        <span className="falling-word__modifier-symbol">
          {isShifting ? '~' : '?'}
        </span>
      )}
    </div>
  );
}
