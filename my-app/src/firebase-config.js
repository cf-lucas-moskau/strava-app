import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { getDatabase, ref, set, get } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDPvsTvEV5Q_x24R9FTvk2PC32rrQ_bBHQ",
  authDomain: "mrc-olso.firebaseapp.com",
  databaseURL:
    "https://mrc-olso-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "mrc-olso",
  storageBucket: "mrc-olso.firebasestorage.app",
  messagingSenderId: "816386613163",
  appId: "1:816386613163:web:21452effa1faa51a783cee",
  measurementId: "G-9MRHDQ0RWE",
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);
const database = getDatabase(app);

export const saveClaimedToken = async (athleteId, trainingId) => {
  try {
    await set(ref(database, `claimedTokens/${athleteId}/${trainingId}`), {
      claimed: true,
      timestamp: Date.now(),
    });
    return true;
  } catch (error) {
    console.error("Error saving claimed token:", error);
    return false;
  }
};

export const checkIfTokenClaimed = async (athleteId, trainingId) => {
  try {
    const snapshot = await get(
      ref(database, `claimedTokens/${athleteId}/${trainingId}`)
    );
    return snapshot.exists();
  } catch (error) {
    console.error("Error checking claimed token:", error);
    return false;
  }
};

export const requestForToken = async () => {
  try {
    const currentToken = await getToken(messaging, {
      vapidKey:
        "BBvx3P3gaJLp-dukbVJGIn-VSlO_l0DraOnlDiwSgHFZ1fquU2bl7DCyyifTXUvxijp-cQYEYmT2gPgs3mx146o",
    });
    if (currentToken) {
      console.log("Current token for client:", currentToken);
      return currentToken;
    } else {
      console.log("No registration token available.");
      return null;
    }
  } catch (err) {
    console.log("An error occurred while retrieving token:", err);
    return null;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });

export default messaging;
