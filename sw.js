/**
 * Service Worker - Кэширование общих ресурсов и офлайн-режим
 * Уменьшает нагрузку на сеть и ускоряет загрузку повторяющихся ресурсов
 */

const CACHE_NAME = 'memorial-core-v1';
const CORE_ASSETS = [
    '/',
    '/index.html',
    '/js/core.js',
    '/css/styles.css',
    // Добавить другие общие ресурсы
];

// Установка Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Кэширование основных ресурсов');
            return cache.addAll(CORE_ASSETS);
        })
    );
});

// Активация и очистка старых кэшей
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
});

// Перехват запросов
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Стратегия "Cache First" для статических ресурсов
    if (request.destination === 'script' || 
        request.destination === 'style' || 
        request.destination === 'image') {
        
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                return fetch(request).then((networkResponse) => {
                    // Кэшируем успешные ответы
                    if (networkResponse && networkResponse.status === 200) {
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, responseClone);
                        });
                    }
                    return networkResponse;
                });
            }).catch(() => {
                // Если сеть недоступна, возвращаем заглушку для офлайн-режима
                if (request.destination === 'image') {
                    return new Response('', { status: 404, statusText: 'Offline' });
                }
            })
        );
    } 
    // Стратегия "Network First" для API запросов
    else if (url.pathname.startsWith('/api') || url.hostname.includes('supabase')) {
        event.respondWith(
            fetch(request).then((networkResponse) => {
                const responseClone = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(request, responseClone);
                });
                return networkResponse;
            }).catch(() => {
                return caches.match(request);
            })
        );
    }
    // Для остальных запросов - стандартная стратегия
    else {
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                return cachedResponse || fetch(request);
            })
        );
    }
});

// Обработка сообщений от клиента
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
