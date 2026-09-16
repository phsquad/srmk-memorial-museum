/**
 * Регистрация Service Worker и управление кэшем
 */

export function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then((registration) => {
                    console.log('Service Worker успешно зарегистрирован:', registration.scope);
                    
                    // Проверка обновлений
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                console.log('Доступна новая версия приложения');
                                // Здесь можно показать уведомление пользователю
                            }
                        });
                    });
                })
                .catch((error) => {
                    console.error('Ошибка регистрации Service Worker:', error);
                });
        });
    }
}

export async function clearCache() {
    if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
            cacheNames.map((name) => caches.delete(name))
        );
        console.log('Кэш очищен');
    }
}

export async function precacheAssets(assets) {
    if ('caches' in window) {
        const cache = await caches.open('memorial-core-v1');
        await cache.addAll(assets);
        console.log('Ресурсы закэшированы:', assets);
    }
}

// Глобальная регистрация
if (typeof window !== 'undefined') {
    window.ServiceWorkerUtils = {
        register: registerServiceWorker,
        clearCache,
        precacheAssets
    };
}
