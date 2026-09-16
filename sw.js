/**
 * Service Worker для офлайн-режима и кэширования ресурсов
 * Версия кэша: v1
 */

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const IMAGES_CACHE = `images-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;

// Критические ресурсы для кэширования при установке
const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/reader.html',
  '/memory-book.html',
  '/guestbook.html',
  '/quiz.html',
  '/verify.html',
  '/certificate.html',
  '/desk-qr.html',
  '/mobile.html',
  '/methodology.html',
  '/main.js',
  '/js/app.js',
  '/js/data.js',
  '/js/reader.js',
  '/js/memory-book.js',
  '/js/guestbook.js',
  '/js/quiz.js',
  '/js/certificate.js',
  '/js/desk-qr.js',
  '/js/mobile.js',
  '/js/methodology.js',
  '/js/archive-service.js',
  '/js/logger.js',
  '/css/styles.css',
  '/css/reader.css',
  '/css/memory-book.css',
  '/css/guestbook.css',
  '/css/quiz.css',
  '/css/certificate.css',
  '/css/desk-qr.css',
  '/css/mobile.css',
  '/css/methodology.css',
  '/assets/images/logo-srmk.svg',
  '/assets/images/cover-master.webp',
  '/assets/images/memorial-bg.webp'
];

// Установка Service Worker и кэширование критических ресурсов
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching critical assets');
        return cache.addAll(CRITICAL_ASSETS);
      })
      .then(() => {
        console.log('[SW] Installation complete, skipping waiting');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache critical assets:', error);
      })
  );
});

// Активация Service Worker и очистка старых кэшей
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return name.startsWith('static-') || 
                     name.startsWith('images-') || 
                     name.startsWith('dynamic-');
            })
            .filter((name) => {
              return name !== STATIC_CACHE && 
                     name !== IMAGES_CACHE && 
                     name !== DYNAMIC_CACHE;
            })
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Activation complete, claiming clients');
        return self.clients.claim();
      })
  );
});

// Стратегия кэширования для разных типов запросов
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Игнорируем запросы к другим доменам
  if (url.origin !== location.origin) {
    return;
  }
  
  // Игнорируем некэшируемые запросы
  if (request.method !== 'GET') {
    return;
  }
  
  // Стратегия для изображений
  if (request.destination === 'image') {
    event.respondWith(handleImageRequest(request));
    return;
  }
  
  // Стратегия для HTML страниц
  if (request.destination === 'document') {
    event.respondWith(handleDocumentRequest(request));
    return;
  }
  
  // Стратегия для CSS и JS
  if (request.destination === 'style' || request.destination === 'script') {
    event.respondWith(handleStaticRequest(request));
    return;
  }
  
  // Стратегия по умолчанию для остальных ресурсов
  event.respondWith(handleDefaultRequest(request));
});

// Обработка запросов изображений: Cache First, затем Network
async function handleImageRequest(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    console.log('[SW] Image served from cache:', request.url);
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(IMAGES_CACHE);
      cache.put(request, networkResponse.clone());
      console.log('[SW] Image cached:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Image fetch failed:', request.url, error);
    return createFallbackImage();
  }
}

// Обработка запросов документов: Network First, затем Cache
async function handleDocumentRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      console.log('[SW] Document cached:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Document fetch failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      console.log('[SW] Document served from cache:', request.url);
      return cachedResponse;
    }
    
    // Возвращаем офлайн-страницу
    return caches.match('/offline.html').then((response) => {
      return response || createOfflinePage();
    });
  }
}

// Обработка запросов статики (CSS/JS): Cache First, затем Network
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    console.log('[SW] Static resource served from cache:', request.url);
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
      console.log('[SW] Static resource cached:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Static resource fetch failed:', request.url, error);
    return new Response('Resource not available offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Обработка запросов по умолчанию: Stale While Revalidate
async function handleDefaultRequest(request) {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      const cache = caches.open(DYNAMIC_CACHE);
      cache.then((c) => c.put(request, networkResponse.clone()));
    }
    return networkResponse;
  }).catch(() => {
    console.log('[SW] Default fetch failed, using cache:', request.url);
    return cachedResponse;
  });
  
  return cachedResponse || fetchPromise;
}

// Создание fallback изображения для офлайн-режима
function createFallbackImage() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <rect width="200" height="200" fill="#f0f0f0"/>
      <text x="100" y="90" text-anchor="middle" fill="#999" font-size="14">Image unavailable</text>
      <text x="100" y="110" text-anchor="middle" fill="#999" font-size="12">Offline mode</text>
    </svg>
  `;
  
  return new Response(svg, {
    headers: { 'Content-Type': 'image/svg+xml' }
  });
}

// Создание офлайн-страницы
function createOfflinePage() {
  const html = `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Нет подключения к интернету</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-align: center;
        }
        .container {
          padding: 40px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          backdrop-filter: blur(10px);
        }
        h1 { margin: 0 0 20px; font-size: 2.5em; }
        p { margin: 0 0 30px; font-size: 1.2em; opacity: 0.9; }
        button {
          padding: 15px 30px;
          font-size: 1em;
          background: white;
          color: #667eea;
          border: none;
          border-radius: 50px;
          cursor: pointer;
          transition: transform 0.2s;
        }
        button:hover { transform: scale(1.05); }
        .icon { font-size: 4em; margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">📡</div>
        <h1>Нет подключения</h1>
        <p>Проверьте ваше интернет-соединение или вернитесь позже</p>
        <button onclick="location.reload()">Попробовать снова</button>
      </div>
    </body>
    </html>
  `;
  
  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  });
}

// Обработка сообщений от основного приложения
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((names) => {
        return Promise.all(names.map((name) => caches.delete(name)));
      }).then(() => {
        event.ports[0].postMessage({ success: true });
      })
    );
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.addAll(event.data.urls);
      }).then(() => {
        event.ports[0].postMessage({ success: true });
      })
    );
  }
});

console.log('[SW] Service Worker script loaded');
