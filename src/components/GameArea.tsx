import type { RefObject } from 'react';
import { useMemo } from 'react';
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
  elapsedMs,
  poppingWordId,
  radarTargetId,
  onPopEnd,
  shake = false,
}: GameAreaProps) {
  const groundHeight = useElementHeight(areaRef);
  const lowerInput = input.toLowerCase();
  const poppedWord = words.find((word) => word.id === poppingWordId);
  const poppedX = poppedWord?.x;
  const poppedY = poppedWord?.y;
  const burst = useMemo(() => {
    return poppedX !== undefined && poppedY !== undefined && poppingWordId
      ? { id: poppingWordId, x: poppedX, y: poppedY }
      : null;
  }, [poppedX, poppedY, poppingWordId]);

  return (
    <div
      className={`game-area ${shake ? 'game-area--shake' : ''}`.trim()}
      data-biome={biomeId}
      ref={areaRef}
    >
      <BiomeBackground biomeId={biomeId} className="game-area__biome-bg" />
      <ParticleCanvas burst={burst} />
      {words.map((word) => {
        const isPartialMatch =
          word.kind !== 'trap' &&
          lowerInput.length > 0 &&
          word.text.startsWith(lowerInput);
        return (
          <FallingWord
            key={word.id}
            word={word}
            elapsedMs={elapsedMs}
            groundHeight={groundHeight}
            isPartialMatch={isPartialMatch}
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
