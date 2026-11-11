import type { BiomeId } from '../data/biomes';

interface BiomeBackgroundProps {
  biomeId: BiomeId;
  className?: string;
}

/** Fondos pixel de combate normal por bioma (detras de las palabras). */
export function BiomeBackground({
  biomeId,
  className = '',
}: BiomeBackgroundProps) {
  const baseClass = `biome-bg biome-bg--${biomeId} ${className}`.trim();

  switch (biomeId) {
    case 'scriptorium':
      return (
        <svg
          className={baseClass}
          viewBox="0 0 160 120"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <rect width="160" height="120" fill="#2b1f14" />
          {[8, 36, 64, 92, 120].map((x) => (
            <g key={x}>
              <rect x={x} y="8" width="18" height="88" fill="#4a3728" />
              <rect x={x + 3} y="14" width="12" height="6" fill="#8b7355" />
              <rect x={x + 3} y="24" width="12" height="6" fill="#73eff7" opacity="0.35" />
              <rect x={x + 3} y="34" width="12" height="6" fill="#ffcd75" opacity="0.3" />
            </g>
          ))}
          <rect x="0" y="100" width="160" height="20" fill="#1a120a" />
        </svg>
      );
    case 'fabrica':
      return (
        <svg
          className={baseClass}
          viewBox="0 0 160 120"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <rect width="160" height="120" fill="#1a1c2c" />
          <rect x="0" y="0" width="160" height="14" fill="#566c86" />
          {[12, 48, 84, 120].map((x) => (
            <g key={x}>
              <rect x={x} y="18" width="10" height="78" fill="#94b0c2" />
              <rect x={x - 2} y="30" width="14" height="3" fill="#f77622" />
              <rect x={x - 2} y="48" width="14" height="3" fill="#f77622" opacity="0.7" />
              <rect x={x - 2} y="66" width="14" height="3" fill="#ffcd75" opacity="0.5" />
            </g>
          ))}
          <rect x="0" y="104" width="160" height="16" fill="#262b44" />
        </svg>
      );
    case 'abismo':
      return (
        <svg
          className={baseClass}
          viewBox="0 0 160 120"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <rect width="160" height="120" fill="#0d0a14" />
          {Array.from({ length: 55 }, (_, i) => (
            <rect
              key={i}
              x={(i * 13) % 158}
              y={(i * 9) % 100}
              width="1"
              height="1"
              fill="#73eff7"
              opacity={0.2 + (i % 4) * 0.12}
            />
          ))}
          <ellipse cx="80" cy="70" rx="50" ry="30" fill="#1a1028" opacity="0.8" />
          <rect x="0" y="108" width="160" height="12" fill="#050308" />
        </svg>
      );
    case 'trono':
      return (
        <svg
          className={baseClass}
          viewBox="0 0 160 120"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <rect width="160" height="120" fill="#1a1028" />
          <rect x="50" y="20" width="60" height="8" fill="#ffcd75" />
          <rect x="40" y="28" width="80" height="60" fill="#7a4ccd" />
          <rect x="48" y="36" width="64" height="44" fill="#4d2f99" />
          {[56, 72, 88, 104].map((x) => (
            <rect key={x} x={x} y="44" width="8" height="28" fill="#ffcd75" opacity="0.6" />
          ))}
          <rect x="0" y="106" width="160" height="14" fill="#2b1f14" />
        </svg>
      );
    case 'palimpsesto':
      return (
        <svg
          className={baseClass}
          viewBox="0 0 160 120"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <rect width="160" height="120" fill="#17101d" />
          <path d="M0 20H160M0 96H160" stroke="#6b435c" strokeWidth="3" />
          {[18, 48, 78, 108, 138].map((x, i) => (
            <g key={x} className="palimpsest-script" style={{ animationDelay: `${i * -0.8}s` }}>
              <rect x={x} y="10" width="2" height="82" fill="#b56b83" opacity="0.5" />
              <rect x={x - 8} y="30" width="18" height="3" fill="#e8bd80" opacity="0.55" />
              <rect x={x - 5} y="43" width="12" height="2" fill="#d9b9d2" opacity="0.4" />
              <rect x={x - 8} y="55" width="18" height="2" fill="#d9b9d2" opacity="0.3" />
            </g>
          ))}
          <path className="palimpsest-ink" d="M12 84C38 68 49 104 77 82S119 66 148 87" fill="none" stroke="#73eff7" strokeWidth="2" opacity="0.35" />
          <rect x="0" y="104" width="160" height="16" fill="#100b14" />
        </svg>
      );
  }
}
