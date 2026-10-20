import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ErrorCode } from '../../commands/kinisi_commands';
import { ControllerError } from '../../commands/kinisi_session';
import BoardTemperature from './BoardTemperature';

const controller = getTemperature => ({
  boardInfo: { board_model: 1, board_major: 0, board_minor: 4, board_patch: 0, protocol_major: 2, protocol_minor: 4 }, get_temperature: getTemperature,
});
const read = () => fireEvent.click(screen.getByRole('button', { name: 'Read temperature' }));

describe('Sensors board temperature display', () => {
  it('reads only on request and shows a signed Celsius reading', async () => {
    let resolve;
    const getTemperature = vi.fn(() => new Promise(done => { resolve = done; }));
    render(<BoardTemperature controller={controller(getTemperature)} />);
    expect(getTemperature).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Latest board temperature')).toHaveTextContent('No reading yet');
    read();
    expect(getTemperature).toHaveBeenCalledWith(0);
    expect(screen.getByRole('button', { name: 'Reading…' })).toBeDisabled();
    await act(async () => resolve(-0.0625));
    expect(screen.getByLabelText('Latest board temperature')).toHaveTextContent('-0.06 °C');
    expect(screen.getByRole('button', { name: 'Read temperature' })).toBeEnabled();
  });

  it.each([
    [ErrorCode.SENSOR_NOT_AVAILABLE, 'no temperature sensor'],
    [ErrorCode.SAMPLE_NOT_AVAILABLE, 'not ready yet'],
    [ErrorCode.INTERNAL_ERROR, 'Could not read the temperature sensor'],
  ])('clears old values and reports sensor error %s with retry support', async (code, message) => {
    const getTemperature = vi.fn().mockResolvedValueOnce(25)
      .mockRejectedValueOnce(new ControllerError(code, 0x50, 2)).mockResolvedValueOnce(26);
    render(<BoardTemperature controller={controller(getTemperature)} />);
    read();
    await waitFor(() => expect(screen.getByLabelText('Latest board temperature')).toHaveTextContent('25.00 °C'));
    read();
    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(screen.getByLabelText('Latest board temperature')).toHaveTextContent('No reading yet');
    read();
    await waitFor(() => expect(screen.getByLabelText('Latest board temperature')).toHaveTextContent('26.00 °C'));
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('does not offer temperature on older firmware', () => {
    render(<BoardTemperature controller={{ boardInfo: { board_model: 1, board_major: 0, board_minor: 4, board_patch: 0, protocol_major: 2, protocol_minor: 3 } }} />);
    expect(screen.queryByRole('button', { name: 'Read temperature' })).toBeNull();
  });

  it('discards a late reading from a previous controller', async () => {
    let finishOld;
    const old = controller(vi.fn(() => new Promise(resolve => { finishOld = resolve; })));
    const next = controller(vi.fn().mockResolvedValue(10));
    const view = render(<BoardTemperature controller={old} />);
    read();
    view.rerender(<BoardTemperature controller={next} />);
    expect(screen.getByLabelText('Latest board temperature')).toHaveTextContent('No reading yet');
    read();
    await waitFor(() => expect(screen.getByLabelText('Latest board temperature')).toHaveTextContent('10.00 °C'));
    await act(async () => finishOld(99));
    expect(screen.getByLabelText('Latest board temperature')).toHaveTextContent('10.00 °C');
  });

  it('reports malformed readings without displaying NaN', async () => {
    render(<BoardTemperature controller={controller(vi.fn().mockResolvedValue(NaN))} />);
    read();
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid temperature reading');
    expect(screen.getByLabelText('Latest board temperature')).toHaveTextContent('No reading yet');
  });
});
