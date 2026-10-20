import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ErrorCode } from '../../commands/kinisi_commands';
import { ControllerError } from '../../commands/kinisi_session';
import BoardImu from './BoardImu';

const sample = { acceleration_x: -1.25, acceleration_y: 0, acceleration_z: 9.80665,
  angular_velocity_x: 0.125, angular_velocity_y: -0.25, angular_velocity_z: 0.5 };
const controller = getImu => ({ boardInfo: { board_model: 1, board_major: 0, board_minor: 4, board_patch: 0, protocol_major: 2, protocol_minor: 5 }, get_imu: getImu });
const read = () => fireEvent.click(screen.getByRole('button', { name: 'Read IMU' }));

describe('IMU sensor display', () => {
  it('reads on demand and shows all six axes with SI units', async () => {
    let resolve;
    const getImu = vi.fn(() => new Promise(done => { resolve = done; }));
    render(<BoardImu controller={controller(getImu)} />);
    expect(getImu).not.toHaveBeenCalled(); read();
    expect(getImu).toHaveBeenCalledWith(0);
    expect(screen.getByRole('button', { name: 'Reading IMU…' })).toBeDisabled();
    await act(async () => resolve(sample));
    expect(screen.getByRole('heading', { name: 'Acceleration (m/s²)' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Angular velocity (rad/s)' })).toBeVisible();
    for (const [label, value] of Object.entries({ 'Acceleration X': '-1.250', 'Acceleration Y': '0.000',
      'Acceleration Z': '9.807', 'Angular velocity X': '0.125', 'Angular velocity Y': '-0.250', 'Angular velocity Z': '0.500' }))
      expect(screen.getByLabelText(label)).toHaveTextContent(value);
  });
  it.each([
    [ErrorCode.SENSOR_NOT_AVAILABLE, 'no IMU sensor'],
    [ErrorCode.SAMPLE_NOT_AVAILABLE, 'not ready yet'],
    [ErrorCode.INTERNAL_ERROR, 'Could not read the IMU sensor'],
  ])('clears stale values after error %s and allows retry', async (code, message) => {
    const getImu = vi.fn().mockResolvedValueOnce(sample)
      .mockRejectedValueOnce(new ControllerError(code, 0x51, 2)).mockResolvedValueOnce(sample);
    render(<BoardImu controller={controller(getImu)} />); read();
    await screen.findByLabelText('Acceleration Z'); read();
    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(screen.queryByLabelText('Acceleration Z')).toBeNull();
    read(); await screen.findByLabelText('Acceleration Z'); expect(screen.queryByRole('alert')).toBeNull();
  });
  it('rejects malformed samples', async () => {
    render(<BoardImu controller={controller(vi.fn().mockResolvedValue({ ...sample, angular_velocity_z: NaN }))} />);
    read(); expect(await screen.findByRole('alert')).toHaveTextContent('Invalid IMU reading');
    expect(screen.queryByLabelText('Acceleration Z')).toBeNull();
  });
  it('hides stale data when the controller changes and discards late responses', async () => {
    let finish;
    const old = controller(vi.fn(() => new Promise(done => { finish = done; })));
    const next = controller(vi.fn().mockResolvedValue({ ...sample, acceleration_x: 2 }));
    const view = render(<BoardImu controller={old} />); read();
    view.rerender(<BoardImu controller={next} />);
    expect(screen.getByText('No reading yet')).toBeVisible(); read();
    await waitFor(() => expect(screen.getByLabelText('Acceleration X')).toHaveTextContent('2.000'));
    await act(async () => finish(sample));
    expect(screen.getByLabelText('Acceleration X')).toHaveTextContent('2.000');
  });
  it('does not expose unsupported commands on old firmware', () => {
    render(<BoardImu controller={{ boardInfo: { board_model: 1, board_major: 0, board_minor: 4, board_patch: 0, protocol_major: 2, protocol_minor: 4 } }} />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
