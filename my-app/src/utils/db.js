import { openDB } from "idb";

const dbName = "strava-app-db";
const version = 1;

const initDB = async () => {
  const db = await openDB(dbName, version, {
    upgrade(db) {
      // Create stores
      if (!db.objectStoreNames.contains("activities")) {
        db.createObjectStore("activities", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("athlete")) {
        db.createObjectStore("athlete", { keyPath: "id" });
      }
    },
  });
  return db;
};

export const saveActivities = async (activities) => {
  const db = await initDB();
  const tx = db.transaction("activities", "readwrite");
  const store = tx.objectStore("activities");

  for (const activity of activities) {
    await store.put(activity);
  }

  await tx.done;
};

export const getActivities = async () => {
  const db = await initDB();
  return db.getAll("activities");
};

export const saveAthlete = async (athlete) => {
  const db = await initDB();
  const tx = db.transaction("athlete", "readwrite");
  const store = tx.objectStore("athlete");
  await store.put(athlete);
  await tx.done;
};

export const getAthlete = async () => {
  const db = await initDB();
  const tx = db.transaction("athlete", "readonly");
  const store = tx.objectStore("athlete");
  const athletes = await store.getAll();
  return athletes[0]; // Return the first athlete (should only be one)
};

export const clearData = async () => {
  const db = await initDB();
  const tx = db.transaction(["activities", "athlete"], "readwrite");

  await Promise.all([
    tx.objectStore("activities").clear(),
    tx.objectStore("athlete").clear(),
  ]);

  await tx.done;
};
