import { useEffect, useMemo, useState } from 'react';
import { RUNNER_CATALOG } from '../data/runners';
import { RELIC_CATALOG } from '../data/relics';
import { GLOSSARY_CATALOG } from '../data/glossaries';
import type { GlossaryId, RelicId } from '../types/combat';
import type { LeaderboardResponse } from '../types/leaderboard';
import type { DeathCause, RunnerId } from '../types/run';
import { recordRunEnd } from '../services/meta';
import { syncMetaToProfile } from '../services/profile';
import { formatPeakIntensity } from '../utils/intensity';
import { calculateMetaCoinsEarned } from '../utils/metaCoins';
import { calculateWpm, formatTime } from '../utils/wpm';
import { fetchLeaderboard, submitScore } from '../services/leaderboard';
import { RunnerSprite } from '../assets/runnerSprites';
import { Leaderboard } from './Leaderboard';
import { PixelButton } from './PixelButton';

interface GameOverScreenProps {
  playerName: string;
  score: number;
  correctChars: number;
  wordsTyped: number;
  elapsedMs: number;
  maxWordsPerSecond: number;
  floor: number;
  runnerId: RunnerId | null;
  runCoins: number;
  deathCause: DeathCause;
  relics: RelicId[];
  glossary: GlossaryId;
  ultimatesUsed: number;
  deflectedLetters: number;
  onRetry: () => void;
  onHome: () => void;
}

const DEATH_LABELS: Record<NonNullable<DeathCause>, string> = {
  ground: 'Una palabra toco el suelo',
  bomb: 'Explosion de bomba',
  boss: 'El jefe te alcanzo',
  event: 'Pacto mortal',
  toxic: 'La tinta toxica te consumio',
  projectile: 'Una letra perforante te alcanzo',
};

