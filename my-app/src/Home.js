import React, { useEffect, useState } from "react";
import "./App.css";
import axios from "axios";
import MapComponent from "./components/MapComponent";
import Header from "./components/Header";
import RunSilhouette from "./components/RunSilhouette";
import WeeklySummary from "./components/WeeklySummary";
import PaceAnalysis from "./components/PaceAnalysis";
import ThresholdAnalysis from "./components/ThresholdAnalysis";
import * as Realm from "realm-web";
import { EditIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";
import { useToast } from "@chakra-ui/react";
import {
  saveActivities,
  getActivities,
  saveAthlete,
  getAthlete,
  clearData,
} from "./utils/db";
import {
  setupNotifications,
  showTestNotification,
} from "./utils/notifications";

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
  CircularProgress,
  CircularProgressLabel,
} from "@chakra-ui/react";
import Activity from "./components/Activity";
import TrainingCard from "./components/TrainingCard";
import { RepeatIcon } from "@chakra-ui/icons";

function Home() {
  const navigate = useNavigate();
  const toast = useToast();

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

  const [pullToRefreshDistance, setPullToRefreshDistance] = useState(0);

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
      {
        day: "2025-02-14",
        distance: 11000,
        description: "Einfach nur entspannt laufen",
        title: "Easy run",
      },
      {
        day: "2025-02-14",
        distance: 11000,
        description: "Einfach nur entspannt laufen",
        title: "Easy run",
      },
      {
        day: "2025-02-14",
        distance: 11000,
        description: "Einfach nur entspannt laufen",
        title: "Easy run",
      },
      {
        day: "2025-02-14",
        distance: 11000,
        description: "Einfach nur entspannt laufen",
        title: "Easy run",
      },
      {
        day: "2025-02-14",
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
      {
        day: "2025-02-14",
        distance: 5000,
        description: "mit Lucas",
        title: "Sonntagslauf",
      },
      {
        day: "2025-02-14",
        distance: 3400,
        description: "mit Lucas",
        title: "Easy run",
      },
      {
        day: "2025-02-14",
        distance: 2500,
        description: "mit Lucas",
        title: "Coffee run",
      },
      {
        day: "2025-02-17",
        distance: 3000,
        description: "mit Lucas",
        title: "Coffee run",
      },
      {
        day: "2025-02-17",
        distance: 4000,
        description: "mit Lucas",
        title: "Easy run",
      },
      {
        day: "2025-02-17",
        distance: 5000,
        description: "",
        title: "Long run",
      },
    ],
  };

  async function updateActivityOnStrava(activityId, { title, description }) {
    try {
      const response = await fetch(
        `https://www.strava.com/api/v3/activities/${activityId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: title,
            description: description,
          }),
        }
      );

      if (!response.ok) {
        console.error("Failed to update activity:", response.statusText);
      } else {
        console.log("Activity updated successfully!", response);
      }
    } catch (error) {
      console.error("Error updating activity:", error);
    }
  }

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
      console.log("No authorization code found in URL");
      return;
    }
    console.log("Authorization code received:", code);

    const clientId = "107512";
    const clientSecret = "1a8f803010a6cd40f81e426960729461ebc7523c";

    // Use the same redirect URI format as in the authorization request
    const redirectUri = window.location.href.includes("localhost")
      ? `${window.location.protocol}//${window.location.host}/callback`
      : `${window.location.protocol}//strava-app-gamma.vercel.app/callback`;

    console.log("Using redirect URI:", redirectUri);
    const tokenUrl = "https://www.strava.com/oauth/token";

    try {
      console.log("Attempting to exchange code for token with params:", {
        client_id: clientId,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      });

      const response = await axios.post(tokenUrl, {
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      });

      console.log("Response from token endpoint:", response.data);
      const accessToken = response.data.access_token;
      setAthlete(response.data.athlete);
      setAccessToken(accessToken);
      localStorage.setItem("accessToken", accessToken);

      // Navigate to home page after successful token exchange
      navigate("/");
    } catch (error) {
      console.error("Error exchanging authorization code for access token:", {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers,
      });
    }
  };

  const populateActivitiesFromStorage = () => {
    const storedActivities = localStorage.getItem("activities");
    if (storedActivities) {
      setActivities(JSON.parse(storedActivities));
    }
  };

  const fetchActivities = async () => {
    if (!athlete || !accessToken) {
      toast({
        title: "Cannot refresh activities",
        description: "Please log in first",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
      return;
    }

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
      setActivities(activities);
      // Save to IndexedDB
      await saveActivities(activities);
      return activities;
    } catch (error) {
      console.error("Error fetching activities:", error);
      toast({
        title: "Error fetching activities",
        description: error.response?.data?.message || "Please try again later",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
      throw error;
    } finally {
      setLoadingActivities(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      // Try to load data from IndexedDB first
      const storedAthlete = await getAthlete();
      const storedActivities = await getActivities();
      const storedAccessToken = localStorage.getItem("accessToken");

      // Set stored data if available
      if (storedAthlete) {
        setAthlete(storedAthlete);
      }
      if (storedActivities.length > 0) {
        setActivities(storedActivities);
      }
      if (storedAccessToken) {
        setAccessToken(storedAccessToken);
      }

      // Only handle authorization if we're on the callback route
      const isCallbackRoute = window.location.pathname === "/callback";
      if (isCallbackRoute) {
        await handleAuthorizationCallback();
        return;
      }

      // If we don't have an access token, we're not authenticated
      if (!storedAccessToken) {
        console.log("No access token found, user needs to log in");
        return;
      }

      // If we have an access token but no athlete data, fetch it
      if (storedAccessToken && !storedAthlete) {
        try {
          await getAthlete(storedAccessToken);
        } catch (error) {
          console.error("Error fetching athlete:", error);
          // If we get a 401, the token is invalid
          if (error.response?.status === 401) {
            logout();
          }
        }
      }
    };

    init();
  }, []);

  // Add new useEffect to handle online/offline status
  useEffect(() => {
    const handleOnline = async () => {
      console.log("App is online, checking for updates");
      if (accessToken) {
        try {
          await fetchActivities();
        } catch (error) {
          console.error("Error fetching activities while online:", error);
        }
      }
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [accessToken]);

  // Separate useEffect for fetching activities when we get an athlete
  useEffect(() => {
    if (athlete && accessToken && navigator.onLine) {
      console.log("Athlete data available and online, fetching activities...");
      fetchActivities();
    }
  }, [athlete, accessToken]);

  const loadSingleActivity = async (activityId) => {
    navigate(`/run/${activityId}`);
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
      // Save to IndexedDB
      await saveAthlete(response.data);
    } catch (error) {
      console.error("Error fetching athlete data:", error);
    }
  };

  const handleLogin = () => {
    console.log(window.location.href);
    const clientId = "107512";
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

    const authorizationUrl = `https://www.strava.com/oauth/authorize?approval_prompt=force&client_id=${clientId}&redirect_uri=${redirectUri}/callback&response_type=code&scope=activity:read_all,activity:write`;

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

  const logout = async () => {
    setAthlete(null);
    setAccessToken("");
    localStorage.removeItem("accessToken");
    // Clear offline data
    await clearData();
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

    // get the activities of the athlete for this week
    const athletesActivities =
      activities?.filter((activity) => {
        const activityDate = new Date(activity.start_date_local);
        return activityDate >= monday && activityDate <= sunday;
      }) || [];

    // Create a copy of athletesActivities that we can modify
    let remainingActivities = [...athletesActivities];

    // now I want to check if the activities are within 10% of the training distance
    // if they are, I consider the training completed
    thisWeeksTrainings.forEach((training) => {
      const completed = remainingActivities.find((activity) => {
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

      training.completed = !!completed;
      training.fullFilledTraining = completed;

      if (completed) {
        // remove the activity from the remaining activities
        remainingActivities = remainingActivities.filter(
          (activity) => activity.id !== completed.id
        );
      }
    });

    // Store the remaining unmatched activities
    window.unmatchedActivities = remainingActivities;

    return thisWeeksTrainings;
  };

  const getUnmatchedActivities = () => {
    return window.unmatchedActivities || [];
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
    if (!athlete || !athlete.id) {
      return "#";
    }
    return `mailto:lucas.moskau@web.de?subject=${athlete.id}&body=Ich%20h%C3%A4tte%20gerne%20einen%20Trainingsplan!`;
  };

  const getThisWeeksActivities = () => {
    if (!activities) return [];

    const today = new Date();
    const dayOfWeek = today.getDay();
    const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;

    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    // Get this week's trainings
    const thisWeeksTrainings = getThisWeeksTrainings();

    // Filter activities to this week first
    const thisWeeksActivities = activities.filter((activity) => {
      const activityDate = new Date(activity.start_date_local);
      return activityDate >= monday && activityDate <= sunday;
    });

    // Filter out activities that have been matched to trainings
    return thisWeeksActivities.filter((activity) => {
      // Check if this activity matches any training
      const isMatched = thisWeeksTrainings.some((training) => {
        const distanceDifference = Math.abs(
          training.distance - activity.distance
        );
        if (training.time) {
          const timeDifference = Math.abs(
            training.time - activity.moving_time / 60
          );
          return (
            distanceDifference < training.distance * 0.15 &&
            timeDifference < training.time * 0.15
          );
        }
        return distanceDifference < training.distance * 0.15;
      });
      return !isMatched;
    });
  };

  const getAllThisWeeksActivities = () => {
    if (!activities) return [];

    const today = new Date();
    const dayOfWeek = today.getDay();
    const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;

    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    // Return all activities within this week
    return activities.filter((activity) => {
      const activityDate = new Date(activity.start_date_local);
      return activityDate >= monday && activityDate <= sunday;
    });
  };

  useEffect(() => {
    if (athlete) {
      setupNotifications().then((success) => {
        if (success) {
          console.log("Notifications set up successfully");
        }
      });
    }
  }, [athlete]);

  return (
    <div>
      {/* Loading overlay */}
      {loadingActivities && (
        <Box
          position="fixed"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bg="blackAlpha.300"
          zIndex="overlay"
          display="flex"
          alignItems="center"
          justifyContent="center"
          backdropFilter="blur(2px)"
        >
          <Box
            bg="white"
            p={6}
            borderRadius="lg"
            boxShadow="xl"
            textAlign="center"
          >
            <Spinner
              size="xl"
              color="teal.500"
              thickness="4px"
              speed="0.65s"
              mb={4}
            />
            <Text fontWeight="medium" color="gray.700">
              Loading activities...
            </Text>
          </Box>
        </Box>
      )}

      <div>
        <Header handleLogin={handleLogin} athlete={athlete} logout={logout} />

        {/* Add reload button */}
        {athlete && (
          <Box maxWidth="1200px" margin="0 auto" px={6} py={4}>
            <Flex gap={4}>
              <Button
                onClick={fetchActivities}
                colorScheme="teal"
                size="md"
                flex="1"
                isLoading={loadingActivities}
                loadingText="Refreshing activities..."
                leftIcon={<RepeatIcon />}
              >
                Refresh Activities
              </Button>
              <Button
                onClick={() =>
                  showTestNotification("Training Reminder", {
                    body: "Don't forget your scheduled run today!",
                    data: { url: window.location.origin },
                  })
                }
                colorScheme="purple"
                size="md"
                flex="1"
              >
                Test Notification
              </Button>
            </Flex>
          </Box>
        )}

        <Box maxWidth="1200px" margin="0 auto" px={6}>
          {athlete && athlete.id && trainingPlans[athlete.id] ? (
            <Box>
              <Flex
                justify="space-between"
                align="center"
                mb={6}
                borderBottom="1px"
                borderColor="gray.200"
                pb={4}
              >
                <Box>
                  <Heading as="h2" size="lg" mb={2}>
                    This Week's Training
                  </Heading>
                  <Text color="gray.600">
                    Your training plan for{" "}
                    {new Date().toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </Text>
                </Box>
                <Flex align="center" gap={8}>
                  <Box textAlign="right">
                    <Text fontSize="lg" fontWeight="bold" color="gray.700">
                      Weekly Progress
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      {formatMeterToKilometer(
                        getAllThisWeeksActivities().reduce(
                          (acc, curr) => acc + curr.distance,
                          0
                        )
                      )}{" "}
                      of{" "}
                      {formatMeterToKilometer(
                        getThisWeeksTrainings().reduce(
                          (acc, curr) => acc + curr.distance,
                          0
                        )
                      )}
                    </Text>
                  </Box>
                  <Box position="relative" width="100px" height="100px">
                    <CircularProgress
                      value={
                        (getAllThisWeeksActivities().reduce(
                          (acc, curr) => acc + curr.distance,
                          0
                        ) /
                          getThisWeeksTrainings().reduce(
                            (acc, curr) => acc + curr.distance,
                            0
                          )) *
                        100
                      }
                      color="teal.400"
                      size="100px"
                      thickness="8px"
                    >
                      <CircularProgressLabel>
                        {Math.round(
                          (getAllThisWeeksActivities().reduce(
                            (acc, curr) => acc + curr.distance,
                            0
                          ) /
                            getThisWeeksTrainings().reduce(
                              (acc, curr) => acc + curr.distance,
                              0
                            )) *
                            100
                        )}
                        %
                      </CircularProgressLabel>
                    </CircularProgress>
                  </Box>
                </Flex>
              </Flex>

              <Grid
                templateColumns={{
                  base: "1fr",
                  md: "repeat(2, 1fr)",
                  lg: "repeat(3, 1fr)",
                }}
                gap={6}
              >
                {getThisWeeksTrainings().map((event) => (
                  <TrainingCard
                    key={event.day + event.title + event.distance}
                    event={event}
                    formatMeterToKilometer={formatMeterToKilometer}
                    convertToPace={convertToPace}
                  />
                ))}
              </Grid>

              {getThisWeeksActivities().length > 0 && (
                <Box mt={8} pt={6} borderTop="1px" borderColor="gray.200">
                  <Flex justify="space-between" align="center" mb={4}>
                    <Box>
                      <Text fontSize="md" fontWeight="medium" color="gray.700">
                        Unmatched Runs This Week
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        {getThisWeeksActivities().length} activities totaling{" "}
                        {formatMeterToKilometer(
                          getThisWeeksActivities().reduce(
                            (acc, curr) => acc + curr.distance,
                            0
                          )
                        )}
                      </Text>
                    </Box>
                    <Text fontSize="sm" color="gray.500">
                      These runs weren't matched to any training plan items
                    </Text>
                  </Flex>

                  <Box>
                    {getThisWeeksActivities().map((activity) => (
                      <Flex
                        key={activity.id}
                        p={3}
                        borderWidth="1px"
                        borderRadius="md"
                        mb={2}
                        justify="space-between"
                        align="center"
                        _hover={{ bg: "gray.50" }}
                      >
                        <Box>
                          <Text fontWeight="medium">{activity.name}</Text>
                          <Text fontSize="sm" color="gray.600">
                            {new Date(
                              activity.start_date_local
                            ).toLocaleDateString()}{" "}
                            at{" "}
                            {new Date(
                              activity.start_date_local
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </Text>
                        </Box>
                        <Flex gap={4} align="center">
                          <Text color="gray.700">
                            {formatMeterToKilometer(activity.distance)}
                          </Text>
                          <Text color="gray.700">
                            {formatDuration(activity.moving_time)}
                          </Text>
                          <Text color="gray.700">
                            {metersPerSecondsToPace(activity.average_speed)} /km
                          </Text>
                        </Flex>
                      </Flex>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
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

          {showAnalytics && (
            <Box textAlign="center" marginTop={8}>
              <Heading as="h1" size="lg" marginBottom={4}>
                Activity Analytics
              </Heading>
              {/* <ThresholdAnalysis
                detailedActivities={detailedActivities}
                onWeekSelect={filterActivites}
              /> */}
              <WeeklySummary activities={detailedActivities} />
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

          {loadingActivities && (
            <Flex justifyContent="center" marginY={4}>
              <Spinner color="teal.500" />
            </Flex>
          )}

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
      </div>
      {hideActivities && (
        <Box marginTop={4} textAlign="center">
          <Button
            onClick={() => setHideActivities(false)}
            colorScheme="teal"
            marginBottom={2}
            width="100%"
            maxWidth="300px"
          >
            Back
          </Button>
        </Box>
      )}
      <Box maxWidth="1200px" margin="0 auto" px={6}>
        <div className="activity-div">
          {!hideActivities &&
            activities &&
            athlete &&
            activities.length &&
            (filteredActivities ? filteredActivities : activities).map(
              (activity) => (
                <Activity
                  activity={activity}
                  loadSingleActivity={loadSingleActivity}
                  updateActivityOnStrava={updateActivityOnStrava}
                />
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
                            index === editedIndex
                              ? editedDistance
                              : lap.distance
                          }
                          onChange={(e) =>
                            handleDistanceChangeFromActivity(e, index)
                          }
                        />
                      </td>
                      <td>
                        {convertToPace((lap.moving_time / 60).toFixed(2))}
                      </td>
                      <td>{lap.average_heartrate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {!showPaceCalculator && (
          <Flex justifyContent="center" marginTop={4}>
            <Button
              onClick={() => {
                setShowPaceCalculator(true);
              }}
              colorScheme="teal"
              marginBottom={2}
              width="100%"
              maxWidth="300px"
            >
              Show Pace Calculator
            </Button>
          </Flex>
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

              <Flex justifyContent="center" marginTop={4}>
                <Button
                  onClick={() => {
                    addInput();
                  }}
                  colorScheme="teal"
                  marginBottom={2}
                  width="100%"
                  maxWidth="300px"
                >
                  +
                </Button>
              </Flex>
              <Flex justifyContent="center" marginTop={4}>
                <Button
                  onClick={() => {
                    setSetDistance(0);
                    setTimeout(() => {
                      calculatePace();
                    }, 500);
                  }}
                  colorScheme="teal"
                  marginBottom={2}
                  width="100%"
                  maxWidth="300px"
                >
                  Calculate Pace
                </Button>
              </Flex>
              <Flex justifyContent="center" marginTop={4}>
                {/* Calculate for same distance for all */}
                <Button
                  onClick={() => {
                    calculatePaceWithSetDistance();
                  }}
                  colorScheme="teal"
                  marginBottom={2}
                  width="100%"
                  maxWidth="300px"
                >
                  Calculate with same distance for all laps
                </Button>
              </Flex>

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
      </Box>
    </div>
  );
}

export default Home;
