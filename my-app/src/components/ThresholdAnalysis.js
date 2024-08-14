import React, { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const ThresholdAnalysis = ({ detailedActivities, onWeekSelect }) => {
  const [thresholdMin, setThresholdMin] = useState(
    localStorage.getItem("thresholdMin") || 165
  );
  const [thresholdMax, setThresholdMax] = useState(
    localStorage.getItem("thresholdMax") || 177
  );
  const [weeklyAveragePaces, setWeeklyAveragePaces] = useState([]);

  const _setThresholdMin = (value) => {
    if (value >= 0) {
      setThresholdMin(value);
    }
    localStorage.setItem("thresholdMin", value);
  };

  const _setThresholdMax = (value) => {
    if (value >= 0) {
      setThresholdMax(value);
    }
    localStorage.setItem("thresholdMax", value);
  };

  useEffect(() => {
    if (detailedActivities) {
      console.log("WE HAVE DETAILED ACTIVITIES");
      analyzeThresholdPaces();
    }
  }, [detailedActivities, thresholdMax, thresholdMin]);

  const getWeekNumber = (date) => {
    const startDate = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date - startDate) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + startDate.getDay() + 1) / 7);
  };

  const analyzeThresholdPaces = async () => {
    let _detailedActivities = detailedActivities;

    if (!_detailedActivities) {
      console.log("Need to fetch detailed activities first");
      return;
    }

    console.log(
      "Detailed activities in Threshold Component:",
      _detailedActivities
    );

    let weeklyPaceData = {};

    _detailedActivities.forEach((_activity) => {
      const activity = _activity.activity;
      const activityDate = new Date(activity.start_date_local);
      const weekNumber = getWeekNumber(activityDate);

      if (!weeklyPaceData[weekNumber]) {
        weeklyPaceData[weekNumber] = {
          totalPace: 0,
          count: 0,
          activityIds: [],
        };
      }

      if (activity.laps) {
        activity.laps.forEach((lap) => {
          const avgHeartrate = lap.average_heartrate;

          if (avgHeartrate >= thresholdMin && avgHeartrate <= thresholdMax) {
            console.log(
              "Lap with avg HR in range:",
              avgHeartrate,
              activity.name,
              weekNumber
            );
            weeklyPaceData[weekNumber].totalPace += 1000 / lap.average_speed;
            weeklyPaceData[weekNumber].count += 1;

            // Add the activity ID to the list of contributing activity IDs
            if (!weeklyPaceData[weekNumber].activityIds.includes(activity.id)) {
              weeklyPaceData[weekNumber].activityIds.push(activity.id);
            }
          }
        });
      }
    });

    let weeklyAveragePacesResult = [];
    for (const week in weeklyPaceData) {
      if (weeklyPaceData[week].count > 0) {
        const avgPace =
          weeklyPaceData[week].totalPace / weeklyPaceData[week].count / 60;
        weeklyAveragePacesResult.push({
          week: parseInt(week),
          avgPace: avgPace,
          activityIds: weeklyPaceData[week].activityIds, // Store the activity IDs
        });
      }
    }

    // Sort by week and limit to the last 10 weeks
    weeklyAveragePacesResult.sort((a, b) => a.week - b.week);
    const last10Weeks = weeklyAveragePacesResult.slice(-10);

    console.log("Last 10 weeks:", last10Weeks);

    setWeeklyAveragePaces(last10Weeks);
  };

  const handleChartClick = (event, elements) => {
    if (elements.length > 0) {
      const elementIndex = elements[0].index;
      const selectedWeek = weeklyAveragePaces[elementIndex];
      onWeekSelect(selectedWeek.activityIds); // Pass the activity IDs to the parent component
    }
  };

  // Prepare data for the chart
  const data = {
    labels: weeklyAveragePaces.map((weekData) => `Week ${weekData.week}`),
    datasets: [
      {
        label: "Average Pace (min/km)",
        data: weeklyAveragePaces.map((weekData) => weekData.avgPace.toFixed(2)),
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Average Pace over Last 10 Weeks",
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        reverse: true, // Flip the y-axis so lower paces are at the top
      },
    },
    onClick: handleChartClick, // Attach click handler
  };

  return (
    <div style={{ maxWidth: "400px", margin: "auto" }}>
      <div>
        <label>
          Min Threshold HR:
          <input
            type="number"
            value={thresholdMin}
            onChange={(e) => _setThresholdMin(Number(e.target.value))}
          />
        </label>
        <label>
          Max Threshold HR:
          <input
            type="number"
            value={thresholdMax}
            onChange={(e) => _setThresholdMax(Number(e.target.value))}
          />
        </label>
      </div>

      <div>
        {weeklyAveragePaces.length > 0 ? (
          <Line data={data} options={options} />
        ) : (
          <p>No data available for the selected heart rate range.</p>
        )}
      </div>
    </div>
  );
};

export default ThresholdAnalysis;
