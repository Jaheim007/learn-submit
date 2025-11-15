// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/12.6.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.6.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyDxVWfXZYTKAW6gF4cqSsiB1ajbh_6nj6E",
  authDomain: "nys-africa.firebaseapp.com",
  projectId: "nys-africa",
  storageBucket: "nys-africa.firebasestorage.app",
  messagingSenderId: "725565778116",
  appId: "1:725565778116:web:ae936b71557bb0bf1c8191",
  measurementId: "G-KYZ053W2LB"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);
  
  const notificationTitle = payload.notification?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: payload.notification?.icon || '/favicon.ico',
    badge: '/favicon.ico',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();
  
  // Navigate to the app or specific page
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  );
});
