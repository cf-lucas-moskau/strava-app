export const formatMeterToKilometer = (meters) => {
  return (meters / 1000).toFixed(2) + " km";
};

export const formatPace = (speed) => {
  const pace = 1000 / speed; // pace in seconds per kilometer
  const minutes = Math.floor(pace / 60);
  const seconds = Math.round(pace % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
};

export const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.round(seconds % 60)
    .toString()
    .padStart(2, "0");
  return hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min ${secs}s`;
};

export const convertToPace = (numberToBeConverted) => {
  const minutes = Math.floor(numberToBeConverted);
  const seconds = Math.round((numberToBeConverted - minutes) * 60);
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
};

export const metersPerSecondsToPace = (metersPerSecond) => {
  const pace = 1000 / metersPerSecond;
  const minutes = Math.floor(pace / 60);
  const seconds = Math.round(pace % 60);
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
};
