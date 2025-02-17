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
