import { createRef } from 'react';
import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MotorControllerChart from './MotorControllerChart';

vi.mock('react-chartjs-2', () => ({
  Line: ({ data, options }) => <output data-testid="velocity-plot">{JSON.stringify({ data, options })}</output>,
}));
afterEach(() => vi.restoreAllMocks());
const plot = () => JSON.parse(screen.getByTestId('velocity-plot').textContent);
const sample = { current_speed: Math.PI, target_speed: 2 * Math.PI, error: Math.PI, output: -75 };

describe('velocity response chart', () => {
  it('converts speed history without adding synthetic samples', () => {
    const { rerender } = render(<MotorControllerChart motorControllerState={{}} speedUnit="rad" />);
    expect(screen.getByText('No velocity samples yet.')).toBeVisible();
    rerender(<MotorControllerChart motorControllerState={sample} speedUnit="rad" />);
    expect(plot().data.datasets[0].data[0].y).toBeCloseTo(Math.PI);
    rerender(<MotorControllerChart motorControllerState={sample} speedUnit="deg" />);
    const { data, options } = plot();
    expect(data.datasets[0].data).toEqual([{ x: 0, y: 180 }]);
    expect(data.datasets[1].data[0].y).toBe(360);
    expect(data.datasets[2].data[0].y).toBe(180);
    expect(data.datasets).toHaveLength(3);
    expect(options.scales.speed.title.text).toBe('Speed (deg/s)');
    expect(options.scales.output).toBeUndefined();
  });
  it('uses elapsed seconds, caps history and resets it for another controller', () => {
    let now = 10000;
    vi.spyOn(Date, 'now').mockImplementation(() => now);
    const ref = createRef();
    const { rerender } = render(<MotorControllerChart ref={ref} motorControllerState={{}} />);
    for (let i = 0; i < 125; i++) {
      now += 500;
      rerender(<MotorControllerChart ref={ref} motorControllerState={{ ...sample }} />);
    }
    const values = plot().data.datasets[0].data;
    expect(values).toHaveLength(120);
    expect(values[0].x).toBe(0);
    expect(values.at(-1).x).toBe(59.5);
    act(() => ref.current.resetChart());
    expect(plot().data.datasets[0].data).toEqual([]);
  });
  it('ignores incomplete or nonfinite telemetry', () => {
    const { rerender } = render(<MotorControllerChart motorControllerState={{}} />);
    rerender(<MotorControllerChart motorControllerState={{ ...sample, current_speed: NaN }} />);
    expect(plot().data.datasets[0].data).toEqual([]);
  });
});
