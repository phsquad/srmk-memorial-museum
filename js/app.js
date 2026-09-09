/**
 * ============================================================================
 * ВИРТУАЛЬНЫЙ МУЗЕЙ ГБПОУ СРМК: «БЫТЬ ВОИНОМ — ЖИТЬ ВЕЧНО»
 * Главный контроллер с защитным ядром AntiBotEngine v8.0 Enterprise
 * 
 * Разработчики: Андреев А. И., науч. рук. Генте А. В., Бледных Е. В.
 * ============================================================================
 */

'use strict';

// 1. Глобальное состояние приложения
const AppState = {
  activeFilter: 'all',
  activeSpecialty: 'all',
  searchQuery: '',
  currentHeroId: null,
  isAudioPlaying: false,
  isPresentationRunning: false,
  presentationTimer: null,
  mapInstance: null,
  mapMarkers: {},
  mapPolylines: [],
  candles: {},
  audioContext: null
};

// Резервный аватар
const FALLBACK_HERO_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='500' viewBox='0 0 400 500'%3E%3Crect width='400' height='500' fill='%2314171d'/%3E%3Cpath d='M200 190c33.1 0 60-26.9 60-60s-26.9-60-60-60-60 26.9-60 60 26.9 60 60 60zm0 30c-48 0-108 24-108 72v48h216v-48c0-48-60-72-108-72z' fill='%238a1c22' opacity='0.4'/%3E%3Cpolygon points='200,380 205,395 220,395 208,405 212,420 200,410 188,420 192,405 180,395 195,395' fill='%23c5a059'/%3E%3Ctext x='50%25' y='92%25' dominant-baseline='middle' text-anchor='middle' fill='%239da6b3' font-family='sans-serif' font-size='13'%3EГБПОУ СРМК • НАВЕЧНО В СТРОЮ%3C/text%3E%3C/svg%3E";

/* ==========================================================================
   2. ЯДРО КЛИЕНТСКОЙ БЕЗОПАСНОСТИ И ЗАЩИТЫ ОТ БОТОВ (ANTIBOT ENGINE)
   ========================================================================== */
