import { type GameAction, type GameState } from '../../types/game.ts';
import { getBossFallSpeed } from '../../data/bosses.ts';
import { clearBossEncounter } from './shared.ts';
import { GAME_BALANCE } from '../../config/gameBalance.ts';

export function reduceBossAction(state: GameState, action: GameAction): GameState | null {
  switch (action.type) {
case 'BOSS_TICK': {
      if (state.status !== 'boss' || state.bossWords.length === 0) return state;
      const deltaSec = action.payload.deltaMs / 1000;
      const fallSpeed = getBossFallSpeed(
        state.bossId,
        state.activeBossWordIndex,
      );
      const bossWords = state.bossWords.map((w, index) => index < state.activeBossWordIndex
        ? w
        : { ...w, y: w.y + fallSpeed * deltaSec });
      const activeIdx = state.activeBossWordIndex;
      const bossWord = bossWords[activeIdx] ?? bossWords[0] ?? null;
      const newElapsed = state.elapsedMs + action.payload.deltaMs;

      let inputBlindedUntilMs = state.inputBlindedUntilMs;
      let bossAttack = state.bossAttack;
      let keyRemap = state.keyRemap;
      const bossTelegraphX =
        state.bossTelegraphX !== null &&
        newElapsed >= state.bossTelegraphUntilMs
          ? null
          : state.bossTelegraphX;

      if (bossAttack) {
        if (bossAttack.blind && newElapsed >= bossAttack.nextBlindAtMs) {
          inputBlindedUntilMs = newElapsed + GAME_BALANCE.boss.blindDurationMs;
          bossAttack = {
            ...bossAttack,
            nextBlindAtMs: bossAttack.nextBlindAtMs + GAME_BALANCE.boss.blindIntervalMs,
          };
        }
        if (keyRemap && newElapsed >= bossAttack.remapUntilMs) {
          if (state.input.length > 0) {
            bossAttack = { ...bossAttack, remapUntilMs: newElapsed + 750 };
          } else {
            keyRemap = null;
          }
        }
      }

      // Proyectiles tambien caen durante el jefe (pisos 9+)
      const deltaSecProj = deltaSec;
      let lives = state.lives;
      const surviving: typeof state.letterProjectiles = [];
      for (const proj of state.letterProjectiles) {
        const newY = proj.y + proj.vy * deltaSecProj;
        if (newY >= action.payload.groundHeight - GAME_BALANCE.typing.projectileHeight) {
          lives -= 1;
        } else {
          surviving.push({ ...proj, y: newY });
        }
      }

      if (lives <= 0) {
        return {
          ...state,
          lastGroundHeight: action.payload.groundHeight,
          lives: 0,
          status: 'gameOver',
          deathCause: 'projectile',
          ...clearBossEncounter(),
          letterProjectiles: [],
        };
      }

      return {
        ...state,
        lastGroundHeight: action.payload.groundHeight,
        bossWords,
        bossWord,
        elapsedMs: newElapsed,
        inputBlindedUntilMs,
        bossAttack,
        keyRemap,
        bossTelegraphX,
        lives,
        letterProjectiles: surviving,
      };
    }
case 'BOSS_TELEGRAPH':
      if (state.status !== 'boss') return state;
      return {
        ...state,
        bossTelegraphX: action.payload.x,
        bossTelegraphUntilMs: action.payload.untilMs,
      };
case 'BOSS_FAIL':
      return {
        ...state,
        status: 'gameOver',
        deathCause: 'boss',
        ...clearBossEncounter(),
        input: '',
      };
    default: return null;
  }
}
