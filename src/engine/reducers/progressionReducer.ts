import { type GameAction, type GameState } from '../../types/game.ts';
import { PERKS_EVERY_N_RAMPS, pickPerkChoices } from '../../data/perks.ts';
import { wordsPerSecondFromSpawnInterval } from '../../utils/intensity.ts';
import { applyEventChoice, applyNextFloorStartModifiers, applyRoomFromMap, applyShopItem, completeFloor, enterPostFloor, randomFor } from './shared.ts';
import { finishRoomToCombat, shouldCompleteFloor } from '../../utils/runTransitions.ts';
import { applyBrokenClockSkip, applyPerkSelection } from '../../utils/perkModifiers.ts';

export function reduceProgressionAction(state: GameState, action: GameAction): GameState | null {
  switch (action.type) {
case 'SPEED_RAMP': {
      const rampsThisFloor = state.rampsThisFloor + 1;
      const rampCount = state.rampCount + 1;
      const offerPerk = rampCount >= PERKS_EVERY_N_RAMPS;

      const next: GameState = {
        ...state,
        maxWordsPerSecond: Math.max(
          state.maxWordsPerSecond,
          wordsPerSecondFromSpawnInterval(action.payload.spawnInterval),
        ),
        showSpeedNotice: true,
        rampBlockedNotice: false,
        rampsThisFloor,
        lastTier: action.payload.tier,
        rampCount: offerPerk ? 0 : rampCount,
        status: offerPerk ? 'perkPick' : 'playing',
        pendingPerkChoice: offerPerk
          ? pickPerkChoices(
              state.activePerks,
              3,
              state.floor,
              state.ascensionLevel,
              randomFor(state, 0x402),
            )
          : null,
      };

      if (!offerPerk && shouldCompleteFloor(next)) {
        return completeFloor(next);
      }

      return next;
    }
case 'BROKEN_CLOCK_SKIP':
      return { ...state, lastTier: action.payload.tier, ...applyBrokenClockSkip(state) };
case 'SELECT_PERK': {
      const partial = applyPerkSelection(state, action.payload);
      const next: GameState = {
        ...state,
        ...partial,
        perksHistory: [...state.perksHistory, action.payload],
        status: 'playing',
        pendingPerkChoice: null,
      };
      if (shouldCompleteFloor(next)) {
        return completeFloor(next);
      }
      return next;
    }
case 'SELECT_RELIC': {
      if (state.status !== 'relicPick') return state;
      const relicId = action.payload;
      const nextStatus = state.postRelicStatus ?? 'playing';
      const withRelic: GameState = {
        ...state,
        activeRelics: state.activeRelics.includes(relicId)
          ? state.activeRelics
          : [...state.activeRelics, relicId],
        relicsHistory: [...state.relicsHistory, relicId],
        pendingRelicChoice: null,
        postRelicStatus: null,
        postRelicAdvance: false,
      };
      if (state.postRelicAdvance) {
        return {
          ...withRelic,
          ...finishRoomToCombat(withRelic, applyNextFloorStartModifiers(withRelic)),
        };
      }
      return { ...withRelic, ...enterPostFloor(withRelic, nextStatus) };
    }
case 'SHOP_BUY': {
      const result = applyShopItem(state, action.payload);
      if (!result) return state;
      return result;
    }
case 'SHOP_LEAVE':
      return {
        ...state,
        ...finishRoomToCombat(state, applyNextFloorStartModifiers(state)),
      };
case 'PICK_ROOM':
      if (state.status !== 'mapPick') return state;
      return applyRoomFromMap(state, action.payload);
case 'EVENT_CHOICE':
      return applyEventChoice(state, action.payload);
case 'CONTINUE_ENDLESS': {
      if (state.status !== 'victory') return state;
      const continued = { ...state, endlessMode: true };
      return {
        ...continued,
        ...finishRoomToCombat(
          continued,
          applyNextFloorStartModifiers(continued),
        ),
      };
    }
    default: return null;
  }
}
