import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { LeaderboardEntry } from '../shared/leaderboard.js';
import type {
  DailyChallengeInfo,
  DailyLeaderboardResponse,
  SubmitDailyScorePayload,
} from '../shared/daily.js';
import {
  getRedis,
  isValidPlayerName,
  normalizePlayerName,
} from './lib/redis.js';

const DAILY_PREFIX = 'keyrunner:daily:';
const DAILY_META_PREFIX = 'keyrunner:daily-meta:';
const TOP_N = 10;
const MAX_SCORE = 1_000_000;
const MAX_ELAPSED_MS = 3_600_000;

const RUNNER_POOL = ['veloz', 'tanque', 'codificador', 'fantasma', 'magnate'];
const GLOSSARY_POOL = ['general', 'medico', 'tecnico'];

function getUtcDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function hashDateSeed(date: string): number {
  let hash = 2166136261;
  for (let i = 0; i < date.length; i++) {
    hash ^= date.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function buildChallenge(date: string): DailyChallengeInfo {
  const seed = hashDateSeed(date);
  return {
    date,
    seed,
    runnerId: RUNNER_POOL[seed % RUNNER_POOL.length],
    glossaryId: GLOSSARY_POOL[(seed >>> 8) % GLOSSARY_POOL.length],
  };
}

function dailyKey(date: string): string {
  return `${DAILY_PREFIX}${date}`;
}

function dailyMetaKey(date: string, playerName: string): string {
  return `${DAILY_META_PREFIX}${date}:${playerName}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const redis = getRedis();
  if (!redis) {
    if (req.method === 'GET') {
      const date = getUtcDateString();
      const empty: DailyLeaderboardResponse = {
        date,
        challenge: buildChallenge(date),
        top10: [],
        playerRank: null,
        playerBest: null,
        totalPlayers: 0,
      };
      return res.status(503).json({ error: 'Desafio diario no configurado', ...empty });
    }
    return res.status(503).json({ error: 'Desafio diario no configurado' });
  }

  if (req.method === 'GET') {
    const dateParam = req.query.date;
    const date =
      typeof dateParam === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
        ? dateParam
        : getUtcDateString();
    const playerNameParam = req.query.playerName;
    const playerName =
      typeof playerNameParam === 'string'
        ? normalizePlayerName(playerNameParam)
        : null;

    try {
      const rawTop = await redis.zrange(dailyKey(date), 0, TOP_N - 1, {
        rev: true,
        withScores: true,
      });

      const top10: LeaderboardEntry[] = [];
      for (let i = 0; i < rawTop.length; i += 2) {
        const name = String(rawTop[i]);
        const score = Number(rawTop[i + 1]);
        const meta = await redis.get<LeaderboardEntry>(
          dailyMetaKey(date, name),
        );
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

      const totalPlayers = await redis.zcard(dailyKey(date));
      let playerRank: number | null = null;
      let playerBest: LeaderboardEntry | null = null;

      if (playerName && isValidPlayerName(playerName)) {
        const rank = await redis.zrevrank(dailyKey(date), playerName);
        if (rank !== null) {
          playerRank = rank + 1;
          playerBest = await redis.get<LeaderboardEntry>(
            dailyMetaKey(date, playerName),
          );
        }
      }

      const response: DailyLeaderboardResponse = {
        date,
        challenge: buildChallenge(date),
        top10,
        playerRank,
        playerBest,
        totalPlayers,
      };
      return res.status(200).json(response);
    } catch (error) {
      console.error('daily GET error', error);
      return res.status(500).json({ error: 'Error al cargar desafio diario' });
    }
  }

  if (req.method === 'POST') {
    const body = req.body as SubmitDailyScorePayload;
    const playerName = normalizePlayerName(body?.playerName ?? '');
    const date =
      typeof body?.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.date)
        ? body.date
        : getUtcDateString();
    const score = Number(body?.score);
    const wpm = Number(body?.wpm);
    const wordsTyped = Number(body?.wordsTyped);
    const elapsedMs = Number(body?.elapsedMs);
    const floorReached =
      body?.floorReached !== undefined ? Number(body.floorReached) : undefined;
    const runnerId =
      typeof body?.runnerId === 'string' ? body.runnerId.slice(0, 16) : undefined;

    if (!isValidPlayerName(playerName)) {
      return res.status(400).json({ error: 'Nombre invalido' });
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
      const key = dailyKey(date);
      const currentBest = await redis.zscore(key, playerName);
      const isNewBest = currentBest === null || score > Number(currentBest);

      if (isNewBest) {
        const entry: LeaderboardEntry = {
          playerName,
          score,
          wpm: Math.round(wpm),
          wordsTyped: Math.round(wordsTyped),
          elapsedMs: Math.round(elapsedMs),
          ...(floorReached !== undefined
            ? { floorReached: Math.round(floorReached) }
            : {}),
          ...(runnerId ? { runnerId } : {}),
          updatedAt: new Date().toISOString(),
        };
        await redis.zadd(key, { score, member: playerName });
        await redis.set(dailyMetaKey(date, playerName), entry);
        await redis.expire(key, 60 * 60 * 24 * 45);
        await redis.expire(dailyMetaKey(date, playerName), 60 * 60 * 24 * 45);
      }

      const rank = await redis.zrevrank(key, playerName);
      return res.status(200).json({
        saved: isNewBest,
        rank: rank !== null ? rank + 1 : null,
      });
    } catch (error) {
      console.error('daily POST error', error);
      return res.status(500).json({ error: 'Error al guardar desafio diario' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
