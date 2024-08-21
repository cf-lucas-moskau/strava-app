import React from "react";
import { Box, Text, Flex } from "@chakra-ui/react";
import { Line } from "react-chartjs-2";
import { format, startOfWeek } from "date-fns";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from "chart.js";
import "chartjs-adapter-date-fns";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale // Registering the TimeScale
);

const WeeklySummary = ({ activities }) => {
  const weeks = {};

  activities.forEach((_activity) => {
    const activity = _activity.activity;
    const date = new Date(activity.start_date_local);
    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    const weekKey = format(weekStart, "yyyy-MM-dd");

    if (!weeks[weekKey]) {
      weeks[weekKey] = { totalDistance: 0, startDate: weekStart };
    }

    weeks[weekKey].totalDistance += activity.distance / 1000; // Convert to kilometers
  });

  let weeksArray = Object.keys(weeks).map((key) => ({
    week: weeks[key].startDate,
    totalDistance: weeks[key].totalDistance.toFixed(2),
  }));

  // Slice the last 10 weeks and then reverse to ensure newest is on the right
  weeksArray = weeksArray.slice(-10).reverse();

  const data = {
    labels: weeksArray.map((week) => format(week.week, "dd MMM")),
    datasets: [
      {
        label: "Distance (km)",
        data: weeksArray.map((week) => week.totalDistance),
        fill: true, // Ensure the area under the line is filled
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 2,
        pointBackgroundColor: "rgba(255, 99, 132, 1)",
        pointBorderColor: "#fff",
        pointHoverRadius: 5,
        pointHoverBackgroundColor: "rgba(255, 99, 132, 1)",
        pointHoverBorderColor: "rgba(220,220,220,1)",
        pointHoverBorderWidth: 2,
        pointRadius: 4,
        tension: 0.4,
      },
    ],
  };

  const options = {
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: false,
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  return (
    <Box p={4} maxW="600px" mx="auto">
      <Flex justifyContent="space-between" mb={4}>
        <Box>
          <Text fontSize="lg" fontWeight="bold">
            Distance
          </Text>
          <Text fontSize="2xl" color="orange.400">
            {weeksArray
              .reduce((sum, week) => sum + parseFloat(week.totalDistance), 0)
              .toFixed(2)}{" "}
            km
          </Text>
        </Box>
        <Box>
          <Text fontSize="lg" fontWeight="bold">
            Time
          </Text>
          <Text fontSize="2xl" color="orange.400">
            -- h -- min
          </Text>
        </Box>
        <Box>
          <Text fontSize="lg" fontWeight="bold">
            Elevation
          </Text>
          <Text fontSize="2xl" color="orange.400">
            -- m
          </Text>
        </Box>
      </Flex>
      <Line data={data} options={options} />
    </Box>
  );
};

export default WeeklySummary;
