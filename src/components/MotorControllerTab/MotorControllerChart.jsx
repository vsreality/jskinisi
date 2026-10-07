import { Component } from 'react';
import { Chart as ChartJS, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend);

const series = [
  ['current_speed', 'Measured speed', '#2563eb', false, false],
  ['target_speed', 'Target speed', '#2563eb', true, false],
  ['error', 'Speed error', '#d97706', false, true],
];

class MotorControllerChart extends Component {
  state = { samples: [] };

  resetChart = () => this.setState({ samples: [] });

  componentDidUpdate(prevProps) {
    const value = this.props.motorControllerState;
    if (prevProps.motorControllerState !== value && series.every(([key]) => Number.isFinite(value?.[key]))) {
      const time = Date.now();
      this.setState(previous => ({ samples: [...previous.samples, { value: { ...value }, time }].slice(-120) }));
    }
  }

  render() {
    const { samples } = this.state;
    const unit = this.props.speedUnit === 'deg' ? 'deg/s' : 'rad/s';
    const scale = this.props.speedUnit === 'deg' ? 180 / Math.PI : 1;
    const start = samples[0]?.time ?? 0;
    const datasets = series.map(([key, label, color, dashed, hidden]) => ({
      label, hidden, borderColor: color, borderDash: dashed ? [6, 4] : [],
      pointRadius: 0, pointHoverRadius: 4, borderWidth: 2,
      yAxisID: 'speed',
      data: samples.map(sample => ({ x: (sample.time - start) / 1000,
        y: sample.value[key] * scale })),
    }));
    return <>
      {samples.length === 0 && <p className="controller-help">No velocity samples yet.</p>}
      <div className="velocity-chart-canvas">
        <Line aria-label="Velocity response graph" role="img" data={{ datasets }} options={{
          responsive: true, maintainAspectRatio: false, animation: false,
          interaction: { mode: 'index', intersect: false },
          plugins: { tooltip: { callbacks: {
            label: context => `${context.dataset.label}: ${context.parsed.y.toFixed(3)} ${unit}`,
          } } },
          scales: {
            x: { type: 'linear', title: { display: true, text: 'Time (s)' } },
            speed: { type: 'linear', position: 'left', title: { display: true, text: `Speed (${unit})` } },
          },
        }} />
      </div>
    </>;
  }
}

export default MotorControllerChart;
