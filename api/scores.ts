import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { LeaderboardEntry, SubmitScorePayload } from '../shared/leaderboard';
import {
  getRedis,
  isValidPlayerName,
  LEADERBOARD_KEY,
  normalizePlayerName,
} from './lib/redis';

const PLAYER_META_PREFIX = 'keyrunner:player:';
const MAX_SCORE = 1_000_000;
const MAX_ELAPSED_MS = 3_600_000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const redis = getRedis();
  if (!redis) {
    return res.status(503).json({ error: 'Leaderboard no configurado' });
  }

  const body = req.body as SubmitScorePayload;
  const playerName = normalizePlayerName(body?.playerName ?? '');
  const score = Number(body?.score);
  const wpm = Number(body?.wpm);
  const wordsTyped = Number(body?.wordsTyped);
  const elapsedMs = Number(body?.elapsedMs);

  if (!isValidPlayerName(playerName)) {
    return res.status(400).json({ error: 'Nombre invalido (2-16 caracteres alfanumericos)' });
  }

  if (
    !Number.isFinite(score) ||
    score < 0 ||
    score > MAX_SCORE ||
    !Number.isFinite(wpm) ||
    wpm < 0 ||
    wpm > 500 ||
    !Number.isFinite(wordsTyped) ||
    wordsTyped < 0 ||
    !Number.isFinite(elapsedMs) ||
    elapsedMs < 0 ||
    elapsedMs > MAX_ELAPSED_MS
  ) {
    return res.status(400).json({ error: 'Puntuacion invalida' });
  }

  try {
    const currentBest = await redis.zscore(LEADERBOARD_KEY, playerName);
    const isNewBest = currentBest === null || score > Number(currentBest);

    if (isNewBest) {
      const entry: LeaderboardEntry = {
        playerName,
        score,
        wpm: Math.round(wpm),
        wordsTyped: Math.round(wordsTyped),
        elapsedMs: Math.round(elapsedMs),
        updatedAt: new Date().toISOString(),
      };

      await redis.zadd(LEADERBOARD_KEY, { score, member: playerName });
      await redis.set(`${PLAYER_META_PREFIX}${playerName}`, entry);
    }

    const rank = await redis.zrevrank(LEADERBOARD_KEY, playerName);

    return res.status(200).json({
      saved: isNewBest,
      rank: rank !== null ? rank + 1 : null,
    });
  } catch (error) {
    console.error('scores POST error', error);
    return res.status(500).json({ error: 'Error al guardar puntuacion' });
  }
}
