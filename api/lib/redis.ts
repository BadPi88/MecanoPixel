import { Redis } from '@upstash/redis';

export const LEADERBOARD_KEY = 'keyrunner:leaderboard:best';

export function getRedis(): Redis | null {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;

  return new Redis({ url, token });
}

export function normalizePlayerName(name: string): string {
  return name.trim().slice(0, 16);
}

export function isValidPlayerName(name: string): boolean {
  const trimmed = normalizePlayerName(name);
  return trimmed.length >= 2 && /^[a-zA-Z0-9_\- ]+$/.test(trimmed);
}
