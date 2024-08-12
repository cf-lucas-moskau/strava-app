import React, { useEffect, useState } from "react";
import "./App.css";
import axios from "axios";
import MapComponent from "./components/MapComponent";
import RunSilhouette from "./components/RunSilhouette";

function App() {
  const [mode, setMode] = useState(localStorage.getItem("mode")); // Default mode is 'Lucas'

  const [distanceInputs, setDistanceInputs] = useState([]);
  const [timeInputs, setTimeInputs] = useState([]);
  const [result, setResult] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [athlete, setAthlete] = useState(null);
  const [activities, setActivities] = useState(null);
  const [hideActivities, setHideActivities] = useState(false);
  const [showSingleActivity, setShowSingleActivity] = useState(false);
  const [activity, setActivity] = useState(null);
  const [loadingActivities, setLoadingActivities] = useState(false);

  const [showPaceCalculator, setShowPaceCalculator] = useState(false);

  const [editedIndex, setEditedIndex] = useState(-1);
  const [editedDistance, setEditedDistance] = useState("");

  const [selectedRows, setSelectedRows] = useState([]);

  const [setDistance, setSetDistance] = useState(0);

  const trainingPlans = {
    32945540: [
      {
        day: "2024-08-10",
        distance: 10011,
        time: 55,
        description:
          "You can definitely hit this pace, stay relaxed and focused. Focus on your breathing",
        title: "Easy run",
      },
      {
        day: "2024-08-11",
        distance: 11000,
        description: "Einfach nur entspannt laufen",
        title: "Easy run",
      },
      {
        day: "2024-08-11",
        distance: 25000,
        time: 115,
        description:
          "Harter und langer lauf, letzte Vorbereitung vor dem Wettkampf",
        title: "Long run",
      },
    ],
    71885025: [
      // 2 trainings this week
      // totalling up to 10 k, no time requirement
      {
        day: "2024-08-13",
        distance: 6000,
        description: "Ganz locker und easy",
      },
      {
        day: "2024-08-12",
        distance: 4000,
        description: "Push day",
        title:
          "Hier kannst du dich gerne ein wenig pushen, dafür ist der Lauf aber auch kürzer!",
      },
    ],
  };

  const addInput = () => {
    setDistanceInputs([...distanceInputs, ""]);
    setTimeInputs([...timeInputs, ""]);
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
    console.log("editedDistance:", editedDistance);
  }, [editedDistance]);

  const handleAuthorizationCallback = async () => {
    const code = new URLSearchParams(window.location.search).get("code");
    if (!code) {
      return;
    }
    const clientId = "107512";
    const cliendIdSophia = "132094";
    const clientSecretSophia = "ba54e2ce83497f2618e1e84220975c89a906e094";
    const clientSecret = "1a8f803010a6cd40f81e426960729461ebc7523c";
    const redirectUri = "http:%2F%2Flocalhost:3000%2Fcallback"; // Replace with your specific redirect URI

    const tokenUrl = "https://www.strava.com/oauth/token";

    try {
      const response = await axios.post(tokenUrl, {
        client_id: mode == "Lucas" ? clientId : cliendIdSophia,
        client_secret: mode == "Lucas" ? clientSecret : clientSecretSophia,
        code: code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      });

      console.log("Response from token endpoint:", response.data);
      const accessToken = response.data.access_token;
      setAthlete(response.data.athlete);
      setAccessToken(accessToken);
      localStorage.setItem("accessToken", accessToken);
      // remove parameters from URL now
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error) {
      console.error(
        "Error exchanging authorization code for access token:",
        error
      );
    }
  };

  const populateActivitiesFromStorage = () => {
    const storedActivities = localStorage.getItem("activities");
    if (storedActivities) {
      setActivities(JSON.parse(storedActivities));
    }
  };

  useEffect(() => {
    handleAuthorizationCallback();
    populateActivitiesFromStorage();
    const storedAccessToken = localStorage.getItem("accessToken");
    if (storedAccessToken) {
      console.log("Already have Access token:", storedAccessToken);
      setAccessToken(storedAccessToken);
      getAthlete(storedAccessToken);
    }
  }, []);

  const loadSingleActivity = async (activityId) => {
    try {
      const response = await axios.get(
        `https://www.strava.com/api/v3/activities/${activityId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const activity = response.data;
      console.log("Activity:", activity);
      setHideActivities(true);
      setShowSingleActivity(true);
      setActivity(activity);
    } catch (error) {
      console.error("Error fetching activity:", error);
    }
  };

  const fetchActivities = async () => {
    setLoadingActivities(true);
    try {
      const response = await axios.get(
        "https://www.strava.com/api/v3/athlete/activities",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: {
            per_page: 10,
          },
        }
      );

      const activities = response.data;
      console.log("Activities:", activities);
      setActivities(activities);
      setLoadingActivities(false);
      // save the activities in localStorage
      localStorage.setItem("activities", JSON.stringify(activities));
    } catch (error) {
      console.error("Error fetching activities:", error);
    }
  };

  const getAthlete = async (_accessToken) => {
    if (!_accessToken && !accessToken) {
      console.warn("WE DONT HAVE ACCESS TOKEN, ABORTING!");
      return;
    }
    console.log("Fetching athlete data...");
    const athleteUrl = "https://www.strava.com/api/v3/athlete";
    const headers = {
      Authorization: `Bearer ${accessToken || _accessToken}`,
    };

    try {
      const response = await axios.get(athleteUrl, { headers });
      console.log("Response from athlete endpoint:", response.data);
      setAthlete(response.data);
    } catch (error) {
      console.error("Error fetching athlete data:", error);
    }
  };

  const handleLogin = () => {
    console.log(window.location.href);
    const clientId = "107512";
    const cliendIdSophia = "132094";
    const redirectUri = window.location.href.includes("localhost")
      ? "http:%2F%2Flocalhost:3000"
      : "https%3A%2F%2Fstrava-app-gamma.vercel.app";
    // check if we are in localhost or in production

    const scope = "activity:read"; // Define the desired scope based on your needs

    const queryParams = {
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      approval_prompt: "force",
      scope: scope,
    };

    const authorizationUrl = `https://www.strava.com/oauth/authorize?approval_prompt=force&client_id=${
      mode == "Sophia" ? cliendIdSophia : clientId
    }&redirect_uri=${redirectUri}/callback&response_type=code&scope=activity:read_all`;

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
  };

  const calculatePaceWithSetDistance = () => {
    setTimeout(() => {
      calculatePace();
    }, 100);
  };

  const getMessageOfCompletion = () => {
    // get todays training, if there is any
    if (!athlete || !athlete.id) {
      console.log("No athlete or athlete id");
      return false;
    }
    const trainingOfToday = trainingPlans[athlete.id].find((event) => {
      const today = new Date().toISOString().split("T")[0];
      return event.day === today;
    });
    console.log("trainingOfToday:", trainingOfToday);
  };

  const checkIfActivityHappenedToday = () => {
    // check if an activity happened today
    if (!activities || !activities.length) {
      return false;
    }
    const today = new Date().toISOString().split("T")[0];
    return activities.find((activity) => {
      console.log(
        "Activity happened today?",
        activity.start_date_local.split("T")[0] === today
      );
      return activity.start_date_local.split("T")[0] === today;
    });
  };

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
      console.log("selectedRows:", selectedRows);
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

      setResult(
        `Your average pace per kilometer: ${averagePace} for a total distance of ${formatMeterToKilometer(
          totalDistance
        )}`
      );
    } else {
      setResult("");
    }
  };

  const handleDistanceChangeFromActivity = (e, index) => {
    const newDistance = e.target.value;
    setEditedDistance(newDistance);
    setEditedIndex(index);
  };

  const metersPerSecondsToPace = (metersPerSecond) => {
    const pace = 1000 / metersPerSecond;
    const minutes = Math.floor(pace / 60);
    const seconds = Math.round(pace % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const convertToPace = (numberToBeConverted) => {
    // we are getting a number like 5.5
    // and it should be converted to 5:30
    const minutes = Math.floor(numberToBeConverted);
    const seconds = Math.round((numberToBeConverted - minutes) * 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const logout = () => {
    setAthlete(null);
    setAccessToken("");
    localStorage.removeItem("accessToken");
  };

  const toggleMode = () => {
    setMode((prevMode) => (prevMode === "Lucas" ? "Sophia" : "Lucas"));
    // also write the mode to localStorage
    localStorage.setItem("mode", mode === "Lucas" ? "Sophia" : "Lucas");
  };

  const getThisWeeksTrainings = () => {
    if (!athlete || !athlete.id) {
      console.log("No athlete or athlete id");
      return [];
    }

    // Get today's date
    const today = new Date();

    // Get the day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const dayOfWeek = today.getDay();

    // Calculate the difference to Monday (subtracting 1 from dayOfWeek, if it's Sunday it becomes -6)
    const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;

    // Calculate the start of the week (Monday)
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0); // Set time to start of day

    // Calculate the end of the week (Sunday)
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999); // Set time to end of day

    // Filter the activities within the current week
    const thisWeeksTrainings = trainingPlans[athlete.id].filter((activity) => {
      const activityDate = new Date(activity.day);
      return activityDate >= monday && activityDate <= sunday;
    });

    // now I want to add an additional field to it that shows me if the activity has been completed
    // I do that by getting the activities of the athlete of the current week
    // and then if a training distance is within 10% of the actual distance, I consider it completed

    // get the activities of the athlete
    const athletesActivities = activities?.filter((activity) => {
      const activityDate = new Date(activity.start_date_local);
      return activityDate >= monday && activityDate <= sunday;
    });

    console.log("athleteActivites:", athletesActivities);

    // now I want to check if the activities are within 10% of the training distance
    // if they are, I consider the training completed
    thisWeeksTrainings.forEach((training) => {
      console.log("Checking training:", training);
      const completed = athletesActivities?.find((activity) => {
        const distanceDifference = Math.abs(
          training.distance - activity.distance
        );
        // if there is also a time, check if the time is within 15% of the training time
        if (training.time) {
          const timeDifference = Math.abs(
            training.time - activity.moving_time / 60
          );
          return (
            distanceDifference < training.distance * 0.15 &&
            timeDifference < training.time * 0.15
          );
        } else {
          return distanceDifference < training.distance * 0.15;
        }
      });

      training.completed = !!completed ? true : false;
      training.fullFilledTraining = completed;

      if (!!completed) {
        // remove the activity from the list of activities
        athletesActivities?.splice(athletesActivities?.indexOf(completed), 1);
      }
    });

    return thisWeeksTrainings;
  };

  const handleRowSelection = (index) => {
    console.log("Selected row:", index);
    if (selectedRows.includes(index)) {
      setSelectedRows(selectedRows.filter((rowIndex) => rowIndex !== index));
    } else {
      setSelectedRows([...selectedRows, index]);
    }
  };

  const getMailString = () => {
    console.log(
      `mailto:lucas.moskau@web.de?subject=${athlete.id}&body=Ich%20h%C3%A4tte%20gerne%20einen%20Trainingsplan!`
    );
    return `mailto:lucas.moskau@web.de?subject=${athlete.id}&body=Ich%20h%C3%A4tte%20gerne%20einen%20Trainingsplan!`;
  };

  return (
    <div>
      <div style={{ position: "fixed", right: 20, top: 20 }}>
        <button onClick={toggleMode} className="toggle-button">
          Switch to {mode === "Lucas" ? "Sophia" : "Lucas"} mode
        </button>
      </div>
      {!athlete && (
        <button className="pace-button" onClick={handleLogin}>
          Login with Strava
        </button>
      )}

      {athlete && (
        <div>
          <div className="center-text margin-bottom-10">
            <p className="margin-bottom-10">Hallo {athlete.firstname}!</p>
            <img
              src={athlete.profile}
              alt="profile"
              className="profile-picture"
              onClick={() => {
                logout();
              }}
            />
            <div>
              {/* This div is supposed to show if there is a daily challenge 
                  It gets the trainingPlans and the activities and shows what the 
                  athlete has to do today
              */}
              {athlete && athlete.id && trainingPlans[athlete.id] ? (
                <>
                  <h2>This weeks training</h2>
                  <div className="grid">
                    {getThisWeeksTrainings().map((event) => {
                      return (
                        <div
                          className={
                            "training-day-card " +
                            (event.completed ? "completed" : "not-completed")
                          }
                          key={event.day + event.title + event.distance}
                        >
                          <h3>{event.title}</h3>
                          <p>{event.description}</p>
                          <p>{formatMeterToKilometer(event.distance)}</p>
                          <p>
                            {event.time
                              ? "Need to complete in " +
                                event.time +
                                " minutes / " +
                                convertToPace(
                                  event.time / (event.distance / 1000)
                                ) +
                                " pace"
                              : ""}
                          </p>
                          <p>
                            {event.completed ? "Completed" : "Not Completed"}
                          </p>
                          {event.fullFilledTraining && (
                            <p>
                              You completed this training with a distance of{" "}
                              {formatMeterToKilometer(
                                event.fullFilledTraining.distance
                              )}{" "}
                              on{" "}
                              {new Date(
                                event.fullFilledTraining.start_date_local
                              ).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <>
                  <h2>Not active trainingplan</h2>
                  {/* mailto link to lucas.moskau@web.de with the athlete.id in the subject */}
                  <a href={getMailString()}>Request one</a>
                </>
              )}
              {athlete &&
              activities &&
              // check if the last activity happened on the day of the training
              checkIfActivityHappenedToday() ? (
                <>
                  <h2>Your run today</h2>
                  <div>
                    <p>
                      Distance: {formatMeterToKilometer(activities[0].distance)}
                    </p>
                    <p>
                      Pace:{" "}
                      {metersPerSecondsToPace(activities[0].average_speed)}
                    </p>
                  </div>
                </>
              ) : (
                <h2>You haven't ran today... Go get after it!</h2>
              )}
            </div>
            {true && (
              <button className="load-button" onClick={fetchActivities}>
                Load newest activities
              </button>
            )}
            {loadingActivities && <p>Loading activities...</p>}
          </div>
          {/* show the athlete.profile in a small circle as profile picture */}
        </div>
      )}
      <div className="activity-div">
        {!hideActivities &&
          activities &&
          activities.length &&
          activities.map((activity) => (
            <div key={activity.id} className="single-activities">
              <button
                onClick={() => {
                  loadSingleActivity(activity.id);
                }}
              >
                <h2>{activity.name}</h2>
                <p>{formatMeterToKilometer(activity.distance)}</p>
              </button>
              <MapComponent summaryPolyline={activity.map.summary_polyline} />
              {/* <RunSilhouette summaryPolyline={activity.map.summary_polyline} /> */}
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
                        value={
                          index === editedIndex ? editedDistance : lap.distance
                        }
                        onChange={(e) =>
                          handleDistanceChangeFromActivity(e, index)
                        }
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
      {!showPaceCalculator && (
        <button
          className="pace-button"
          onClick={() => {
            setShowPaceCalculator(true);
          }}
        >
          Show Pace Calculator
        </button>
      )}

      {showPaceCalculator && (
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
                    onChange={(e) =>
                      handleDistanceChange(index, e.target.value)
                    }
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

            <button className="plus-button" onClick={addInput}>
              +
            </button>

            <button
              className="pace-button"
              onClick={() => {
                setSetDistance(0);
                setTimeout(() => {
                  calculatePace();
                }, 500);
              }}
            >
              Calculate Pace
            </button>
            {/* Calculate for same distance for all */}
            <button
              className="pace-button"
              onClick={calculatePaceWithSetDistance}
            >
              Calculate with same distance for all laps
            </button>
            <input
              type="number"
              value={setDistance}
              onChange={(e) => setSetDistance(e.target.value)}
            />

            <div id="result" className="output-container">
              {result}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
