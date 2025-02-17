import { getDatabase, ref, set, get } from "firebase/database";

export const saveClaimedToken = async (athleteId, activityId) => {
  try {
    const database = getDatabase();
    await set(ref(database, `claimedTokens/${athleteId}/${activityId}`), {
      claimed: true,
      timestamp: Date.now(),
    });
    return true;
  } catch (error) {
    console.error("Error saving claimed token:", error);
    return false;
  }
};

export const checkIfTokenClaimed = async (athleteId, activityId) => {
  try {
    const database = getDatabase();
    const snapshot = await get(
      ref(database, `claimedTokens/${athleteId}/${activityId}`)
    );
    return snapshot.exists();
  } catch (error) {
    console.error("Error checking claimed token:", error);
    return false;
  }
};

export const getClaimedTokensCount = async (athleteId) => {
  try {
    const database = getDatabase();
    const snapshot = await get(ref(database, `claimedTokens/${athleteId}`));
    return snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
  } catch (error) {
    console.error("Error getting claimed tokens count:", error);
    return 0;
  }
};
