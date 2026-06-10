import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { LeaderboardEntry, LeaderboardResponse } from '../shared/leaderboard';
import {
  getRedis,
  isValidPlayerName,
  LEADERBOARD_KEY,
  normalizePlayerName,
} from './lib/redis';

const PLAYER_META_PREFIX = 'keyrunner:player:';
/** Top 10 para la UI; el ranking completo vive en Redis sin limite de jugadores. */
const TOP_N = 10;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const redis = getRedis();
  if (!redis) {
    return res.status(503).json({
      error: 'Leaderboard no configurado',
      top10: [],
      playerRank: null,
      playerBest: null,
      totalPlayers: 0,
    } satisfies LeaderboardResponse & { error: string });
  }

  const playerNameParam = req.query.playerName;
  const playerName =
    typeof playerNameParam === 'string'
      ? normalizePlayerName(playerNameParam)
      : null;

  try {
    const rawTop = await redis.zrange(LEADERBOARD_KEY, 0, TOP_N - 1, {
      rev: true,
      withScores: true,
    });

    const top10: LeaderboardEntry[] = [];

    for (let i = 0; i < rawTop.length; i += 2) {
      const name = String(rawTop[i]);
      const score = Number(rawTop[i + 1]);
      const meta = await redis.get<LeaderboardEntry>(`${PLAYER_META_PREFIX}${name}`);
      top10.push(
        meta ?? {
          playerName: name,
          score,
          wpm: 0,
          wordsTyped: 0,
          elapsedMs: 0,
          updatedAt: new Date().toISOString(),
        },
      );
    }

    const totalPlayers = await redis.zcard(LEADERBOARD_KEY);

    let playerRank: number | null = null;
    let playerBest: LeaderboardEntry | null = null;

    if (playerName && isValidPlayerName(playerName)) {
      const rank = await redis.zrevrank(LEADERBOARD_KEY, playerName);
      if (rank !== null) {
        playerRank = rank + 1;
        playerBest = await redis.get<LeaderboardEntry>(
          `${PLAYER_META_PREFIX}${playerName}`,
        );
      }
    }

    const response: LeaderboardResponse = {
      top10,
      playerRank,
      playerBest,
      totalPlayers,
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('leaderboard GET error', error);
    return res.status(500).json({ error: 'Error al cargar leaderboard' });
  }
}
