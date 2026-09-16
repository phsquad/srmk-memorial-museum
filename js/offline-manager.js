/**
 * Менеджер офлайн-режима для интеграции Service Worker и IndexedDB
 */

import { dbManager } from './db-manager.js';

class OfflineManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.isOfflineReady = false;
    this.swRegistration = null;
    this.statusListeners = [];
    
    this.init();
  }

  /**
   * Инициализация офлайн-режима
   */
  async init() {
    console.log('[OfflineManager] Initializing...');
    
    // Слушатели изменения сетевого статуса
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
    
    // Регистрация Service Worker
    await this.registerServiceWorker();
    
    // Проверка текущего статуса
    this.updateStatus();
    
    // Индикатор готовности офлайн-режима
    this.checkOfflineReady();
  }

  /**
   * Регистрация Service Worker
   */
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        this.swRegistration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });
        
        console.log('[OfflineManager] Service Worker registered:', this.swRegistration.scope);
        
        // Обработка обновлений Service Worker
        this.swRegistration.addEventListener('updatefound', () => {
          const newWorker = this.swRegistration.installing;
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                console.log('[OfflineManager] New content available, please refresh');
                this.showUpdateNotification();
              } else {
                console.log('[OfflineManager] Content cached for offline use');
                this.isOfflineReady = true;
                this.notifyStatusChange();
              }
            }
          });
        });
        
        // Обработка сообщений от Service Worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'OFFLINE_READY') {
            this.isOfflineReady = true;
            this.notifyStatusChange();
          }
        });
        
        return this.swRegistration;
      } catch (error) {
        console.error('[OfflineManager] Service Worker registration failed:', error);
        return null;
      }
    } else {
      console.warn('[OfflineManager] Service Workers not supported');
      return null;
    }
  }

  /**
   * Обработка перехода в онлайн
   */
  handleOnline() {
    console.log('[OfflineManager] Back online');
    this.isOnline = true;
    this.hideOfflineIndicator();
    this.notifyStatusChange();
    
    // Синхронизация данных при восстановлении соединения
    this.syncData();
  }

  /**
   * Обработка перехода в офлайн
   */
  handleOffline() {
    console.log('[OfflineManager] Went offline');
    this.isOnline = false;
    this.showOfflineIndicator();
    this.notifyStatusChange();
  }

  /**
   * Обновление статуса
   */
  updateStatus() {
    this.isOnline = navigator.onLine;
    
    if (this.isOnline) {
      this.hideOfflineIndicator();
    } else {
      this.showOfflineIndicator();
    }
    
    this.notifyStatusChange();
  }

  /**
   * Проверка готовности офлайн-режима
   */
  async checkOfflineReady() {
    if (!this.swRegistration) {
      return false;
    }
    
    try {
      const cacheNames = await caches.keys();
      const hasStaticCache = cacheNames.some(name => name.startsWith('static-'));
      const hasImagesCache = cacheNames.some(name => name.startsWith('images-'));
      
      this.isOfflineReady = hasStaticCache && hasImagesCache;
      
      if (this.isOfflineReady) {
        console.log('[OfflineManager] Ready for offline use');
      } else {
        console.log('[OfflineManager] Not ready for offline use yet');
      }
      
      this.notifyStatusChange();
      return this.isOfflineReady;
    } catch (error) {
      console.error('[OfflineManager] Failed to check offline readiness:', error);
      return false;
    }
  }

  /**
   * Показ индикатора офлайн-режима
   */
  showOfflineIndicator() {
    let indicator = document.getElementById('offline-indicator');
    
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'offline-indicator';
      indicator.innerHTML = `
        <div class="offline-banner">
          <span class="offline-icon">📡</span>
          <span class="offline-text">Нет подключения к интернету. Работаем в офлайн-режиме.</span>
        </div>
      `;
      indicator.style.cssText = `
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
        color: white;
        padding: 12px 20px;
        text-align: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        z-index: 9999;
        box-shadow: 0 -2px 10px rgba(0,0,0,0.2);
        animation: slideUp 0.3s ease-out;
      `;
      
      // Добавляем анимацию
      const style = document.createElement('style');
      style.textContent = `
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .offline-banner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .offline-icon { font-size: 18px; }
      `;
      document.head.appendChild(style);
      document.body.appendChild(indicator);
    }
  }

  /**
   * Скрытие индикатора офлайн-режима
   */
  hideOfflineIndicator() {
    const indicator = document.getElementById('offline-indicator');
    if (indicator) {
      indicator.style.animation = 'slideDown 0.3s ease-out forwards';
      setTimeout(() => indicator.remove(), 300);
    }
    
    // Добавляем анимацию скрытия если её нет
    if (!document.querySelector('style[data-offline-anim]')) {
      const style = document.createElement('style');
      style.setAttribute('data-offline-anim', 'true');
      style.textContent = `
        @keyframes slideDown {
          from { transform: translateY(0); opacity: 1; }
          to { transform: translateY(100%); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * Показ уведомления о доступности обновления
   */
  showUpdateNotification() {
    if (confirm('Доступна новая версия приложения. Перезагрузить страницу?')) {
      window.location.reload();
    }
  }

  /**
   * Подписка на изменение статуса
   */
  onStatusChange(callback) {
    this.statusListeners.push(callback);
  }

  /**
   * Уведомление слушателей об изменении статуса
   */
  notifyStatusChange() {
    const status = {
      isOnline: this.isOnline,
      isOfflineReady: this.isOfflineReady,
      hasServiceWorker: !!this.swRegistration
    };
    
    this.statusListeners.forEach(callback => callback(status));
  }

  /**
   * Синхронизация данных при восстановлении соединения
   */
  async syncData() {
    console.log('[OfflineManager] Syncing data...');
    
    // Здесь можно добавить логику синхронизации данных из IndexedDB с сервером
    // Например, отправка сохранённых записей из гостевой книги
    
    try {
      // Пример: получение всех офлайн-записей из гостевой книги
      const pendingEntries = await dbManager.getAll('guestbookEntries');
      
      if (pendingEntries.length > 0) {
        console.log(`[OfflineManager] Found ${pendingEntries.length} pending entries to sync`);
        // TODO: Отправить данные на сервер
      }
    } catch (error) {
      console.error('[OfflineManager] Sync failed:', error);
    }
  }

  /**
   * Кэширование указанных URL
   */
  async cacheUrls(urls) {
    if (!this.swRegistration) {
      console.warn('[OfflineManager] Service Worker not registered');
      return false;
    }
    
    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.success);
      };
      
      this.swRegistration.active.postMessage({
        type: 'CACHE_URLS',
        urls: urls
      }, [messageChannel.port2]);
    });
  }

  /**
   * Очистка всех кэшей
   */
  async clearCaches() {
    if (!this.swRegistration) {
      return false;
    }
    
    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        this.isOfflineReady = false;
        this.notifyStatusChange();
        resolve(event.data.success);
      };
      
      this.swRegistration.active.postMessage({
        type: 'CLEAR_CACHE'
      }, [messageChannel.port2]);
    });
  }

  /**
   * Получение статуса офлайн-режима
   */
  getStatus() {
    return {
      isOnline: this.isOnline,
      isOfflineReady: this.isOfflineReady,
      hasServiceWorker: !!this.swRegistration
    };
  }

  /**
   * Принудительная активация нового Service Worker
   */
  async skipWaiting() {
    if (!this.swRegistration || !this.swRegistration.waiting) {
      return false;
    }
    
    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        resolve(true);
      };
      
      this.swRegistration.waiting.postMessage({
        type: 'SKIP_WAITING'
      }, [messageChannel.port2]);
    });
  }
}

// Экспорт экземпляра для использования в приложении
const offlineManager = new OfflineManager();

// Делаем доступным глобально
if (typeof window !== 'undefined') {
  window.offlineManager = offlineManager;
}

export default OfflineManager;
export { offlineManager };
