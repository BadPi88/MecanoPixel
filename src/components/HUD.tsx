import type { ActivePerk } from '../types/perks';
import { getEffectiveDifficulty } from '../utils/perkModifiers';
import { formatWordsPerSecond } from '../utils/intensity';
import { calculateWpm, formatTime } from '../utils/wpm';
import { PerkBar } from './PerkBar';

interface HUDProps {
  playerName?: string;
  score: number;
  lives: number;
  combo: number;
  correctChars: number;
  elapsedMs: number;
  input: string;
  showSpeedNotice: boolean;
  rampBlockedNotice: boolean;
  difficultyTierOffset: number;
  activePerks: ActivePerk[];
  frozenUntilMs: number;
  isPaused: boolean;
  isPerkPick?: boolean;
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      className={`hud__heart ${filled ? 'hud__heart--full' : 'hud__heart--empty'}`}
      viewBox="0 0 16 16"
      width="20"
      height="20"
      aria-hidden="true"
    >
      {filled ? (
        <>
          <rect x="4" y="2" width="2" height="2" fill="currentColor" />
          <rect x="10" y="2" width="2" height="2" fill="currentColor" />
          <rect x="2" y="4" width="12" height="2" fill="currentColor" />
          <rect x="2" y="6" width="12" height="2" fill="currentColor" />
          <rect x="4" y="8" width="8" height="2" fill="currentColor" />
          <rect x="6" y="10" width="4" height="2" fill="currentColor" />
          <rect x="7" y="12" width="2" height="2" fill="currentColor" />
        </>
      ) : (
        <>
          <rect x="4" y="2" width="2" height="2" fill="none" stroke="currentColor" strokeWidth="1" />
          <rect x="10" y="2" width="2" height="2" fill="none" stroke="currentColor" strokeWidth="1" />
          <rect x="2" y="4" width="12" height="8" fill="none" stroke="currentColor" strokeWidth="1" />
          <rect x="6" y="10" width="4" height="2" fill="none" stroke="currentColor" strokeWidth="1" />
          <rect x="7" y="12" width="2" height="2" fill="none" stroke="currentColor" strokeWidth="1" />
        </>
      )}
    </svg>
  );
}

export function HUD({
  playerName,
  score,
  lives,
  combo,
  correctChars,
  elapsedMs,
  input,
  showSpeedNotice,
  rampBlockedNotice,
  difficultyTierOffset,
  activePerks,
  frozenUntilMs,
  isPaused,
  isPerkPick = false,
}: HUDProps) {
  const wpm = calculateWpm(correctChars, elapsedMs);
  const effective = getEffectiveDifficulty(
    elapsedMs,
    difficultyTierOffset,
    activePerks,
    frozenUntilMs,
  );
  const currentWps = formatWordsPerSecond(
    1000 / effective.spawnInterval,
  );
  const maxComboBlocks = 10;
  const comboBlocks = Math.min(combo, maxComboBlocks);
  const maxHearts = 5;

  return (
    <header className="hud">
      <div className="hud__panel">
        <div className="hud__row">
          {playerName && (
            <div className="hud__stat hud__stat--player">
              <span className="hud__label">RUNNER</span>
              <span className="hud__value hud__value--player">{playerName}</span>
            </div>
          )}
          <div className="hud__stat hud__stat--score">
            <span className="hud__label">SCORE</span>
            <span className="hud__value">{score}</span>
          </div>
          <div className="hud__stat">
            <span className="hud__label">WPM</span>
            <span className="hud__value">{wpm}</span>
          </div>
          <div className="hud__stat">
            <span className="hud__label">TIME</span>
            <span className="hud__value">{formatTime(elapsedMs)}</span>
          </div>
          <div className="hud__lives" aria-label={`${lives} vidas`}>
            {Array.from({ length: maxHearts }, (_, i) => (
              <HeartIcon key={i} filled={i < lives} />
            ))}
          </div>
        </div>

        <PerkBar activePerks={activePerks} elapsedMs={elapsedMs} />

        <div className="hud__row hud__row--bottom">
          <div className="hud__input">
            <span className="hud__label">INPUT</span>
            <span className="hud__input-value">{input || '_'}</span>
          </div>
          <div className="hud__combo">
            <span className="hud__label">COMBO</span>
            <div className="hud__combo-bar" aria-hidden="true">
              {Array.from({ length: maxComboBlocks }, (_, i) => (
                <span
                  key={i}
                  className={`hud__combo-block ${i < comboBlocks ? 'hud__combo-block--active' : ''}`}
                />
              ))}
            </div>
            {combo > 1 && <span className="hud__combo-count">x{combo}</span>}
          </div>
        </div>
      </div>

      {showSpeedNotice && !isPerkPick && (
        <div className="hud__speed-notice" role="status">
          {rampBlockedNotice
            ? 'RELOJ ROTO — ritmo bloqueado'
            : `¡MAS RAPIDO! ${currentWps}`}
        </div>
      )}

      {isPaused && !isPerkPick && (
        <div className="hud__pause-overlay">
          <span>PAUSA</span>
        </div>
      )}
    </header>
  );
}
