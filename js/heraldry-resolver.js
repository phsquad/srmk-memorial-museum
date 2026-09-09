/**
 * ============================================================================
 * АВТОПОИСК И КЭШИРОВАНИЕ ГЕРАЛЬДИКИ: js/heraldry-resolver.js
 * Прямая интеграция с открытым API Wikimedia Commons / Wikipedia
 * ============================================================================
 */

'use strict';

const HeraldryResolver = {
  DB_NAME: "SRMK_Heraldry_Cache_v2",
  STORE_NAME: "awards_store",
  db: null,

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
    console.log("[HeraldryResolver] Геральдический модуль и IndexedDB готовы.");
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

    // 1. Попытка извлечь из IndexedDB
    const cached = await this._getFromCache(matchedKey);
    if (cached) return cached;

    // 2. Если нет в кэше — запрос к Wikimedia Commons API
    try {
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

      // Сохраняем в кэш
      await this._saveToCache(result);
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
  }
};

window.HeraldryResolver = HeraldryResolver;
document.addEventListener('DOMContentLoaded', () => HeraldryResolver.init());