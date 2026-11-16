import type { RefObject } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { BiomeId } from '../data/biomes';
import type { FallingWord as FallingWordType } from '../types/game';
import type { LetterProjectile } from '../types/combat';
import { BiomeBackground } from '../assets/biomeBackgrounds';
import { useElementHeight } from '../hooks/useElementHeight';
import { FallingWord } from './FallingWord';
import { LetterProjectileView } from './LetterProjectileView';
import { ParticleCanvas } from './ParticleCanvas';

interface GameAreaProps {
  areaRef: RefObject<HTMLDivElement | null>;
  biomeId: BiomeId;
  words: FallingWordType[];
  projectiles: LetterProjectile[];
  input: string;
  activeTargetWordId: string | null;
  correctKeyPresses: number;
  elapsedMs: number;
  poppingWordId: string | null;
  radarTargetId: string | null;
  onPopEnd: () => void;
  shake?: boolean;
}

export function GameArea({
  areaRef,
  biomeId,
  words,
  projectiles,
  input,
  activeTargetWordId,
  correctKeyPresses,
  elapsedMs,
  poppingWordId,
  radarTargetId,
  onPopEnd,
  shake = false,
}: GameAreaProps) {
  const groundHeight = useElementHeight(areaRef);
  const [hitStopped, setHitStopped] = useState(false);
  const [frozenWords, setFrozenWords] = useState(words);
  const wordsBeforeImpactRef = useRef(words);
  useEffect(() => {
    if (!poppingWordId) return;
    let hitStopTimer: ReturnType<typeof setTimeout> | undefined;
    const startTimer = setTimeout(() => {
      setFrozenWords(wordsBeforeImpactRef.current);
      setHitStopped(true);
      hitStopTimer = setTimeout(() => setHitStopped(false), 42);
    }, 0);
    return () => {
      clearTimeout(startTimer);
      if (hitStopTimer) clearTimeout(hitStopTimer);
    };
  }, [poppingWordId]);
  useEffect(() => {
    if (!poppingWordId) wordsBeforeImpactRef.current = words;
  }, [words, poppingWordId]);
  const visibleWords = hitStopped ? frozenWords : words;
  const lowerInput = input.toLowerCase();
  const poppedWord = visibleWords.find((word) => word.id === poppingWordId);
  const activeTarget = visibleWords.find((word) => word.id === activeTargetWordId);
  const poppedX = poppedWord?.x;
  const poppedY = poppedWord?.y;
  const burst = useMemo(() => {
    return poppedX !== undefined && poppedY !== undefined && poppingWordId
      ? { id: poppingWordId, x: poppedX, y: poppedY }
      : null;
  }, [poppedX, poppedY, poppingWordId]);

  return (
    <div
      className={`game-area ${shake ? 'game-area--shake' : ''} ${poppingWordId ? 'game-area--impact' : ''}`.trim()}
      data-biome={biomeId}
      ref={areaRef}
    >
      <BiomeBackground biomeId={biomeId} className="game-area__biome-bg" />
      <ParticleCanvas burst={burst} />
      {activeTarget && correctKeyPresses > 0 && (
        <span
          key={correctKeyPresses}
          className="game-area__typing-bolt"
          style={{ left: activeTarget.x + 8, top: activeTarget.y + 8 }}
          aria-hidden="true"
        />
      )}
      {visibleWords.map((word) => {
        const isTarget = word.id === activeTargetWordId;
        const isPartialMatch = isTarget && lowerInput.length > 0;
        return (
          <FallingWord
            key={word.id}
            word={word}
            elapsedMs={elapsedMs}
            groundHeight={groundHeight}
            isPartialMatch={isPartialMatch}
            typedCount={isTarget ? lowerInput.length : 0}
            isRadarTarget={word.id === radarTargetId}
            isPopping={poppingWordId === word.id}
            onPopEnd={onPopEnd}
          />
        );
      })}
      {projectiles.map((projectile) => (
        <LetterProjectileView key={projectile.id} projectile={projectile} />
      ))}
      <div className="game-area__ground" aria-hidden="true">
        <div className="game-area__ground-bricks" />
      </div>
    </div>
  );
}
