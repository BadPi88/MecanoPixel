import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface ScoreBody {
  mode: 'global' | 'daily' | 'weekly';
  challengeKey: string;
  playerName: string;
  score: number;
  wpm: number;
  wordsTyped: number;
  elapsedMs: number;
  floorReached?: number;
  runnerId?: string;
  verification: {
    runSeed: number;
    correctChars: number;
    correctKeyPresses: number;
    mistakes: number;
    defeatedAtMs: number[];
    relics: string[];
  };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function isScoreBody(value: unknown): value is ScoreBody {
  if (!value || typeof value !== 'object') return false;
  const body = value as Partial<ScoreBody>;
  return (body.mode === 'global' || body.mode === 'daily' || body.mode === 'weekly') &&
    typeof body.challengeKey === 'string' && typeof body.playerName === 'string' &&
    Number.isInteger(body.score) && Number.isInteger(body.wpm) &&
    Number.isInteger(body.wordsTyped) && Number.isInteger(body.elapsedMs) &&
    !!body.verification && Number.isInteger(body.verification.runSeed) &&
    Number.isInteger(body.verification.correctChars) &&
    Number.isInteger(body.verification.correctKeyPresses) &&
    Number.isInteger(body.verification.mistakes) &&
    Array.isArray(body.verification.defeatedAtMs) &&
    Array.isArray(body.verification.relics);
}

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405, headers: corsHeaders });

  try {
    const bodyValue: unknown = await request.json();
    if (!isScoreBody(bodyValue)) return Response.json({ error: 'Payload invalido' }, { status: 400, headers: corsHeaders });
    const body = bodyValue;
    const verification = body.verification;
    const validChars = verification.correctChars >= 0 && verification.correctChars <= 1_000_000;
    const validCounts = verification.correctKeyPresses >= 0 && verification.mistakes >= 0 &&
      verification.correctKeyPresses <= 2_000_000 && verification.mistakes <= 2_000_000;
    const validTimes = verification.defeatedAtMs.length === body.wordsTyped &&
      verification.defeatedAtMs.length <= 1_000_000 &&
      verification.defeatedAtMs.every((time, index, values) => Number.isInteger(time) && time >= 0 &&
        time <= body.elapsedMs && (index === 0 || time >= values[index - 1]!));
    const expectedWpm = body.elapsedMs > 0
      ? Math.round((verification.correctChars / 5) / (body.elapsedMs / 60_000))
      : 0;
    if (!validChars || !validCounts || !validTimes || body.wpm !== expectedWpm ||
      body.score < 0 || body.score > 1_000_000 || body.wpm > 500 ||
      body.elapsedMs < 0 || body.elapsedMs > 3_600_000 || body.wordsTyped < 0 ||
      body.wordsTyped > 1_000_000 || body.score > Math.max(body.wordsTyped, 1) * 100_000 ||
      verification.correctKeyPresses < verification.correctChars) {
      return Response.json({ error: 'La puntuacion no coincide con la telemetria' }, { status: 422, headers: corsHeaders });
    }

    const authorization = request.headers.get('Authorization');
    if (!authorization) return Response.json({ error: 'Sesion requerida' }, { status: 401, headers: corsHeaders });
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authorization } },
    });
    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError || !userData.user) return Response.json({ error: 'Sesion invalida' }, { status: 401, headers: corsHeaders });
    const { data, error } = await supabase.rpc('submit_run_score', {
      p_mode: body.mode,
      p_challenge_key: body.challengeKey,
      p_score: body.score,
      p_wpm: body.wpm,
      p_words_typed: body.wordsTyped,
      p_elapsed_ms: body.elapsedMs,
      p_floor_reached: body.floorReached ?? 0,
      p_runner_id: body.runnerId ?? null,
    });
    if (error) return Response.json({ error: error.message }, { status: 400, headers: corsHeaders });
    return Response.json({ saved: Boolean(data) }, { headers: corsHeaders });
  } catch {
    return Response.json({ error: 'No se pudo validar la puntuacion' }, { status: 400, headers: corsHeaders });
  }
});
