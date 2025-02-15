const CACHE_NAME = "strava-app-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/static/js/main.chunk.js",
  "/static/js/0.chunk.js",
  "/static/js/bundle.js",
  "/manifest.json",
  "/favicon.ico",
  "/logo192.png",
  "/logo512.png",
];

// Import and configure firebase messaging
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyDPvsTvEV5Q_x24R9FTvk2PC32rrQ_bBHQ",
  authDomain: "mrc-olso.firebaseapp.com",
  databaseURL:
    "https://mrc-olso-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "mrc-olso",
  storageBucket: "mrc-olso.firebasestorage.app",
  messagingSenderId: "816386613163",
  appId: "1:816386613163:web:21452effa1faa51a783cee",
  measurementId: "G-9MRHDQ0RWE",
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log("Received background message:", payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "logo192.png",
    badge: "favicon.ico",
    vibrate: [200, 100, 200],
    tag: "strava-notification",
    data: {
      url: self.location.origin,
    },
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Install a service worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache");
      return cache.addAll(urlsToCache);
    })
  );
});

// Listen for push notifications
self.addEventListener("push", (event) => {
  const options = {
    body: event.data.text(),
    icon: "logo192.png",
    badge: "favicon.ico",
    vibrate: [200, 100, 200],
    tag: "strava-notification",
    data: {
      url: self.location.origin,
    },
  };

  event.waitUntil(
    self.registration.showNotification("Strava Training App", options)
  );
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(clients.openWindow(event.notification.data.url));
});

// Cache and return requests
self.addEventListener("fetch", (event) => {
  // Only cache GET requests
  if (event.request.method !== "GET") return;

  // Don't cache Strava API calls
  if (event.request.url.includes("strava.com/api")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        return response;
      }

      return fetch(event.request).then((response) => {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }

        // Clone the response as it can only be consumed once
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});

// Update a service worker
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
