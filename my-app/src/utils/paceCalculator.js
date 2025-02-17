export const calculatePace = (
  distanceInputs,
  timeInputs,
  selectedRows,
  activity,
  setDistance
) => {
  let totalDistance = 0;
  let totalSeconds = 0;

  for (let i = 0; i < distanceInputs.length; i++) {
    let distance;
    if (setDistance > 0) {
      distance = parseFloat(setDistance);
    } else {
      distance = parseFloat(distanceInputs[i]);
    }
    const time = parseFloat(timeInputs[i]);

    if (!isNaN(distance) && !isNaN(time)) {
      totalDistance += distance;
      totalSeconds += time;
    }
  }

  if (selectedRows && selectedRows.length > 0) {
    for (let _row of selectedRows) {
      const row = activity.laps[_row];
      let distance;
      if (setDistance > 0) {
        distance = parseFloat(setDistance);
      } else {
        distance = parseFloat(row.distance);
      }
      const time = parseFloat(row.moving_time);

      if (!isNaN(distance) && !isNaN(time)) {
        totalDistance += distance;
        totalSeconds += time;
      }
    }
  }

  const inputAmounts = distanceInputs.length + selectedRows.length;
  if (totalDistance > 0 && totalSeconds > 0) {
    const averageDistance = totalDistance / inputAmounts;
    const averagePaceSeconds = totalSeconds / inputAmounts;
    const multiplier = 1000 / averageDistance;
    const averagePaceSecondsPerKm = averagePaceSeconds * multiplier;
    const averageMinutes = Math.floor(averagePaceSecondsPerKm / 60);
    const averageSeconds = Math.round(averagePaceSecondsPerKm % 60);
    const averagePace = `${averageMinutes}:${
      averageSeconds < 10 ? "0" : ""
    }${averageSeconds}`;

    return {
      pace: averagePace,
      totalDistance,
    };
  }

  return null;
};
