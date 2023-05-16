import React, { useState } from 'react';
import './App.css';

function App() {
  const [distanceInputs, setDistanceInputs] = useState([]);
  const [timeInputs, setTimeInputs] = useState([]);
  const [result, setResult] = useState('');

  const addInput = () => {
    setDistanceInputs([...distanceInputs, '']);
    setTimeInputs([...timeInputs, '']);
  };

  const handleDistanceChange = (index, value) => {
    const updatedDistanceInputs = [...distanceInputs];
    updatedDistanceInputs[index] = value;
    setDistanceInputs(updatedDistanceInputs);
  };

  const handleTimeChange = (index, value) => {
    const updatedTimeInputs = [...timeInputs];
    updatedTimeInputs[index] = value;
    setTimeInputs(updatedTimeInputs);
  };

  const calculatePace = () => {
    let totalDistance = 0;
    let totalSeconds = 0;

    for (let i = 0; i < distanceInputs.length; i++) {
      const distance = parseFloat(distanceInputs[i]);
      const time = parseFloat(timeInputs[i]);

      if (!isNaN(distance) && !isNaN(time)) {
        totalDistance += distance;
        totalSeconds += time;
      }
    }

    if (totalDistance > 0 && totalSeconds > 0) {
      const averageDistance = totalDistance / distanceInputs.length;
      const averagePaceSeconds = totalSeconds / distanceInputs.length;
      const multiplier = 1000 / averageDistance;
      const averagePaceSecondsPerKm = averagePaceSeconds * multiplier;
      const averageMinutes = Math.floor(averagePaceSecondsPerKm / 60);
      const averageSeconds = Math.round(averagePaceSecondsPerKm % 60);
      const averagePace = `${averageMinutes}:${averageSeconds < 10 ? '0' : ''}${averageSeconds}`;

      setResult(`Your average pace per kilometer: ${averagePace}`);
    } else {
      setResult('');
    }
  };

  return (
    <div>
      <h1>Pace Calculator</h1>
      <h2>Bislett Special</h2>
      <div className="container">
        <div id="inputs">
          {distanceInputs.map((distance, index) => (
            <div className="input-container" key={index}>
              <label>Distance (in meters):</label>
              <input
                type="number"
                value={distance}
                onChange={(e) => handleDistanceChange(index, e.target.value)}
                step="1"
              />
              <label>Time (in seconds):</label>
              <input
                type="number"
                value={timeInputs[index]}
                onChange={(e) => handleTimeChange(index, e.target.value)}
                step="1"
              />
            </div>
          ))}
        </div>

        <button className="plus-button" onClick={addInput}>+</button>

        <button className="pace-button" onClick={calculatePace}>Calculate Pace</button>

        <div id="result" className="output-container">{result}</div>
      </div>
    </div>
  );
}

export default App;
