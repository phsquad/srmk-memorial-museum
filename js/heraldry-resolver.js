/**
 * ============================================================================
 * АВТОПОИСК И КЭШИРОВАНИЕ ГЕРАЛЬДИКИ: js/heraldry-resolver.js v2.0
 * Интеграция с Wikimedia Commons API + Supabase heraldry_cache
 * Приоритет: 1) Supabase Cloud Cache, 2) IndexedDB Local Cache, 3) API запрос
 * ============================================================================
 */

'use strict';

const HeraldryResolver = {
  DB_NAME: "SRMK_Heraldry_Cache_v2",
  STORE_NAME: "awards_store",
  db: null,
  useSupabaseCache: true, // Флаг использования облачного кэша

  // Локальный эталонный реестр названий наград для точного поиска
  KNOWN_ENTITIES: {
    "орден мужества": {
      query: "Order of Courage RF.png",
      ribbonQuery: "Order of Courage ribbon.svg",
      name: "Орден Мужества",
      established: "1994 г."
    },
    "медаль «за отвагу»": {
      query: "Medal For Courage RF.png",
      ribbonQuery: "Medal For Courage RF ribbon.png",
      name: "Медаль «За отвагу»",
      established: "1994 г."
    },
    "медаль суворова": {
      query: "Medal of Suvorov.png",
      ribbonQuery: "Medal of Suvorov ribbon.png",
      name: "Медаль Суворова",
      established: "1994 г."
    },
    "медаль «за храбрость»": {
      query: "Medal For Bravery 2 class.png",
      ribbonQuery: "Medal For Bravery 2nd class ribbon.png",
      name: "Медаль «За храбрость» II ст.",
      established: "2023 г."
    },
    "орден жукова": {
      query: "Order of Zhukov.png",
      ribbonQuery: "Order of Zhukov ribbon.png",
      name: "Орден Жукова",
      established: "1994 г."
    }
  },

  async init() {
    await this._initIndexedDB();
    console.log("[HeraldryResolver] Геральдический модуль v2.0 (Supabase Cache) готов.");
  },

  _initIndexedDB() {
    return new Promise((resolve) => {
      const request = indexedDB.open(this.DB_NAME, 1);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME, { keyPath: "awardKey" });
        }
      };
      request.onsuccess = (e) => {
        this.db = e.target.result;
        resolve();
      };
      request.onerror = () => resolve();
    });
  },

  /**
   * Главный метод: получение изображений знака и планки
   * Приоритет: Supabase → IndexedDB → API
   */
  async resolveAwardImages(awardTitle) {
    const rawKey = awardTitle.toLowerCase().trim();
    const matchedKey = Object.keys(this.KNOWN_ENTITIES).find(k => rawKey.includes(k));
    const entity = matchedKey ? this.KNOWN_ENTITIES[matchedKey] : null;

    if (!entity) {
      return {
        name: awardTitle,
        badgeUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Order_of_Courage_RF.png/300px-Order_of_Courage_RF.png",
        ribbonUrl: null
      };
    }

    // 1. Попытка извлечь из Supabase Cloud Cache
    if (this.useSupabaseCache && typeof CloudSync !== 'undefined' && CloudSync.client) {
      try {
        const cloudCached = await this._getFromSupabaseCache(matchedKey);
        if (cloudCached) {
          console.log(`[Heraldry] 🌐 Найдено в облачном кэше: ${entity.name}`);
          return cloudCached;
        }
      } catch (e) {
        console.warn("[Heraldry] Ошибка чтения облачного кэша, fallback на локальный:", e);
      }
    }

    // 2. Попытка извлечь из IndexedDB (локальный кэш)
    const localCached = await this._getFromCache(matchedKey);
    if (localCached) {
      console.log(`[Heraldry] 💾 Найдено в локальном кэше: ${entity.name}`);
      
      // Асинхронно обновить облачный кэш, если локальная версия новее
      if (this.useSupabaseCache && typeof CloudSync !== 'undefined' && CloudSync.client) {
        this._syncToSupabaseCache(localCached).catch(() => {});
      }
      
      return localCached;
    }

    // 3. Если нет в кэшах — запрос к Wikimedia Commons API
    try {
      console.log(`[Heraldry] 🌐 Запрос к Wikimedia API: ${entity.query}`);
      const badgeUrl = await this._fetchCommonsImageUrl(entity.query, 400);
      const ribbonUrl = await this._fetchCommonsImageUrl(entity.ribbonQuery, 600);

      const result = {
        awardKey: matchedKey,
        name: entity.name,
        badgeUrl: badgeUrl || "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Order_of_Courage_RF.png/300px-Order_of_Courage_RF.png",
        ribbonUrl: ribbonUrl,
        established: entity.established,
        cachedAt: Date.now()
      };

      // Сохраняем в оба кэша
      await this._saveToCache(result);
      if (this.useSupabaseCache && typeof CloudSync !== 'undefined' && CloudSync.client) {
        await this._syncToSupabaseCache(result);
      }
      
      return result;
    } catch (e) {
      console.warn("[Heraldry] Ошибка загрузки из сети, fallback:", e);
      return {
        name: entity.name,
        badgeUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Order_of_Courage_RF.png/300px-Order_of_Courage_RF.png",
        ribbonUrl: null
      };
    }
  },

  /**
   * Получение данных из Supabase heraldry_cache
   */
  async _getFromSupabaseCache(key) {
    if (!CloudSync?.client) return null;
    
    const { data, error } = await CloudSync.client
      .from('heraldry_cache')
      .select('badge_url, ribbon_url, name, established, cached_at')
      .eq('file_name', key)
      .single();
    
    if (error || !data) return null;
    
    // Проверка актульности кэша (не старше 30 дней)
    const cacheAge = Date.now() - new Date(data.cached_at).getTime();
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 дней
    
    if (cacheAge > maxAge) {
      console.log(`[Heraldry] Облачный кэш устарел (${Math.round(cacheAge / 86400000)} дн.)`);
      return null;
    }
    
    return {
      awardKey: key,
      name: data.name,
      badgeUrl: data.badge_url,
      ribbonUrl: data.ribbon_url,
      established: data.established,
      cachedAt: new Date(data.cached_at).getTime()
    };
  },

  /**
   * Синхронизация данных в Supabase heraldry_cache
   */
  async _syncToSupabaseCache(data) {
    if (!CloudSync?.client) return;
    
    try {
      const { error } = await CloudSync.client
        .from('heraldry_cache')
        .upsert([{
          file_name: data.awardKey,
          badge_url: data.badgeUrl,
          ribbon_url: data.ribbonUrl,
          name: data.name,
          established: data.established,
          cached_at: new Date(data.cachedAt).toISOString()
        }], { onConflict: 'file_name' });
      
      if (error) throw error;
      console.log(`[Heraldry] ✅ Синхронизировано в облако: ${data.name}`);
    } catch (e) {
      console.warn("[Heraldry] Ошибка записи в облачный кэш:", e);
    }
  },

  async _fetchCommonsImageUrl(fileName, width = 400) {
    if (!fileName) return null;
    const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(fileName)}&prop=imageinfo&iiprop=url&iiurlwidth=${width}&format=json&origin=*`;
    
    const res = await fetch(url);
    const data = await res.json();
    const pages = data.query?.pages;
    if (!pages) return null;

    const pageId = Object.keys(pages)[0];
    const imageInfo = pages[pageId]?.imageinfo?.[0];
    return imageInfo?.thumburl || imageInfo?.url || null;
  },

  _getFromCache(key) {
    if (!this.db) return null;
    return new Promise((resolve) => {
      const tx = this.db.transaction([this.STORE_NAME], "readonly");
      const store = tx.objectStore(this.STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  },

  _saveToCache(data) {
    if (!this.db) return;
    return new Promise((resolve) => {
      const tx = this.db.transaction([this.STORE_NAME], "readwrite");
      const store = tx.objectStore(this.STORE_NAME);
      store.put(data);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  },
  
  /**
   * Метод для принудительной очистки облачного кэша (для админ-панели)
   */
  async clearSupabaseCache() {
    if (!CloudSync?.client) return false;
    
    const { error } = await CloudSync.client
      .from('heraldry_cache')
      .delete()
      .neq('file_name', ''); // Удалить все записи
    
    return !error;
  },
  
  /**
   * Метод для получения статистики кэша
   */
  async getCacheStats() {
    const stats = {
      supabaseCount: 0,
      localCount: 0
    };
    
    // Статистика Supabase
    if (CloudSync?.client) {
      const { count } = await CloudSync.client
        .from('heraldry_cache')
        .select('*', { count: 'exact', head: true });
      stats.supabaseCount = count || 0;
    }
    
    // Статистика IndexedDB
    if (this.db) {
      const tx = this.db.transaction([this.STORE_NAME], "readonly");
      const store = tx.objectStore(this.STORE_NAME);
      const req = store.count();
      stats.localCount = await new Promise(resolve => {
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(0);
      });
    }
    
    return stats;
  }
};

window.HeraldryResolver = HeraldryResolver;
document.addEventListener('DOMContentLoaded', () => HeraldryResolver.init());