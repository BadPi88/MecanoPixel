import type { GlossaryId, RelicId } from '../types/combat.ts';
import { RELIC_IDS } from '../data/relics.ts';
import { RUNNER_CATALOG } from '../data/runners.ts';
import { GLOSSARY_CATALOG } from '../data/glossaries.ts';
import { loadMeta, saveMeta } from './meta.ts';
import { supabase } from './supabaseClient.ts';
import type { RankedRunMode, RankedRunTicket, StartRankedRunResponse } from '../../shared/runReplay';

function isTicket(value: unknown): value is StartRankedRunResponse {
  if (!value || typeof value !== 'object') return false;
  const ticket = value as Partial<StartRankedRunResponse>;
  return typeof ticket.runId === 'string' && typeof ticket.token === 'string' &&
    Number.isInteger(ticket.runSeed) && Number.isInteger(ticket.rulesVersion) &&
    ['global', 'daily', 'weekly'].includes(ticket.mode ?? '') &&
    typeof ticket.challengeKey === 'string' && Number.isSafeInteger(ticket.issuedAtMs) &&
    !!ticket.progression && Array.isArray(ticket.progression.unlockedRelics) &&
    Array.isArray(ticket.progression.unlockedRunners) && Array.isArray(ticket.progression.unlockedGlossaries) &&
    Number.isInteger(ticket.progression.maxAscension) &&
    !!ticket.progression.hubUpgrades;
}

/** Obtiene ticket firmado; sin conexión o sesión, la partida queda local y no rankeada. */
export async function startRankedRun(
  mode: RankedRunMode,
  challengeKey: string,
): Promise<RankedRunTicket | null> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return null;
  if (!supabase) return null;
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return null;

  const { data, error } = await supabase.functions.invoke('start-run', {
    body: { mode, challengeKey },
  });
  if (error) throw new Error(error.message);
  if (!isTicket(data) || data.mode !== mode || data.challengeKey !== challengeKey) {
    throw new Error('El servidor devolvio un ticket de partida invalido');
  }

  const meta = loadMeta();
  meta.unlockedRelics = [...new Set(data.progression.unlockedRelics.filter((id): id is RelicId => RELIC_IDS.includes(id as RelicId)))];
  meta.unlockedRunners = [...new Set(data.progression.unlockedRunners.filter((id): id is typeof meta.unlockedRunners[number] => id in RUNNER_CATALOG))];
  meta.unlockedGlossaries = [...new Set(data.progression.unlockedGlossaries.filter((id): id is GlossaryId => id in GLOSSARY_CATALOG))];
  meta.maxAscension = data.progression.maxAscension;
  meta.hubUpgrades = {
    ...meta.hubUpgrades,
    extraMapOption: data.progression.hubUpgrades.extraMapOption === true,
    safeFirstFloor: data.progression.hubUpgrades.safeFirstFloor === true,
  };
  saveMeta(meta);

  return {
    runId: data.runId,
    token: data.token,
    runSeed: data.runSeed,
    rulesVersion: data.rulesVersion,
    mode: data.mode,
    challengeKey: data.challengeKey,
    issuedAtMs: data.issuedAtMs,
  };
}
