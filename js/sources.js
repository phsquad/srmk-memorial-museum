/**
 * ============================================================================
 * МОДУЛЬ ИСТОЧНИКОВ, НАГРАД И ГАЛЕРЕИ: js/sources.js (v6.0 Master)
 * 
 * Включает:
 * 1. Геральдическую базу подлинных наград РФ (Wikimedia Commons CDN)
 * 2. Автоматический сборщик мультимедийной галереи (фото + ордена + ленты)
 * 3. Каскадный асинхронный резолвер фотографий героев
 * 4. Генератор векторных мемориальных медальонов (SVG Fallback)
 * 5. Локальный загрузчик фото из семейного архива (FileReader / LocalStorage)
 * ============================================================================
 */

'use strict';

/**
 * 1. БАЗА ДАННЫХ ГОСУДАРСТВЕННЫХ НАГРАД РФ
 * Подлинные изображения орденов, медалей и планок из открытого геральдического реестра
 */
const AWARDS_DATABASE = {
  "орден мужества": {
    name: "Орден Мужества",
    badge: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Order_of_Courage_RF.png/300px-Order_of_Courage_RF.png",
    ribbon: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Order_of_Courage_ribbon.svg/800px-Order_of_Courage_ribbon.svg.png",
    established: "1994 г.",
    criteria: "За самоотверженность, мужество и отвагу, проявленные при исполнении воинского долга."
  },
  "орден жукова": {
    name: "Орден Жукова",
    badge: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Order_of_Zhukov.png/300px-Order_of_Zhukov.png",
    ribbon: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Order_of_Zhukov_ribbon.png/800px-Order_of_Zhukov_ribbon.png",
    established: "1994 г.",
    criteria: "За умелое руководство войсковыми операциями и проявленное личное мужество."
  },
  "медаль «за отвагу»": {
    name: "Медаль «За отвагу»",
    badge: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Medal_For_Courage_RF.png/300px-Medal_For_Courage_RF.png",
    ribbon: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Medal_For_Courage_RF_ribbon.png/800px-Medal_For_Courage_RF_ribbon.png",
    established: "1994 г.",
    criteria: "За личное мужество и отвагу в боях при защите Отечества."
  },
  "медаль суворова": {
    name: "Медаль Суворова",
    badge: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Medal_of_Suvorov.png/300px-Medal_of_Suvorov.png",
    ribbon: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Medal_of_Suvorov_ribbon.png/800px-Medal_of_Suvorov_ribbon.png",
    established: "1994 г.",
    criteria: "За личное мужество и отвагу, проявленные при защите рубежей Отечества."
  },
  "медаль «за храбрость»": {
    name: "Медаль «За храбрость» II степени",
    badge: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Medal_For_Bravery_2_class.png/300px-Medal_For_Bravery_2_class.png",
    ribbon: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Medal_For_Bravery_2nd_class_ribbon.png/800px-Medal_For_Bravery_2nd_class_ribbon.png",
    established: "2023 г.",
    criteria: "За храбрость и мужество в ходе выполнения боевых и специальных задач."
  },
  "медаль жукова": {
    name: "Медаль Жукова",
    badge: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Medal_of_Zhukov.png/300px-Medal_of_Zhukov.png",
    ribbon: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Medal_of_Zhukov_ribbon.png/800px-Medal_of_Zhukov_ribbon.png",
    established: "1995 г.",
    criteria: "За мужество и отвагу, проявленные в боевых действиях."
  },
  "ветеран боевых действий": {
    name: "Ветеран боевых действий",
    badge: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Combat_Veteran_badge_RF.png/300px-Combat_Veteran_badge_RF.png",
    ribbon: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Combat_Veteran_badge_RF.png/300px-Combat_Veteran_badge_RF.png",
    established: "Государственный статус",
    criteria: "Участник боевых действий по защите интересов Отечества."
  }
};

