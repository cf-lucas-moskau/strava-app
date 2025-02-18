import axios from "axios";
import { saveActivities } from "./db";
import { getValidAccessToken } from "./auth";
import { ADMIN_ATHLETE_ID, saveAthleteActivities } from "./admin";

export const fetchActivities = async (
  athlete,
  accessToken,
  setLoadingActivities,
  toast,
  setAthlete,
  setAccessToken
) => {
  if (!athlete) {
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
    // Get a valid access token
    const validToken = await getValidAccessToken(setAthlete, setAccessToken);

    const response = await axios.get(
      "https://www.strava.com/api/v3/athlete/activities",
      {
        headers: {
          Authorization: `Bearer ${validToken}`,
        },
        params: {
          per_page: 200,
        },
      }
    );

    const activities = response.data;
    console.log("Activities:", activities);
    await saveActivities(activities);

    // Save activities to Firebase for all users (including admin)
    const savedCount = await saveAthleteActivities(athlete.id, activities);
    if (savedCount > 0) {
      console.log(`Saved ${savedCount} new activities to Firebase`);
    }

    return activities;
  } catch (error) {
    console.error("Error fetching activities:", error);

    // If the error is related to authentication, prompt user to log in again
    if (error.response?.status === 401) {
      toast({
        title: "Authentication Error",
        description: "Please log in again to continue",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top",
      });
    } else {
      toast({
        title: "Error fetching activities",
        description: error.response?.data?.message || "Please try again later",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
    }

    throw error;
  } finally {
    setLoadingActivities(false);
  }
};

export const updateActivityOnStrava = async (
  activityId,
  { title, description },
  accessToken,
  setAthlete,
  setAccessToken
) => {
  try {
    // Get a valid access token
    const validToken = await getValidAccessToken(setAthlete, setAccessToken);

    const response = await fetch(
      `https://www.strava.com/api/v3/activities/${activityId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${validToken}`,
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
};
