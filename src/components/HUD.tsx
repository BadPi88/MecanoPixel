import { BIOME_CATALOG, type BiomeId } from '../data/biomes';
import {
  ELITE_MODIFIER_CATALOG,
  type EliteModifierId,
} from '../data/eliteModifiers';
import { RAMPS_PER_FLOOR } from '../data/run';
import { RUNNER_CATALOG } from '../data/runners';
import type { GlossaryId } from '../types/combat';
import type { ActivePerk } from '../types/perks';
import type { GameStatus } from '../types/game';
import type { RunnerId } from '../types/run';
import { getEffectiveDifficulty } from '../utils/perkModifiers';
import { formatWordsPerSecond } from '../utils/intensity';
import { calculateWpm, formatTime } from '../utils/wpm';
import { RunnerSprite } from '../assets/runnerSprites';
import { PerkBar } from './PerkBar';
import { PixelButton } from './PixelButton';

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
  floor?: number;
  biomeId?: BiomeId;
  runCoins?: number;
  rampsThisFloor?: number;
  runnerId?: RunnerId | null;
  precisionStreak?: number;
  ultimateCharge?: number;
  inputBlinded?: boolean;
  synergyNames?: string[];
  relicNames?: string[];
  selectedGlossary?: GlossaryId;
  gameStatus?: GameStatus;
  eliteModifierId?: EliteModifierId | null;
  onToggleBuild?: () => void;
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
  floor = 1,
  biomeId = 'scriptorium',
  runCoins = 0,
  rampsThisFloor = 0,
  runnerId = null,
  precisionStreak = 0,
  ultimateCharge = 0,
  inputBlinded = false,
  synergyNames = [],
  relicNames = [],
  selectedGlossary = 'general',
  gameStatus = 'playing',
  eliteModifierId = null,
  onToggleBuild,
}: HUDProps) {
  const glossaryFloorNotice =
    selectedGlossary === 'medico' && floor % 2 === 0
      ? 'VENENO ACTIVO — palabras 7+ letras +30%'
      : selectedGlossary === 'tecnico' && gameStatus === 'boss'
        ? 'ELECTRICO — ultimate acelera en jefe'
        : null;
  const wpm = calculateWpm(correctChars, elapsedMs);
  const effective = getEffectiveDifficulty(
    elapsedMs,
    difficultyTierOffset,
    activePerks,
    frozenUntilMs,
    runnerId,
  );
  const currentWps = formatWordsPerSecond(
    1000 / effective.spawnInterval,
  );
  const maxComboBlocks = 10;
  const comboBlocks = Math.min(combo, maxComboBlocks);
  const comboMilestone = combo >= 5 && combo % 5 === 0;
  const maxHearts = 5;

  return (
    <header className="hud">
      <div className="hud__panel">
        <div className="hud__row">
          <div className="hud__stat">
            <span className="hud__label">PISO</span>
            <span className="hud__value">
              {floor} ({rampsThisFloor}/{RAMPS_PER_FLOOR})
            </span>
          </div>
          <div className="hud__stat hud__stat--biome">
            <span className="hud__label">ZONA</span>
            <span className="hud__value hud__value--biome">
              {BIOME_CATALOG[biomeId].name}
            </span>
          </div>
          {eliteModifierId && (
            <div className="hud__stat hud__stat--elite">
              <span className="hud__label">ELITE</span>
              <span className="hud__value hud__value--elite">
                {ELITE_MODIFIER_CATALOG[eliteModifierId].label}
              </span>
            </div>
          )}
          <div className="hud__stat">
            <span className="hud__label">COINS</span>
            <span className="hud__value">{runCoins}</span>
          </div>
          {runnerId && (
            <div className="hud__stat hud__stat--player">
              <span className="hud__label">RUNNER</span>
              <span className="hud__value hud__value--player hud__value--runner">
                <RunnerSprite runnerId={runnerId} size={20} />
                {RUNNER_CATALOG[runnerId].name}
              </span>
            </div>
          )}
          {playerName && (
            <div className="hud__stat hud__stat--player">
              <span className="hud__label">JUGADOR</span>
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
          {onToggleBuild && (
            <PixelButton
              variant="secondary"
              className="hud__build-button"
              onClick={onToggleBuild}
              aria-haspopup="dialog"
            >
              VER BUILD
            </PixelButton>
          )}
        </div>

        <PerkBar activePerks={activePerks} elapsedMs={elapsedMs} />

        {relicNames.length > 0 && (
          <div className="hud__relics" aria-label="Reliquias activas">
            {relicNames.map((name) => (
              <span key={name} className="hud__relic-chip">
                {name}
              </span>
            ))}
          </div>
        )}

        {synergyNames.length > 0 && (
          <div className="hud__synergies" aria-label="Sinergias activas">
            {synergyNames.map((name) => (
              <span key={name} className="hud__synergy-badge">
                SINERGIA: {name}
              </span>
            ))}
          </div>
        )}

        {glossaryFloorNotice && (
          <div className="hud__glossary-notice" role="status">
            {glossaryFloorNotice}
          </div>
        )}

        <div className="hud__row hud__row--combat">
          <div
            className="hud__meter"
            role="progressbar"
            aria-label="Precision"
            aria-valuenow={precisionStreak}
            aria-valuemin={0}
            aria-valuemax={50}
          >
            <span className="hud__label">PRECISION</span>
            <div className="hud__meter-bar">
              <div
                className="hud__meter-fill hud__meter-fill--precision"
                style={{ width: `${Math.min(precisionStreak * 2, 100)}%` }}
              />
            </div>
            <span className="hud__meter-value">x{precisionStreak}</span>
          </div>
          <div
            className="hud__meter"
            role="progressbar"
            aria-label="Ultimate"
            aria-valuenow={Math.round(ultimateCharge)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span className="hud__label">
              ULTIMATE {ultimateCharge >= 100 ? '[TAB]' : ''}
            </span>
            <div className="hud__meter-bar">
              <div
                className={`hud__meter-fill hud__meter-fill--ultimate ${
                  ultimateCharge >= 100 ? 'hud__meter-fill--ready' : ''
                }`}
                style={{ width: `${Math.min(ultimateCharge, 100)}%` }}
              />
            </div>
            <span className="hud__meter-value">
              {Math.round(ultimateCharge)}%
            </span>
          </div>
        </div>

        <div className="hud__row hud__row--bottom">
          <div className="hud__input">
            <span className="hud__label">INPUT</span>
            <span
              className={`hud__input-value ${inputBlinded ? 'hud__input-value--blinded' : ''}`}
            >
              {inputBlinded ? '▮▮▮▮▮' : input || '_'}
            </span>
          </div>
          <div
            className={`hud__combo ${comboMilestone ? 'hud__combo--milestone' : ''}`}
          >
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