const ArchiveService = {
  // Кэш проверенных изображений в оперативной памяти
  _imageCache: new Map(),

  /**
   * 2. АВТОМАТИЧЕСКАЯ СБОРКА ГАЛЕРЕИ В ДОСЬЕ ГЕРОЯ
   * Объединяет личные фото, знаки наград и орденские планки без ручной загрузки
   */
  buildDynamicGallery(hero) {
    const gallery = [];

    // 1. Портрет героя (или загруженное пользователем фото)
    const userPhoto = localStorage.getItem(`srmk_user_photo_${hero.id}`);
    if (userPhoto) {
      gallery.push({
        url: userPhoto,
        caption: `Фото из архива: ${hero.name}`,
        desc: "Предоставлено для экспозиции",
        type: "portrait"
      });
    } else if (hero.media?.gallery && hero.media.gallery.length > 0) {
      hero.media.gallery.forEach(item => gallery.push({ ...item, type: "portrait" }));
    } else if (hero.media?.photo) {
      gallery.push({
        url: hero.media.photo,
        caption: `Портрет: ${hero.name}`,
        desc: hero.education?.specialty || "Выпускник СРМК",
        type: "portrait"
      });
    } else {
      gallery.push({
        url: this.generateFallbackAvatar(hero),
        caption: `Мемориальный герб: ${hero.name}`,
        desc: "Архивное фото в процессе поиска",
        type: "portrait"
      });
    }

    // 2. Автоматическая подгрузка знаков наград из геральдической базы
    if (hero.awards && Array.isArray(hero.awards)) {
      hero.awards.forEach(awardTitle => {
        const visual = this.getAwardVisual(awardTitle);
        
        if (visual.badge) {
          gallery.push({
            url: visual.badge,
            caption: `Государственная награда: ${visual.name}`,
            desc: visual.criteria || "Награда Российской Федерации за проявленный героизм",
            type: "award_badge"
          });
        }

        if (visual.ribbon) {
          gallery.push({
            url: visual.ribbon,
            caption: `Орденская планка: ${visual.name}`,
            desc: `Учреждена: ${visual.established || 'РФ'}`,
            type: "award_ribbon"
          });
        }
      });
    }

    // 3. Мемориальный объект колледжа
    gallery.push({
      url: "assets/images/memorial-bg.jpg",
      caption: `Мемориал Славы ГБПОУ СРМК`,
      desc: `Памятная ${hero.plaque === 'left' ? 'левая' : 'правая'} плита монумента`,
      type: "memorial"
    });

    return gallery;
  },

  /**
   * 3. ВИЗУАЛИЗАТОР НАГРАД (ПОИСК ПО НАЗВАНИЮ)
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
   * 4. КАСКАДНЫЙ РЕЗОЛВЕР ФОТОГРАФИЙ ГЕРОЕВ
   */
  async resolveHeroPhotoAsync(hero) {
    if (this._imageCache.has(hero.id)) {
      return this._imageCache.get(hero.id);
    }

    const userUploaded = localStorage.getItem(`srmk_user_photo_${hero.id}`);
    if (userUploaded) {
      this._imageCache.set(hero.id, userUploaded);
      return userUploaded;
    }

    const candidateUrls = [
      hero.media?.photo,
      `assets/images/heroes/${hero.id}.jpg`,
      `assets/images/heroes/${hero.id}.png`,
      `https://raw.githubusercontent.com/phsquad/srmkmuseum/main/assets/images/heroes/${hero.id}.jpg`
    ].filter(Boolean);

    for (const url of candidateUrls) {
      const isAvailable = await this._checkImageExists(url);
      if (isAvailable) {
        this._imageCache.set(hero.id, url);
        return url;
      }
    }

    const fallbackSvg = this.generateFallbackAvatar(hero);
    this._imageCache.set(hero.id, fallbackSvg);
    return fallbackSvg;
  },

  _checkImageExists(url) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  },

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
   * 5. ГЕНЕРАТОР ВЕКТОРНЫХ МЕМОРИАЛЬНЫХ АВАТАРОВ (SVG)
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
            <stop offset="0%" stop-color="#14171d"/>
            <stop offset="100%" stop-color="#0a0c10"/>
          </linearGradient>
          <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#fdf0b2"/>
            <stop offset="100%" stop-color="#c5a059"/>
          </linearGradient>
        </defs>

        <rect width="400" height="500" fill="url(#bgGrad)"/>
        <rect x="14" y="14" width="372" height="472" fill="none" stroke="url(#goldGrad)" stroke-width="1.5" stroke-opacity="0.3" rx="4"/>

        <!-- Центральный орденский медальон -->
        <g transform="translate(200, 175)">
          <circle r="80" fill="#0f1218" stroke="url(#goldGrad)" stroke-width="2"/>
          <path d="M-46 -46 L46 46 M-46 46 L46 -46" stroke="#8a1c22" stroke-width="12" stroke-linecap="round"/>
          <circle r="48" fill="#8a1c22" stroke="url(#goldGrad)" stroke-width="2"/>
          <text y="9" text-anchor="middle" fill="#ffffff" font-family="'Cinzel', Georgia, serif" font-weight="900" font-size="26" letter-spacing="2">${initials}</text>
        </g>

        <!-- Георгиевская лента -->
        <g transform="translate(45, 295)">
          <rect width="310" height="8" fill="#f97316"/>
          <rect x="62" width="31" height="8" fill="#111111"/>
          <rect x="155" width="31" height="8" fill="#111111"/>
          <rect x="248" width="31" height="8" fill="#111111"/>
        </g>

        <!-- Типографика -->
        <text x="200" y="340" text-anchor="middle" fill="#c5a059" font-family="'Montserrat', sans-serif" font-weight="700" font-size="14" letter-spacing="1">ГБПОУ СРМК</text>
        <text x="200" y="365" text-anchor="middle" fill="#9da6b3" font-family="'Montserrat', sans-serif" font-size="11">${specialtyName.length > 34 ? specialtyName.substring(0, 31) + '...' : specialtyName}</text>
        <text x="200" y="388" text-anchor="middle" fill="#606875" font-family="'Montserrat', sans-serif" font-size="11.5">${yearsText}</text>
        
        <text x="200" y="435" text-anchor="middle" fill="#f1f3f7" font-family="'Cinzel', Georgia, serif" font-weight="700" font-size="12" letter-spacing="3">НАВЕЧНО В СТРОЮ</text>
      </svg>
    `;

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  },

  /**
   * 6. ЛОКАЛЬНЫЙ ТЕСТЕР ФОТО (ИЗ СЕМЕЙНОГО АРХИВА)
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
        this._imageCache.set(heroId, base64Data);
        if (typeof callback === 'function') callback(base64Data);
        alert("Фото успешно сохранено в локальном хранилище и отображено в карточке!");
      } catch (err) {
        alert("Изображение слишком большое для локального кэша браузера. Рекомендуется размер до 1 МБ.");
      }
    };
    reader.readAsDataURL(file);
  },

  resetUserPhoto(heroId) {
    localStorage.removeItem(`srmk_user_photo_${heroId}`);
    this._imageCache.delete(heroId);
  }
};

window.ArchiveService = ArchiveService;