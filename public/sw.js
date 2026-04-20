const CACHE_NAME = 'luna-y-sol-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Push Notification handling
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'Luna y Sol', body: 'Nueva notificación operacional.' };
  
  const options = {
    body: data.body,
    icon: '/icon-192x192.png', // Assuming icon exists
    badge: '/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
