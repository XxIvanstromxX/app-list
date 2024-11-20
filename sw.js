// Nombre del caché
const CACHE_NAME = 'taskflow-cache-v1';

// Recursos para cachear
const RECURSOS = [
  '/',
  '/index.html',
  '/src/style.css',
  '/src/script.js',
  '/assets/notification.png',
  '/manifest.json'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierto');
        return cache.addAll(RECURSOS)
          .catch(error => {
            console.error('Error al cachear recursos:', error);
            // Continuar incluso si algunos recursos fallan
            return Promise.resolve();
          });
      })
  );
  self.skipWaiting();
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Interceptar peticiones
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Devolver del cache si existe
        if (response) {
          return response;
        }
        
        // Si no está en cache, intentar traerlo de la red
        return fetch(event.request)
          .then(response => {
            // Verificar si la respuesta es válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clonar la respuesta para el cache
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(error => {
            console.error('Error en fetch:', error);
            // Podrías devolver una respuesta fallback aquí
          });
      })
  );
});

// Manejo de notificaciones
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({type: 'window'}).then(clientList => {
      if (clientList.length > 0) {
        let client = clientList[0];
        client.focus();
        return client.navigate(event.notification.data?.url || '/');
      }
      return clients.openWindow('/');
    })
  );
});