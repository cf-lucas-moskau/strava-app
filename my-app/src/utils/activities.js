import axios from "axios";
import { saveActivities } from "./db";
import { getValidAccessToken } from "./auth";
import { ADMIN_ATHLETE_ID, saveAthleteActivities } from "./admin";
import {
  getDatabase,
  ref,
  set,
  get,
  query,
  orderByChild,
  limitToLast,
} from "firebase/database";

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

export const fetchGroupActivities = async (athleteId) => {
  try {
    console.log("Fetching group activities for athlete:", athleteId);
    const db = getDatabase();
    const groupsRef = ref(db, "groups");
    const snapshot = await get(groupsRef);

    if (!snapshot.exists()) {
      console.log("No groups found in database");
      return [];
    }

    // Find groups that the athlete is a member of
    const groups = Object.entries(snapshot.val()).filter(([_, group]) => {
      const isMember = group.members && group.members[athleteId];
      console.log("Group members:", group.members);
      return isMember;
    });

    console.log("Athlete is member of", groups.length, "groups");

    // Get activities from all group members
    const allActivities = [];
    for (const [groupId, group] of groups) {
      console.log("Processing group:", groupId);
      const memberIds = Object.keys(group.members || {});
      console.log("Group members:", memberIds);

      for (const memberId of memberIds) {
        if (memberId === athleteId) continue; // Skip the current athlete's activities

        // Create a query to get only the 5 most recent activities using the id index
        const activitiesRef = ref(db, `athleteActivities/${memberId}`);
        const recentActivitiesQuery = query(
          activitiesRef,
          orderByChild("id"),
          limitToLast(5)
        );

        const activitiesSnapshot = await get(recentActivitiesQuery);

        if (activitiesSnapshot.exists()) {
          const activities = Object.values(activitiesSnapshot.val());
          console.log(
            `Found ${activities.length} recent activities for member ${memberId}`
          );
          allActivities.push(...activities);
        }
      }
    }

    // Sort by activity id (descending) to get most recent first
    const filteredActivities = allActivities.sort((a, b) => b.id - a.id);

    console.log(`Returning ${filteredActivities.length} group activities`);
    return filteredActivities;
  } catch (error) {
    console.error("Error fetching group activities:", error);
    return [];
  }
};
