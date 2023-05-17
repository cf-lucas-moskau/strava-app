import React, { useEffect, useState } from 'react';
import './App.css';
import axios from 'axios';
import queryString from 'query-string';


function App() {
  const [distanceInputs, setDistanceInputs] = useState([]);
  const [timeInputs, setTimeInputs] = useState([]);
  const [result, setResult] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [athlete, setAthlete] = useState(null);
  const [activities, setActivities] = useState(null);
  const [hideActivities, setHideActivities] = useState(false);
  const [showSingleActivity, setShowSingleActivity] = useState(false);
  const [activity, setActivity] = useState(null);

  const [editedIndex, setEditedIndex] = useState(-1);
  const [editedDistance, setEditedDistance] = useState('');

  const [selectedRows, setSelectedRows] = useState([]);

  const [setDistance, setSetDistance] = useState(0);



  const addInput = () => {
    setDistanceInputs([...distanceInputs, '']);
    setTimeInputs([...timeInputs, '']);
  };

  const updateActivity = () => {
    if (editedIndex >= 0) {
      const updatedActivity = { ...activity };
      updatedActivity.laps[editedIndex].distance = editedDistance;
      setActivity(updatedActivity);
    }
  };

  useEffect(() => {
    updateActivity();
    console.log('editedDistance:', editedDistance);
  }, [editedDistance]);
  

  const handleAuthorizationCallback = async () => {
    const code = new URLSearchParams(window.location.search).get('code');
    if (!code) {
      return;
    }
    const clientId = '107512';
    const clientSecret = '1a8f803010a6cd40f81e426960729461ebc7523c';
    const redirectUri = 'http:%2F%2Flocalhost:3000%2Fcallback'; // Replace with your specific redirect URI
  
    const tokenUrl = 'https://www.strava.com/oauth/token';
  
    try {
      const response = await axios.post(tokenUrl, {
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      });
  
      console.log('Response from token endpoint:', response.data)
      const accessToken = response.data.access_token;
      setAthlete(response.data.athlete);
      setAccessToken(accessToken);
      localStorage.setItem('accessToken', accessToken);
      console.log('Access token:', accessToken);
    } catch (error) {
      console.error('Error exchanging authorization code for access token:', error);
    }
  };
  
  useEffect(() => {
    handleAuthorizationCallback();
    const storedAccessToken = localStorage.getItem('accessToken');
    if (storedAccessToken) {
      console.log('Already have Access token:', storedAccessToken);
      setAccessToken(storedAccessToken);
      getAthlete();
    }
  }, []);

  const loadSingleActivity = async (activityId) => {
    try {
      const response = await axios.get(`https://www.strava.com/api/v3/activities/${activityId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const activity = response.data;
      console.log('Activity:', activity);
      setHideActivities(true);
      setShowSingleActivity(true);
      setActivity(activity);
    } catch (error) {
      console.error('Error fetching activity:', error);
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          per_page: 15,
        },
      });
  
      const activities = response.data;
      console.log('Activities:', activities);
      setActivities(activities);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const getAthlete = async () => {
    const athleteUrl = 'https://www.strava.com/api/v3/athlete';
    const headers = {
      Authorization: `Bearer ${accessToken}`,
    };
  
    try {
      const response = await axios.get(athleteUrl, { headers });
      console.log('Response from athlete endpoint:', response.data);
      setAthlete(response.data);
    } catch (error) {
      console.error('Error fetching athlete data:', error);
    }
  }

  const handleLogin = () => {
    const clientId = '107512';
    const redirectUri = 'https:%2F%2Fstrava-app-gamma.vercel.app%2Fcallback';
    const scope = 'activity:read'; // Define the desired scope based on your needs
  
    const queryParams = {
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      approval_prompt: 'force',
      scope: scope,
    };
  
    const authorizationUrl = `https://www.strava.com/oauth/authorize?approval_prompt=force&client_id=107512&redirect_uri=https:%2F%2Fstrava-app-gamma.vercel.app%2Fcallback&response_type=code&scope=activity:read_all`;
  
    window.location.href = authorizationUrl;
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

  const formatMeterToKilometer = (meters) => {
    return (meters / 1000).toFixed(2) + " km";
  }

  const calculatePaceWithSetDistance = () => {
    setTimeout(() => {
      calculatePace();
    }, 100);
  }

  const calculatePace = () => {
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
      console.log('selectedRows:', selectedRows);
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
      const averagePace = `${averageMinutes}:${averageSeconds < 10 ? '0' : ''}${averageSeconds}`;

      setResult(`Your average pace per kilometer: ${averagePace} for a total distance of ${formatMeterToKilometer(totalDistance)}`);
    } else {
      setResult('');
    }
  };

  const handleDistanceChangeFromActivity = (e, index) => {
    const newDistance = e.target.value;
    setEditedDistance(newDistance);
    setEditedIndex(index);
  };

  const handleRowSelection = (index) => {
    console.log('Selected row:', index);
    if (selectedRows.includes(index)) {
      setSelectedRows(selectedRows.filter((rowIndex) => rowIndex !== index));
    } else {
      setSelectedRows([...selectedRows, index]);
    }
  };

  return (
    <div>
      {!athlete && (
        <button onClick={handleLogin}>Login with Strava</button>
      )
      }
      
      {athlete && (
      <div>
        <div className='center-text'>
          Logged in as {athlete.firstname} {athlete.lastname}
          <img src={athlete.profile} alt="profile" className='profile-picture' />
          {!activities && (
            <button className='load-button' onClick={fetchActivities}>Load Activities</button>
          )}
        </div>
        {/* show the athlete.profile in a small circle as profile picture */}
        
      </div>
      )}
      <div className='activity-div'>
      {!hideActivities && activities && activities.length && activities.map((activity) => (
        <div key={activity.id} className='single-activities'>
          <button onClick={() => {loadSingleActivity(activity.id)}}>
            <h2>{activity.name}</h2>
            <p>{formatMeterToKilometer(activity.distance)}</p>
          </button>
        </div>
      ))}
      {showSingleActivity && activity && (
        <div className="single-activity">
          <p>{activity.name}</p>
          <p>{activity.description}</p>
          {/* a table that displays all laps of the activity */}
          <table className="lap-table">
            <thead>
              <tr>
                <th>Select</th>
                <th>Lap</th>
                <th>Distance</th>
                <th>Time</th>
                <th>Avg. Heartrate</th>
              </tr>
            </thead>
            <tbody>
              {activity.laps.map((lap, index) => (
                <tr key={lap.id} className="lap-table-row">
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(index)}
                      onChange={() => handleRowSelection(index)}
                    />
                  </td>
                  <td>{lap.name}</td>
                  <td>
                    <input
                      type="text"
                      value={index === editedIndex ? editedDistance : lap.distance}
                      onChange={(e) => handleDistanceChangeFromActivity(e, index)}
                    />
                  </td>
                  <td>{lap.moving_time}</td>
                  <td>{lap.average_heartrate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </div>
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

        <button className="pace-button" onClick={() => {
          setSetDistance(0)
          setTimeout(() => {
            calculatePace()
          }, 500)
          }}>Calculate Pace</button>
        {/* Calculate for same distance for all */}
        <button className="pace-button" onClick={calculatePaceWithSetDistance}>Calculate with same distance for all laps</button>
        <input type="number" value={setDistance} onChange={(e) => setSetDistance(e.target.value)} />

        <div id="result" className="output-container">{result}</div>
      </div>
    </div>
  );
}

export default App;