const AntiBotEngine = {
  SALT: "SRMK_MUSEUM_SECURE_SALT_v8_2026",
  COOLDOWN_MS: 24 * 60 * 60 * 1000, // 24 часа
  MIN_CLICK_INTERVAL: 650,          // Минимальный интервал между действиями (мс)
  _lastActionTimestamp: 0,
  _humanMovementScore: 0,
  _isBlacklisted: false,

  init() {
    this._trackHumanMetrics();
    this._createHoneypot();
  },

  /**
   * Отслеживание физического перемещения мыши или пальца (Human Jitter)
   */
  _trackHumanMetrics() {
    const recordMovement = () => {
      if (this._humanMovementScore < 100) this._humanMovementScore += 5;
    };
    window.addEventListener('mousemove', recordMovement, { passive: true });
    window.addEventListener('touchmove', recordMovement, { passive: true });
    window.addEventListener('scroll', recordMovement, { passive: true });
  },

  /**
   * Создание ловушки для скрытых краулеров/ботов (Honeypot)
   */
  _createHoneypot() {
    const pot = document.createElement('div');
    pot.id = 'botHoneypotTrigger';
    pot.style.cssText = 'position:absolute; left:-9999px; top:-9999px; opacity:0; pointer-events:none;';
    pot.innerHTML = '<input type="text" name="tribute_bot_check" tabindex="-1" autocomplete="off">';
    pot.addEventListener('click', () => { this._isBlacklisted = true; });
    pot.querySelector('input').addEventListener('input', () => { this._isBlacklisted = true; });
    document.body.appendChild(pot);
  },

  /**
   * Комплексная проверка: человек или робот?
   */
  validateHumanAction(event) {
    if (this._isBlacklisted) return { success: false, reason: "Сессия заблокирована." };

    // 1. Проверка на подлинность браузерного события
    if (event && !event.isTrusted) {
      return { success: false, reason: "Программная эмуляция клика запрещена." };
    }

    // 2. Проверка троттлинга (защита от зажатия клавиши и автокликера)
    const now = Date.now();
    if (now - this._lastActionTimestamp < this.MIN_CLICK_INTERVAL) {
      return { success: false, reason: "Слишком частые действия. Подождите секунду." };
    }
    this._lastActionTimestamp = now;

    // 3. Проверка на наличие базовой физической активности
    if (this._humanMovementScore < 5 && !('ontouchstart' in window)) {
      return { success: false, reason: "Нетипичная активность браузера." };
    }

    return { success: true };
  },

  /**
   * Криптографическая хеш-подпись данных (SHA-256)
   */
  async generateSignature(dataObj) {
    const text = JSON.stringify(dataObj) + this.SALT;
    const msgBuffer = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  /**
   * Проверка тайм-лока на 24 часа для конкретного героя
   */
  canLightCandle(heroId) {
    try {
      const history = JSON.parse(localStorage.getItem('srmk_candle_history') || '{}');
      const lastTime = history[heroId];
      if (!lastTime) return { allowed: true };

      const timePassed = Date.now() - lastTime;
      if (timePassed < this.COOLDOWN_MS) {
        const remainingHours = Math.ceil((this.COOLDOWN_MS - timePassed) / (1000 * 60 * 60));
        return { allowed: false, remainingHours };
      }
      return { allowed: true };
    } catch (e) {
      return { allowed: true };
    }
  },

  /**
   * Безопасная запись зажженной свечи в хранилище с криптоподписью
   */
  async recordCandleSuccess(heroId) {
    const history = JSON.parse(localStorage.getItem('srmk_candle_history') || '{}');
    history[heroId] = Date.now();
    localStorage.setItem('srmk_candle_history', JSON.stringify(history));

    const currentCandles = AppState.candles;
    const signature = await this.generateSignature(currentCandles);
    const secureVault = {
      payload: currentCandles,
      signature: signature,
      timestamp: Date.now()
    };
    localStorage.setItem('srmk_verified_candles_vault', JSON.stringify(secureVault));
  },

  /**
   * Загрузка проверенных счетчиков (самовосстановление при взломе)
   */
  async loadSecureCandles() {
    try {
      const raw = localStorage.getItem('srmk_verified_candles_vault');
      if (!raw) return {};
      const vault = JSON.parse(raw);
      const expectedSig = await this.generateSignature(vault.payload);

      if (vault.signature === expectedSig) {
        return vault.payload || {};
      } else {
        console.warn("[AntiBot] Обнаружена модификация хранилища. Неверифицированные данные сброшены.");
        localStorage.removeItem('srmk_verified_candles_vault');
        return {};
      }
    } catch (e) {
      return {};
    }
  }
};

/* ==========================================================================
   3. ГЛАВНЫЙ КОНТРОЛЛЕР ИНТЕРФЕЙСА (APP ENGINE)
   ========================================================================== */
const App = {
  async init() {
    AntiBotEngine.init();
    AppState.candles = await AntiBotEngine.loadSecureCandles();

    this.cacheDOM();
    this.bindEvents();
    this.initAmbientParticles();
    this.renderMemorialPlaques();
    this.renderSpecialtyFilters();
    this.renderCardsGrid();
    this.initInteractiveMap();
    this.updateCandlesStats();
    this.checkDeepLink();
    console.log(`[Музей СРМК] Защищенный запуск завершен. В строю: ${heroesDatabase.length} героев.`);
  },

  cacheDOM() {
    this.dom = {
      leftPlaque: document.getElementById('leftPlaqueNames'),
      rightPlaque: document.getElementById('rightPlaqueNames'),
      cardsContainer: document.getElementById('heroesCardsContainer'),
      searchInput: document.getElementById('heroSearchInput'),
      searchClearBtn: document.getElementById('searchClearBtn'),
      specialtyContainer: document.getElementById('specialtyFiltersContainer'),
      totalCandlesDisplay: document.getElementById('totalCandlesCount'),
      statHeroCandles: document.getElementById('heroTotalCandlesStat'),

      heroModal: document.getElementById('heroModal'),
      modalOverlay: document.getElementById('modalOverlay'),
      modalCloseBtn: document.getElementById('modalCloseBtn'),
      modalBody: document.getElementById('modalHeroContent'),
      passportModal: document.getElementById('passportModal'),

      audioBar: document.getElementById('audioPlayerBar'),
      audioElement: document.getElementById('mainAudioElement'),
      audioPlayBtn: document.getElementById('audioPlayPauseBtn'),
      audioTrackTitle: document.getElementById('audioTrackTitle'),
      audioHeroName: document.getElementById('audioHeroName'),
      audioProgressBar: document.getElementById('audioProgressBar'),
      audioProgressContainer: document.getElementById('audioProgressContainer'),
      audioTimeDisplay: document.getElementById('audioTimeDisplay'),
      audioCloseBtn: document.getElementById('audioCloseBtn'),
      btnGeneralTour: document.getElementById('btnOpenGeneralTour')
    };
  },

  bindEvents() {
    // Живой поиск с защитой от флуда
    if (this.dom.searchInput) {
      let debounceTimeout;
      this.dom.searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
          AppState.searchQuery = e.target.value.toLowerCase().trim();
          this.renderCardsGrid();
        }, 120);
      });
    }

    if (this.dom.modalCloseBtn) this.dom.modalCloseBtn.addEventListener('click', () => this.closeModal());
    if (this.dom.modalOverlay) this.dom.modalOverlay.addEventListener('click', () => this.closeModal());

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.dom.heroModal?.classList.contains('active')) this.closeModal();
      }
      if (this.dom.heroModal?.classList.contains('active')) {
        if (e.key === 'ArrowRight') this.navigateHero(1);
        if (e.key === 'ArrowLeft') this.navigateHero(-1);
        if (e.key === 'p' || e.key === 'P' || e.key === 'з' || e.key === 'З') this.printHeroDossier();
      }
    });

    this.initAudioPlayerEvents();

    if (this.dom.btnGeneralTour) {
      this.dom.btnGeneralTour.addEventListener('click', () => {
        this.playAudio('assets/audio/guides/general-tour.mp3', 'Вводная экскурсия музея СРМК', 'Обзор экспозиции');
      });
    }

    window.addEventListener('hashchange', () => this.checkDeepLink());
  },

  /* ==========================================================================
     4. ЗВУКОВОЙ СИНТЕЗАТОР (WEB AUDIO API)
     ========================================================================== */
  playChimeSound(freq = 480, duration = 0.3) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!AppState.audioContext) AppState.audioContext = new AudioCtx();
      
      const ctx = AppState.audioContext;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.3, ctx.currentTime + duration);

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  },

  /* ==========================================================================
     5. ЗАЛ I: МЕМОРИАЛ «ЗВЕЗДА ПАМЯТИ»
     ========================================================================== */
  renderMemorialPlaques() {
    if (!this.dom.leftPlaque || !this.dom.rightPlaque) return;

    this.dom.leftPlaque.innerHTML = '';
    this.dom.rightPlaque.innerHTML = '';

    heroesDatabase.forEach(hero => {
      if (hero.plaque === 'none') return;

      const item = document.createElement('div');
      item.className = 'plaque-item';
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');

      const hasCandle = AppState.candles[hero.id] ? '🕯 ' : '';
      item.innerHTML = `
        <span class="plaque-hero-name">${hasCandle}${hero.name}</span>
        <span class="plaque-arrow">→</span>
      `;

      item.addEventListener('click', (e) => {
        const check = AntiBotEngine.validateHumanAction(e);
        if (!check.success) return;
        this.playChimeSound(440, 0.2);
        this.openModal(hero.id);
      });

      if (hero.plaque === 'left') {
        this.dom.leftPlaque.appendChild(item);
      } else if (hero.plaque === 'right') {
        this.dom.rightPlaque.appendChild(item);
      }
    });
  },

  /* ==========================================================================
     6. ЗАЛ II: КАРТОЧКИ И СПЕЦИАЛЬНОСТИ
     ========================================================================== */
  renderSpecialtyFilters() {
    if (!this.dom.specialtyContainer) return;

    const specialties = [
      { id: 'all', label: 'Все направления' },
      { id: 'fire', label: 'МЧС и спасатели' },
      { id: 'weld', label: 'Сварочное дело' },
      { id: 'electro', label: 'Электротехника' },
      { id: 'auto', label: 'Автотранспорт' },
      { id: 'it', label: 'IT и сети' },
      { id: 'mech', label: 'Машиностроение' }
    ];

    this.dom.specialtyContainer.innerHTML = specialties.map(s => `
      <button class="spec-filter-btn ${AppState.activeSpecialty === s.id ? 'active' : ''}" data-spec="${s.id}" type="button">
        ${s.label}
      </button>
    `).join('');

    this.dom.specialtyContainer.querySelectorAll('.spec-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.dom.specialtyContainer.querySelectorAll('.spec-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        AppState.activeSpecialty = btn.dataset.spec;
        this.playChimeSound(560, 0.15);
        this.renderCardsGrid();
      });
    });
  },

  renderCardsGrid() {
    if (!this.dom.cardsContainer) return;
    this.dom.cardsContainer.innerHTML = '';

    const filtered = heroesDatabase.filter(hero => {
      let matchesSearch = true;
      if (AppState.searchQuery) {
        const q = AppState.searchQuery;
        matchesSearch = hero.name.toLowerCase().includes(q) ||
          (hero.education?.specialty && hero.education.specialty.toLowerCase().includes(q)) ||
          (hero.deed && hero.deed.toLowerCase().includes(q)) ||
          (hero.military?.unit && hero.military.unit.toLowerCase().includes(q)) ||
          (hero.awards && hero.awards.some(a => a.toLowerCase().includes(q)));
      }

      let matchesSpec = true;
      if (AppState.activeSpecialty !== 'all') {
        const spec = (hero.education?.specialty || '').toLowerCase();
        const tag = hero.specTag || '';
        if (AppState.activeSpecialty === 'fire') matchesSpec = tag === 'fire' || spec.includes('пожарн') || spec.includes('мчс');
        if (AppState.activeSpecialty === 'weld') matchesSpec = tag === 'weld' || spec.includes('свар');
        if (AppState.activeSpecialty === 'electro') matchesSpec = tag === 'electro' || spec.includes('электр');
        if (AppState.activeSpecialty === 'auto') matchesSpec = tag === 'auto' || spec.includes('авто') || spec.includes('ремонт');
        if (AppState.activeSpecialty === 'it') matchesSpec = tag === 'it' || spec.includes('сетей') || spec.includes('компьютер');
        if (AppState.activeSpecialty === 'mech') matchesSpec = tag === 'mech' || spec.includes('оборудован') || spec.includes('металло');
      }

      return matchesSearch && matchesSpec;
    });

    if (filtered.length === 0) {
      this.dom.cardsContainer.innerHTML = `
        <div style="grid-column: 1/-1; text-align:center; padding: 48px 20px; color: var(--text-tertiary);">
          <p style="font-size: 1.1rem; margin-bottom: 6px;">По вашему запросу записи не найдены</p>
          <small>Попробуйте сбросить поисковую строку или выбрать другое направление</small>
        </div>
      `;
      return;
    }

    filtered.forEach(hero => {
      const photoSrc = (typeof ArchiveService !== 'undefined')
        ? (hero.media?.photo || ArchiveService.generateFallbackAvatar(hero))
        : (hero.media?.photo || FALLBACK_HERO_AVATAR);

      const yearsText = hero.dates?.years || `${hero.dates?.birth || ''} — ${hero.dates?.death || ''}`;
      const specialtyText = hero.education?.specialty || "Выпускник колледжа";
      const candleCount = AppState.candles[hero.id] || 0;

      const card = document.createElement('article');
      card.className = 'hero-card';
      card.innerHTML = `
        <div class="hero-card-img-wrap">
          <img src="${photoSrc}" alt="${hero.name}" class="hero-card-img" loading="lazy">
          <span class="hero-card-badge">СВО</span>
          ${candleCount > 0 ? `<span class="hero-candle-badge" title="Зажжено свечей памяти">🕯 ${candleCount}</span>` : ''}
        </div>
        <div class="hero-card-body">
          <h3 class="hero-card-name">${hero.name}</h3>
          <p class="hero-card-specialty">${specialtyText}</p>
          <p class="hero-card-years">${yearsText}</p>
          <button class="hero-card-btn" onclick="App.openModal('${hero.id}')" type="button">
            Открыть архивное досье
          </button>
        </div>
      `;

      const imgEl = card.querySelector('.hero-card-img');
      if (typeof ArchiveService !== 'undefined') {
        ArchiveService.attachSmartImageFallback(imgEl, hero);
      }

      this.dom.cardsContainer.appendChild(card);
    });
  },

  /* ==========================================================================
     7. ДОСЬЕ ГЕРОЯ С МУЛЬТИМЕДИЙНОЙ ГАЛЕРЕЕЙ
     ========================================================================== */
  openModal(id) {
    const hero = heroesDatabase.find(h => h.id === id);
    if (!hero) return;

    AppState.currentHeroId = id;
    window.location.hash = `hero-${id}`;

    const currentIndex = heroesDatabase.findIndex(h => h.id === id);
    const prevHero = heroesDatabase[currentIndex - 1] || heroesDatabase[heroesDatabase.length - 1];
    const nextHero = heroesDatabase[currentIndex + 1] || heroesDatabase[0];

    const mainPhoto = (typeof ArchiveService !== 'undefined')
      ? (hero.media?.photo || ArchiveService.generateFallbackAvatar(hero))
      : (hero.media?.photo || FALLBACK_HERO_AVATAR);

    const audioSrc = hero.media?.audioGuide || "";
    const yearsText = hero.dates?.years || `${hero.dates?.birth || ''} — ${hero.dates?.death || ''}`;
    const rankText = hero.military ? `${hero.military.rank || ''} ${hero.military.unit ? `• ${hero.military.unit}` : ''}` : "Воин ВС РФ";
    const deedText = hero.deed || "Сведения о боевом пути и подвиге уточняются в архивах колледжа.";
    const candleCount = AppState.candles[hero.id] || 0;

    // Сборка фотогалереи (Фотографии + Медали + Планки)
    const galleryItems = (typeof ArchiveService !== 'undefined')
      ? ArchiveService.buildDynamicGallery(hero)
      : [{ url: mainPhoto, caption: "Основной портрет", desc: "", type: "portrait" }];

    const awardsHTML = (hero.awards || []).map(awardTitle => {
      if (typeof ArchiveService !== 'undefined') {
        const visual = ArchiveService.getAwardVisual(awardTitle);
        return `
          <div class="award-tag" title="${visual.criteria || ''}">
            ${visual.badge ? `<img src="${visual.badge}" alt="" class="award-badge-mini">` : ''}
            <span>${visual.name}</span>
          </div>
        `;
      }
      return `<span class="award-tag">${awardTitle}</span>`;
    }).join('');

    const qrTargetUrl = `${window.location.origin}${window.location.pathname}#hero-${hero.id}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(qrTargetUrl)}`;

    // Проверка статуса свечи через AntiBotEngine
    const candleCheck = AntiBotEngine.canLightCandle(hero.id);
    const candleBtnText = candleCheck.allowed 
      ? `Зажечь Свечу Памяти (<span id="candleCountDisplay">${candleCount}</span>)` 
      : `🕯 Свеча зажжена вами сегодня (${candleCount})`;

    this.dom.modalBody.innerHTML = `
      <div class="dossier-nav-bar">
        <button class="dossier-nav-btn" onclick="App.openModal('${prevHero.id}')" title="${prevHero.name}" type="button">← Предыдущий герой</button>
        <span class="dossier-nav-counter">${currentIndex + 1} / ${heroesDatabase.length}</span>
        <button class="dossier-nav-btn" onclick="App.openModal('${nextHero.id}')" title="${nextHero.name}" type="button">Следующий герой →</button>
      </div>

      <div class="dossier-layout">
        <div class="dossier-sidebar">
          <div class="dossier-gallery-main">
            <img src="${galleryItems[0].url}" alt="${hero.name}" id="dossierMainImage" class="dossier-img" onerror="this.src='${FALLBACK_HERO_AVATAR}'">
            <div class="dossier-gallery-caption" id="dossierImageCaption">
              <strong>${galleryItems[0].caption || ''}</strong>
              ${galleryItems[0].desc ? `<br><small style="opacity:0.8;">${galleryItems[0].desc}</small>` : ''}
            </div>
          </div>

          ${galleryItems.length > 1 ? `
            <div class="dossier-thumbnails-track">
              ${galleryItems.map((item, idx) => `
                <button class="dossier-thumb-btn ${idx === 0 ? 'active' : ''} ${item.type}" 
                        onclick="App.switchGalleryPhoto('${item.url}', '${item.caption.replace(/'/g, "\\'")}', '${(item.desc || '').replace(/'/g, "\\'")}', this)" 
                        type="button" 
                        title="${item.caption}">
                  <img src="${item.url}" alt="${item.caption}" onerror="this.src='${FALLBACK_HERO_AVATAR}'">
                </button>
              `).join('')}
            </div>
          ` : ''}

          <div class="dossier-actions-stack">
            <button class="dossier-candle-btn ${!candleCheck.allowed ? 'active locked' : ''}" onclick="App.lightCandle('${hero.id}', event)" type="button">
              ${candleBtnText}
            </button>

            ${audioSrc ? `
              <button class="dossier-btn-audio" onclick="App.playAudio('${audioSrc}', '${hero.name.replace(/'/g, "\\'")}', 'Аудиоэкскурсия')" type="button">
                Слушать аудиогид
              </button>
            ` : ''}

            <button class="dossier-action-btn" onclick="App.printHeroDossier()" type="button">
              Распечатать лист памяти
            </button>

            <button class="dossier-action-btn" onclick="if(typeof TechModules !== 'undefined') TechModules.generateSocialPoster('${hero.id}')" type="button">
              Скачать карточку для стенда
            </button>

            <label class="dossier-action-btn" style="text-align:center; cursor:pointer;">
              Прикрепить фото из архива
              <input type="file" accept="image/*" style="display:none;" onchange="if(typeof ArchiveService !== 'undefined') ArchiveService.uploadFamilyPhoto('${hero.id}', this, () => App.openModal('${hero.id}'))">
            </label>
          </div>

          <div class="dossier-qr-box">
            <img src="${qrUrl}" alt="QR-код" class="dossier-qr-img">
            <span class="dossier-qr-label">QR для «Парты Героя»</span>
          </div>
        </div>

        <div class="dossier-main">
          <h2 class="dossier-name">${hero.name}</h2>
          <div class="dossier-years-badge">${yearsText}</div>

          <div class="dossier-section-block">
            <h4 class="dossier-block-title">Студенческие годы в СРМК</h4>
            <div class="dossier-student-grid">
              <div class="student-info-item">
                <span class="meta-label">Специальность:</span>
                <strong>${hero.education?.specialty || 'Выпускник СРМК'}</strong>
              </div>
              <div class="student-info-item">
                <span class="meta-label">Период обучения:</span>
                <strong>${hero.education?.period || 'Архивные данные'}</strong>
              </div>
              ${hero.education?.honors ? `
                <div class="student-info-item" style="grid-column: 1/-1;">
                  <span class="meta-label">Учебные отличия и квалификация:</span>
                  <strong>${hero.education.honors}</strong>
                </div>
              ` : ''}
            </div>
          </div>

          <div class="dossier-section-block">
            <h4 class="dossier-block-title">Ратный подвиг и воинский долг</h4>
            <div class="student-info-item" style="margin-bottom: 10px;">
              <span class="meta-label">Подразделение и звание:</span>
              <strong>${rankText}</strong>
            </div>
            <p class="dossier-deed-text">${deedText}</p>
          </div>

          ${hero.quote ? `
            <blockquote class="dossier-quote">
              «${hero.quote}»
            </blockquote>
          ` : ''}

          <div class="dossier-section-block">
            <h4 class="dossier-block-title">Государственные награды</h4>
            <div class="dossier-awards-list">
              ${awardsHTML || '<span class="award-tag">Награды уточняются</span>'}
            </div>
          </div>

          ${hero.memorialStatus ? `
            <div class="dossier-memorial-status">
              <span class="meta-label">Память в колледже:</span>
              <p>${hero.memorialStatus}</p>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    this.dom.heroModal.classList.add('active');
    document.body.style.overflow = 'hidden';

    if (hero.mapCoords && AppState.mapInstance) {
      AppState.mapInstance.setCenter([hero.mapCoords.lat, hero.mapCoords.lng], 8);
    }
  },

  switchGalleryPhoto(url, caption, desc, btnEl) {
    const mainImg = document.getElementById('dossierMainImage');
    const capEl = document.getElementById('dossierImageCaption');
    if (mainImg) mainImg.src = url;
    if (capEl) {
      capEl.innerHTML = `<strong>${caption}</strong>${desc ? `<br><small style="opacity:0.8;">${desc}</small>` : ''}`;
    }

    document.querySelectorAll('.dossier-thumb-btn').forEach(b => b.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');
  },

  /* ==========================================================================
     8. ЗАЩИЩЕННОЕ ЗАЖЖЕНИЕ СВЕЧИ ПАМЯТИ
     ========================================================================== */
  async lightCandle(heroId, event) {
    // 1. Проверка через ядро безопасности AntiBotEngine
    const validation = AntiBotEngine.validateHumanAction(event);
    if (!validation.success) {
      alert(validation.reason);
      return;
    }

    // 2. Проверка тайм-лока (24 часа)
    const status = AntiBotEngine.canLightCandle(heroId);
    if (!status.allowed) {
      alert(`Вы уже почтили память этого героя сегодня. Зажечь свечу повторно можно будет через ${status.remainingHours} ч.`);
      return;
    }

    // 3. Запись значения и криптоподпись
    AppState.candles[heroId] = (AppState.candles[heroId] || 0) + 1;
    await AntiBotEngine.recordCandleSuccess(heroId);

    this.playChimeSound(880, 0.35);

    const countDisplay = document.getElementById('candleCountDisplay');
    if (countDisplay) countDisplay.textContent = AppState.candles[heroId];
    
    const candleBtn = document.querySelector('.dossier-candle-btn');
    if (candleBtn) {
      candleBtn.classList.add('active', 'locked');
      candleBtn.innerHTML = `🕯 Свеча зажжена вами сегодня (${AppState.candles[heroId]})`;
    }

    this.updateCandlesStats();
    this.renderCardsGrid();
    this.renderMemorialPlaques();
  },

  updateCandlesStats() {
    const total = Object.values(AppState.candles).reduce((a, b) => a + b, 0);
    if (this.dom.totalCandlesDisplay) this.dom.totalCandlesDisplay.textContent = total;
    if (this.dom.statHeroCandles) this.dom.statHeroCandles.textContent = total;
  },

  printHeroDossier() {
    window.print();
  },

  navigateHero(direction) {
    if (!AppState.currentHeroId) return;
    const currentIndex = heroesDatabase.findIndex(h => h.id === AppState.currentHeroId);
    let newIndex = currentIndex + direction;
    if (newIndex < 0) newIndex = heroesDatabase.length - 1;
    if (newIndex >= heroesDatabase.length) newIndex = 0;
    this.openModal(heroesDatabase[newIndex].id);
  },

  closeModal() {
    if (this.dom.heroModal) {
      this.dom.heroModal.classList.remove('active');
    }
    document.body.style.overflow = 'auto';
    AppState.currentHeroId = null;
    history.replaceState(null, null, ' ');
  },

  checkDeepLink() {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#hero-')) {
      const heroId = hash.replace('#hero-', '');
      this.openModal(heroId);
    }
  },

  /* ==========================================================================
     9. РЕЖИМ «УРОК МУЖЕСТВА» (ПРЕЗЕНТАЦИЯ)
     ========================================================================== */
  startPresentationMode() {
    if (AppState.isPresentationRunning) {
      this.stopPresentationMode();
      return;
    }

    AppState.isPresentationRunning = true;
    let index = 0;
    this.openModal(heroesDatabase[index].id);
    this.playChimeSound(520, 0.4);

    AppState.presentationTimer = setInterval(() => {
      index = (index + 1) % heroesDatabase.length;
      this.openModal(heroesDatabase[index].id);
    }, 12000);

    console.log("[Урок Мужества] Полноэкранная смена слайдов активирована.");
  },

  stopPresentationMode() {
    AppState.isPresentationRunning = false;
    clearInterval(AppState.presentationTimer);
    console.log("[Урок Мужества] Презентация остановлена.");
  },

  /* ==========================================================================
     10. АУДИОПЛЕЕР С ИНДИКАТОРОМ
     ========================================================================== */
  initAudioPlayerEvents() {
    const { audioElement, audioPlayBtn, audioProgressBar, audioProgressContainer, audioTimeDisplay, audioCloseBtn } = this.dom;
    if (!audioElement) return;

    audioPlayBtn.addEventListener('click', () => {
      if (audioElement.paused) {
        audioElement.play();
        audioPlayBtn.textContent = '❚❚';
      } else {
        audioElement.pause();
        audioPlayBtn.textContent = '▶';
      }
    });

    audioElement.addEventListener('timeupdate', () => {
      const cur = audioElement.currentTime;
      const dur = audioElement.duration || 1;
      audioProgressBar.style.width = `${(cur / dur) * 100}%`;

      const format = t => Math.floor(t / 60) + ':' + ('0' + Math.floor(t % 60)).slice(-2);
      audioTimeDisplay.textContent = `${format(cur)} / ${format(dur)}`;
    });

    audioElement.addEventListener('ended', () => {
      audioPlayBtn.textContent = '▶';
      audioProgressBar.style.width = '0%';
    });

    audioProgressContainer.addEventListener('click', (e) => {
      const rect = audioProgressContainer.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      audioElement.currentTime = pos * (audioElement.duration || 0);
    });

    if (audioCloseBtn) {
      audioCloseBtn.addEventListener('click', () => {
        audioElement.pause();
        this.dom.audioBar.classList.remove('active');
      });
    }
  },

  playAudio(src, heroName, trackLabel = "Аудиоэкскурсия") {
    const { audioElement, audioTrackTitle, audioHeroName, audioPlayBtn, audioBar } = this.dom;
    if (!audioElement || !src) return;

    audioElement.src = src;
    audioTrackTitle.textContent = trackLabel;
    audioHeroName.textContent = heroName;
    audioBar.classList.add('active');

    audioElement.play()
      .then(() => {
        audioPlayBtn.textContent = '❚❚';
        AppState.isAudioPlaying = true;
      })
      .catch(() => {
        audioPlayBtn.textContent = '▶';
      });
  },

  /* ==========================================================================
     11. ИНТЕРАКТИВНАЯ КАРТА (YANDEX MAPS API)
     ========================================================================== */
  initInteractiveMap() {
    const mapElement = document.getElementById('interactiveBattleMap');
    if (!mapElement || typeof ymaps === 'undefined') return;

    ymaps.ready(() => {
      AppState.mapInstance = new ymaps.Map('interactiveBattleMap', {
        center: [47.2, 38.5],
        zoom: 6,
        controls: ['zoomControl', 'fullscreenControl']
      }, {
        suppressMapOpenBlock: true
      });

      AppState.mapInstance.behaviors.disable('scrollZoom');

      const srmkCoords = MUSEUM_CONFIG.coords;
      const srmkPlacemark = new ymaps.Placemark(srmkCoords, {
        balloonContentHeader: '<strong style="color:#8a1c22; font-size:14px;">ГБПОУ СРМК</strong>',
        balloonContentBody: '<small>г. Ставрополь, пр. Юности, 3</small><br><span style="font-size:12px; color:#555;">Альма-матер всех 20 героев</span>'
      }, {
        preset: 'islands#yellowDotIcon',
        iconColor: '#c5a059'
      });
      AppState.mapInstance.geoObjects.add(srmkPlacemark);

      const markers = MuseumAPI.getMapMarkers();
      markers.forEach(m => {
        const heroPlacemark = new ymaps.Placemark(m.coords, {
          balloonContentHeader: `<strong style="color:#8a1c22; font-size:14px;">${m.name}</strong>`,
          balloonContentBody: `
            <small>${m.rank}</small><br>
            <span>📍 ${m.location}</span><br>
            <button onclick="App.openModal('${m.id}')" style="margin-top:8px; background:#8a1c22; color:#fff; border:none; padding:5px 8px; border-radius:2px; cursor:pointer; font-size:12px; width:100%;">
              Открыть архивное досье
            </button>
          `
        }, {
          preset: 'islands#redCircleDotIcon',
          iconColor: '#8a1c22'
        });

        AppState.mapInstance.geoObjects.add(heroPlacemark);
        AppState.mapMarkers[m.id] = heroPlacemark;

        const polyline = new ymaps.Polyline([srmkCoords, m.coords], {}, {
          strokeColor: '#c5a059',
          strokeWidth: 2,
          strokeStyle: 'shortdash',
          strokeOpacity: 0.6
        });
        AppState.mapInstance.geoObjects.add(polyline);
        AppState.mapPolylines.push(polyline);
      });

      document.querySelectorAll('.theatre-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.theatre-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const theatre = btn.dataset.theatre;

          document.querySelectorAll('.timeline-theatre-card').forEach(card => {
            if (theatre === 'all' || card.dataset.theatreCard === theatre) {
              card.style.display = 'flex';
            } else {
              card.style.display = 'none';
            }
          });

          if (theatre === 'dnieper') this.focusMap([46.6, 32.7], 8);
          if (theatre === 'zaporozhye') this.focusMap([47.45, 35.8], 8);
          if (theatre === 'donbass') this.focusMap([48.1, 37.7], 8);
          if (theatre === 'kursk') this.focusMap([51.3, 35.2], 9);
          if (theatre === 'all') this.focusMap([47.5, 36.5], 6);
        });
      });
    });
  },

  focusMap(coords, zoom = 8) {
    if (AppState.mapInstance) {
      AppState.mapInstance.setCenter(coords, zoom, {
        checkZoomRange: true,
        duration: 700
      });
      this.playChimeSound(480, 0.2);
    }
  },

  /* ==========================================================================
     12. ФОНОВЫЕ ИСКРЫ ПАМЯТИ (CANVAS PARTICLES)
     ========================================================================== */
  initAmbientParticles() {
    const canvas = document.createElement('canvas');
    canvas.id = 'ambientSparksCanvas';
    canvas.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:0; opacity:0.35;';
    document.body.prepend(canvas);

    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const particles = Array.from({ length: 24 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 1,
      speedY: Math.random() * 0.45 + 0.15,
      speedX: (Math.random() - 0.5) * 0.25,
      opacity: Math.random() * 0.5 + 0.2
    }));

    function animate() {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#c5a059';

      particles.forEach(p => {
        p.y -= p.speedY;
        p.x += p.speedX;
        if (p.y < 0) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }

        ctx.globalAlpha = p.opacity;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(animate);
    }
    animate();
  }
};

window.App = App;