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

  return (
    <div
      className={[
        'falling-word',
        `falling-word--${danger}`,
        kindClass,
        isPartialMatch ? 'falling-word--match' : '',
        isRadarTarget ? 'falling-word--radar' : '',
        isPopping ? 'falling-word--pop' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ left: word.x, top: word.y }}
    >
      {word.text}
    </div>
  );
}
