import type { LetterProjectile } from '../types/combat';

interface LetterProjectileViewProps {
  projectile: LetterProjectile;
}

export function LetterProjectileView({ projectile }: LetterProjectileViewProps) {
  return (
    <div
      className="letter-projectile"
      style={{ left: projectile.x, top: projectile.y }}
      aria-hidden="true"
    >
      {projectile.char}
    </div>
  );
}
