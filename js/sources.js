/**
 * ============================================================================
 * МОДУЛЬ ИНТЕГРАЦИИ И АВТОПОДБОРА: js/sources.js (v5.0 Enterprise)
 * 
 * Архитектура:
 * 1. Геральдическая база наград РФ (с открытыми CDN-векторами и лентами)
 * 2. Каскадный асинхронный поиск фото (Local -> Cloud CDN -> GitHub Raw -> SVG)
 * 3. Открытый API Wikimedia Commons для подгрузки геральдических описаний
 * 4. Прецизионный генератор поисковых запросов в государственные архивы
 * 5. Локальный инжектор семейных архивов (FileReader & LocalStorage)
 * ============================================================================
 */

'use strict';

// 1. БАЗА ДАННЫХ ГОСУДАРСТВЕННЫХ НАГРАД РФ (ОТКРЫТЫЙ ГЕРАЛЬДИЧЕСКИЙ РЕЕСТР)
const AWARDS_DATABASE = {
  "орден мужества": {
    name: "Орден Мужества",
    badge: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Order_of_Courage_RF.png/300px-Order_of_Courage_RF.png",
    ribbon: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Order_of_Courage_ribbon.svg/800px-Order_of_Courage_ribbon.svg.png",
    established: "1994 г.",
    criteria: "За самоотверженность, мужество и отвагу, проявленные при спасении граждан, охране общественного порядка, в борьбе с преступностью, а также при исполнении воинского долга."
  },
  "орден жукова": {
    name: "Орден Жукова",
    badge: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Order_of_Zhukov.png/300px-Order_of_Zhukov.png",
    ribbon: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Order_of_Zhukov_ribbon.png/800px-Order_of_Zhukov_ribbon.png",
    established: "1994 г.",
    criteria: "За умелое руководство крупными войсковыми операциями и личное мужество."
  },
  "медаль «за отвагу»": {
    name: "Медаль «За отвагу»",
    badge: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Medal_For_Courage_RF.png/300px-Medal_For_Courage_RF.png",
    ribbon: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Medal_For_Courage_RF_ribbon.png/800px-Medal_For_Courage_RF_ribbon.png",
    established: "1994 г. (1938 г.)",
    criteria: "За личное мужество и отвагу, проявленные в боях при защите Отечества и государственных интересов РФ."
  },
  "медаль суворова": {
    name: "Медаль Суворова",
    badge: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Medal_of_Suvorov.png/300px-Medal_of_Suvorov.png",
    ribbon: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Medal_of_Suvorov_ribbon.png/800px-Medal_of_Suvorov_ribbon.png",
    established: "1994 г.",
    criteria: "За личное мужество и отвагу, проявленные при защите Отечества в наземных операциях."
  },
  "медаль «за храбрость»": {
    name: "Медаль «За храбрость» II степени",
    badge: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Medal_For_Bravery_2_class.png/300px-Medal_For_Bravery_2_class.png",
    ribbon: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Medal_For_Bravery_2nd_class_ribbon.png/800px-Medal_For_Bravery_2nd_class_ribbon.png",
    established: "2023 г.",
    criteria: "За храбрость и мужество, проявленные в ходе выполнения боевых задач по защите Родины."
  },
  "медаль жукова": {
    name: "Медаль Жукова",
    badge: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Medal_of_Zhukov.png/300px-Medal_of_Zhukov.png",
    ribbon: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Medal_of_Zhukov_ribbon.png/800px-Medal_of_Zhukov_ribbon.png",
    established: "1995 г.",
    criteria: "За мужество и отвагу, проявленные в боевых действиях при защите государственных интересов."
  },
  "ветеран боевых действий": {
    name: "Ветеран боевых действий",
    badge: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Combat_Veteran_badge_RF.png/300px-Combat_Veteran_badge_RF.png",
    ribbon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Combat_Veteran_badge_RF.png/300px-Combat_Veteran_badge_RF.png",
    established: "Государственный статус",
    criteria: "Участник боевых действий по защите интересов Отечества."
  }
};

// 2. ОТКРЫТЫЕ CDN И ОБЛАЧНЫЕ ЗЕРКАЛА
const ARCHIVE_CDN_ENDPOINTS = {
  // Публичный CDN репозитория колледжа
  GITHUB_RAW_MIRROR: "https://raw.githubusercontent.com/srmk-it/srmk-museum-media/main/photos/",
  JSDELIVR_CDN: "https://cdn.jsdelivr.net/gh/srmk-it/srmk-museum-media@main/photos/",
  // Wikimedia Commons API для открытой верификации
  WIKIMEDIA_API: "https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*"
};

