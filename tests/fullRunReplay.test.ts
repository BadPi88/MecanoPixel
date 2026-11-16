import { describe, expect, it } from 'vitest';
import { getDefaultMeta } from '../src/services/meta';
import { getDifficultyTier } from '../src/utils/difficulty';
import { getEffectiveDifficulty } from '../src/utils/perkModifiers';
import { hasPerkWithCharge } from '../src/utils/perkModifiers';
import { getFloorTierOffset } from '../src/utils/runTransitions';
import { getRelicFallSpeedMult } from '../src/utils/combatModifiers';
import { getBiomeSpeedMult } from '../src/utils/biomeModifiers';
import { getEliteSpawnMult } from '../src/utils/eliteModifiers';
import { createSeededRandom } from '../src/engine/rng';
import { gameReducer } from '../src/engine/gameReducer';
import { replayRun, type ReplayExpectation } from '../src/engine/replay';
import { initialGameState, type GameAction, type GameState } from '../src/types/game';
import type { RunReplayEvent } from '../shared/runReplay';

const GROUND = 552;

describe('full deterministic run replay', () => {
  it('replays a complete floor 1 to 12 run with map rooms and a boss projectile', () => {
    const progression = getDefaultMeta();
    const seed = 81_337;
    let state: GameState = initialGameState;
    const events: RunReplayEvent[] = [];
    const visitedRooms = new Set<string>();
    let eventClock = 0;

    const send = (action: GameAction) => {
      events.push({ sequence: events.length, elapsedMs: Math.max(eventClock, state.elapsedMs), action });
      state = gameReducer(state, action);
      eventClock = Math.max(eventClock, state.elapsedMs);
    };

    send({ type: 'BEGIN_RUN', payload: {
      runSeed: seed,
      unlockedRelics: progression.unlockedRelics as GameState['unlockedRelics'],
      hubUpgrades: progression.hubUpgrades,
    } });
    send({ type: 'SELECT_RUNNER', payload: 'veloz' });
    send({ type: 'SELECT_GLOSSARY', payload: 'general', startedAtMs: 0 });

    let ticks = 0;
    while (state.status !== 'victory' && state.status !== 'gameOver' && ticks < 900) {
      if (state.status === 'perkPick') {
        const choice = state.pendingPerkChoice?.[0];
        if (!choice) throw new Error('perk choice missing');
        send({ type: 'SELECT_PERK', payload: choice });
        continue;
      }
      if (state.status === 'mapPick') {
        const preferred = ['shop', 'event', 'treasure', 'elite'].find((type) =>
          !visitedRooms.has(type) && state.mapRoomOptions.some((option) => option.type === type));
        const room = state.mapRoomOptions.find((option) => option.type === preferred)
          ?? state.mapRoomOptions[0];
        if (!room) throw new Error('map choice missing');
        visitedRooms.add(room.type);
        send({ type: 'PICK_ROOM', payload: room.id });
        continue;
      }
      if (state.status === 'shop') { send({ type: 'SHOP_LEAVE' }); continue; }
      if (state.status === 'event') { send({ type: 'EVENT_CHOICE', payload: 'A' }); continue; }
      if (state.status === 'relicPick') {
        const relic = state.pendingRelicChoice?.[0];
        if (!relic) throw new Error('relic choice missing');
        send({ type: 'SELECT_RELIC', payload: relic });
        continue;
      }
      if (state.status === 'boss') {
        if (state.bossAttack?.projectiles && state.projectileCount === 0) {
          const rand = createSeededRandom((state.runSeed + Math.imul(state.projectileCount + 1, 0x85ebca6b)) >>> 0);
          const x = rand() * 700;
          const char = ['q', 'x', 'j', 'z', 'k', 'w', 'b', 'v'][Math.floor(rand() * 8)]!;
          const vy = 60 + rand() * 30;
          send({ type: 'SPAWN_PROJECTILE', payload: { id: `boss-projectile-${state.floor}`, char, x, y: -24, vy } });
        }
        const word = state.bossWord;
        if (!word) throw new Error('boss target missing');
        for (const char of word.text) send({ type: 'TYPE_CHAR', payload: char });
        send({ type: 'SUBMIT' });
        continue;
      }

      if (state.status !== 'playing') throw new Error(`unexpected state ${state.status}`);
      const deltaMs = 1_000;
      const nextElapsed = state.elapsedMs + deltaMs;
      const nextDifficulty = state.difficultyElapsedMs + deltaMs * state.flowStats.progressionRate;
      const offset = getFloorTierOffset(state);
      const nextTier = getDifficultyTier(nextDifficulty, offset).tier;
      let tickOffset = offset;
      let effective = getEffectiveDifficulty(nextElapsed, tickOffset, state.activePerks, state.frozenUntilMs, state.runnerId, {
        difficultyElapsedMs: nextDifficulty,
        tempoBuffUntilMs: state.tempoBuffUntilMs,
        flowSpawnMult: state.flowStats.spawnMult,
        flowSpeedMult: state.flowStats.speedMult,
        relicFallMult: getRelicFallSpeedMult(state.activeRelics),
        biomeSpeedMult: getBiomeSpeedMult(state.biomeId),
        eliteSpawnMult: getEliteSpawnMult(state.eliteModifierId),
      });
      if (nextTier > state.lastTier) {
        if (hasPerkWithCharge(state.activePerks, 'broken_clock')) {
          send({ type: 'BROKEN_CLOCK_SKIP', payload: { tier: nextTier } });
          tickOffset += 1;
          effective = getEffectiveDifficulty(nextElapsed, tickOffset, state.activePerks, state.frozenUntilMs, state.runnerId, {
            difficultyElapsedMs: nextDifficulty,
            tempoBuffUntilMs: state.tempoBuffUntilMs,
            flowSpawnMult: state.flowStats.spawnMult,
            flowSpeedMult: state.flowStats.speedMult,
            relicFallMult: getRelicFallSpeedMult(state.activeRelics),
            biomeSpeedMult: getBiomeSpeedMult(state.biomeId),
            eliteSpawnMult: getEliteSpawnMult(state.eliteModifierId),
          });
        } else {
        const rampEffective = getEffectiveDifficulty(state.elapsedMs, offset, state.activePerks, state.frozenUntilMs, state.runnerId, {
          difficultyElapsedMs: nextDifficulty,
          tempoBuffUntilMs: state.tempoBuffUntilMs,
          flowSpawnMult: state.flowStats.spawnMult,
          flowSpeedMult: state.flowStats.speedMult,
          relicFallMult: getRelicFallSpeedMult(state.activeRelics),
          biomeSpeedMult: getBiomeSpeedMult(state.biomeId),
          eliteSpawnMult: getEliteSpawnMult(state.eliteModifierId),
        });
        send({ type: 'SPEED_RAMP', payload: { fallSpeed: rampEffective.fallSpeed, spawnInterval: rampEffective.spawnInterval, tier: nextTier } });
        }
      }
      send({ type: 'TICK', payload: { deltaMs, fallSpeed: effective.fallSpeed, groundHeight: GROUND } });
      ticks += 1;
    }

    expect(state.status).toBe('victory');
    expect(state.floor).toBe(12);
    for (const requiredRoom of ['shop', 'event', 'treasure', 'elite', 'boss']) {
      expect(visitedRooms.has(requiredRoom), `missing room ${requiredRoom}`).toBe(true);
    }
    expect(events.some((event) => (event.action as GameAction).type === 'SPAWN_PROJECTILE')).toBe(true);

    const expected: ReplayExpectation = {
      mode: 'global', challengeKey: '', runSeed: seed, score: state.score,
      wordsTyped: state.wordsTyped, correctChars: state.correctChars, elapsedMs: state.elapsedMs,
    };
    const replay = replayRun(events, expected, progression);
    expect(replay, JSON.stringify(replay)).toMatchObject({ valid: true });
  }, 30_000);
});
