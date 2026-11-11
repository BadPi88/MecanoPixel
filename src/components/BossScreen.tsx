import type { FallingWord } from '../types/game';
import type { BossAttackState, BossId } from '../types/combat';
import { BOSS_CATALOG, getBossHpPercent } from '../data/bosses';
import { BossBackground } from '../assets/bossBackgrounds';
import { BossSprite } from '../assets/bossSprites';
import { useElementHeight } from '../hooks/useElementHeight';
import { FallingWord as FallingWordView } from './FallingWord';

interface BossScreenProps {
  bossId: BossId;
  bossWord: FallingWord;
  bossWords: FallingWord[];
  activeBossWordIndex: number;
  bossPhase: number;
  input: string;
  floor: number;
  areaRef: React.RefObject<HTMLDivElement | null>;
  bossAttack: BossAttackState | null;
  remapActive: boolean;
  telegraphX: number | null;
  elapsedMs: number;
}

export function BossScreen({
  bossId,
  bossWord,
  bossWords,
  activeBossWordIndex,
  bossPhase,
  input,
  floor,
  areaRef,
  bossAttack,
  remapActive,
  telegraphX,
  elapsedMs,
}: BossScreenProps) {
  const groundHeight = useElementHeight(areaRef);
  const boss = BOSS_CATALOG[bossId];
  const lowerInput = input.toLowerCase();
  const isPartialMatch =
    lowerInput.length > 0 && bossWord.text.startsWith(lowerInput);
  const hpPercent = getBossHpPercent(input, bossWords, activeBossWordIndex);
  const isDual = boss.dualWords && bossWords.length > 1;
  const blindWarning =
    bossAttack?.blind === true &&
    bossAttack.nextBlindAtMs > elapsedMs &&
    bossAttack.nextBlindAtMs - elapsedMs <= boss.telegraphMs;

  return (
    <div
      className={`boss-overlay boss-overlay--intro boss-overlay--${bossId}${
        remapActive ? ' boss-overlay--remap-active' : ''
      }${bossId === 'indexadora' && bossPhase > 0 ? ' boss-overlay--phase-two' : ''}`}
    >
      <BossBackground bossId={bossId} className="boss-bg" />
      <div className="boss-specter" aria-hidden="true">
        <BossSprite bossId={bossId} size={360} />
      </div>
      {telegraphX !== null && (
        <div
          className="boss-telegraph"
          style={{ left: `${telegraphX}px` }}
          aria-hidden="true"
        >
          <span>{boss.telegraphLabel || 'IMPACTO'}</span>
        </div>
      )}
      {blindWarning && (
        <div className="boss-blind-telegraph" role="status">
          {bossId === 'indexadora' ? 'PREPARA EL BORRON' : 'CEGUERA INMINENTE'}
        </div>
      )}

      <div className="boss-header">
        <div className="boss-header__identity">
          <BossSprite bossId={bossId} size={48} />
          <div className="boss-header__text">
            <h2 className="boss-header__title">{boss.name}</h2>
            <p className="boss-header__floor">PISO {floor}</p>
            <p className="boss-header__quote">&ldquo;{boss.quote}&rdquo;</p>
          </div>
        </div>

        <div className="boss-hp-bar" role="progressbar" aria-valuenow={hpPercent}>
          <div className="boss-hp-bar__track">
            <div
              className="boss-hp-bar__fill"
              style={{ width: `${hpPercent}%` }}
            />
          </div>
          <span className="boss-hp-bar__label">HP JEFE {100 - hpPercent}%</span>
        </div>

        <p className="boss-header__hint">
          {isDual
            ? `Palabra ${bossPhase + 1}/${bossWords.length} — alterna hasta derrotarla`
            : 'Escribe la palabra antes de que toque el suelo'}
        </p>
        {bossId === 'indexadora' && (
          <p className="boss-header__phase" role="status">
            {boss.phases?.[bossPhase]?.label ?? `FASE ${bossPhase + 1}`}
          </p>
        )}

        {bossAttack && (
          <div className="boss-header__attacks">
            {bossAttack.blind && (
              <span className="boss-header__attack">CEGUERA</span>
            )}
            {remapActive && (
              <span className="boss-header__attack boss-header__attack--remap">
                TECLAS A-Z / S-X INTERCAMBIADAS
              </span>
            )}
            {bossAttack.projectiles && (
              <span className="boss-header__attack">PROYECTILES</span>
            )}
          </div>
        )}
      </div>

      <div className="boss-area">
        {bossWords.map((word, index) => (
          <FallingWordView
            key={word.id}
            word={word}
            groundHeight={groundHeight}
            isPartialMatch={index === activeBossWordIndex && isPartialMatch}
            isPopping={false}
            onPopEnd={() => {}}
            className={
              index < activeBossWordIndex
                ? 'falling-word--boss-complete'
                : index === activeBossWordIndex
                  ? 'falling-word--boss-active'
                  : 'falling-word--boss-inactive'
            }
          />
        ))}
      </div>
    </div>
  );
}
