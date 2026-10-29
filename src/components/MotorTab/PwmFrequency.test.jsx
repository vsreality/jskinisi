import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { it, expect, vi } from 'vitest';
import PwmFrequency from './PwmFrequency';

const boardInfo = { board_model: 1, board_major: 0, board_minor: 4, board_patch: 0, protocol_major: 2, protocol_minor: 13 };
it('reads and applies a board-wide frequency and clears unverified results on failure', async () => {
  const c = { boardInfo, get_pwm_frequency: vi.fn().mockResolvedValue(100000), set_pwm_frequency: vi.fn().mockResolvedValue(25000) };
  render(<PwmFrequency controller={c} />);
  fireEvent.click(screen.getByText('Read PWM frequency'));
  await waitFor(() => expect(screen.getByLabelText('Applied PWM frequency')).toHaveTextContent('100 kHz'));
  fireEvent.change(screen.getByLabelText('Frequency'), { target: { value: '25000' } });
  fireEvent.click(screen.getByText('Apply PWM frequency'));
  await waitFor(() => expect(c.set_pwm_frequency).toHaveBeenCalledWith(25000));
  await waitFor(() => expect(screen.getByText('PWM frequency applied. All motors remain stopped.')).toBeInTheDocument());
  c.set_pwm_frequency.mockRejectedValue(new Error('Disconnected'));
  fireEvent.click(screen.getByText('Apply PWM frequency'));
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Disconnected'));
  expect(screen.queryByText('Apply PWM frequency')).not.toBeInTheDocument();
});

it('ignores old pending responses across reconnect and gates older firmware', async () => {
  let resolve;
  const c = { boardInfo, get_pwm_frequency: vi.fn().mockImplementationOnce(() => new Promise(r => { resolve = r; })).mockResolvedValue(25000) };
  const view = render(<PwmFrequency controller={c} />);
  fireEvent.click(screen.getByText('Read PWM frequency'));
  c.boardInfo = { ...boardInfo };
  view.rerender(<PwmFrequency controller={c} />);
  fireEvent.click(screen.getByText('Read PWM frequency'));
  await waitFor(() => expect(screen.getByLabelText('Applied PWM frequency')).toHaveTextContent('25 kHz'));
  resolve(100000);
  await waitFor(() => expect(screen.getByLabelText('Applied PWM frequency')).toHaveTextContent('25 kHz'));
  c.boardInfo = { ...boardInfo, protocol_minor: 12 };
  view.rerender(<PwmFrequency controller={c} />);
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
  c.boardInfo = { ...boardInfo, board_minor: 99 };
  view.rerender(<PwmFrequency controller={c} />);
  expect(screen.queryByText('PWM frequency — all motors')).not.toBeInTheDocument();
});
