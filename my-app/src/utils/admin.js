import { ref, update, get, set } from "firebase/database";
import { database } from "../firebase-config";

export const ADMIN_ATHLETE_ID = 32945540;

export const STATUS_OPTIONS = [
  { value: "pending", label: "Pending", color: "yellow" },
  { value: "approved", label: "Approved", color: "green" },
  { value: "rejected", label: "Rejected", color: "red" },
];

export const updateTrainingPlanRequestStatus = async (
  requestId,
  newStatus,
  athleteId
) => {
  if (!athleteId || athleteId !== ADMIN_ATHLETE_ID) {
    throw new Error("Unauthorized access");
  }

  const updates = {};
  updates[`trainingPlanRequests/${requestId}/status`] = newStatus;
  updates[`trainingPlanRequests/${requestId}/lastUpdated`] =
    new Date().toISOString();
  updates[`trainingPlanRequests/${requestId}/updatedBy`] = athleteId;

  await update(ref(database), updates);
};

export const createTrainingPlan = async (athleteId, adminId, trainings) => {
  if (!adminId || adminId !== ADMIN_ATHLETE_ID) {
    throw new Error("Unauthorized access");
  }

  const trainingPlanRef = ref(database, `trainingPlans/${athleteId}`);

  await set(trainingPlanRef, {
    trainings,
    createdAt: new Date().toISOString(),
    createdBy: adminId,
    lastUpdated: new Date().toISOString(),
  });
};

export const updateTrainingPlan = async (athleteId, adminId, trainings) => {
  if (!adminId || adminId !== ADMIN_ATHLETE_ID) {
    throw new Error("Unauthorized access");
  }

  const updates = {};
  updates[`trainingPlans/${athleteId}/trainings`] = trainings;
  updates[`trainingPlans/${athleteId}/lastUpdated`] = new Date().toISOString();
  updates[`trainingPlans/${athleteId}/updatedBy`] = adminId;

  await update(ref(database), updates);
};

export const getTrainingPlan = async (athleteId) => {
  const trainingPlanRef = ref(database, `trainingPlans/${athleteId}`);
  const snapshot = await get(trainingPlanRef);

  if (snapshot.exists()) {
    return snapshot.val();
  }
  return null;
};

export const getAllTrainingPlans = async (adminId) => {
  if (!adminId || adminId !== ADMIN_ATHLETE_ID) {
    throw new Error("Unauthorized access");
  }

  const trainingPlansRef = ref(database, "trainingPlans");
  const snapshot = await get(trainingPlansRef);

  if (snapshot.exists()) {
    return snapshot.val();
  }
  return {};
};

// Helper function to format a training for the database
export const formatTraining = (training) => ({
  title: training.title,
  description: training.description,
  distance: training.distance, // in meters
  time: training.time, // in minutes (optional)
  day: training.day, // ISO string date
  type: training.type || "run",
  intensity: training.intensity || "medium",
});

