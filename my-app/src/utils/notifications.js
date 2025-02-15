import { requestForToken } from "../firebase-config";

const convertedVapidKey =
  "BLC8GOevpcpjQiLkO7JmVClQjycvTCYWm6Cq_a7dJyKTRqsmpRkRuKvBYzP4gNurTnH_yqyEGQDWNUwPzUzJ8Zk";

export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    console.log("This browser does not support notifications");
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return false;
  }
}

export async function subscribeToPushNotifications(registration) {
  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey,
    });

    console.log("Push notification subscription:", subscription);

    // Here you would typically send this subscription to your server
    // await sendSubscriptionToServer(subscription);

    return subscription;
  } catch (error) {
    console.error("Error subscribing to push notifications:", error);
    return null;
  }
}

export async function setupNotifications() {
  if (!("serviceWorker" in navigator)) {
    console.log("Service workers are not supported");
    return false;
  }

  try {
    const permission = await requestNotificationPermission();
    if (!permission) {
      console.log("Notification permission denied");
      return false;
    }

    // Get Firebase messaging token
    const token = await requestForToken();
    if (!token) {
      console.log("Could not get Firebase token");
      return false;
    }

    // Here you would send this token to your backend
    console.log("Firebase token:", token);

    return true;
  } catch (error) {
    console.error("Error setting up notifications:", error);
    return false;
  }
}

// Example function to show a notification (for testing)
export async function showTestNotification(title, options = {}) {
  if (!("Notification" in window)) {
    console.log("This browser does not support notifications");
    return;
  }

  if (Notification.permission === "granted") {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      body: options.body || "This is a test notification",
      icon: "logo192.png",
      badge: "favicon.ico",
      vibrate: [200, 100, 200],
      ...options,
    });
  }
}
