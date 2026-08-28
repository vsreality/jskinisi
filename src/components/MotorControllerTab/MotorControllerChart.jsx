// MotorControllerChart
import { Component } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const options = {
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 0 // general animation time
  }
};

class MotorControllerChart extends Component {
    constructor(props) {
        super(props);
        this.initialState = {
          data:{
              labels:[],
              datasets: [
                {
                  label: 'output',
                  data: [],
                  borderColor: 'rgb(0, 128, 0)',
                  backgroundColor: 'rgba(0, 128, 0, 0.5)',
                  pointRadius: 2,
                },
                {
                  label: 'target_speed',
                  data: [],
                  borderColor: 'rgb(255, 0, 0)',
                  backgroundColor: 'rgba(255, 0, 0, 0.5)',
                  pointRadius: 2,
                },
                {
                  label: 'error',
                  data: [],
                  borderColor: 'rgb(0, 255, 255)',
                  backgroundColor: 'rgba(0, 255, 255, 0.5)',
                  pointRadius: 2,
                },
                {
                  label: 'current_speed',
                  data: [],
                  borderColor: 'rgb(0, 0, 255)',
                  backgroundColor: 'rgba(0, 0, 255, 0.5)',
                  pointRadius: 2,
                }
              ],
            }
      };

      this.state = {...this.initialState};
    }

    resetChart = () => {
        this.setState(this.initialState);
    };

    componentDidUpdate(prevProps) {
        // max 100 data points
        let maxDataPoints = 100;
        if (prevProps.motorControllerState !== this.props.motorControllerState) {
          this.setState(prevState => ({
            ...prevState,
            data: {
              ...prevState.data,
              labels: [...prevState.data.labels, new Date().toLocaleTimeString()].slice(-maxDataPoints),
              datasets: prevState.data.datasets.map(dataset => ({
                ...dataset,
                data: [...dataset.data, this.props.motorControllerState[dataset.label]].slice(-maxDataPoints),
              })),
            },
          }));
        }
      }

    render() {
        return (
            <div style={{ width: '100%', maxWidth: '640px', height: '300px' }}>
                <Line options={options} data={this.state.data} />
            </div>
        );
    }
}

export default MotorControllerChart