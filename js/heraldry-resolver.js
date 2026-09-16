/**
 * ============================================================================
 * АВТОПОИСК И КЭШИРОВАНИЕ ГЕРАЛЬДИКИ: js/heraldry-resolver.js (v4.0 Master)
 * Мемориально-образовательный комплекс ГБПОУ СРМК «Быть воином — жить вечно»
 * 
 * Включает 5-уровневый каскад автономной верификации:
 * 1. Instant Local Atlas (SVG Data URI из sources.js)
 * 2. Fuzzy Key Normalization (Очистка от номеров указов и спецсимволов)
 * 3. IndexedDB Cache с фолбэком на In-Memory Map для режима инкогнито
 * 4. Timed Fetch Controller (Wikimedia API с отсечкой 1.2 сек)
 * 5. Guaranteed Vector Fallback (Защита от undefined и пустых блоков)
 * ============================================================================
 */

'use strict';

const HeraldryResolver = {
  DB_NAME: "SRMK_Heraldry_Cache_v4",
  STORE_NAME: "awards_store",
  db: null,
  memoryCache: new Map(),
  networkTimeoutMs: 1200, // 1.2 секунды макс. на сетевой запрос

  // Канонический реестр ключевых слов для нечеткого распознавания
  TAXONOMY_MAP: {
    "мужеств": {
      key: "орден мужества",
      query: "Order_of_Courage_RF.png",
      ribbonQuery: "Order_of_Courage_ribbon.svg",
      name: "Орден Мужества",
      established: "Учрежден в 1994 г."
    },
    "отваг": {
      key: "медаль «за отвагу»",
      query: "Medal_For_Courage_RF.png",
      ribbonQuery: "Medal_For_Courage_RF_ribbon.png",
      name: "Медаль «За отвагу»",
      established: "Учреждена в 1994 г."
    },
    "суворов": {
      key: "медаль суворова",
      query: "Medal_of_Suvorov.png",
      ribbonQuery: "Medal_of_Suvorov_ribbon.png",
      name: "Медаль Суворова",
      established: "Учреждена в 1994 г."
    },
    "храброст": {
      key: "медаль «за храбрость»",
      query: "Medal_For_Bravery_2_class.png",
      ribbonQuery: "Medal_For_Bravery_2nd_class_ribbon.png",
      name: "Медаль «За храбрость» II ст.",
      established: "Учреждена в 2023 г."
    },
    "жуков": {
      key: "медаль жукова",
      query: "Medal_of_Zhukov.png",
      ribbonQuery: "Medal_of_Zhukov_ribbon.png",
      name: "Медаль Жукова",
      established: "Учреждена в 1995 г."
    },
    "ветеран": {
      key: "ветеран боевых действий",
      query: "Combat_Veteran_badge_RF.png",
      ribbonQuery: "Combat_Veteran_badge_RF.png",
      name: "Ветеран боевых действий",
      established: "Государственный статус РФ"
    }
  },

  async init() {
    await this._initIndexedDBSafe();
    console.log("[HeraldryResolver v4.0 Master] Геральдический адаптер полностью готов.");
  },

  /**
   * Безопасная инициализация IndexedDB с поддержкой Incognito Mode
   */
  _initIndexedDBSafe() {
    return new Promise((resolve) => {
      if (!window.indexedDB) {
        resolve();
        return;
      }
      try {
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
      } catch (e) {
        console.warn("[Heraldry] IndexedDB заблокирован (Incognito Mode), переключение на MemoryMap.");
        resolve();
      }
    });
  },

  /**
   * Нормализация текстовой формулировки награды из приказа
   */
  normalizeAwardTitle(rawTitle) {
    if (!rawTitle) return "";
    return String(rawTitle)
      .toLowerCase()
      .replace(/посмертно/gi, '')
      .replace(/указ президента рф/gi, '')
      .replace(/указ от/gi, '')
      .replace(/№\s*\d+/gi, '')
      .replace(/\d{1,2}\.\d{2}\.\d{4}/g, '')
      .replace(/[«»"'()]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  },

  /**
   * ГЛАВНЫЙ МЕТОД: Разрешение изображений знака и планки
   */
  async resolveAwardImages(rawAwardTitle) {
    const cleanTitle = this.normalizeAwardTitle(rawAwardTitle);

    // ------------------------------------------------------------------------
    // УРОВЕНЬ 1: Мгновенная выдача из локального векторного атласа ArchiveService
    // ------------------------------------------------------------------------
    if (typeof ArchiveService !== 'undefined' && typeof ArchiveService.getAwardVisual === 'function') {
      const localVisual = ArchiveService.getAwardVisual(rawAwardTitle);
      if (localVisual && localVisual.badge) {
        return {
          awardKey: cleanTitle,
          name: localVisual.name || rawAwardTitle,
          badgeUrl: localVisual.badge,
          badge: localVisual.badge, // Двойной алиас
          ribbonUrl: localVisual.ribbon || localVisual.badge,
          ribbon: localVisual.ribbon || localVisual.badge,
          established: localVisual.established || "Государственная награда РФ",
          criteria: localVisual.criteria || "За проявленный героизм при исполнении воинского долга.",
          isOfflineResolved: true
        };
      }
    }

    // ------------------------------------------------------------------------
    // УРОВЕНЬ 2: Поиск в оперативной памяти и IndexedDB
    // ------------------------------------------------------------------------
    if (this.memoryCache.has(cleanTitle)) {
      return this.memoryCache.get(cleanTitle);
    }

    const dbCached = await this._getFromCache(cleanTitle);
    if (dbCached) {
      this.memoryCache.set(cleanTitle, dbCached);
      return dbCached;
    }

    // Сопоставление с таксономией
    const matchedTaxonKey = Object.keys(this.TAXONOMY_MAP).find(k => cleanTitle.includes(k));
    const taxon = matchedTaxonKey ? this.TAXONOMY_MAP[matchedTaxonKey] : null;

    // ------------------------------------------------------------------------
    // УРОВЕНЬ 3: Сетевой запрос к Wikimedia API с жестким отсечением по времени
    // ------------------------------------------------------------------------
    if (taxon && navigator.onLine) {
      try {
        const badgeUrl = await this._fetchWikimediaUrlWithTimeout(taxon.query, 300);
        const ribbonUrl = await this._fetchWikimediaUrlWithTimeout(taxon.ribbonQuery, 600);

        if (badgeUrl) {
          const resolved = {
            awardKey: cleanTitle,
            name: taxon.name,
            badgeUrl: badgeUrl,
            badge: badgeUrl,
            ribbonUrl: ribbonUrl || badgeUrl,
            ribbon: ribbonUrl || badgeUrl,
            established: taxon.established,
            criteria: "Государственная награда Российской Федерации.",
            isOfflineResolved: false
          };

          this.memoryCache.set(cleanTitle, resolved);
          this._saveToCache(resolved);
          return resolved;
        }
      } catch (e) {
        console.warn("[Heraldry] Тайм-аут или ошибка сети Wikimedia API, переход на фолбэк.");
      }
    }

    // ------------------------------------------------------------------------
    // УРОВЕНЬ 4: Гарантированный векторный SVG-фолбэк (Никаких undefined и битых картинок!)
    // ------------------------------------------------------------------------
    const fallbackBadge = window.HERALDIC_SVGS ? window.HERALDIC_SVGS.ORDER_OF_COURAGE_BADGE : "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22100%22%20height%3D%22100%22%3E%3Ccircle%20cx%3D%2250%22%20cy%3D%2250%22%20r%3D%2240%22%20fill%3D%22%23c5a059%22%2F%3E%3C%2Fsvg%3E";
    const fallbackRibbon = window.HERALDIC_SVGS ? window.HERALDIC_SVGS.ORDER_OF_COURAGE_RIBBON : fallbackBadge;

    const fallbackResult = {
      awardKey: cleanTitle,
      name: rawAwardTitle || "Государственная награда РФ",
      badgeUrl: fallbackBadge,
      badge: fallbackBadge,
      ribbonUrl: fallbackRibbon,
      ribbon: fallbackRibbon,
      established: "Государственная награда РФ",
      criteria: "За самоотверженность, мужество и отвагу при исполнении воинского долга.",
      isOfflineResolved: true
    };

    this.memoryCache.set(cleanTitle, fallbackResult);
    return fallbackResult;
  },

  /**
   * Пакетная параллельная верификация массива наград
   */
  async resolveBatch(awardTitlesArray) {
    if (!Array.isArray(awardTitlesArray)) return [];
    return Promise.all(awardTitlesArray.map(title => this.resolveAwardImages(title)));
  },

  /**
   * Запрос к Wikimedia API с контроллером тайм-аута (AbortController)
   */
  async _fetchWikimediaUrlWithTimeout(fileName, width = 300) {
    if (!fileName) return null;
    
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.networkTimeoutMs);

    try {
      const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(fileName)}&prop=imageinfo&iiprop=url&iiurlwidth=${width}&format=json&origin=*`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);

      if (!res.ok) return null;
      const data = await res.json();
      const pages = data.query?.pages;
      if (!pages) return null;

      const pageId = Object.keys(pages)[0];
      const imageInfo = pages[pageId]?.imageinfo?.[0];
      return imageInfo?.thumburl || imageInfo?.url || null;
    } catch (e) {
      clearTimeout(timer);
      return null;
    }
  },

  _getFromCache(key) {
    if (!this.db) return Promise.resolve(null);
    return new Promise((resolve) => {
      try {
        const tx = this.db.transaction([this.STORE_NAME], "readonly");
        const store = tx.objectStore(this.STORE_NAME);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      } catch (e) {
        resolve(null);
      }
    });
  },

  _saveToCache(data) {
    if (!this.db || !data.awardKey) return;
    try {
      const tx = this.db.transaction([this.STORE_NAME], "readwrite");
      const store = tx.objectStore(this.STORE_NAME);
      store.put(data);
    } catch (e) {}
  }
};

window.HeraldryResolver = HeraldryResolver;
document.addEventListener('DOMContentLoaded', () => HeraldryResolver.init());