export const saveAthleteActivities = async (athleteId, newActivities) => {
  try {
    // Get the 5 most recent activities
    const recentActivities = newActivities
      .sort((a, b) => b.id - a.id)
      .slice(0, 5);

    // First check if these recent activities exist
    const recentActivityRefs = recentActivities.map((activity) =>
      ref(database, `athleteActivities/${athleteId}/${activity.id}`)
    );

    const recentSnapshots = await Promise.all(
      recentActivityRefs.map((ref) => get(ref))
    );

    const allRecentExist = recentSnapshots.every((snapshot) =>
      snapshot.exists()
    );

    if (allRecentExist) {
      console.log("Recent activities already saved, skipping full check");
      return 0;
    }

    // If some recent activities are missing, determine which ones
    const missingRecentActivities = recentActivities.filter(
      (activity, index) => !recentSnapshots[index].exists()
    );

    // If all recent activities are missing, do a full comparison
    if (missingRecentActivities.length === recentActivities.length) {
      console.log("All recent activities missing, performing full comparison");
      const activitiesRef = ref(database, `athleteActivities/${athleteId}`);
      const snapshot = await get(activitiesRef);
      const existingActivities = snapshot.exists() ? snapshot.val() : {};

      // Create updates object for all missing activities
      const updates = {};
      let newCount = 0;
      newActivities.forEach((activity) => {
        if (!existingActivities[activity.id]) {
          updates[`athleteActivities/${athleteId}/${activity.id}`] = {
            ...activity,
            savedAt: new Date().toISOString(),
          };
          newCount++;
        }
      });

      if (Object.keys(updates).length > 0) {
        // Update the activities count
        const countRef = ref(
          database,
          `athleteActivitiesMeta/${athleteId}/count`
        );
        const countSnapshot = await get(countRef);
        const currentCount = countSnapshot.exists() ? countSnapshot.val() : 0;
        updates[`athleteActivitiesMeta/${athleteId}/count`] =
          currentCount + newCount;
        updates[`athleteActivitiesMeta/${athleteId}/lastUpdated`] =
          new Date().toISOString();

        await update(ref(database), updates);
        console.log(
          `Saved ${newCount} new activities for athlete ${athleteId}`
        );
        return newCount;
      }
    } else {
      // Only save the missing recent activities
      const updates = {};
      missingRecentActivities.forEach((activity) => {
        updates[`athleteActivities/${athleteId}/${activity.id}`] = {
          ...activity,
          savedAt: new Date().toISOString(),
        };
      });

      // Update the activities count
      const countRef = ref(
        database,
        `athleteActivitiesMeta/${athleteId}/count`
      );
      const countSnapshot = await get(countRef);
      const currentCount = countSnapshot.exists() ? countSnapshot.val() : 0;
      updates[`athleteActivitiesMeta/${athleteId}/count`] =
        currentCount + missingRecentActivities.length;
      updates[`athleteActivitiesMeta/${athleteId}/lastUpdated`] =
        new Date().toISOString();

      await update(ref(database), updates);
      console.log(
        `Saved ${missingRecentActivities.length} recent activities for athlete ${athleteId}`
      );
      return missingRecentActivities.length;
    }

    console.log(`No new activities to save for athlete ${athleteId}`);
    return 0;
  } catch (error) {
    console.error("Error saving athlete activities:", error);
    return 0;
  }
};

export const getAthleteActivities = async (athleteId, page = 1, limit = 10) => {
  try {
    // Get the total count first
    const countRef = ref(database, `athleteActivitiesMeta/${athleteId}/count`);
    const countSnapshot = await get(countRef);
    const totalCount = countSnapshot.exists() ? countSnapshot.val() : 0;

    // Calculate pagination values
    const totalPages = Math.ceil(totalCount / limit);
    const startIndex = (page - 1) * limit;

    // Get only the activities for the current page
    const activitiesRef = ref(database, `athleteActivities/${athleteId}`);
    const snapshot = await get(activitiesRef);

    if (!snapshot.exists()) {
      return { activities: [], total: 0, page, limit, totalPages: 0 };
    }

    // Convert to array and sort by date
    const allActivities = Object.values(snapshot.val())
      .sort(
        (a, b) => new Date(b.start_date_local) - new Date(a.start_date_local)
      )
      .slice(startIndex, startIndex + limit);

    // Mark athlete as seen by admin
    await markAthleteSeen(athleteId);

    return {
      activities: allActivities,
      total: totalCount,
      page,
      limit,
      totalPages,
    };
  } catch (error) {
    console.error("Error getting athlete activities:", error);
    return { activities: [], total: 0, page, limit, totalPages: 0 };
  }
};

export const markAthleteSeen = async (athleteId) => {
  if (!athleteId) return;

  const updates = {};
  updates[`athleteActivitiesMeta/${athleteId}/lastSeenByAdmin`] =
    new Date().toISOString();
  await update(ref(database), updates);
};

export const getUnseenAthletes = async () => {
  try {
    // Get all athletes' metadata
    const metaRef = ref(database, "athleteActivitiesMeta");
    const metaSnapshot = await get(metaRef);

    if (!metaSnapshot.exists()) return [];

    const unseenAthletes = [];
    const meta = metaSnapshot.val();

    for (const [athleteId, athleteMeta] of Object.entries(meta)) {
      const lastSeenByAdmin = athleteMeta.lastSeenByAdmin
        ? new Date(athleteMeta.lastSeenByAdmin)
        : new Date(0);
      const lastUpdated = athleteMeta.lastUpdated
        ? new Date(athleteMeta.lastUpdated)
        : new Date(0);

      if (lastUpdated > lastSeenByAdmin) {
        unseenAthletes.push(athleteId);
      }
    }

    return unseenAthletes;
  } catch (error) {
    console.error("Error getting unseen athletes:", error);
    return [];
  }
};