export function GameOverScreen({
  playerName,
  score,
  correctChars,
  wordsTyped,
  elapsedMs,
  maxWordsPerSecond,
  floor,
  runnerId,
  runCoins,
  deathCause,
  relics,
  glossary,
  ultimatesUsed,
  deflectedLetters,
  onRetry,
  onHome,
}: GameOverScreenProps) {
  const wpm = calculateWpm(correctChars, elapsedMs);
  const peakIntensity = formatPeakIntensity(maxWordsPerSecond);
  const metaCoinsEarned = useMemo(
    () => calculateMetaCoinsEarned(floor, score),
    [floor, score],
  );

  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(
    null,
  );
  const [submitStatus, setSubmitStatus] = useState<
    'saving' | 'saved' | 'error' | 'skipped'
  >('saving');
  const [newRank, setNewRank] = useState<number | null>(null);
  // Inicializador perezoso: registra la run una sola vez al montar la pantalla.
  const [runEnd] = useState(() =>
    recordRunEnd(floor, wordsTyped, metaCoinsEarned),
  );
  const newRunners = runEnd.newlyUnlockedRunners;

  useEffect(() => {
    void syncMetaToProfile(runEnd.meta);
  }, [runEnd]);

  useEffect(() => {
    let cancelled = false;

    async function saveAndLoad() {
      if (!playerName.trim()) {
        setSubmitStatus('skipped');
        return;
      }

      try {
        const result = await submitScore({
          playerName: playerName.trim(),
          score,
          wpm,
          wordsTyped,
          elapsedMs,
          floorReached: floor,
          runnerId: runnerId ?? undefined,
        });
        if (cancelled) return;
        setNewRank(result.rank);
        setSubmitStatus(result.saved ? 'saved' : 'saved');
      } catch {
        if (cancelled) return;
        setSubmitStatus('error');
      }

      try {
        const data = await fetchLeaderboard(playerName.trim());
        if (!cancelled) setLeaderboard(data);
      } catch {
        if (!cancelled) {
          setLeaderboard({
            top10: [],
            playerRank: null,
            playerBest: null,
            totalPlayers: 0,
          });
        }
      }
    }

    void saveAndLoad();
    return () => {
      cancelled = true;
    };
  }, [playerName, score, wpm, wordsTyped, elapsedMs, floor, runnerId]);

  return (
    <div className="screen screen--gameover">
      <h1 className="screen__title screen__title--danger">GAME OVER</h1>
      <p className="screen__subtitle">{playerName || 'Jugador'}</p>
      {deathCause && (
        <p className="screen__status">{DEATH_LABELS[deathCause]}</p>
      )}

      {submitStatus === 'saving' && (
        <p className="screen__status">Guardando puntuacion...</p>
      )}
      {submitStatus === 'saved' && newRank !== null && (
        <p className="screen__status screen__status--highlight">
          {leaderboard && leaderboard.totalPlayers > 0
            ? `Eres el #${newRank} de ${leaderboard.totalPlayers} jugadores`
            : `Tu posicion global: #${newRank}`}
        </p>
      )}
      {submitStatus === 'error' && (
        <p className="screen__status screen__status--error">
          No se pudo guardar (leaderboard no configurado en local)
        </p>
      )}

      {newRunners.length > 0 && (
        <div className="unlock-banner pixel-panel" role="status">
          <span className="unlock-banner__title">
            ¡NUEVO PERSONAJE DESBLOQUEADO!
          </span>
          <div className="unlock-banner__runners">
            {newRunners.map((id) => (
              <div key={id} className="unlock-banner__runner">
                <RunnerSprite runnerId={id} size={48} />
                <span className="unlock-banner__name">
                  {RUNNER_CATALOG[id].name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="screen__layout screen__layout--gameover">
        <div className="screen__panel screen__stats pixel-panel">
          <div className="screen__stat">
            <span className="screen__stat-label">PISO</span>
            <span className="screen__stat-value">{floor}</span>
          </div>
          <div className="screen__stat">
            <span className="screen__stat-label">SCORE</span>
            <span className="screen__stat-value">{score}</span>
          </div>
          <div className="screen__stat">
            <span className="screen__stat-label">WPM</span>
            <span className="screen__stat-value">{wpm}</span>
          </div>
          <div className="screen__stat">
            <span className="screen__stat-label">RUN COINS</span>
            <span className="screen__stat-value">{runCoins}</span>
          </div>
          <div className="screen__stat screen__stat--wide">
            <span className="screen__stat-label">META COINS</span>
            <span className="screen__stat-value screen__stat-value--gold">
              +{metaCoinsEarned}
            </span>
          </div>
          {runnerId && (
            <div className="screen__stat screen__stat--wide">
              <span className="screen__stat-label">RUNNER</span>
              <span className="screen__stat-value">
                {RUNNER_CATALOG[runnerId].name} · {GLOSSARY_CATALOG[glossary].name}
              </span>
            </div>
          )}
          {relics.length > 0 && (
            <div className="screen__stat screen__stat--wide">
              <span className="screen__stat-label">RELIQUIAS</span>
              <span className="screen__stat-value screen__stat-value--small">
                {relics.map((id) => RELIC_CATALOG[id].name).join(' · ')}
              </span>
            </div>
          )}
          <div className="screen__stat">
            <span className="screen__stat-label">ULTIMATES</span>
            <span className="screen__stat-value">{ultimatesUsed}</span>
          </div>
          <div className="screen__stat">
            <span className="screen__stat-label">DESVIOS</span>
            <span className="screen__stat-value">{deflectedLetters}</span>
          </div>
          <div className="screen__stat">
            <span className="screen__stat-label">PALABRAS</span>
            <span className="screen__stat-value">{wordsTyped}</span>
          </div>
          <div className="screen__stat">
            <span className="screen__stat-label">TIEMPO</span>
            <span className="screen__stat-value">{formatTime(elapsedMs)}</span>
          </div>
          <div className="screen__stat screen__stat--wide">
            <span className="screen__stat-label">RITMO MAX</span>
            <span className="screen__stat-value">{peakIntensity.value}</span>
            <span className="screen__stat-hint">{peakIntensity.hint}</span>
          </div>
        </div>

        <div className="screen__panel pixel-panel">
          <Leaderboard
            top10={leaderboard?.top10 ?? []}
            playerRank={leaderboard?.playerRank ?? newRank}
            playerName={playerName.trim()}
            totalPlayers={leaderboard?.totalPlayers ?? 0}
            loading={submitStatus === 'saving'}
            compact
          />
        </div>
      </div>

      <div className="screen__actions">
        <PixelButton onClick={onRetry}>REINTENTAR</PixelButton>
        <PixelButton variant="secondary" onClick={onHome}>
          INICIO
        </PixelButton>
      </div>
    </div>
  );
}
