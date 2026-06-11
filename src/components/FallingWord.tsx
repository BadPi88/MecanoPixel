import { useEffect } from 'react';
import type { FallingWord as FallingWordType } from '../types/game';
import { TooltipHint } from './TooltipHint';

interface FallingWordProps {
  word: FallingWordType;
  groundHeight: number;
  isPartialMatch: boolean;
  isRadarTarget?: boolean;
  isPopping: boolean;
  onPopEnd: () => void;
  className?: string;
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
  oracle: '?',
};

const KIND_HINTS: Record<string, string> = {
  trap: 'Trampa: escribirla resta puntos y combo',
  bomb: 'Bomba: explota si toca el suelo',
  bonus: 'Bonus: monedas extra al acertar',
  oracle: 'Oraculo: elige recompensa al acertar',
};

const POS_SYMBOLS: Record<string, string> = {
  verb: 'V',
  adj: 'A',
  noun: 'S',
};

const POS_HINTS: Record<string, string> = {
  verb: 'Verbo: efecto AOE al acertar',
  adj: 'Adjetivo: buff de ritmo temporal',
  noun: 'Sustantivo: congela palabras cercanas',
};

export function FallingWord({
  word,
  groundHeight,
  isPartialMatch,
  isRadarTarget = false,
  isPopping,
  onPopEnd,
  className = '',
}: FallingWordProps) {
  const danger = getDangerLevel(word.y, groundHeight);

  useEffect(() => {
    if (!isPopping) return;
    const timer = setTimeout(onPopEnd, 200);
    return () => clearTimeout(timer);
  }, [isPopping, onPopEnd]);

  const kindClass =
    word.kind !== 'normal' ? `falling-word--kind-${word.kind}` : '';
  const popClass = isPopping
    ? word.kind === 'bonus'
      ? 'falling-word--pop-gold'
      : word.kind === 'bomb'
        ? 'falling-word--pop-bomb'
        : 'falling-word--pop'
    : '';
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
        popClass,
        word.burning ? 'falling-word--burning' : '',
        isAnagram ? 'falling-word--anagram' : '',
        isShifting ? 'falling-word--shifting' : '',
        className,
        isVowelless ? 'falling-word--vowelless' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ left: word.x, top: word.y }}
    >
      {kindSymbol && (
        <TooltipHint hintId={`kind-${word.kind}`} message={KIND_HINTS[word.kind] ?? ''}>
          <span className="falling-word__kind-symbol">{kindSymbol}</span>
        </TooltipHint>
      )}
      {posSymbol && word.pos && (
        <TooltipHint hintId={`pos-${word.pos}`} message={POS_HINTS[word.pos] ?? ''}>
          <span className="falling-word__pos-symbol">{posSymbol}·</span>
        </TooltipHint>
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
