import { useEffect } from 'react';
import type { Dispatch } from 'react';
import type { GameAction, GameState } from '../types/game';
import type { PerkId } from '../types/perks';

export function useKeyboard(
  state: GameState,
  dispatch: Dispatch<GameAction>,
) {
  useEffect(() => {
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

      if (event.key === 'Escape') {
        if (state.status === 'playing' || state.status === 'paused') {
          event.preventDefault();
          dispatch({ type: 'TOGGLE_PAUSE' });
        }
        return;
      }

      if (state.status !== 'playing' && state.status !== 'boss') return;

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

      if (event.key.length === 1 && /^[a-zA-ZñÑáéíóúÁÉÍÓÚüÜ]$/.test(event.key)) {
        event.preventDefault();
        dispatch({
          type: 'TYPE_CHAR',
          payload: event.key
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, ''),
        });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [state.status, state.pendingPerkChoice, dispatch]);
}
