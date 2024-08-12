import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
} from "chart.js";

// Register the required components with Chart.js
Chart.register(LineElement, CategoryScale, LinearScale, PointElement);

// Function to decode polyline
const decodePolyline = (encoded) => {
  let points = [];
  let index = 0,
    len = encoded.length;
  let lat = 0,
    lng = 0;

  while (index < len) {
    let b,
      shift = 0,
      result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push([lat / 1e5, lng / 1e5]);
  }

  return points;
};

const RunSilhouette = ({ summaryPolyline }) => {
  const polylinePoints = decodePolyline(summaryPolyline);

  const data = {
    labels: polylinePoints.map((_, index) => index), // Just use the index as the x-axis label
    datasets: [
      {
        label: "Run Route",
        data: polylinePoints.map((point) => ({ x: point[1], y: point[0] })), // Use longitude as x and latitude as y
        borderColor: "blue",
        borderWidth: 2,
        fill: false,
        pointRadius: 0, // Hide points, just show the line
      },
    ],
  };

  const options = {
    scales: {
      x: {
        display: false, // Hide the x-axis
      },
      y: {
        display: false, // Hide the y-axis
      },
    },
    plugins: {
      legend: {
        display: false, // Hide the legend
      },
    },
  };

  return (
    <div style={{ width: "300px", height: "300px" }}>
      <Line data={data} options={options} />
    </div>
  );
};

export default RunSilhouette;
