import type { RefObject } from 'react';
import type { BiomeId } from '../data/biomes';
import type { FallingWord as FallingWordType } from '../types/game';
import type { LetterProjectile } from '../types/combat';
import { BiomeBackground } from '../assets/biomeBackgrounds';
import { useElementHeight } from '../hooks/useElementHeight';
import { FallingWord } from './FallingWord';
import { LetterProjectileView } from './LetterProjectileView';

interface GameAreaProps {
  areaRef: RefObject<HTMLDivElement | null>;
  biomeId: BiomeId;
  words: FallingWordType[];
  projectiles: LetterProjectile[];
  input: string;
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
  poppingWordId,
  radarTargetId,
  onPopEnd,
  shake = false,
}: GameAreaProps) {
  const groundHeight = useElementHeight(areaRef);
  const lowerInput = input.toLowerCase();

  return (
    <div
      className={`game-area ${shake ? 'game-area--shake' : ''}`.trim()}
      data-biome={biomeId}
      ref={areaRef}
    >
      <BiomeBackground biomeId={biomeId} className="game-area__biome-bg" />
      {words.map((word) => {
        const isPartialMatch =
          word.kind !== 'trap' &&
          lowerInput.length > 0 &&
          word.text.startsWith(lowerInput);
        return (
          <FallingWord
            key={word.id}
            word={word}
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
