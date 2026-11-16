import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { CURRENT_RULES_VERSION, signRunToken, type ProgressionSnapshot, type RunTokenClaims } from '../_shared/runToken.ts';

interface StartRequest {
  mode: 'global' | 'daily' | 'weekly';
  challengeKey: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function dailySeed(date: string): number {
  let hash = 2166136261;
  for (const char of date) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return hash >>> 0;
}

function weeklySeed(week: string): number {
  let hash = 2166136261;
  for (const char of `keyrunner-week-${week}`) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return hash >>> 0;
}

function currentWeek(now: Date): string {
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  return monday.toISOString().slice(0, 10);
}

function isRequest(value: unknown): value is StartRequest {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<StartRequest>;
  return ['global', 'daily', 'weekly'].includes(candidate.mode ?? '') && typeof candidate.challengeKey === 'string';
}

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405, headers: corsHeaders });
  try {
    const raw = await request.text();
    if (raw.length > 8_000) return Response.json({ error: 'Payload demasiado grande' }, { status: 413, headers: corsHeaders });
    const bodyValue: unknown = JSON.parse(raw);
    if (!isRequest(bodyValue)) return Response.json({ error: 'Solicitud invalida' }, { status: 400, headers: corsHeaders });

    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const week = currentWeek(now);
    if ((bodyValue.mode === 'global' && bodyValue.challengeKey !== '') ||
      (bodyValue.mode === 'daily' && bodyValue.challengeKey !== today) ||
      (bodyValue.mode === 'weekly' && bodyValue.challengeKey !== week)) {
      return Response.json({ error: 'El reto solicitado no esta activo' }, { status: 409, headers: corsHeaders });
    }

    const authorization = request.headers.get('Authorization');
    if (!authorization) return Response.json({ error: 'Sesion requerida' }, { status: 401, headers: corsHeaders });
    const url = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const secret = Deno.env.get('RUN_TOKEN_SECRET');
    if (!url || !anonKey || !secret) return Response.json({ error: 'Servicio de partidas no configurado' }, { status: 503, headers: corsHeaders });
    const supabase = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } });
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) return Response.json({ error: 'Sesion invalida' }, { status: 401, headers: corsHeaders });
    const { data: profile, error: profileError } = await supabase
      .from('player_profiles').select('meta').eq('user_id', authData.user.id).single();
    if (profileError) return Response.json({ error: 'No se pudo cargar el perfil competitivo' }, { status: 503, headers: corsHeaders });

    const rawMeta = profile.meta as Record<string, unknown>;
    const rawUpgrades = (rawMeta.hubUpgrades && typeof rawMeta.hubUpgrades === 'object'
      ? rawMeta.hubUpgrades : {}) as Record<string, unknown>;
    const progression: ProgressionSnapshot = {
      unlockedRelics: Array.isArray(rawMeta.unlockedRelics)
        ? rawMeta.unlockedRelics.filter((id): id is string => typeof id === 'string') : [],
      unlockedRunners: Array.isArray(rawMeta.unlockedRunners)
        ? rawMeta.unlockedRunners.filter((id): id is string => typeof id === 'string') : ['mecanografo'],
      unlockedGlossaries: Array.isArray(rawMeta.unlockedGlossaries)
        ? rawMeta.unlockedGlossaries.filter((id): id is string => typeof id === 'string') : ['general'],
      maxAscension: Number.isInteger(rawMeta.maxAscension) ? Math.max(0, Math.min(5, Number(rawMeta.maxAscension))) : 0,
      hubUpgrades: {
        extraMapOption: rawUpgrades.extraMapOption === true,
        safeFirstFloor: rawUpgrades.safeFirstFloor === true,
      },
    };
    const runSeed = bodyValue.mode === 'daily' ? dailySeed(today)
      : bodyValue.mode === 'weekly' ? weeklySeed(week)
      : crypto.getRandomValues(new Uint32Array(1))[0]!;
    const claims: RunTokenClaims = {
      sub: authData.user.id,
      runId: crypto.randomUUID(),
      runSeed,
      rulesVersion: CURRENT_RULES_VERSION,
      mode: bodyValue.mode,
      challengeKey: bodyValue.challengeKey,
      issuedAtMs: now.getTime(),
      progression,
    };
    const token = await signRunToken(claims, secret);
    return Response.json({ ...claims, token }, { headers: corsHeaders });
  } catch {
    return Response.json({ error: 'No se pudo iniciar una run competitiva' }, { status: 400, headers: corsHeaders });
  }
});
