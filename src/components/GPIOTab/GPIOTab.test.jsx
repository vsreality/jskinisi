// File: GPIOTab.test.jsx
// Controller ERROR replies must be visible rather than becoming unhandled promises.
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import GPIOTab from './GPIOTab';
import { ControllerContext } from '../../contexts/ControllerContext';

describe('GPIO command errors', () => {
  it('shows a rejected LED command', async () => {
    const controller = { toggle_status_led_state: vi.fn().mockRejectedValue(new Error('Controller unavailable')) };
    render(<ControllerContext.Provider value={{ controller }}><GPIOTab /></ControllerContext.Provider>);
    fireEvent.click(screen.getByRole('button', { name: 'Toggle Status LED' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Controller unavailable');
  });
});
