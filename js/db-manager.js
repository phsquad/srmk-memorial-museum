/**
 * Менеджер IndexedDB для хранения динамических данных в офлайн-режиме
 */

class DatabaseManager {
  constructor(dbName = 'VirtualMuseumDB', version = 1) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
    this.requestQueue = [];
  }

  /**
   * Инициализация базы данных
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('[IndexedDB] Failed to open database:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('[IndexedDB] Database opened successfully');
        resolve(this.db);
        
        // Выполняем отложенные запросы
        this.processQueue();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        console.log('[IndexedDB] Upgrading database schema');

        // Хранилище для героев
        if (!db.objectStoreNames.contains('heroes')) {
          const heroesStore = db.createObjectStore('heroes', { keyPath: 'id' });
          heroesStore.createIndex('name', 'name', { unique: false });
          heroesStore.createIndex('category', 'category', { unique: false });
        }

        // Хранилище для книг памяти
        if (!db.objectStoreNames.contains('memoryBooks')) {
          const memoryStore = db.createObjectStore('memoryBooks', { keyPath: 'id' });
          memoryStore.createIndex('title', 'title', { unique: false });
        }

        // Хранилище для записей в гостевой книге
        if (!db.objectStoreNames.contains('guestbookEntries')) {
          const guestStore = db.createObjectStore('guestbookEntries', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          guestStore.createIndex('timestamp', 'timestamp', { unique: false });
          guestStore.createIndex('heroId', 'heroId', { unique: false });
        }

        // Хранилище для результатов викторин
        if (!db.objectStoreNames.contains('quizResults')) {
          const quizStore = db.createObjectStore('quizResults', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          quizStore.createIndex('score', 'score', { unique: false });
          quizStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Хранилище для кэшированных изображений
        if (!db.objectStoreNames.contains('imageCache')) {
          const imageStore = db.createObjectStore('imageCache', { keyPath: 'url' });
        }

        // Хранилище для настроек приложения
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Добавление или обновление записи
   */
  async put(storeName, data) {
    if (!this.db) {
      return this.enqueueOperation('put', storeName, data);
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => {
        console.log(`[IndexedDB] Data saved to ${storeName}:`, data.id || data.key);
        resolve(request.result);
      };

      request.onerror = () => {
        console.error(`[IndexedDB] Failed to save to ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Получение записи по ключу
   */
  async get(storeName, key) {
    if (!this.db) {
      return this.enqueueOperation('get', storeName, key);
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.error(`[IndexedDB] Failed to get from ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Получение всех записей из хранилища
   */
  async getAll(storeName) {
    if (!this.db) {
      return this.enqueueOperation('getAll', storeName);
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.error(`[IndexedDB] Failed to get all from ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Удаление записи по ключу
   */
  async delete(storeName, key) {
    if (!this.db) {
      return this.enqueueOperation('delete', storeName, key);
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => {
        console.log(`[IndexedDB] Deleted from ${storeName}:`, key);
        resolve();
      };

      request.onerror = () => {
        console.error(`[IndexedDB] Failed to delete from ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Очистка хранилища
   */
  async clear(storeName) {
    if (!this.db) {
      return this.enqueueOperation('clear', storeName);
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => {
        console.log(`[IndexedDB] Cleared ${storeName}`);
        resolve();
      };

      request.onerror = () => {
        console.error(`[IndexedDB] Failed to clear ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Поиск по индексу
   */
  async getByIndex(storeName, indexName, value) {
    if (!this.db) {
      return this.enqueueOperation('getByIndex', storeName, indexName, value);
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.error(`[IndexedDB] Failed to query index:`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Сохранение изображения в кэш
   */
  async cacheImage(url, blob) {
    return this.put('imageCache', {
      url,
      blob,
      timestamp: Date.now()
    });
  }

  /**
   * Получение изображения из кэша
   */
  async getCachedImage(url) {
    const record = await this.get('imageCache', url);
    return record ? record.blob : null;
  }

  /**
   * Очистка старого кэша изображений
   */
  async cleanImageCache(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 дней по умолчанию
    const allImages = await this.getAll('imageCache');
    const now = Date.now();
    
    for (const img of allImages) {
      if (now - img.timestamp > maxAge) {
        await this.delete('imageCache', img.url);
      }
    }
  }

  /**
   * Сохранение настройки
   */
  async setSetting(key, value) {
    return this.put('settings', { key, value });
  }

  /**
   * Получение настройки
   */
  async getSetting(key, defaultValue = null) {
    const setting = await this.get('settings', key);
    return setting ? setting.value : defaultValue;
  }

  /**
   * Постановка операции в очередь
   */
  enqueueOperation(operation, ...args) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        operation,
        args,
        resolve,
        reject
      });
    });
  }

  /**
   * Обработка очереди операций
   */
  async processQueue() {
    while (this.requestQueue.length > 0 && this.db) {
      const { operation, args, resolve, reject } = this.requestQueue.shift();
      
      try {
        const result = await this[operation](...args);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }
  }

  /**
   * Закрытие базы данных
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('[IndexedDB] Database closed');
    }
  }

  /**
   * Удаление базы данных
   */
  async deleteDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(this.dbName);
      
      request.onsuccess = () => {
        console.log('[IndexedDB] Database deleted');
        this.db = null;
        resolve();
      };
      
      request.onerror = () => {
        console.error('[IndexedDB] Failed to delete database:', request.error);
        reject(request.error);
      };
    });
  }
}

// Экспорт экземпляра для использования в приложении
const dbManager = new DatabaseManager();

// Автоматическая инициализация при загрузке модуля
if (typeof window !== 'undefined') {
  window.dbManager = dbManager;
  
  // Инициализируем БД при загрузке страницы
  document.addEventListener('DOMContentLoaded', () => {
    dbManager.init().catch(console.error);
  });
}

export default DatabaseManager;
export { dbManager };
