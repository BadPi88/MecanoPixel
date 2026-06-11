import { useEffect } from 'react';
import type { Dispatch } from 'react';
import type { GameAction, GameState } from '../types/game';
import type { PerkId } from '../types/perks';
import { loadSettings } from '../services/settings';
import { resolveTypedChar } from '../utils/keyboardLayout';
import { ULTIMATE_MAX_CHARGE } from '../types/combat';

export function useKeyboard(
  state: GameState,
  dispatch: Dispatch<GameAction>,
) {
  useEffect(() => {
    const layout = loadSettings().keyboardLayout;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      if (state.status === 'perkPick' && state.pendingPerkChoice) {
        const index = Number(event.key) - 1;
        if (index >= 0 && index < state.pendingPerkChoice.length) {
          event.preventDefault();
          dispatch({
            type: 'SELECT_PERK',
            payload: state.pendingPerkChoice[index] as PerkId,
          });
        }
        return;
      }

      if (state.status === 'oraclePick') {
        if (event.key === '1' || event.key.toLowerCase() === 'a') {
          event.preventDefault();
          dispatch({ type: 'ORACLE_CHOICE', payload: 'score' });
        } else if (event.key === '2' || event.key.toLowerCase() === 'b') {
          event.preventDefault();
          dispatch({ type: 'ORACLE_CHOICE', payload: 'charge' });
        }
        return;
      }

      if (state.status === 'relicPick' && state.pendingRelicChoice) {
        const index = Number(event.key) - 1;
        if (index >= 0 && index < state.pendingRelicChoice.length) {
          event.preventDefault();
          dispatch({
            type: 'SELECT_RELIC',
            payload: state.pendingRelicChoice[index],
          });
        }
        return;
      }

      if (event.key === 'Escape') {
        if (state.status === 'playing' || state.status === 'paused') {
          event.preventDefault();
          dispatch({ type: 'TOGGLE_PAUSE' });
        }
        return;
      }

      if (state.status !== 'playing' && state.status !== 'boss') return;

      // Ataque definitivo con TAB (la U es una letra jugable)
      if (event.key === 'Tab') {
        event.preventDefault();
        if (state.ultimateCharge >= ULTIMATE_MAX_CHARGE) {
          dispatch({ type: 'ULTIMATE_FIRE' });
        }
        return;
      }

      if (event.key === 'Backspace') {
        event.preventDefault();
        dispatch({ type: 'BACKSPACE' });
        return;
      }

      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        dispatch({ type: 'SUBMIT' });
        return;
      }

      let char = resolveTypedChar(event, layout);
      if (char) {
        // Ataque del jefe: teclas intercambiadas temporalmente
        if (state.keyRemap && state.keyRemap[char]) {
          char = state.keyRemap[char];
        }
        event.preventDefault();
        dispatch({ type: 'TYPE_CHAR', payload: char });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    state.status,
    state.pendingPerkChoice,
    state.pendingRelicChoice,
    state.ultimateCharge,
    state.keyRemap,
    dispatch,
  ]);
}
