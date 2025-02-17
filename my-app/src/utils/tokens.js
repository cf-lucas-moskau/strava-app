import { database } from "../firebase-config";
import { ref, get, set } from "firebase/database";
import { getThisWeeksTrainings } from "./training";

export const saveClaimedToken = async (athlete, activity) => {
  if (!athlete || !activity) return;

  const claimedTokenRef = ref(
    database,
    `claimedTokens/${athlete.id}/${activity.id}`
  );
  await set(claimedTokenRef, {
    activityId: activity.id,
    claimedAt: new Date().toISOString(),
  });
};

export const checkIfTokenClaimed = async (athlete, activity) => {
  if (!athlete || !activity) return false;

  const claimedTokenRef = ref(
    database,
    `claimedTokens/${athlete.id}/${activity.id}`
  );
  const snapshot = await get(claimedTokenRef);
  return snapshot.exists();
};

export const getClaimedTokensCount = async (athlete) => {
  if (!athlete) return 0;

  const claimedTokensRef = ref(database, `claimedTokens/${athlete.id}`);
  const snapshot = await get(claimedTokensRef);
  return snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
};

export const claimToken = async (
  athlete,
  activity,
  setTokens,
  setUnclaimedTokens
) => {
  if (!athlete || !activity) return;

  const isClaimed = await checkIfTokenClaimed(athlete, activity);
  if (isClaimed) {
    console.log("Token already claimed for activity:", activity.id);
    return;
  }

  await saveClaimedToken(athlete, activity);
  const newTokenCount = await getClaimedTokensCount(athlete);
  setTokens(newTokenCount);

  // Update unclaimed tokens state
  setUnclaimedTokens((prev) => {
    const newState = { ...prev };
    delete newState[activity.id];
    return newState;
  });

  localStorage.setItem("tokens", newTokenCount.toString());
};

export const checkAndUpdateClaimedTokens = async (
  athlete,
  activities,
  weekOffset,
  setTokens,
  setUnclaimedTokens
) => {
  if (!athlete || !activities) return;

  const today = new Date();
  const dayOfWeek = today.getDay();
  const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday + weekOffset * 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  // Get all activities for this week
  const weekActivities = activities.filter((activity) => {
    const activityDate = new Date(activity.start_date_local);
    return activityDate >= monday && activityDate <= sunday;
  });

  // Get all claimed tokens for this athlete
  const claimedTokensRef = ref(database, `claimedTokens/${athlete.id}`);
  const snapshot = await get(claimedTokensRef);
  const claimedTokens = snapshot.exists() ? snapshot.val() : {};

  // Create a map of unclaimed tokens
  const unclaimedTokensMap = {};
  for (const activity of weekActivities) {
    if (!claimedTokens[activity.id]) {
      unclaimedTokensMap[activity.id] = true;
    }
  }

  setUnclaimedTokens(unclaimedTokensMap);
  setTokens(Object.keys(claimedTokens).length);
  localStorage.setItem("tokens", Object.keys(claimedTokens).length.toString());
};
