import type { ReactNode } from 'react';
import type { RunnerId } from '../types/run';

/**
 * Sprites pixel art 16x16 por runner. Cada fila es un string de 16 chars:
 * '.' = transparente, cualquier otro char indexa la paleta del sprite.
 */
interface SpriteDef {
  palette: Record<string, string>;
  rows: string[];
  opacity?: number;
}

const SPRITES: Record<RunnerId, SpriteDef> = {
  veloz: {
    palette: {
      h: '#41a6f6',
      v: '#ffcd75',
      s: '#f2c79b',
      b: '#1d7fce',
      d: '#14508a',
      f: '#ffcd75',
      c: '#73eff7',
    },
    rows: [
      '................',
      '.....hhhhhh.....',
      '....hhhhhhhh....',
      '....hhhhhhhh....',
      '....vvvvvvvv....',
      '....ssssssss....',
      '.....ssssss.....',
      '..c..bbbbbb.....',
      '.cc.bbbbbbbb....',
      '..c.bbbbbbbb....',
      '.cc..bbbbbb.....',
      '..c..dddddd.....',
      '.....dd..dd.....',
      '....dd....dd....',
      '...ff......ff...',
      '................',
    ],
  },
  tanque: {
    palette: {
      m: '#94b0c2',
      k: '#566c86',
      s: '#f2c79b',
      e: '#1a1c2c',
      g: '#38b764',
      G: '#257953',
      f: '#566c86',
    },
    rows: [
      '................',
      '....mmmmmmmm....',
      '...mmmmmmmmmm...',
      '...mkkkkkkkkm...',
      '....ssssssss....',
      '....sesssses....',
      '....ssssssss....',
      '...gggggggggg...',
      '..gggggggggggg..',
      '..ggGGGGGGGGgg..',
      '..gg.GGGGGG.gg..',
      '..kk.GGGGGG.kk..',
      '....kkk..kkk....',
      '....kk....kk....',
      '...ff......ff...',
      '................',
    ],
  },
  codificador: {
    palette: {
      a: '#2b2440',
      g: '#ffcd75',
      l: '#73eff7',
      s: '#f2c79b',
      b: '#7a4ccd',
      d: '#4d2f99',
      L: '#94b0c2',
      k: '#1a1c2c',
      f: '#2b2440',
    },
    rows: [
      '................',
      '.....aaaaaa.....',
      '....aaaaaaaa....',
      '....aassssaa....',
      '....ssssssss....',
      '...gllgssgllg...',
      '....ssssssss....',
      '.....bbbbbb.....',
      '....bbbbbbbb....',
      '...bbbbbbbbbb...',
      '...b.LLLLLL.b...',
      '...s.LkkkkL.s...',
      '.....dd..dd.....',
      '.....dd..dd.....',
      '....ff....ff....',
      '................',
    ],
  },
  fantasma: {
    palette: {
      w: '#dff6f5',
      p: '#94b0c2',
      e: '#1a1c2c',
    },
    opacity: 0.9,
    rows: [
      '................',
      '.....wwwwww.....',
      '....wwwwwwww....',
      '...wwwwwwwwww...',
      '...wwppppppww...',
      '...wwpeppepww...',
      '...wwppppppww...',
      '...wwwwwwwwww...',
      '...wwwwwwwwww...',
      '...wwwwwwwwww...',
      '...wwwwwwwwww...',
      '...wwwwwwwwww...',
      '...ww.www.www...',
      '...w..ww...ww...',
      '................',
      '................',
    ],
  },
  magnate: {
    palette: {
      t: '#1a1c2c',
      G: '#ffcd75',
      s: '#f2c79b',
      e: '#1a1c2c',
      u: '#333c57',
      W: '#f4f4f4',
      d: '#d95763',
      c: '#ffcd75',
    },
    rows: [
      '.....tttttt.....',
      '.....tttttt.....',
      '.....GGGGGG.....',
      '...tttttttttt...',
      '....ssssssss....',
      '....sessssGs....',
      '....ssssssss....',
      '.....uWWWWu.....',
      '....uuWddWuu....',
      '...uuuWWWWuuu...',
      '...u.uWWWWu.c...',
      '...s.uuuuuu.cc..',
      '.....uu..uu.....',
      '.....uu..uu.....',
      '....tt....tt....',
      '................',
    ],
  },
  centinela: {
    palette: {
      p: '#d95763',
      m: '#94b0c2',
      k: '#566c86',
      e: '#1a1c2c',
      b: '#41a6f6',
      S: '#ffcd75',
    },
    rows: [
      '.......pp.......',
      '.....mmppmm.....',
      '....mmmmmmmm....',
      '....mmmmmmmm....',
      '....mkkkkkkm....',
      '....mkekkekm....',
      '....mmkkkkmm....',
      '..SS.bbbbbb.....',
      '.SSSSbbbbbbb....',
      '.SkkSbbbbbbb....',
      '.SkkSbbbbbbb....',
      '.SSSSbbbbbb.....',
      '..SS.kk..kk.....',
      '.....kk..kk.....',
      '....mm....mm....',
      '................',
    ],
  },
  alquimista: {
    palette: {
      h: '#7a4ccd',
      d: '#4d2f99',
      s: '#f2c79b',
      e: '#1a1c2c',
      r: '#7a4ccd',
      k: '#ffcd75',
      g: '#73eff7',
      l: '#38b764',
    },
    rows: [
      '................',
      '.....hhhhhh.....',
      '....hhhhhhhh....',
      '...hhhhhhhhhh...',
      '...hhsssssshh...',
      '...hhsesseshh...',
      '....hssssssh....',
      '.....rrrrrr.....',
      '....rrrrrrrr....',
      '...rrrrrrrr..g..',
      '...r.rrrrrr.ggg.',
      '...s.kkkkkk.lll.',
      '.....rr..rr.....',
      '.....rr..rr.....',
      '....dd....dd....',
      '................',
    ],
  },
  maestro: {
    palette: {
      w: '#f4f4f4',
      n: '#d95763',
      s: '#f2c79b',
      e: '#1a1c2c',
      W: '#f4f4f4',
      k: '#1a1c2c',
    },
    rows: [
      '................',
      '.....wwwwww.....',
      '....wwwwwwww....',
      '....nnnnnnnn....',
      '....ssssssss....',
      '....sesssses....',
      '....ssssssss....',
      '.....WWWWWW.....',
      '....WWWWWWWW....',
      '...WWWWWWWWWW...',
      '...W.WWWWWW.W...',
      '...s.kkkkkk.s...',
      '.....WW..WW.....',
      '.....WW..WW.....',
      '....kk....kk....',
      '................',
    ],
  },
};

interface RunnerSpriteProps {
  runnerId: RunnerId;
  size?: number;
  className?: string;
}

export function RunnerSprite({
  runnerId,
  size = 48,
  className = '',
}: RunnerSpriteProps) {
  const def = SPRITES[runnerId];

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
      className={`runner-sprite ${className}`.trim()}
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
