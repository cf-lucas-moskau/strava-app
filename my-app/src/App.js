import React, { useEffect, useState } from "react";
import "./App.css";
import axios from "axios";
import MapComponent from "./components/MapComponent";
import RunSilhouette from "./components/RunSilhouette";
import PaceAnalysis from "./components/PaceAnalysis";
import ThresholdAnalysis from "./components/ThresholdAnalysis";
import * as Realm from "realm-web";

import {
  Box,
  Flex,
  Text,
  Image,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverCloseButton,
  PopoverBody,
  Button,
  Heading,
  Grid,
  Link,
  Stack,
  Spinner,
} from "@chakra-ui/react";

function App() {
  const [mode, setMode] = useState(localStorage.getItem("mode")); // Default mode is 'Lucas'

  const [distanceInputs, setDistanceInputs] = useState([]);
  const [timeInputs, setTimeInputs] = useState([]);
  const [result, setResult] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [athlete, setAthlete] = useState(null);
  const [activities, setActivities] = useState(null);
  const [filteredActivities, setFilteredActivities] = useState(null);
  const [hideActivities, setHideActivities] = useState(false);
  const [showSingleActivity, setShowSingleActivity] = useState(false);
  const [activity, setActivity] = useState(null);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [savingActivities, setSavingActivities] = useState(false);

  const [allowAnalytics, setAllowAnalytics] = useState(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  const [detailedActivities, setDetailedActivities] = useState(null);

  const [showPaceCalculator, setShowPaceCalculator] = useState(false);

  const [editedIndex, setEditedIndex] = useState(-1);
  const [editedDistance, setEditedDistance] = useState("");

  const [selectedRows, setSelectedRows] = useState([]);

  const [setDistance, setSetDistance] = useState(0);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const mongoApiKey =
    "xUxMs0pTBssX9ylmTyk0MorcQwcCUjQEP9vA4IgZdKVJIjNsNEYqugQUDFhkAUYH";
  const dataSource = "Cluster0";
  const database = "development";
  const appId = "application-0-vtsodnl";

  const app = new Realm.App({ id: appId });

  const trainingPlans = {
    // Lucas
    32945540: [
      {
        day: "2024-08-19",
        distance: 12000,
        title: "Easy run",
      },
      {
        day: "2024-08-19",
        distance: 12000,
        title: "Easy run",
      },
      {
        day: "2024-08-19",
        distance: 12000,
        title: "Easy run",
      },
      {
        day: "2024-08-19",
        distance: 19000,
        title: "Workout Fartlek",
        description: "5 x 2km on @ 3:50 or faster / 1km float @ 4:30",
      },
      {
        day: "2024-08-19",
        distance: 25000,
        title: "Double T",
        description: "10 x 800m in the morning, Mikeller in the Evening",
      },
      {
        day: "2024-08-19",
        distance: 26000,
        title: "Long run",
      },
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
      {
        day: "2024-08-14",
        distance: 25000,
        time: 115,
        description:
          "Harter und langer lauf, letzte Vorbereitung vor dem Wettkampf",
        title: "Long run",
      },
      {
        day: "2024-08-14",
        distance: 11000,
        description: "Einfach nur entspannt laufen",
        title: "Easy run",
      },
      {
        day: "2024-08-14",
        distance: 11000,
        description: "Einfach nur entspannt laufen",
        title: "Easy run",
      },
      {
        day: "2024-08-14",
        distance: 11000,
        description: "Einfach nur entspannt laufen",
        title: "Easy run",
      },
      {
        day: "2024-08-14",
        distance: 11000,
        description: "Einfach nur entspannt laufen",
        title: "Easy run",
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

  const getActivitesFromDB = async () => {
    if (!athlete) {
      console.warn("No athlete, aborting!");
      return;
    }

    // now fetch the activities from the database
    const user = await app.logIn(Realm.Credentials.anonymous());
    const activities = await user.functions.getActivitiesByAthleteId(
      athlete.id
    );

    console.log("Activities from DB:", activities);
    setDetailedActivities(activities);
    // doesnt work because too much data
    // localStorage.setItem("detailedActivities", JSON.stringify(activities));
    return activities;
  };

  const loadAnalytics = async () => {
    setLoadingAnalytics(true);
    setShowAnalytics(true);
    let _detailedActivities = detailedActivities;
    if (!_detailedActivities) {
      console.log("Need to fetch detailed activities first");
      _detailedActivities = await getActivitesFromDB();
    }
    console.log("Detailed activities:", _detailedActivities);
    setLoadingAnalytics(false);

    // now we can analyze
  };

  const saveActivitiesToDB = async () => {
    setSavingActivities(true);
    const user = await app.logIn(Realm.Credentials.anonymous());
    // Check and save each activity in your MongoDB via the Data API
    let _detailedActivities = detailedActivities;
    if (!detailedActivities) {
      console.log("Need to fetch detailed activities first");
      _detailedActivities = await getActivitesFromDB();
    }
    let counter = 0;
    for (const activity of activities) {
      // check if the activity is already in the database
      const activityExists = _detailedActivities.find(
        (act) => act.strava_id === activity.id
      );
      if (activityExists) {
        console.log("Activity already exists in DB:", activity.id, counter++);
        continue;
      }
      await checkAndSaveActivity(activity.id, accessToken, user);
    }
    setSavingActivities(false);
    setAllowAnalytics(true);
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
            per_page: 200,
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

  const checkAndSaveActivity = async (activityId, accessToken, user) => {
    try {
      const response = await user.functions.checkAndSaveActivity(
        activityId,
        accessToken
      );

      console.log(`Activity ${activityId} ${accessToken} processed:`, response);
    } catch (error) {
      console.error(`Error checking/saving activity ${activityId}:`, error);
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

  function formatPace(speed) {
    const pace = 1000 / speed; // pace in seconds per kilometer
    const minutes = Math.floor(pace / 60);
    const seconds = Math.round(pace % 60)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.round(seconds % 60)
      .toString()
      .padStart(2, "0");
    return hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min ${secs}s`;
  }

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

  const filterActivites = (activityIds) => {
    console.log("Filtering activities:", activityIds);
    const filteredActivities = activities.filter((activity) =>
      activityIds.includes(activity.id)
    );
    console.log("Filtered activities:", filteredActivities);
    setFilteredActivities(filteredActivities);
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
      <div>
        <Box as="nav" bg="gray.800" paddingY={4} paddingX={4}>
          <Flex
            maxWidth="1200px"
            margin="0 auto"
            justify="space-between"
            align="center"
          >
            {/* Logo or Site Title */}
            <Heading as="h1" size="lg" color="white">
              My App
            </Heading>

            {/* Right Side - Buttons */}
            <Flex align="center">
              <Button onClick={toggleMode} colorScheme="teal" marginRight={4}>
                Switch to {mode === "Lucas" ? "Sophia" : "Lucas"} mode
              </Button>
              {!athlete && (
                <Button onClick={handleLogin} colorScheme="orange">
                  Login with Strava
                </Button>
              )}
            </Flex>
          </Flex>
        </Box>

        {athlete && (
          <Box padding={4}>
            <Flex height="250px" align="center" justify="center">
              <Box
                textAlign="center"
                padding={6}
                borderRadius="md"
                boxShadow="lg"
                bg="gray.100"
                height="200px"
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
              >
                <Text fontSize="2xl" marginBottom={4}>
                  Hallo {athlete.firstname}!
                </Text>

                <Popover trigger="hover" placement="bottom">
                  <PopoverTrigger>
                    <Image
                      src={athlete.profile}
                      alt="profile"
                      borderRadius="full"
                      boxSize="100px"
                      cursor="pointer"
                      margin="0 auto"
                    />
                  </PopoverTrigger>
                  <PopoverContent>
                    <PopoverArrow />
                    <PopoverCloseButton />
                    <PopoverBody>Click to logout</PopoverBody>
                  </PopoverContent>
                </Popover>
              </Box>
            </Flex>

            {athlete && athlete.id && trainingPlans[athlete.id] ? (
              <>
                <Heading as="h2" size="md" marginBottom={4}>
                  This Week's Training
                </Heading>
                <Grid
                  templateColumns="repeat(auto-fill, minmax(250px, 1fr))"
                  gap={6}
                  justifyItems="center"
                  alignItems="center"
                >
                  {getThisWeeksTrainings().map((event) => (
                    <Box
                      key={event.day + event.title + event.distance}
                      borderWidth="1px"
                      borderRadius="md"
                      padding={6}
                      backgroundColor={
                        event.completed ? "green.100" : "red.100"
                      }
                      boxShadow="md"
                      width="100%"
                      maxWidth="300px"
                    >
                      <Heading
                        as="h3"
                        size="md"
                        marginBottom={4}
                        textAlign="center"
                      >
                        {event.title}
                      </Heading>
                      <Text marginBottom={2} fontWeight="bold">
                        {event.description}
                      </Text>
                      <Text marginBottom={2}>
                        Distance: {formatMeterToKilometer(event.distance)}
                      </Text>
                      {event.time && (
                        <Text marginBottom={2}>
                          Need to complete in {event.time} minutes /{" "}
                          {convertToPace(event.time / (event.distance / 1000))}{" "}
                          pace
                        </Text>
                      )}
                      <Text
                        fontWeight="bold"
                        color={event.completed ? "green.600" : "red.600"}
                      >
                        {event.completed ? "Completed" : "Not Completed"}
                      </Text>
                      {event.fullFilledTraining && (
                        <Text marginTop={4} fontSize="sm" color="gray.600">
                          You completed this training with a distance of{" "}
                          {formatMeterToKilometer(
                            event.fullFilledTraining.distance
                          )}{" "}
                          on{" "}
                          {new Date(
                            event.fullFilledTraining.start_date_local
                          ).toLocaleDateString()}
                        </Text>
                      )}
                    </Box>
                  ))}
                </Grid>
              </>
            ) : (
              <>
                <Heading as="h2" size="md" marginBottom={4}>
                  No active training plan
                </Heading>
                <Link href={getMailString()} color="blue.500">
                  Request one
                </Link>
              </>
            )}

            {/* <Box
              width="100%"
              maxWidth="400px"
              margin="0 auto"
              padding={6}
              borderWidth="1px"
              borderRadius="md"
              boxShadow="md"
              backgroundColor="gray.100"
              marginTop={8}
            >
              {athlete && activities && checkIfActivityHappenedToday() ? (
                <>
                  <Heading
                    as="h2"
                    size="lg"
                    textAlign="center"
                    marginBottom={4}
                  >
                    Your Run Today
                  </Heading>
                  <Box>
                    <Text fontSize="lg" fontWeight="bold" marginBottom={2}>
                      Distance: {formatMeterToKilometer(activities[0].distance)}
                    </Text>
                    <Text fontSize="lg" fontWeight="bold" marginBottom={2}>
                      Pace:{" "}
                      {metersPerSecondsToPace(activities[0].average_speed)}
                    </Text>
                  </Box>
                </>
              ) : (
                <Heading as="h2" size="lg" textAlign="center" color="red.500">
                  You haven't ran today... Go get after it!
                </Heading>
              )}
            </Box> */}

            {showAnalytics && (
              <Box textAlign="center" marginTop={8}>
                <Heading as="h1" size="lg" marginBottom={4}>
                  Activity Analytics
                </Heading>
                <ThresholdAnalysis
                  detailedActivities={detailedActivities}
                  onWeekSelect={filterActivites}
                />
              </Box>
            )}

            {allowAnalytics && (
              <Box marginTop={4} textAlign="center">
                <Button
                  onClick={loadAnalytics}
                  colorScheme="teal"
                  marginBottom={2}
                  width="100%"
                  maxWidth="300px"
                >
                  Load analytics
                </Button>
                {loadingAnalytics && (
                  <Flex justifyContent="center">
                    <Spinner color="teal.500" marginTop={2} />
                  </Flex>
                )}
              </Box>
            )}

            <Box marginTop={allowAnalytics ? 4 : 10} textAlign="center">
              <Button
                onClick={saveActivitiesToDB}
                colorScheme="teal"
                marginBottom={2}
                width="100%"
                maxWidth="300px"
              >
                Save activities to DB to allow for analytics
              </Button>
              {savingActivities && (
                <Flex justifyContent="center">
                  <Spinner color="teal.500" marginTop={2} />
                </Flex>
              )}
            </Box>

            <Box marginTop={4} textAlign="center">
              <Button
                onClick={fetchActivities}
                colorScheme="teal"
                marginBottom={2}
                width="100%"
                maxWidth="300px"
              >
                Load newest activities
              </Button>
              {loadingActivities && (
                <Flex justifyContent="center">
                  <Spinner color="teal.500" marginTop={2} />
                </Flex>
              )}
            </Box>

            {filteredActivities && (
              <Box textAlign="center" marginTop={4}>
                <Button
                  onClick={() => setFilteredActivities(null)}
                  colorScheme="red"
                  width="100%"
                  maxWidth="300px"
                >
                  Remove filter
                </Button>
              </Box>
            )}
          </Box>
        )}
      </div>
      {hideActivities && (
        <button
          className="load-button width-100"
          onClick={() => setHideActivities(false)}
        >
          Back
        </button>
      )}
      <div className="activity-div">
        {!hideActivities &&
          activities &&
          athlete &&
          activities.length &&
          (filteredActivities ? filteredActivities : activities).map(
            (activity) => (
              <Box
                key={activity.id}
                borderWidth="1px"
                borderRadius="md"
                boxShadow="md"
                overflow="hidden"
                padding={4}
                marginBottom={6}
                bg="white"
              >
                <Box
                  onClick={() => loadSingleActivity(activity.id)}
                  cursor="pointer"
                  _hover={{ bg: "gray.100" }}
                  padding={4}
                  borderRadius="md"
                >
                  {/* User Info and Activity Details */}
                  <Flex justifyContent="space-between" marginBottom={4}>
                    <Stack spacing={1}>
                      <Text fontSize="sm" color="gray.600">
                        {new Date(activity.start_date_local).toLocaleString()}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        {activity.location_city ||
                          activity.location_state ||
                          activity.location_country}
                      </Text>
                    </Stack>

                    {/* Activity Name and Description */}
                    <Stack spacing={1} textAlign="right">
                      <Heading as="h3" size="md">
                        {activity.name}
                      </Heading>
                      <Text fontSize="sm" color="gray.500">
                        {activity.description}
                      </Text>
                    </Stack>
                  </Flex>
                </Box>

                {/* Additional Information */}
                <Box padding={4} borderTopWidth="1px" borderColor="gray.200">
                  <Flex justifyContent="space-between">
                    <Text>
                      <strong>Distanz:</strong>{" "}
                      {formatMeterToKilometer(activity.distance)}
                    </Text>
                    <Text>
                      <strong>Tempo:</strong>{" "}
                      {formatPace(activity.average_speed)} /km
                    </Text>
                    <Text>
                      <strong>Zeit:</strong>{" "}
                      {formatDuration(activity.elapsed_time)}
                    </Text>
                  </Flex>
                </Box>

                {/* Map Component */}
                <Box marginTop={4}>
                  <MapComponent
                    summaryPolyline={activity.map.summary_polyline}
                  />
                </Box>

                {/* Optional: Add a section for Pace Analysis Component here */}
              </Box>
            )
          )}

        {showSingleActivity && activity && (
          <div className="single-activity">
            <p>{activity.name}</p>
            <p>{activity.description}</p>
            <div className="pace-analysis-container">
              <PaceAnalysis laps={activity.laps} />
            </div>
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
                    <td>{convertToPace((lap.moving_time / 60).toFixed(2))}</td>
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
