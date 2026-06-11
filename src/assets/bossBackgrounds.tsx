import type { BossId } from '../types/combat';

interface BossBackgroundProps {
  bossId: BossId;
  className?: string;
}

/** Fondos pixel SVG unicos por villano (no reutilizan runners). */
export function BossBackground({ bossId, className = '' }: BossBackgroundProps) {
  switch (bossId) {
    case 'archivista':
      return (
        <svg
          className={`boss-bg boss-bg--archivista ${className}`.trim()}
          viewBox="0 0 160 90"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <rect width="160" height="90" fill="#2b1f14" />
          {[0, 20, 40, 60, 80, 100, 120, 140].map((x) => (
            <g key={x}>
              <rect x={x} y="10" width="14" height="70" fill="#4a3728" />
              <rect x={x + 2} y="14" width="10" height="8" fill="#73eff7" opacity="0.5" />
              <rect x={x + 2} y="26" width="10" height="8" fill="#ffcd75" opacity="0.4" />
              <rect x={x + 2} y="38" width="10" height="8" fill="#b13e53" opacity="0.35" />
            </g>
          ))}
          <rect x="0" y="82" width="160" height="8" fill="#1a120a" />
        </svg>
      );
    case 'saboteador':
      return (
        <svg
          className={`boss-bg boss-bg--saboteador ${className}`.trim()}
          viewBox="0 0 160 90"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <rect width="160" height="90" fill="#1a1c2c" />
          <rect x="0" y="0" width="160" height="12" fill="#566c86" />
          {[10, 50, 90, 130].map((x) => (
            <g key={x}>
              <rect x={x} y="20" width="8" height="60" fill="#94b0c2" />
              <rect x={x - 4} y="30" width="16" height="4" fill="#f77622" />
              <rect x={x - 4} y="50" width="16" height="4" fill="#f77622" opacity="0.7" />
            </g>
          ))}
          <rect x="0" y="78" width="160" height="12" fill="#262b44" />
          <rect x="20" y="72" width="120" height="6" fill="#566c86" />
        </svg>
      );
    case 'perforador':
      return (
        <svg
          className={`boss-bg boss-bg--perforador ${className}`.trim()}
          viewBox="0 0 160 90"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <rect width="160" height="90" fill="#0d0a14" />
          {Array.from({ length: 40 }, (_, i) => (
            <rect
              key={i}
              x={(i * 17) % 160}
              y={(i * 11) % 80}
              width="1"
              height="1"
              fill="#73eff7"
              opacity={0.3 + (i % 5) * 0.1}
            />
          ))}
          <circle cx="80" cy="50" r="28" fill="#1a1028" stroke="#7a4ccd" strokeWidth="2" />
          <circle cx="80" cy="50" r="14" fill="#0d0a14" stroke="#73eff7" strokeWidth="1" />
          <rect x="76" y="10" width="8" height="30" fill="#566c86" />
        </svg>
      );
    case 'tiranotipo':
      return (
        <svg
          className={`boss-bg boss-bg--tiranotipo ${className}`.trim()}
          viewBox="0 0 160 90"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <rect width="160" height="90" fill="#2a1520" />
          <rect x="0" y="0" width="160" height="20" fill="#3e2731" />
          <rect x="50" y="55" width="60" height="20" fill="#b13e53" />
          <rect x="45" y="50" width="70" height="8" fill="#ffcd75" />
          <rect x="55" y="60" width="50" height="10" fill="#7a4ccd" opacity="0.6" />
          {[20, 60, 100, 140].map((x) => (
            <g key={x}>
              <rect x={x} y="22" width="6" height="50" fill="#566c86" />
              <rect x={x - 2} y="20" width="10" height="4" fill="#ffcd75" />
            </g>
          ))}
          <rect x="0" y="82" width="160" height="8" fill="#1a0e14" />
        </svg>
      );
  }
}
