import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { replayRun } from '../../../src/engine/replay.ts';
import { getDefaultMeta } from '../../../src/services/meta.ts';
import { verifyRunToken } from '../_shared/runToken.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405, headers: corsHeaders });
  try {
    const raw = await request.text();
    if (raw.length > 4_000_000) return Response.json({ error: 'Payload demasiado grande' }, { status: 413, headers: corsHeaders });
    const body = JSON.parse(raw) as Record<string, unknown>;
    const verification = body.verification as Record<string, unknown> | undefined;
    const ticket = verification?.rankedRun as { token?: unknown; runId?: unknown } | undefined;
    const events = verification?.replayEvents;
    if (!verification || !ticket || typeof ticket.token !== 'string' || typeof ticket.runId !== 'string' ||
      !Array.isArray(events) || events.length === 0 || events.length > 250_000 ||
      !['global', 'daily', 'weekly'].includes(String(body.mode)) || typeof body.challengeKey !== 'string') {
      return Response.json({ error: 'Replay o ticket invalido' }, { status: 400, headers: corsHeaders });
    }
    const secret = Deno.env.get('RUN_TOKEN_SECRET');
    const url = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!secret || !url || !anonKey) return Response.json({ error: 'Servicio competitivo no configurado' }, { status: 503, headers: corsHeaders });
    const claims = await verifyRunToken(ticket.token, secret);
    if (!claims || claims.runId !== ticket.runId || claims.mode !== body.mode || claims.challengeKey !== body.challengeKey ||
      claims.runSeed !== verification.runSeed || claims.issuedAtMs > Date.now() || Date.now() - claims.issuedAtMs > 14 * 86400_000) {
      return Response.json({ error: 'Ticket de run invalido o expirado' }, { status: 422, headers: corsHeaders });
    }
    const authorization = request.headers.get('Authorization');
    if (!authorization) return Response.json({ error: 'Sesion requerida' }, { status: 401, headers: corsHeaders });
    const supabase = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } });
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user || authData.user.id !== claims.sub) return Response.json({ error: 'Sesion invalida' }, { status: 401, headers: corsHeaders });
    const meta = getDefaultMeta();
    meta.unlockedRelics = claims.progression.unlockedRelics as typeof meta.unlockedRelics;
    meta.unlockedRunners = claims.progression.unlockedRunners as typeof meta.unlockedRunners;
    meta.unlockedGlossaries = claims.progression.unlockedGlossaries as typeof meta.unlockedGlossaries;
    meta.maxAscension = claims.progression.maxAscension;
    meta.hubUpgrades = claims.progression.hubUpgrades;
    const result = replayRun(events as never[], {
      mode: claims.mode,
      challengeKey: claims.challengeKey,
      runSeed: claims.runSeed,
      score: Number(body.score),
      wordsTyped: Number(body.wordsTyped),
      correctChars: Number(verification.correctChars),
      elapsedMs: Number(body.elapsedMs),
    }, meta);
    if (!result.valid || Number(verification.correctKeyPresses) !== result.state.correctKeyPresses ||
      Number(verification.mistakes) !== result.state.mistakes ||
      Number(body.wpm) !== (result.state.elapsedMs > 0 ? Math.round(result.state.correctChars * 12_000 / result.state.elapsedMs) : 0)) {
      return Response.json({ error: 'La reproduccion no coincide con el resultado' }, { status: 422, headers: corsHeaders });
    }
    const { data, error } = await supabase.rpc('submit_verified_run_score', {
      p_run_id: claims.runId, p_rules_version: claims.rulesVersion, p_mode: claims.mode,
      p_challenge_key: claims.challengeKey, p_score: result.state.score,
      p_wpm: Number(body.wpm), p_words_typed: result.state.wordsTyped,
      p_elapsed_ms: result.state.elapsedMs, p_floor_reached: result.state.floor,
      p_runner_id: result.state.runnerId,
    });
    if (error) return Response.json({ error: error.message }, { status: 400, headers: corsHeaders });
    return Response.json({ saved: Boolean(data) }, { headers: corsHeaders });
  } catch {
    return Response.json({ error: 'No se pudo validar la puntuacion' }, { status: 400, headers: corsHeaders });
  }
});