const ArchiveService = {
  // Локальный кэш проверенных изображений в памяти
  _verifiedImagesCache: new Map(),

  /**
   * 1. АСИНХРОННЫЙ КАСКАДНЫЙ РЕЗОЛВЕР ФОТОГРАФИЙ
   * Проверяет цепочку: Локальный кэш -> Локальный файл -> GitHub CDN -> jsDelivr -> SVG Fallback
   */
  async resolveHeroPhotoAsync(hero) {
    if (this._verifiedImagesCache.has(hero.id)) {
      return this._verifiedImagesCache.get(hero.id);
    }

    // Проверяем, не загрузил ли пользователь фото из семейного архива в локальный Storage
    const userUploaded = localStorage.getItem(`srmk_user_photo_${hero.id}`);
    if (userUploaded) {
      this._verifiedImagesCache.set(hero.id, userUploaded);
      return userUploaded;
    }

    const candidateUrls = [
      hero.media?.photo,
      `assets/images/heroes/${hero.id}.jpg`,
      `assets/images/heroes/${hero.id}.png`,
      `${ARCHIVE_CDN_ENDPOINTS.GITHUB_RAW_MIRROR}${hero.id}.jpg`,
      `${ARCHIVE_CDN_ENDPOINTS.JSDELIVR_CDN}${hero.id}.jpg`
    ].filter(Boolean);

    for (const url of candidateUrls) {
      const isAvailable = await this._checkImageExists(url);
      if (isAvailable) {
        this._verifiedImagesCache.set(hero.id, url);
        return url;
      }
    }

    // Если фото нет нигде — возвращаем сгенерированный векторный медальон
    const fallbackSvg = this.generateFallbackAvatar(hero);
    this._verifiedImagesCache.set(hero.id, fallbackSvg);
    return fallbackSvg;
  },

  /**
   * Быстрая проверка доступности картинки без блокировки потока
   */
  _checkImageExists(url) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  },

  /**
   * Прикрепление авторезолвера к любому <img> элементу DOM
   */
  attachSmartImageFallback(imgElement, hero) {
    if (!imgElement) return;

    this.resolveHeroPhotoAsync(hero).then((verifiedUrl) => {
      imgElement.src = verifiedUrl;
    });

    imgElement.onerror = () => {
      imgElement.onerror = null;
      imgElement.src = this.generateFallbackAvatar(hero);
    };
  },

  /**
   * 2. ГЕНЕРАТОР ВЕКТОРНЫХ МЕМОРИАЛЬНЫХ АВАТАРОВ (SVG ULTRA-HD)
   * Формирует гербовый медальон с инициалами, орденом и георгиевской лентой
   */
  generateFallbackAvatar(hero) {
    const parts = hero.name.split(' ');
    const initials = (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
    const specialtyName = hero.education?.specialty || "Выпускник СРМК";
    const yearsText = hero.dates?.years || "Навечно в строю";

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500">
        <defs>
          <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#161c28"/>
            <stop offset="100%" stop-color="#090b10"/>
          </linearGradient>
          <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#f5e7b2"/>
            <stop offset="100%" stop-color="#d4af37"/>
          </linearGradient>
          <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <!-- Мраморно-обсидиановый фон -->
        <rect width="400" height="500" fill="url(#bgGrad)"/>
        <rect x="14" y="14" width="372" height="472" fill="none" stroke="url(#goldGrad)" stroke-width="1.5" stroke-opacity="0.4" rx="8"/>

        <!-- Центральный орденский медальон -->
        <g transform="translate(200, 180)">
          <circle r="88" fill="#10141e" stroke="url(#goldGrad)" stroke-width="2" filter="url(#goldGlow)"/>
          <!-- Лучи креста мужества -->
          <path d="M-52 -52 L52 52 M-52 52 L52 -52" stroke="#9e1b20" stroke-width="14" stroke-linecap="round"/>
          <circle r="54" fill="#9e1b20" stroke="url(#goldGrad)" stroke-width="2.5"/>
          <text y="10" text-anchor="middle" fill="#ffffff" font-family="'Cinzel', Georgia, serif" font-weight="900" font-size="28" letter-spacing="2">${initials}</text>
        </g>

        <!-- Георгиевская лента -->
        <g transform="translate(45, 305)">
          <rect width="310" height="10" fill="#f97316"/>
          <rect x="62" width="31" height="10" fill="#111111"/>
          <rect x="155" width="31" height="10" fill="#111111"/>
          <rect x="248" width="31" height="10" fill="#111111"/>
        </g>

        <!-- Типографика -->
        <text x="200" y="348" text-anchor="middle" fill="#d4af37" font-family="'Montserrat', sans-serif" font-weight="700" font-size="15" letter-spacing="1">ГБПОУ СРМК</text>
        <text x="200" y="374" text-anchor="middle" fill="#8e98a8" font-family="'Montserrat', sans-serif" font-size="11.5">${specialtyName.length > 34 ? specialtyName.substring(0, 31) + '...' : specialtyName}</text>
        <text x="200" y="398" text-anchor="middle" fill="#5c6675" font-family="'Montserrat', sans-serif" font-size="12">${yearsText}</text>
        
        <text x="200" y="445" text-anchor="middle" fill="#f0f3f8" font-family="'Cinzel', Georgia, serif" font-weight="700" font-size="13" letter-spacing="3">НАВЕЧНО В СТРОЮ</text>
      </svg>
    `;

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  },

  /**
   * 3. ВИЗУАЛИЗАТОР НАГРАД РФ
   * Автоматически находит реальные фото орденов и планок
   */
  getAwardVisual(awardTitle) {
    if (!awardTitle) return { name: "Награда РФ", badge: null, ribbon: null, criteria: "" };

    const lower = awardTitle.toLowerCase().trim();
    const key = Object.keys(AWARDS_DATABASE).find(k => lower.includes(k));

    if (key) {
      return AWARDS_DATABASE[key];
    }

    return {
      name: awardTitle,
      badge: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Order_of_Courage_RF.png/300px-Order_of_Courage_RF.png",
      ribbon: null,
      criteria: "Государственная награда Российской Федерации за проявленный героизм."
    };
  },

  /**
   * 4. ПРЕЦИЗИОННЫЙ ГЕНЕРАТОР ПОИСКОВЫХ ЗАПРОСОВ В ГОС. АРХИВЫ
   */
  getHeroSources(hero) {
    const encodedName = encodeURIComponent(hero.name);
    const parts = hero.name.split(' ');
    const lastName = encodeURIComponent(parts[0]);
    const firstName = encodeURIComponent(parts[1] || '');

    return [
      {
        title: "Архив ГБПОУ СРМК",
        type: "internal",
        badge: "Верифицировано ОО",
        desc: "Личное дело студента, приказы о зачислении и выпуске",
        url: "https://rmk.stavedu.ru"
      },
      {
        title: "Федеральный портал «Карта Доблести РФ»",
        type: "official",
        badge: "Минпросвещения РФ",
        desc: "Реестр участников Всероссийской мемориальной акции",
        url: `https://карта-доблести.рф/поиск?q=${encodedName}`
      },
      {
        title: "Книга Памяти Ставропольского края",
        type: "regional",
        badge: "Региональный архив",
        desc: "Сводные списки участников боевых действий Ставрополья",
        url: `https://yandex.ru/search/?text=${encodeURIComponent("Книга Памяти Ставропольского края " + hero.name)}`
      },
      {
        title: "Минобороны РФ / Память Народа",
        type: "state",
        badge: "ЦАМО РФ",
        desc: "Проверка наградных указов и сведений о воинской части",
        url: `https://pamyat-naroda.ru/heroes/?last_name=${lastName}&first_name=${firstName}`
      },
      {
        title: "Поиск реальных фото в открытых фотобанках",
        type: "photo_search",
        badge: "Яндекс.Картинки",
        desc: "Поиск в региональных СМИ и фотоотчетах колледжа",
        url: `https://yandex.ru/images/search?text=${encodeURIComponent('"Ставропольский многопрофильный колледж" "' + hero.name + '"')}`
      }
    ];
  },

  /**
   * 5. МОДУЛЬ ЗАГРУЗКИ ФОТО ИЗ СЕМЕЙНОГО АРХИВА (ЛОКАЛЬНЫЙ ТЕСТЕР)
   * Позволяет преподавателю или студенту прямо в браузере прикрепить найденное фото
   */
  uploadFamilyPhoto(heroId, fileInput, callback) {
    if (!fileInput.files || !fileInput.files[0]) return;

    const file = fileInput.files[0];
    if (!file.type.match('image.*')) {
      alert("Пожалуйста, выберите файл изображения (JPG, PNG или WebP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target.result;
      try {
        localStorage.setItem(`srmk_user_photo_${heroId}`, base64Data);
        this._verifiedImagesCache.set(heroId, base64Data);
        if (typeof callback === 'function') callback(base64Data);
        alert("Фото успешно сохранено в локальном хранилище музея и отображено в карточке!");
      } catch (err) {
        alert("Изображение слишком большое для локального кэша. Рекомендуется размер до 1 МБ.");
      }
    };
    reader.readAsDataURL(file);
  },

  /**
   * Сбросить пользовательское фото и вернуться к каскаду
   */
  resetUserPhoto(heroId) {
    localStorage.removeItem(`srmk_user_photo_${heroId}`);
    this._verifiedImagesCache.delete(heroId);
  }
};

// Экспорт для глобального доступа
window.ArchiveService = ArchiveService;