import axios from "axios";
import { saveActivities } from "./db";

export const fetchActivities = async (
  athlete,
  accessToken,
  setLoadingActivities,
  toast
) => {
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
    console.log("Activities:", activities);
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

export const updateActivityOnStrava = async (
  activityId,
  { title, description },
  accessToken
) => {
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
};
