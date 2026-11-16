import { useEffect, useRef } from 'react';
import type { Dispatch } from 'react';
import type { GameAction, GameState } from '../types/game';
import { loadSettings } from '../services/settings';
import { resolveTypedChar } from '../utils/keyboardLayout';
import { ULTIMATE_MAX_CHARGE } from '../types/combat';

export function useKeyboard(state: GameState, dispatch: Dispatch<GameAction>) {
  const stateRef = useRef(state);
  const dispatchRef = useRef(dispatch);
  const composingRef = useRef(false);

  useEffect(() => {
    stateRef.current = state;
    dispatchRef.current = dispatch;
  }, [state, dispatch]);

  useEffect(() => {
    const sendChar = (rawChar: string) => {
      const current = stateRef.current;
      if (current.showBuildOverlay || document.querySelector('[role="dialog"][aria-modal="true"]')) return;
      if (current.status !== 'playing' && current.status !== 'boss') return;
      const char = rawChar.toLocaleLowerCase('es-ES').normalize('NFC');
      if (!/^[a-zñáéíóúü]$/.test(char)) return;
      dispatchRef.current({
        type: 'TYPE_CHAR',
        payload: current.keyRemap?.[char] ?? char,
      });
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing || composingRef.current) return;
      const current = stateRef.current;
      const modal = document.querySelector('[role="dialog"][aria-modal="true"]');
      if (event.key === 'Escape') {
        if (current.showBuildOverlay) {
          event.preventDefault();
          dispatchRef.current({ type: 'TOGGLE_BUILD_OVERLAY' });
          return;
        }
        if (modal) return;
        if (current.status === 'playing' || current.status === 'paused') {
          event.preventDefault();
          dispatchRef.current({ type: 'TOGGLE_PAUSE' });
        }
        return;
      }
      if (current.showBuildOverlay || modal) return;
      if (current.status !== 'playing' && current.status !== 'boss') return;
      if (event.key === 'Tab') {
        event.preventDefault();
        if (current.ultimateCharge >= ULTIMATE_MAX_CHARGE) dispatchRef.current({ type: 'ULTIMATE_FIRE' });
        return;
      }
      if (event.key === 'Backspace') {
        event.preventDefault();
        dispatchRef.current({ type: 'BACKSPACE' });
        return;
      }
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        dispatchRef.current({ type: 'SUBMIT' });
        return;
      }
      const char = resolveTypedChar(event, loadSettings().keyboardLayout);
      if (char) {
        event.preventDefault();
        sendChar(char);
      }
    };
    const onCompositionStart = () => { composingRef.current = true; };
    const onCompositionEnd = (event: CompositionEvent) => {
      composingRef.current = false;
      for (const char of event.data) sendChar(char);
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('compositionstart', onCompositionStart);
    document.addEventListener('compositionend', onCompositionEnd);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('compositionstart', onCompositionStart);
      document.removeEventListener('compositionend', onCompositionEnd);
    };
  }, []);
}
