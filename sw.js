// Precarga de recursos
const RECURSOS = [
  'https://cdn.icon-icons.com/icons2/2063/PNG/512/add_new_create_notification_bell_icon_124695.png',
  'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('recursos-v1').then((cache) => {
      return cache.addAll(RECURSOS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/assets/')) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({type: 'window'}).then(clientList => {
      if (clientList.length > 0) {
        let client = clientList[0];
        client.focus();
        return client.navigate(event.notification.data.url || '/');
      }
      return clients.openWindow(event.notification.data.url || '/');
    })
  );
});