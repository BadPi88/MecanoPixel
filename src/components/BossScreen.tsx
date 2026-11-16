import type { FallingWord } from '../types/game';
import type { BossAttackState, BossId } from '../types/combat';
import { BOSS_CATALOG, getBossHpPercent } from '../data/bosses';
import { BossBackground } from '../assets/bossBackgrounds';
import { BossSprite } from '../assets/bossSprites';
import { useEffect, useState } from 'react';
import { useElementHeight } from '../hooks/useElementHeight';
import { FallingWord as FallingWordView } from './FallingWord';

interface BossScreenProps {
  bossId: BossId;
  bossWord: FallingWord;
  bossWords: FallingWord[];
  activeBossWordIndex: number;
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
  input,
  floor,
  areaRef,
  bossAttack,
  remapActive,
  telegraphX,
  elapsedMs,
}: BossScreenProps) {
  const groundHeight = useElementHeight(areaRef);
  const [visibleBossWordIndex, setVisibleBossWordIndex] = useState(activeBossWordIndex);
  useEffect(() => {
    if (visibleBossWordIndex === activeBossWordIndex) return;
    const timer = setTimeout(() => setVisibleBossWordIndex(activeBossWordIndex), 42);
    return () => clearTimeout(timer);
  }, [activeBossWordIndex, visibleBossWordIndex]);
  const visibleBossWord = bossWords[visibleBossWordIndex] ?? bossWord;
  const boss = BOSS_CATALOG[bossId];
  const lowerInput = input.toLowerCase();
  const isPartialMatch =
    lowerInput.length > 0 && visibleBossWord.text.startsWith(lowerInput);
  const hpPercent = getBossHpPercent(input, bossWords, visibleBossWordIndex);
  const isDual = bossWords.length > 1;
  const visibleBossPhase = bossId === 'tiranotipo'
    ? Math.min(2, Math.floor(visibleBossWordIndex / 4))
    : bossId === 'indexadora'
      ? Math.min(1, Math.floor(visibleBossWordIndex / 3))
      : visibleBossWordIndex;
  const completedBossChars = bossWords.slice(0, visibleBossWordIndex).reduce((sum, word) => sum + word.text.length, 0);
  const bossDurationMs = Math.max(1_000, elapsedMs - (bossAttack?.startedAtMs ?? elapsedMs));
  const bossWpm = (completedBossChars / 5) / (bossDurationMs / 60_000);
  const bossPushback = Math.min(48, Math.round(bossWpm * 0.5));
  const blindWarning =
    bossAttack?.blind === true &&
    bossAttack.nextBlindAtMs > elapsedMs &&
    bossAttack.nextBlindAtMs - elapsedMs <= boss.telegraphMs;

  return (
    <div
      className={`boss-overlay boss-overlay--intro boss-overlay--${bossId}${
        remapActive ? ' boss-overlay--remap-active' : ''
      }${bossId === 'indexadora' && visibleBossWordIndex > 0 ? ' boss-overlay--phase-two' : ''}${visibleBossWordIndex !== activeBossWordIndex ? ' boss-overlay--hitstop' : ''}`}
    >
      <BossBackground bossId={bossId} className="boss-bg" />
      <div
        className="boss-specter"
        aria-hidden="true"
      >
        <div className="boss-specter__pushback" style={{ transform: `translateY(-${bossPushback}px)` }}>
          <BossSprite bossId={bossId} size={360} />
        </div>
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
            ? `Objetivo ${visibleBossWordIndex + 1}/${bossWords.length} — completa la cadena para derrotarla`
            : 'Escribe la palabra antes de que toque el suelo'}
        </p>
        {isDual && (
          <p className="boss-header__active-target" role="status" aria-live="polite">
            OBJETIVO ACTIVO {visibleBossWordIndex + 1}/{bossWords.length}: {visibleBossWord.text}
          </p>
        )}
        {bossId === 'tiranotipo' && (
          <p className="boss-header__phase" role="status">
            {visibleBossWordIndex >= 12 ? 'PALABRA DE EJECUCION' : `FASE ${Math.floor(visibleBossWordIndex / 4) + 1}/3 · OBJETIVO ${visibleBossWordIndex % 4 + 1}/4`}
          </p>
        )}
        {bossId === 'indexadora' && (
          <p className="boss-header__phase" role="status">
            {boss.phases?.[visibleBossPhase]?.label ?? `FASE ${visibleBossPhase + 1}`}
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
            {bossAttack.remap && !remapActive && bossAttack.remapUntilMs > elapsedMs && bossAttack.remapUntilMs - elapsedMs <= 1_500 && (
              <span className="boss-header__attack boss-header__attack--remap-warning" role="status">
                INTERCAMBIO EN {((bossAttack.remapUntilMs - elapsedMs) / 1000).toFixed(1)} S
              </span>
            )}
            {bossAttack.projectiles && (
              <span className="boss-header__attack">PROYECTILES</span>
            )}
          </div>
        )}
      </div>

      <div className="boss-area">
        {visibleBossWordIndex > 0 && <span key={visibleBossWordIndex} className="boss-area__attack-bolt" aria-hidden="true" />}
        {visibleBossWordIndex < 2 && bossId === 'archivista' && (
          <p className="boss-header__active-target" role="status">SELLO DE ARCHIVO {visibleBossWordIndex + 1}/2 · DESTRUYELO PARA ABRIR EL REGISTRO</p>
        )}
        {bossWords.map((word, index) => (bossWords.length > 2 && index !== visibleBossWordIndex ? null : (
          <FallingWordView
            key={word.id}
            word={word}
            elapsedMs={elapsedMs}
            groundHeight={groundHeight}
            isPartialMatch={index === visibleBossWordIndex && isPartialMatch}
            isPopping={false}
            typedCount={index === visibleBossWordIndex ? input.length : 0}
            onPopEnd={() => {}}
            className={
              index < visibleBossWordIndex
                ? 'falling-word--boss-complete'
                : index === visibleBossWordIndex
                  ? 'falling-word--boss-active'
                  : 'falling-word--boss-inactive'
            }
        />
        )))}
      </div>
    </div>
  );
}
