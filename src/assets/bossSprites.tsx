import type { ReactNode } from 'react';
import type { BossId } from '../types/combat';

interface SpriteDef {
  palette: Record<string, string>;
  rows: string[];
  opacity?: number;
}

const SPRITES: Record<BossId, SpriteDef> = {
  archivista: {
    palette: {
      h: '#5d4037',
      g: '#ffcd75',
      l: '#73eff7',
      b: '#3e2723',
      s: '#f2c79b',
      e: '#1a1c2c',
      p: '#c0cbdc',
      f: '#566c86',
    },
    rows: [
      '................',
      '....hhhhhhhh....',
      '...hhhhhhhhhh...',
      '...hggggggggh...',
      '...hllllllllh...',
      '....ssssssss....',
      '....sesssses....',
      '....ssssssss....',
      '..pppppppppppp..',
      '..ppbbbbbbbbpp..',
      '..ppbbbbbbbbpp..',
      '...ppbbbbbbpp...',
      '....pp....pp....',
      '....ff....ff....',
      '................',
      '................',
    ],
  },
  saboteador: {
    palette: {
      h: '#566c86',
      m: '#94b0c2',
      g: '#ffcd75',
      s: '#f2c79b',
      e: '#1a1c2c',
      o: '#f77622',
      k: '#262b44',
      f: '#566c86',
    },
    rows: [
      '................',
      '....mmmmmmmm....',
      '...mmmmmmmmmm...',
      '...mggggggggm...',
      '....ssssssss....',
      '....sesssses....',
      '....ssssssss....',
      '...oooooooooo...',
      '..oooooooooooo..',
      '..ookkkkkkkkoo..',
      '..ookkkkkkkkoo..',
      '...ookkkkkkoo...',
      '....kk....kk....',
      '....ff....ff....',
      '................',
      '................',
    ],
  },
  perforador: {
    palette: {
      v: '#262b44',
      d: '#1a1c2c',
      p: '#7a4ccd',
      g: '#73eff7',
      s: '#566c86',
      e: '#ffcd75',
      f: '#3e3546',
    },
    rows: [
      '................',
      '....vvvvvvvv....',
      '...vvvvvvvvvv...',
      '...vppppppppv...',
      '...vppggggppv...',
      '...vppggggppv...',
      '...vppppppppv...',
      '....ssssssss....',
      '....sesssses....',
      '...dddddddddd...',
      '..dddddddddddd..',
      '..dd........dd..',
      '...dd......dd...',
      '....ff....ff....',
      '................',
      '................',
    ],
  },
  tiranotipo: {
    palette: {
      c: '#ffcd75',
      r: '#f77622',
      h: '#f2c79b',
      s: '#e43b44',
      g: '#b13e53',
      b: '#3e2731',
      p: '#7a4ccd',
      f: '#566c86',
    },
    rows: [
      '................',
      '....cccccccc....',
      '...cccccccccc...',
      '...crrrrrrrrc...',
      '...chhhhhhhhc...',
      '....ssssssss....',
      '....sesssses....',
      '....ssssssss....',
      '..pppppppppppp..',
      '..ppggggggggpp..',
      '..ppggggggggpp..',
      '...ppbbbbbbpp...',
      '....pp....pp....',
      '....ff....ff....',
      '................',
      '................',
    ],
  },
  cronista: {
    palette: {
      h: '#3e3546',
      g: '#b13e53',
      l: '#ffcd75',
      s: '#f2c79b',
      e: '#1a1c2c',
      p: '#7a4ccd',
      f: '#566c86',
    },
    rows: [
      '................',
      '....hhhhhhhh....',
      '...hhhhhhhhhh...',
      '...hggggggggh...',
      '...hllllllllh...',
      '....ssssssss....',
      '....sesssses....',
      '....ssssssss....',
      '..pppppppppppp..',
      '..pppppppppppp..',
      '..pppppppppppp..',
      '...pppppppppp...',
      '....pp....pp....',
      '....ff....ff....',
      '................',
      '................',
    ],
  },
  devoratexto: {
    palette: {
      v: '#1a1c2c',
      m: '#b13e53',
      g: '#ffcd75',
      s: '#e43b44',
      e: '#f2c79b',
      k: '#3e3546',
      f: '#566c86',
    },
    rows: [
      '................',
      '....mmmmmmmm....',
      '...mmmmmmmmmm...',
      '...mggggggggm...',
      '...mssssssssm...',
      '....sesssses....',
      '....ssssssss....',
      '...vvvvvvvvvv...',
      '..vvvvvvvvvvvv..',
      '..vvkkkkkkvvvv..',
      '..vvkkkkkkvvvv..',
      '...vvkkkkvvv....',
      '....kk....kk....',
      '....ff....ff....',
      '................',
      '................',
    ],
  },
  hilandera: {
    palette: {
      p: '#7a4ccd',
      v: '#3e3546',
      g: '#ffcd75',
      c: '#73eff7',
      e: '#1a1c2c',
      f: '#566c86',
    },
    rows: [
      '...p........p...',
      '....p......p....',
      '.....pppppp.....',
      '...ppggggggpp...',
      '..ppggccccggpp..',
      '...pppggggppp...',
      '..p..pppppp..p..',
      '.pp.p.pppp.p.pp.',
      'pp..p.pppp.p..pp',
      '....p......p....',
      '...p........p...',
      '..p..........p..',
      '................',
      '................',
      '................',
      '................',
    ],
  },
  corrector: {
    palette: {
      h: '#3e3546',
      r: '#e43b44',
      g: '#ffcd75',
      s: '#f2c79b',
      e: '#1a1c2c',
      i: '#b13e53',
      p: '#566c86',
      f: '#262b44',
    },
    rows: [
      '......hhhh......',
      '.....hhhhhh.....',
      '....hhgggghh....',
      '...hhgggggghh...',
      '...hrrrrrrrrh...',
      '....ssssssss....',
      '....sesseess....',
      '...ssssssssss...',
      '..pppppppppppp..',
      '..ppiiiiiiiipp..',
      '...ppiiiiiipp...',
      '....pppppppp....',
      '....ff....ff....',
      '....ff....ff....',
      '................',
      '................',
    ],
  },
  indexadora: {
    palette: {
      g: '#ffcd75',
      p: '#7a4ccd',
      i: '#3e2731',
      s: '#f2c79b',
      c: '#73eff7',
      e: '#1a1c2c',
      f: '#566c86',
      r: '#b13e53',
    },
    rows: [
      '...gggggggggg...',
      '..ggppppppppgg..',
      '.ggppppppppppgg.',
      '.ggppppppppppgg.',
      '..ppp......ppp..',
      '...ppssssppp....',
      '...ppceseppp....',
      '...ppssssppp....',
      '..pppppppppppp..',
      '.pppprrrrrppppp.',
      '..ppprrrrrrppp..',
      '...ppppppppp....',
      '....ff....ff....',
      '....ff....ff....',
      '................',
      '................',
    ],
  },
  mini_guardian: {
    palette: {
      h: '#73eff7',
      g: '#ffcd75',
      s: '#566c86',
      e: '#1a1c2c',
      p: '#7a4ccd',
      f: '#3e3546',
    },
    rows: [
      '................',
      '......hhhh......',
      '.....hhhhhh.....',
      '.....hggggh.....',
      '......ssss......',
      '......sese......',
      '......ssss......',
      '....pppppppp....',
      '....pppppppp....',
      '.....pppppp.....',
      '......pppp......',
      '.......pp.......',
      '.......ff.......',
      '................',
      '................',
      '................',
    ],
  },
};

interface BossSpriteProps {
  bossId: BossId;
  size?: number;
  className?: string;
}

export function BossSprite({
  bossId,
  size = 64,
  className = '',
}: BossSpriteProps) {
  const def = SPRITES[bossId];

  const rects: ReactNode[] = [];
  def.rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      if (ch === '.') {
        x += 1;
        continue;
      }
      let end = x + 1;
      while (end < row.length && row[end] === ch) end += 1;
      rects.push(
        <rect
          key={`${y}-${x}`}
          x={x}
          y={y}
          width={end - x}
          height={1}
          fill={def.palette[ch]}
        />,
      );
      x = end;
    }
  });

  return (
    <svg
      className={`boss-sprite ${className}`.trim()}
      viewBox="0 0 16 16"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      aria-hidden="true"
      opacity={def.opacity}
    >
      {rects}
    </svg>
  );
}
