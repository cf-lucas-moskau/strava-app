import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

const PaceAnalysis = ({ laps }) => {
  // Convert pace data (from average_speed) and extract average heartrate data from laps
  const paceData = laps.map((lap) => {
    const speedInMetersPerSecond = lap.average_speed;
    const paceInSecondsPerKm = 1000 / speedInMetersPerSecond;
    const minutes = Math.floor(paceInSecondsPerKm / 60);
    const seconds = Math.round(paceInSecondsPerKm % 60)
      .toString()
      .padStart(2, "0");
    return parseFloat(minutes + "." + seconds);
  });

  const heartrateData = laps.map((lap) => lap.average_heartrate);

  // Get the min and max pace values to dynamically set the y-axis range
  const minPace = Math.min(...paceData);
  const maxPace = Math.max(...paceData);

  // Get the min and max heartrate values
  const minHeartrate = Math.min(...heartrateData);
  const maxHeartrate = Math.max(...heartrateData);

  // Prepare data for the chart
  const data = {
    labels: laps.map((lap, index) => `Lap ${index + 1}`),
    datasets: [
      {
        type: "bar",
        label: "Pace",
        data: paceData, // Use the original pace data
        backgroundColor: "rgba(0, 123, 255, 0.8)",
        yAxisID: "y1",
      },
      {
        type: "line",
        label: "Average Heartrate",
        data: heartrateData,
        borderColor: "rgba(255, 99, 132, 0.8)",
        fill: false,
        yAxisID: "y2",
      },
    ],
  };

  const options = {
    scales: {
      y1: {
        type: "linear",
        position: "left",
        min: minPace - 0.1,
        max: maxPace + 0.1,
        ticks: {
          reverse: true,
          callback: function (value) {
            const minutes = Math.floor(value);
            const seconds = Math.round((value - minutes) * 60)
              .toString()
              .padStart(2, "0");
            return `${minutes}:${seconds} min/km`;
          },
        },
        grid: {
          drawOnChartArea: false,
        },
      },
      y2: {
        type: "linear",
        position: "right",
        min: minHeartrate - 5, // Adjust the min and max for heartrate as needed
        max: maxHeartrate + 5,
        ticks: {
          callback: function (value) {
            return value + " bpm";
          },
        },
      },
      x: {
        categoryPercentage: 1,
        barPercentage: 1,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  return (
    <div>
      <h3>Tempoanalyse</h3>
      <Bar data={data} options={options} />
    </div>
  );
};

export default PaceAnalysis;
