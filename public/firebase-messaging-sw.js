importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyAnL_B2dzFYrLNO2YY7pO0ZQnSaHmkljOE",
    authDomain: "tbu-sport.firebaseapp.com",
    projectId: "tbu-sport",
    storageBucket: "tbu-sport.firebasestorage.app",
    messagingSenderId: "60216516830",
    appId: "1:60216516830:web:b872edf5b0829c2cd4a24f",
});

const messaging = firebase.messaging();

// Xử lý thông báo khi app đang ở background
messaging.onBackgroundMessage((payload) => {
    const { title, body, icon } = payload.notification ?? {};
    self.registration.showNotification(title ?? 'TBU Sport', {
        body: body ?? '',
        icon: icon ?? '/logo192.png',
        badge: '/logo192.png',
        requireInteraction: true,
        vibrate: [200, 120, 200],
        data: {
            url: '/'
        }
    });
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const targetUrl = event.notification?.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url.includes(targetUrl) && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
