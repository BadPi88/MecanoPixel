import type { LeaderboardEntry } from '../types/leaderboard';

interface LeaderboardProps {
  top10: LeaderboardEntry[];
  playerRank: number | null;
  playerName: string;
  playerBest?: LeaderboardEntry | null;
  totalPlayers?: number;
  loading?: boolean;
  compact?: boolean;
}

function formatGlobalRank(rank: number, totalPlayers: number): string {
  if (totalPlayers > 0) {
    return `Eres el #${rank} de ${totalPlayers} jugadores`;
  }
  return `Tu posicion: #${rank}`;
}

function getGapToTenth(
  top10: LeaderboardEntry[],
  playerBest: LeaderboardEntry | null | undefined,
): number | null {
  if (top10.length < 10 || !playerBest) return null;
  const tenthScore = top10[9]?.score;
  if (tenthScore === undefined) return null;
  if (playerBest.score >= tenthScore) return null;
  return tenthScore - playerBest.score;
}

export function Leaderboard({
  top10,
  playerRank,
  playerName,
  playerBest = null,
  totalPlayers = 0,
  loading = false,
  compact = false,
}: LeaderboardProps) {
  if (loading) {
    return (
      <div className={`leaderboard ${compact ? 'leaderboard--compact' : ''}`}>
        <p className="leaderboard__status">Cargando ranking...</p>
      </div>
    );
  }

  const inTop10 =
    playerRank !== null &&
    playerRank <= 10 &&
    top10.some(
      (e) => e.playerName.toLowerCase() === playerName.toLowerCase(),
    );

  const gapToTenth = getGapToTenth(top10, playerBest);

  return (
    <div className={`leaderboard ${compact ? 'leaderboard--compact' : ''}`}>
      <h2 className="leaderboard__title">TOP 10 GLOBAL</h2>
      {totalPlayers > 0 && (
        <p className="leaderboard__total">{totalPlayers} jugadores en total</p>
      )}

      {top10.length === 0 ? (
        <p className="leaderboard__empty">Aun no hay puntuaciones. ¡Se el primero!</p>
      ) : (
        <ol className="leaderboard__list">
          {top10.map((entry, index) => {
            const isYou =
              playerName &&
              entry.playerName.toLowerCase() === playerName.toLowerCase();
            return (
              <li
                key={`${entry.playerName}-${index}`}
                className={`leaderboard__row ${isYou ? 'leaderboard__row--you' : ''}`}
              >
                <span className="leaderboard__rank">{index + 1}</span>
                <span className="leaderboard__name">
                  {entry.playerName}
                  {entry.floorReached != null && entry.floorReached > 0 && (
                    <span className="leaderboard__floor">
                      {' '}
                      P{entry.floorReached}
                    </span>
                  )}
                </span>
                <span className="leaderboard__score">{entry.score}</span>
              </li>
            );
          })}
        </ol>
      )}

      {gapToTenth !== null && gapToTenth > 0 && (
        <p className="leaderboard__gap">
          A {gapToTenth} puntos del #10
        </p>
      )}

      {playerName && playerRank !== null && !inTop10 && (
        <p className="leaderboard__your-rank">
          {formatGlobalRank(playerRank, totalPlayers)}
        </p>
      )}

      {playerName && playerRank !== null && inTop10 && totalPlayers > 10 && (
        <p className="leaderboard__your-rank">
          {formatGlobalRank(playerRank, totalPlayers)}
        </p>
      )}

      {playerName && playerRank === null && top10.length > 0 && (
        <p className="leaderboard__your-rank leaderboard__your-rank--unranked">
          {playerName}, juega para entrar al ranking global
        </p>
      )}
    </div>
  );
}
