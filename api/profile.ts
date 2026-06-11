import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import type {
  ProfileMeta,
  ProfilePayload,
  ProfileResponse,
} from '../shared/profile.js';
import {
  getRedis,
  isValidPlayerName,
  normalizePlayerName,
} from './lib/redis.js';

const PROFILE_PREFIX = 'keyrunner:profile:';
const MAX_COINS = 100_000_000;
const MAX_STAT = 100_000_000;
const MAX_UNLOCK_IDS = 64;

interface StoredProfile {
  pinHash: string;
  salt: string;
  meta: ProfileMeta | null;
  createdAt: string;
  updatedAt: string;
}

function hashPin(pin: string, salt: string): string {
  return createHash('sha256').update(`${salt}:${pin}`).digest('hex');
}

function pinMatches(pin: string, profile: StoredProfile): boolean {
  const expected = Buffer.from(profile.pinHash, 'hex');
  const actual = Buffer.from(hashPin(pin, profile.salt), 'hex');
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function sanitizeCount(value: unknown, max: number): number {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return 0;
  return Math.min(Math.round(num), max);
}

function sanitizeIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value
        .filter((id): id is string => typeof id === 'string')
        .map((id) => id.slice(0, 24)),
    ),
  ].slice(0, MAX_UNLOCK_IDS);
}

function sanitizeMeta(raw: unknown): ProfileMeta | null {
  if (!raw || typeof raw !== 'object') return null;
  const meta = raw as Partial<ProfileMeta>;
  const stats = (meta.stats ?? {}) as Partial<ProfileMeta['stats']>;
  return {
    totalCoins: sanitizeCount(meta.totalCoins, MAX_COINS),
    unlockedRunners: sanitizeIds(meta.unlockedRunners),
    unlockedRelics: sanitizeIds(meta.unlockedRelics),
    unlockedGlossaries: sanitizeIds(meta.unlockedGlossaries),
    stats: {
      runsPlayed: sanitizeCount(stats.runsPlayed, MAX_STAT),
      bestFloor: sanitizeCount(stats.bestFloor, 999),
      totalWords: sanitizeCount(stats.totalWords, MAX_STAT),
    },
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const redis = getRedis();
  if (!redis) {
    return res.status(503).json({ error: 'Perfiles no configurados' });
  }

  const body = req.body as ProfilePayload;
  const playerName = normalizePlayerName(body?.playerName ?? '');
  const pin = typeof body?.pin === 'string' ? body.pin : '';
  const action = body?.action;

  if (!isValidPlayerName(playerName)) {
    return res
      .status(400)
      .json({ error: 'Nombre invalido (2-16 caracteres alfanumericos)' });
  }
  if (!/^\d{4}$/.test(pin)) {
    return res.status(400).json({ error: 'PIN invalido (4 digitos)' });
  }
  if (action !== 'auth' && action !== 'save') {
    return res.status(400).json({ error: 'Accion invalida' });
  }

  const key = `${PROFILE_PREFIX}${playerName}`;

  try {
    const existing = await redis.get<StoredProfile>(key);

    if (!existing) {
      if (action === 'save') {
        return res.status(404).json({ error: 'Perfil no encontrado' });
      }
      const salt = randomBytes(8).toString('hex');
      const now = new Date().toISOString();
      const profile: StoredProfile = {
        pinHash: hashPin(pin, salt),
        salt,
        meta: sanitizeMeta(body?.meta),
        createdAt: now,
        updatedAt: now,
      };
      await redis.set(key, profile);
      const response: ProfileResponse = { created: true, meta: profile.meta };
      return res.status(200).json(response);
    }

    if (!pinMatches(pin, existing)) {
      return res.status(401).json({ error: 'PIN incorrecto' });
    }

    if (action === 'auth') {
      const response: ProfileResponse = { created: false, meta: existing.meta };
      return res.status(200).json(response);
    }

    const meta = sanitizeMeta(body?.meta);
    if (!meta) {
      return res.status(400).json({ error: 'Progreso invalido' });
    }
    const updated: StoredProfile = {
      ...existing,
      meta,
      updatedAt: new Date().toISOString(),
    };
    await redis.set(key, updated);
    const response: ProfileResponse = { created: false, meta };
    return res.status(200).json(response);
  } catch (error) {
    console.error('profile POST error', error);
    return res.status(500).json({ error: 'Error de perfil' });
  }
}
