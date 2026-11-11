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
    case 'cronista':
      return (
        <svg
          className={`boss-bg boss-bg--cronista ${className}`.trim()}
          viewBox="0 0 160 90"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <rect width="160" height="90" fill="#171522" />
          <path d="M0 18H160M0 72H160" stroke="#566c86" strokeWidth="3" />
          {[18, 40, 62, 84, 106, 128, 150].map((x, i) => (
            <g key={x} className="boss-bg__glyph" style={{ animationDelay: `${i * -0.7}s` }}>
              <rect x={x} y="28" width="3" height="32" fill={i % 2 ? '#b13e53' : '#ffcd75'} opacity="0.65" />
              <rect x={x - 4} y="34" width="11" height="2" fill="#f2c79b" opacity="0.55" />
              <rect x={x - 2} y="43" width="7" height="2" fill="#f2c79b" opacity="0.4" />
            </g>
          ))}
          <rect x="72" y="10" width="16" height="70" fill="#3e3546" opacity="0.7" />
          <path d="M78 18H82V65H78Z" fill="#ffcd75" opacity="0.65" />
        </svg>
      );
    case 'devoratexto':
      return (
        <svg
          className={`boss-bg boss-bg--devoratexto ${className}`.trim()}
          viewBox="0 0 160 90"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <rect width="160" height="90" fill="#090b18" />
          <circle className="boss-bg__maw" cx="82" cy="49" r="38" fill="#21142f" stroke="#b13e53" strokeWidth="3" />
          <circle cx="82" cy="49" r="25" fill="#090b18" stroke="#7a4ccd" strokeWidth="2" />
          <path d="M60 49H104M82 27V71M66 33L98 65M98 33L66 65" stroke="#73eff7" strokeWidth="1" opacity="0.55" />
          {[20, 38, 126, 144].map((x, i) => (
            <rect key={x} className="boss-bg__debris" x={x} y={16 + i * 9} width="5" height="5" fill={i % 2 ? '#ffcd75' : '#b13e53'} />
          ))}
        </svg>
      );
    case 'hilandera':
      return (
        <svg
          className={`boss-bg boss-bg--hilandera ${className}`.trim()}
          viewBox="0 0 160 90"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <rect width="160" height="90" fill="#120e22" />
          <g className="boss-bg__web" fill="none" stroke="#7a4ccd" strokeWidth="1">
            <path d="M80 4V86M10 18L150 72M10 72L150 18M25 8L135 82M135 8L25 82" />
            <path d="M80 16C48 20 35 35 32 48C48 44 63 48 80 58C97 48 112 44 128 48C125 35 112 20 80 16Z" />
            <path d="M80 28C58 31 48 40 46 49C58 47 69 52 80 60C91 52 102 47 114 49C112 40 102 31 80 28Z" />
          </g>
          <circle cx="80" cy="47" r="4" fill="#73eff7" />
          <g className="boss-bg__spool">
            <rect x="26" y="22" width="8" height="8" fill="#ffcd75" />
            <path d="M30 30V47" stroke="#f2c79b" strokeWidth="1" />
          </g>
          <g className="boss-bg__spool boss-bg__spool--alt">
            <rect x="126" y="60" width="8" height="8" fill="#b13e53" />
            <path d="M130 60V43" stroke="#f2c79b" strokeWidth="1" />
          </g>
        </svg>
      );
    case 'corrector':
      return (
        <svg
          className={`boss-bg boss-bg--corrector ${className}`.trim()}
          viewBox="0 0 160 90"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <rect width="160" height="90" fill="#1c1217" />
          {[16, 32, 48, 64, 80, 96, 112, 128, 144].map((x, i) => (
            <g key={x} className="boss-bg__type" style={{ animationDelay: `${i * -0.45}s` }}>
              <rect x={x} y="8" width="2" height="48" fill={i % 3 ? '#566c86' : '#e43b44'} opacity="0.55" />
              <rect x={x - 4} y="18" width="10" height="2" fill="#ffcd75" opacity="0.7" />
              <rect x={x - 2} y="34" width="7" height="2" fill="#f2c79b" opacity="0.5" />
            </g>
          ))}
          <rect x="0" y="70" width="160" height="10" fill="#3e2731" />
          <rect x="22" y="64" width="116" height="6" fill="#b13e53" />
          <path d="M0 84H160" stroke="#ffcd75" strokeWidth="2" opacity="0.5" />
        </svg>
      );
    case 'mini_guardian':
      return (
        <svg
          className={`boss-bg boss-bg--mini_guardian ${className}`.trim()}
          viewBox="0 0 160 90"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <rect width="160" height="90" fill="#111927" />
          <path d="M0 70L35 54L58 70L80 48L104 70L130 55L160 70V90H0Z" fill="#262b44" />
          <path d="M0 76H160" stroke="#73eff7" strokeWidth="2" opacity="0.7" />
          <rect x="16" y="30" width="8" height="40" fill="#3e3546" />
          <rect x="136" y="30" width="8" height="40" fill="#3e3546" />
          <path d="M20 30H140" stroke="#7a4ccd" strokeWidth="3" />
          <circle cx="80" cy="28" r="8" fill="#73eff7" opacity="0.65" />
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
