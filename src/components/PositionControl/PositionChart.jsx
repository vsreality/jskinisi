import { Chart as ChartJS, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend);

export default function PositionChart({ samples, platform, angleUnit }) {
  const angleScale = angleUnit === 'deg' ? 180 / Math.PI : 1;
  const axes = platform
    ? [['x', 'X', '#2563eb', 1], ['y', 'Y', '#16a34a', 1], ['t', 'Heading', '#9333ea', angleScale]]
    : [['position', 'Position', '#2563eb', angleScale]];
  const start = samples[0]?.time ?? 0;
  const datasets = axes.flatMap(([key, label, color, scale]) => [false, true].map(target => ({
    label: `${label} ${target ? 'target' : 'measured'}`,
    data: samples.map(sample => ({ x: (sample.time - start) / 1000,
      y: (target ? sample.target?.[key] : sample.value[key]) == null ? null
        : (target ? sample.target[key] : sample.value[key]) * scale })),
    borderColor: color, borderDash: target ? [6, 4] : [], pointRadius: 0,
    borderWidth: 2, yAxisID: platform && key !== 't' ? 'distance' : 'angle',
    spanGaps: false,
  })));
  return <div className="position-chart-canvas">
    <Line aria-label="Position response graph" role="img" data={{ datasets }} options={{
      responsive: true, maintainAspectRatio: false, animation: false,
      scales: {
        x: { type: 'linear', title: { display: true, text: 'Time (s)' } },
        angle: { type: 'linear', position: platform ? 'right' : 'left',
          title: { display: true, text: `${platform ? 'Heading' : 'Position'} (${angleUnit})` } },
        ...(platform ? { distance: { type: 'linear', position: 'left',
          title: { display: true, text: 'X / Y (m)' }, grid: { drawOnChartArea: false } } } : {}),
      },
    }} />
  </div>;
}
