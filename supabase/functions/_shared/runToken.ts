export const CURRENT_RULES_VERSION = 2;

export interface ProgressionSnapshot {
  unlockedRelics: string[];
  unlockedRunners: string[];
  unlockedGlossaries: string[];
  maxAscension: number;
  hubUpgrades: { extraMapOption: boolean; safeFirstFloor: boolean };
}

export interface RunTokenClaims {
  sub: string;
  runId: string;
  runSeed: number;
  rulesVersion: number;
  mode: 'global' | 'daily' | 'weekly';
  challengeKey: string;
  issuedAtMs: number;
  progression: ProgressionSnapshot;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value: string): Uint8Array {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function importSigningKey(secret: string, usage: KeyUsage[]): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, usage);
}

export async function signRunToken(claims: RunTokenClaims, secret: string): Promise<string> {
  const payload = toBase64Url(new TextEncoder().encode(JSON.stringify(claims)));
  const key = await importSigningKey(secret, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return `${payload}.${toBase64Url(new Uint8Array(signature))}`;
}

export async function verifyRunToken(token: string, secret: string): Promise<RunTokenClaims | null> {
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra !== undefined) return null;
  try {
    const key = await importSigningKey(secret, ['verify']);
    const valid = await crypto.subtle.verify('HMAC', key, fromBase64Url(signature), new TextEncoder().encode(payload));
    if (!valid) return null;
    const claims: unknown = JSON.parse(new TextDecoder().decode(fromBase64Url(payload)));
    if (!claims || typeof claims !== 'object') return null;
    const value = claims as Partial<RunTokenClaims>;
    if (typeof value.sub !== 'string' || typeof value.runId !== 'string' ||
      !Number.isInteger(value.runSeed) || value.rulesVersion !== CURRENT_RULES_VERSION ||
      !['global', 'daily', 'weekly'].includes(value.mode ?? '') ||
      typeof value.challengeKey !== 'string' || !Number.isSafeInteger(value.issuedAtMs) ||
      !value.progression || !Array.isArray(value.progression.unlockedRelics) ||
      !Array.isArray(value.progression.unlockedRunners) || !Array.isArray(value.progression.unlockedGlossaries) ||
      !Number.isInteger(value.progression.maxAscension) || !value.progression.hubUpgrades) return null;
    return value as RunTokenClaims;
  } catch {
    return null;
  }
}
