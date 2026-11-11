import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PerkPicker } from '../src/components/PerkPicker';
import { useKeyboard } from '../src/hooks/useKeyboard';
import { initialGameState, type GameAction } from '../src/types/game';
import type { Dispatch } from 'react';

function KeyboardModal({ dispatch }: { dispatch: Dispatch<GameAction> }) {
  useKeyboard({ ...initialGameState, status: 'playing', ultimateCharge: 100 }, dispatch);
  return <div role="dialog" aria-modal="true"><button type="button">Elegir</button></div>;
}

describe('dialogos de seleccion', () => {
  it('anuncia el dialogo, enfoca la primera opcion y mantiene el foco dentro', async () => {
    const onSelect = vi.fn();
    render(<PerkPicker choices={['shield', 'purge']} onSelect={onSelect} />);
    const dialog = screen.getByRole('dialog', { name: '¡MAS RAPIDO!' });
    const choices = screen.getAllByRole('button');
    expect(document.activeElement).toBe(choices[0]);
    choices[choices.length - 1].focus();
    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(document.activeElement).toBe(choices[0]);
    await userEvent.setup().keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith('shield');
  });

  it('no convierte teclas del dialogo en acciones de combate', () => {
    const dispatch = vi.fn();
    render(<KeyboardModal dispatch={dispatch} />);
    fireEvent.keyDown(screen.getByRole('button', { name: 'Elegir' }), { key: 'Tab' });
    fireEvent.keyDown(screen.getByRole('button', { name: 'Elegir' }), { key: 'a' });
    fireEvent.keyDown(screen.getByRole('button', { name: 'Elegir' }), { key: 'Escape' });
    expect(dispatch).not.toHaveBeenCalled();
  });
});
