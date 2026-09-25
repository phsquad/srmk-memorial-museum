/**
 * ============================================================================
 * ВИРТУАЛЬНЫЙ МЕМОРИАЛЬНЫЙ КОМПЛЕКС ГБПОУ СРМК: «БЫТЬ ВОИНОМ — ЖИТЬ ВЕЧНО»
 * Главный управляющий контроллер экспозиции (js/app.js v16.0 Ultra Master)
 * 
 * Включает:
 * 1. Управление состояниями залов музея (I–IV), поиском и фильтрацией
 * 2. Интерактивное досье героя без битых картинок и черных квадратов
 * 3. Автономное отображение орденов, медалей и планок РФ через векторные SVG
 * 4. 2.5D Мемориал Славы с параллаксом и точками зажжения свечей
 * 5. Интерактивную Яндекс Карту API v2.1 с векторными лучами подвига
 * 6. Процедурный синтезатор звуков и Колокола Памяти (Web Audio API)
 * 7. Автопилот-презентацию «Урок Мужества» и свайп-жесты для смартфонов
 * 8. Полную синхронизацию с облаком Supabase Realtime (с защитой от TypeError)
 * ============================================================================
 */

'use strict';

/**
 * 1. ГЛОБАЛЬНОЕ СОСТОЯНИЕ ПРИЛОЖЕНИЯ (APP STATE)
 */
const AppState = {
  activeSpecialty: 'all',
  activePlaqueView: 'all',
  activeTheatre: 'all',
  searchQuery: '',
  currentHeroId: null,

  // Аудио и системная озвучка
  isAudioPlaying: false,
  isTTSPlaying: false,
  audioContext: null,

  // Интерактивный режим «Урок Мужества» и презентация
  isPresentationRunning: false,
  presentationTimer: null,
  isProjectorMode: false,
  silenceTimer: null,
  silenceSecondsLeft: 60,
  lessonTimer: null,
  lessonSecondsLeft: 45 * 60,
  isLessonTimerRunning: false,
  activeLessonPhase: 0,

  // Автономная ротация Героя дня (Spotlight)
  spotlightHeroIndex: 0,
  spotlightInterval: null,
  isSpotlightPaused: false,

  // Яндекс Карты v2.1
  mapInstance: null,
  mapMarkers: {},
  mapPolylines: [],

  // Мемориальные хранилища
  candles: {},
  flowersCount: 0,

  // Сенсорные жесты (Touch Swipes)
  touchStartX: 0,
  touchStartY: 0,
  touchEndX: 0,
  touchEndY: 0
};

/**
 * Векторный аватар-заглушка по умолчанию (SVG Data URI)
 */
const FALLBACK_HERO_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='500' viewBox='0 0 400 500'%3E%3Crect width='400' height='500' fill='%2312151b'/%3E%3Ccircle cx='200' cy='180' r='64' fill='%23181d26' stroke='%23c5a059' stroke-width='2'/%3E%3Cpath d='M200 130 L208 155 L235 155 L213 172 L221 198 L200 182 L179 198 L187 172 L165 155 L192 155 Z' fill='%23c5a059'/%3E%3Cpath d='M100 360 C100 280, 300 280, 300 360 Z' fill='%238a1c22' opacity='0.7'/%3E%3Ctext x='50%25' y='82%25' dominant-baseline='middle' text-anchor='middle' fill='%23c5a059' font-family='sans-serif' font-weight='bold' font-size='14'%3EГБПОУ СРМК%3C/text%3E%3Ctext x='50%25' y='90%25' dominant-baseline='middle' text-anchor='middle' fill='%239da6b3' font-family='sans-serif' font-size='11'%3EНАВЕЧНО В СТРОЮ%3C/text%3E%3C/svg%3E";

/**
 * 2. ТОЧКА ВХОДА И ИНИЦИАЛИЗАЦИЯ
 */
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

const App = {
  init() {
    this.cacheDOM();
    this.loadStorageData();
    this.loadCloudData();

    // Автоматическое восстановление сохраненного режима оборудования (монитор/доска)
    this.restoreDeviceMode();

    // Первичная отрисовка выставочных залов
    this.renderMemorialPlaques();
    this.renderSpecialtyFilters();
    this.renderCardsGrid();
    this.renderFeaturedHero();
    this.startSpotlightAutoPlay();
    this.updateMemorialStats();

    // Первичная отрисовка виджета анонимной аналитики залов для преподавателя
    if (window.HallAnalytics && typeof HallAnalytics.renderTeacherMonitor === 'function') {
      HallAnalytics.renderTeacherMonitor();
    }

    // Привязка событий, жесткого роутинга, скролл-шпиона и тач-жестов
    this.bindEvents();
    this.initTouchGestures();
    this.initMobileScrollSpy();
    this.checkDeepLink();

    // Асинхронный запуск тяжелых графических модулей
    setTimeout(() => {
      this.initInteractiveMapSafe();
      this.initAmbientParticles();
    }, 150);

    console.log(`[Музей СРМК v16.0 Master] Ядро запущено. Героев в базе: ${typeof heroesDatabase !== 'undefined' ? heroesDatabase.length : 0}`);
  },

  /**
   * Кэширование DOM-селекторов с защитой от отсутствующих элементов
   */
  cacheDOM() {
    this.dom = {
      // Зал I: Мемориал Славы
      leftPlaque: document.getElementById('leftPlaqueNames'),
      rightPlaque: document.getElementById('rightPlaqueNames'),
      leftPlaqueZone: document.getElementById('leftPlaqueZone'),
      rightPlaqueZone: document.getElementById('rightPlaqueZone'),

      // Зал II: Студенческая юность и поиск
      cardsContainer: document.getElementById('heroesCardsContainer'),
      searchInput: document.getElementById('heroSearchInput'),
      searchClearBtn: document.getElementById('searchClearBtn'),
      specialtyContainer: document.getElementById('specialtyFiltersContainer'),

      // Мемориальные счетчики
      totalCandlesDisplay: document.getElementById('totalCandlesCount'),
      statHeroCandles: document.getElementById('heroTotalCandlesStat'),
      flowersDisplay: document.getElementById('flowersCountDisplay'),

      // Модальное окно досье
      heroModal: document.getElementById('heroModal'),
      modalOverlay: document.getElementById('modalOverlay'),
      modalCloseBtn: document.getElementById('modalCloseBtn'),
      modalBody: document.getElementById('modalHeroContent'),

      // Аудиоплеер экскурсий
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

  /**
   * Загрузка локальных данных устройства
   */
  loadStorageData() {
    try {
      AppState.candles = JSON.parse(localStorage.getItem('srmk_museum_candles_v3') || '{}');
      
      const vault = JSON.parse(localStorage.getItem('srmk_tribute_vault') || '{}');
      let localFlowersSum = 0;
      Object.keys(vault).forEach(k => {
        if (k.startsWith('flowers_')) localFlowersSum += vault[k];
      });
      if (localFlowersSum > 0) AppState.flowersCount = localFlowersSum;
    } catch (e) {
      AppState.candles = {};
    }
  },

  /**
   * Загрузка облачных данных из Supabase в реальном времени
   */
  async loadCloudData() {
    if (!window.CloudSync?.isLive) return;
    try {
      const cloudData = await CloudSync.fetchAllCounters();
      if (!cloudData) return;

      AppState.candles = { ...AppState.candles, ...cloudData.candles };
      if (cloudData.flowers) AppState.flowersCount = cloudData.flowers;

      localStorage.setItem('srmk_museum_candles_v3', JSON.stringify(AppState.candles));
      
      this.updateMemorialStats();
      this.renderCardsGrid();
      this.renderMemorialPlaques();
    } catch (e) {
      console.warn("[App] Ошибка загрузки облачной метрики:", e);
    }
  },

  /**
   * Привязка глобальных событий
   */
  bindEvents() {
    // Живой дебаунс-поиск по базе (100 мс)
    if (this.dom.searchInput) {
      let debounceTimer;
      this.dom.searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          AppState.searchQuery = e.target.value.toLowerCase().trim();
          this.renderCardsGrid();
        }, 100);
      });
    }

    // Закрытие модального окна
    if (this.dom.modalCloseBtn) this.dom.modalCloseBtn.addEventListener('click', () => this.closeModal());
    if (this.dom.modalOverlay) this.dom.modalOverlay.addEventListener('click', () => this.closeModal());

    // Горячие клавиши (Esc - закрыть всё, M - минута молчания, P - печать, Пробел - диктор)
    document.addEventListener('keydown', (e) => {
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) || e.target.isContentEditable;

      if (e.key === 'Escape') {
        if (AppState.silenceTimer || document.getElementById('silenceOverlay')?.classList.contains('active')) {
          this.stopMinuteOfSilence();
        }
        if (document.getElementById('lessonReportModal')?.classList.contains('active')) {
          this.closeLessonReportModal();
        }
        if (this.dom.heroModal?.classList.contains('active')) {
          this.closeModal();
        }
      }

      // Клавиша M / Ь: быстрый вызов Всероссийской минуты молчания
      if ((e.key === 'm' || e.key === 'M' || e.key === 'ь' || e.key === 'Ь') && !isInput) {
        if (!this.dom.heroModal?.classList.contains('active') && !document.getElementById('lessonReportModal')?.classList.contains('active')) {
          this.startMinuteOfSilence();
        }
      }

      if (this.dom.heroModal?.classList.contains('active')) {
        if (e.key === 'ArrowRight') this.navigateHero(1);
        if (e.key === 'ArrowLeft') this.navigateHero(-1);
        if (e.key === 'p' || e.key === 'P' || e.key === 'з' || e.key === 'З') this.printHeroDossier();
        if (e.key === ' ' && !isInput) {
          e.preventDefault();
          this.toggleHeroTTS(AppState.currentHeroId);
        }
      }
    });

    this.initAudioPlayerEvents();

    if (this.dom.btnGeneralTour) {
      this.dom.btnGeneralTour.addEventListener('click', () => this.startGeneralTour());
    }

    window.addEventListener('hashchange', () => this.checkDeepLink());

    // Глобальное обнуление счетчиков мемориала
    window.addEventListener('srmk-counters-reset', () => {
      AppState.candles = {};
      AppState.flowersCount = 0;
      this.updateMemorialStats();
      this.renderCardsGrid();
      this.renderMemorialPlaques();
      const flowersDisplay = document.getElementById('flowersCountDisplay');
      if (flowersDisplay) flowersDisplay.textContent = '0';
      const candleDisplay = document.getElementById('candleCountDisplay');
      if (candleDisplay) candleDisplay.textContent = '0';
    });
  },

  /* ==========================================================================
     3. ЗАЛ I: ПЛИТЫ МЕМОРИАЛА
     ========================================================================== */
  renderMemorialPlaques() {
    const { leftPlaque, rightPlaque } = this.dom;
    if (!leftPlaque || !rightPlaque) return;

    if (typeof heroesDatabase === 'undefined' || !Array.isArray(heroesDatabase)) {
      leftPlaque.innerHTML = '<div style="color:#ef4444; padding:10px; font-size:12px;">Реестр СРМК не загружен.</div>';
      return;
    }

    leftPlaque.innerHTML = '';
    rightPlaque.innerHTML = '';

    heroesDatabase.forEach(hero => {
      if (hero.plaque === 'none') return;

      const item = document.createElement('div');
      item.className = 'plaque-item';
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');
      item.setAttribute('aria-label', `Герой ${hero.name}`);

      const candleCount = AppState.candles[hero.id] || 0;
      const candleBadge = candleCount > 0 ? `<span title="Зажжена свеча памяти">🕯 ${candleCount}</span> ` : '';

      item.innerHTML = `
        <span class="plaque-hero-name">${candleBadge}${this.escapeHtml(hero.name)}</span>
        <span class="plaque-arrow">→</span>
      `;

      item.addEventListener('click', () => {
        this.playChimeSound(440, 0.2);
        this.openModal(hero.id);
      });

      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.openModal(hero.id);
        }
      });

      if (hero.plaque === 'left') {
        leftPlaque.appendChild(item);
      } else if (hero.plaque === 'right') {
        rightPlaque.appendChild(item);
      }
    });
  },

  /* ==========================================================================
     4. ЗАЛ II: ФИЛЬТРЫ И СЕТКА КАРТОЧЕК
     ========================================================================== */
  renderSpecialtyFilters() {
    const container = this.dom.specialtyContainer;
    if (!container) return;

    const specialties = [
      { id: 'all', label: 'Все направления' },
      { id: 'fire', label: 'МЧС и спасатели' },
      { id: 'weld', label: 'Сварочное дело' },
      { id: 'electro', label: 'Электротехника' },
      { id: 'auto', label: 'Автотранспорт' },
      { id: 'it', label: 'IT и сети' },
      { id: 'mech', label: 'Машиностроение' }
    ];

    container.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; width:100%; margin-bottom:14px;">
        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
          ${specialties.map(s => `
            <button class="spec-filter-btn ${AppState.activeSpecialty === s.id ? 'active' : ''}" data-spec="${s.id}" type="button">
              ${s.label}
            </button>
          `).join('')}
        </div>
        <div style="display:flex; align-items:center; gap:10px;">
          <span id="heroFilterCount" style="font-size:0.78rem; color:var(--text-tertiary, #9da6b3); font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">20 героев</span>
          <button id="btnRandomHero" type="button" class="spec-filter-btn" style="border-color:rgba(197,160,89,0.5); color:#c5a059;" title="Открыть случайную страницу памяти">
            🎲 Случайный герой
          </button>
        </div>
      </div>
    `;

    container.querySelectorAll('.spec-filter-btn[data-spec]').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.spec-filter-btn[data-spec]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        AppState.activeSpecialty = btn.dataset.spec;
        this.playChimeSound(560, 0.15);
        this.renderCardsGrid();
      });
    });

    const randomBtn = document.getElementById('btnRandomHero');
    if (randomBtn) {
      randomBtn.addEventListener('click', () => {
        if (typeof heroesDatabase !== 'undefined' && heroesDatabase.length > 0) {
          const randomIndex = Math.floor(Math.random() * heroesDatabase.length);
          const randomHero = heroesDatabase[randomIndex];
          this.playChimeSound(680, 0.2);
          this.openModal(randomHero.id);
        }
      });
    }
  },

  renderCardsGrid() {
    const container = this.dom.cardsContainer;
    if (!container) return;

    if (typeof heroesDatabase === 'undefined' || !Array.isArray(heroesDatabase)) {
      container.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px; color:#ef4444;">База данных не загружена.</div>';
      return;
    }

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    const filtered = heroesDatabase.filter(hero => {
      let matchesSearch = true;
      if (AppState.searchQuery) {
        const q = AppState.searchQuery;
        matchesSearch = hero.name.toLowerCase().includes(q) ||
          (hero.education?.specialty && hero.education.specialty.toLowerCase().includes(q)) ||
          (hero.deed && hero.deed.toLowerCase().includes(q)) ||
          (hero.military?.unit && hero.military.unit.toLowerCase().includes(q)) ||
          (hero.military?.rank && hero.military.rank.toLowerCase().includes(q)) ||
          (hero.awards && hero.awards.some(a => a.toLowerCase().includes(q)));
      }

      let matchesSpec = true;
      if (AppState.activeSpecialty !== 'all') {
        const spec = (hero.education?.specialty || '').toLowerCase();
        const tag = hero.specTag || '';
        if (AppState.activeSpecialty === 'fire') matchesSpec = tag === 'fire' || spec.includes('пожарн') || spec.includes('мчс') || spec.includes('спасател');
        if (AppState.activeSpecialty === 'weld') matchesSpec = tag === 'weld' || spec.includes('свар');
        if (AppState.activeSpecialty === 'electro') matchesSpec = tag === 'electro' || spec.includes('электр') || spec.includes('энергет');
        if (AppState.activeSpecialty === 'auto') matchesSpec = tag === 'auto' || spec.includes('авто') || spec.includes('транспорт');
        if (AppState.activeSpecialty === 'it') matchesSpec = tag === 'it' || spec.includes('сетей') || spec.includes('компьютер') || spec.includes('программ');
        if (AppState.activeSpecialty === 'mech') matchesSpec = tag === 'mech' || spec.includes('оборудован') || spec.includes('металло') || spec.includes('машин');
      }

      return matchesSearch && matchesSpec;
    });

    const countEl = document.getElementById('heroFilterCount');
    if (countEl) {
      countEl.textContent = `Показано: ${filtered.length} из ${heroesDatabase.length}`;
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align:center; padding: 50px 20px; color: var(--text-tertiary);">
          <p style="font-size: 1.1rem; margin-bottom: 6px; color: #fff;">Герои не найдены</p>
          <small>Попробуйте сбросить поисковую строку</small>
        </div>
      `;
      return;
    }

    filtered.forEach(hero => {
      const fallbackAvatar = (typeof ArchiveService !== 'undefined') ? ArchiveService.generateFallbackAvatar(hero) : FALLBACK_HERO_AVATAR;
      const photoSrc = hero.media?.photo || fallbackAvatar;
      const yearsText = hero.dates?.years || `${hero.dates?.birth || ''} — ${hero.dates?.death || ''}`;
      const specialtyText = hero.education?.specialty || "Выпускник колледжа";
      const candleCount = AppState.candles[hero.id] || 0;

      // Отрисовка векторных знаков наград
      let medalsHTML = '';
      if (hero.awards && Array.isArray(hero.awards) && hero.awards.length > 0) {
        medalsHTML = `
          <div style="display:flex; gap:6px; margin-top:8px; align-items:center; flex-wrap:wrap;">
            ${hero.awards.map(a => {
              const visual = (typeof ArchiveService !== 'undefined') ? ArchiveService.getAwardVisual(a) : { badge: fallbackAvatar, name: a };
              return `<img src="${visual.badge}" alt="${this.escapeHtml(visual.name)}" title="${this.escapeHtml(visual.name)}" style="width:26px; height:26px; object-fit:contain; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5));">`;
            }).join('')}
          </div>
        `;
      }

      const card = document.createElement('article');
      card.className = 'hero-card';
      card.setAttribute('role', 'article');
      card.setAttribute('aria-label', `Карточка: ${hero.name}`);
      
      card.innerHTML = `
        <div class="hero-card-img-wrap">
          <img src="${photoSrc}" alt="${this.escapeHtml(hero.name)}" class="hero-card-img" loading="lazy" onerror="this.onerror=null; this.src='${fallbackAvatar}';">
          <span class="hero-card-badge">СВО</span>
          ${candleCount > 0 ? `<span class="hero-candle-badge" title="Зажжено свечей памяти">🕯 ${candleCount}</span>` : ''}
        </div>
        <div class="hero-card-body">
          <h3 class="hero-card-name">${this.escapeHtml(hero.name)}</h3>
          <p class="hero-card-specialty" title="${this.escapeHtml(specialtyText)}">${this.escapeHtml(specialtyText)}</p>
          <p class="hero-card-years">${this.escapeHtml(yearsText)}</p>
          ${medalsHTML}
          <button class="hero-card-btn" onclick="App.openModal('${hero.id}')" type="button" aria-label="Открыть досье на ${this.escapeHtml(hero.name)}" style="margin-top:14px;">
            Открыть архивное досье
          </button>
        </div>
      `;

      container.appendChild(card);
    });
  },

  /* ==========================================================================
     5. МОДАЛЬНОЕ ОКНО ДОСЬЕ ГЕРОЯ (ЧИСТАЯ ВЕРСТКА БЕЗ СРЕЗАННЫХ БЛОКОВ И ЧЕРНЫХ КВАДРАТОВ)
     ========================================================================== */
  openModal(id) {
    const hero = heroesDatabase.find(h => h.id === id);
    if (!hero) return;

    if (window.TTSNarrator) TTSNarrator.stop();

    AppState.currentHeroId = id;
    window.location.hash = `hero-${id}`;

    // Анонимная аналитика интереса к экспозиции героя (ФЗ-152)
    if (window.HallAnalytics && typeof HallAnalytics.trackHeroView === 'function') {
      HallAnalytics.trackHeroView(id, hero.name);
    }

    const currentIndex = heroesDatabase.findIndex(h => h.id === id);
    const prevHero = heroesDatabase[currentIndex - 1] || heroesDatabase[heroesDatabase.length - 1];
    const nextHero = heroesDatabase[currentIndex + 1] || heroesDatabase[0];

    const fallbackAvatar = (typeof ArchiveService !== 'undefined') ? ArchiveService.generateFallbackAvatar(hero) : FALLBACK_HERO_AVATAR;
    const mainPhoto = hero.media?.photo || fallbackAvatar;
    const audioSrc = hero.media?.audioGuide || "";
    const yearsText = hero.dates?.years || `${hero.dates?.birth || ''} — ${hero.dates?.death || ''}`;
    const rankText = hero.military ? `${hero.military.rank || 'Воин ВС РФ'} ${hero.military.unit ? `• ${hero.military.unit}` : ''}` : "Воин ВС РФ";
    const deedText = hero.deed || "Сведения о боевом пути и ратном подвиге верифицированы архивами колледжа.";
    const candleCount = AppState.candles[hero.id] || 0;

    // Сборка галереи миниатюр (Портрет + Знаки орденов + Планки + Мемориал)
    const galleryItems = (typeof ArchiveService !== 'undefined')
      ? ArchiveService.buildDynamicGallery(hero)
      : [{ url: mainPhoto, caption: `Портрет: ${hero.name}`, desc: "", type: "portrait" }];

    // Сборка наградного блока справа с векторными медалями и планками
    const awardsHTML = (hero.awards || []).map(awardTitle => {
      const visual = (typeof ArchiveService !== 'undefined') 
        ? ArchiveService.getAwardVisual(awardTitle) 
        : { name: awardTitle, badge: fallbackAvatar, ribbon: null, established: 'Государственная награда РФ', criteria: '' };

      return `
        <div class="award-card-item" style="display:flex; align-items:center; gap:14px; padding:12px 16px; margin-bottom:10px; background:#181d26; border:1px solid rgba(197,160,89,0.35); border-radius:4px; box-shadow:0 4px 14px rgba(0,0,0,0.5);">
          <img src="${visual.badge}" alt="${this.escapeHtml(visual.name)}" style="width:44px; height:44px; object-fit:contain; flex-shrink:0; filter:drop-shadow(0 2px 6px rgba(0,0,0,0.6));">
          <div style="flex-grow:1;">
            <strong style="display:block; color:#ffffff; font-size:0.92rem; font-family:'Cinzel', serif; line-height:1.25;">${this.escapeHtml(visual.name)}</strong>
            <span style="display:block; color:#c5a059; font-size:0.76rem; margin-top:2px;">${this.escapeHtml(visual.established || 'Государственная награда РФ')}</span>
            <small style="display:block; color:#9da6b3; font-size:0.75rem; margin-top:4px; line-height:1.35;">${this.escapeHtml(visual.criteria || 'За мужество и отвагу при исполнении воинского долга.')}</small>
          </div>
          ${visual.ribbon && visual.ribbon !== visual.badge ? `<img src="${visual.ribbon}" alt="Планка" style="width:54px; height:18px; object-fit:contain; border-radius:2px; border:1px solid rgba(255,255,255,0.2);" title="Орденская планка">` : ''}
        </div>
      `;
    }).join('');

    const qrTargetUrl = `${window.location.origin}${window.location.pathname}#hero-${hero.id}`;
    const qrUrl = (typeof CertificateVerifier !== 'undefined' && CertificateVerifier.getQrCodeSrc)
      ? CertificateVerifier.getQrCodeSrc(qrTargetUrl, 160)
      : `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(qrTargetUrl)}`;

    this.dom.modalBody.innerHTML = `
      <div class="dossier-nav-bar">
        <button class="dossier-nav-btn" onclick="App.openModal('${prevHero.id}')" title="${this.escapeHtml(prevHero.name)}" type="button">← Предыдущий герой</button>
        <span class="dossier-nav-counter">${currentIndex + 1} / ${heroesDatabase.length}</span>
        <button class="dossier-nav-btn" onclick="App.openModal('${nextHero.id}')" title="${this.escapeHtml(nextHero.name)}" type="button">Следующий герой →</button>
      </div>

      <div class="dossier-layout">
        <!-- ЛЕВАЯ КОЛОНКА: ФОТО, ГАЛЕРЕЯ И ДЕЙСТВИЯ -->
        <div class="dossier-sidebar">
          <div class="dossier-gallery-main">
            <img src="${mainPhoto}" alt="${this.escapeHtml(hero.name)}" id="dossierMainImage" class="dossier-img" onerror="this.onerror=null; this.src='${fallbackAvatar}';">
            <div class="dossier-gallery-caption" id="dossierImageCaption">
              <strong>${this.escapeHtml(galleryItems[0].caption || '')}</strong>
              ${galleryItems[0].desc ? `<br><small style="opacity:0.8;">${this.escapeHtml(galleryItems[0].desc)}</small>` : ''}
            </div>
          </div>

          <!-- МИНИАТЮРЫ ГАЛЕРЕИ (ЧИСТАЯ ЛЕНТА С СОХРАНЕНИЕМ ПРОПОРЦИЙ) -->
          <div class="dossier-thumbnails-track">
            ${galleryItems.map((item, idx) => `
              <button class="dossier-thumb-btn ${idx === 0 ? 'active' : ''} ${item.type || ''}" 
                      onclick="App.switchGalleryPhoto('${item.url}', '${item.caption.replace(/'/g, "\\'")}', '${(item.desc || '').replace(/'/g, "\\'")}', this)" 
                      type="button" 
                      title="${this.escapeHtml(item.caption)}">
                <img src="${item.url}" alt="" onerror="this.onerror=null; this.src='${fallbackAvatar}';">
              </button>
            `).join('')}
          </div>

          <div class="dossier-actions-stack">
            <button class="dossier-btn-tts" id="dossierTTSPlayBtn" onclick="App.toggleHeroTTS('${hero.id}')" type="button">
              <span class="tts-icon">🔊</span> Слушать диктора онлайн
            </button>

            <button class="dossier-candle-btn" onclick="App.lightCandleSafe('${hero.id}', event)" type="button">
              Зажечь Свечу Памяти (<span id="candleCountDisplay">${candleCount}</span>)
            </button>

            <button class="dossier-action-btn" onclick="App.layFlowerSafe('${hero.id}', event)" type="button">
              💐 Возложить живые гвоздики
            </button>

            ${audioSrc ? `
              <button class="dossier-btn-audio" onclick="App.playAudio('${audioSrc}', '${hero.name.replace(/'/g, "\\'")}', 'Аудиоэкскурсия')" type="button">
                🎧 Слушать аудиогид (MP3)
              </button>
            ` : ''}

            <button class="dossier-action-btn" onclick="App.printHeroDossier()" type="button">
              🖨 Распечатать лист памяти
            </button>

            <button class="dossier-action-btn" onclick="if(typeof TechModules !== 'undefined') TechModules.generateSocialPoster('${hero.id}')" type="button">
              📥 Скачать карточку для стенда
            </button>

            <a href="desk-qr.html#${hero.id}" class="dossier-action-btn" style="text-decoration:none; text-align:center; display:block; color:#c5a059; border-color:rgba(197,160,89,0.4);" title="Открыть конструктор памятной таблички А4">
              🪑 Создать «Парту Героя» А4
            </a>
          </div>

          <div class="dossier-qr-box">
            <img src="${qrUrl}" alt="QR" class="dossier-qr-img">
            <span class="dossier-qr-label">QR для «Парты Героя»</span>
          </div>
        </div>

        <!-- ПРАВАЯ КОЛОНКА: АНКЕТА, ПОДВИГ И НАГРАДЫ -->
        <div class="dossier-main">
          <h2 class="dossier-name">${this.escapeHtml(hero.name)}</h2>
          <div class="dossier-years-badge">${this.escapeHtml(yearsText)}</div>

          <div class="dossier-section-block">
            <h4 class="dossier-block-title">Студенческие годы в СРМК</h4>
            <div class="dossier-student-grid">
              <div class="student-info-item">
                <span class="meta-label">Специальность:</span>
                <strong>${this.escapeHtml(hero.education?.specialty || 'Выпускник СРМК')}</strong>
              </div>
              <div class="student-info-item">
                <span class="meta-label">Период обучения:</span>
                <strong>${this.escapeHtml(hero.education?.period || 'Архивные данные')}</strong>
              </div>
              ${hero.education?.honors ? `
                <div class="student-info-item" style="grid-column: 1/-1;">
                  <span class="meta-label">Учебные отличия и квалификация:</span>
                  <strong>${this.escapeHtml(hero.education.honors)}</strong>
                </div>
              ` : ''}
            </div>
          </div>

          <div class="dossier-section-block">
            <h4 class="dossier-block-title">Ратный подвиг и воинский долг</h4>
            <div class="student-info-item" style="margin-bottom: 10px;">
              <span class="meta-label">Подразделение и звание:</span>
              <strong>${this.escapeHtml(rankText)}</strong>
            </div>
            <div class="dossier-deed-text md-content">${this.parseMarkdown(deedText)}</div>
          </div>

          ${hero.quote ? `
            <blockquote class="dossier-quote md-content">
              «${this.parseMarkdown(hero.quote)}»
            </blockquote>
          ` : ''}

          <div class="dossier-section-block">
            <h4 class="dossier-block-title">Государственные награды Российской Федерации</h4>
            <div class="dossier-awards-container">
              ${awardsHTML || '<span class="award-tag">Награды верифицируются</span>'}
            </div>
          </div>

          ${hero.memorialStatus ? `
            <div class="dossier-memorial-status">
              <span class="meta-label">Память в колледже:</span>
              <p>${this.escapeHtml(hero.memorialStatus)}</p>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    this.dom.heroModal.classList.add('active');
    document.body.style.overflow = 'hidden';

    if (hero.mapCoords && AppState.mapInstance) {
      try {
        AppState.mapInstance.setCenter([hero.mapCoords.lat, hero.mapCoords.lng], 8, { duration: 600 });
      } catch (e) {}
    }
  },

  switchGalleryPhoto(url, caption, desc, btnEl) {
    const mainImg = document.getElementById('dossierMainImage');
    const capEl = document.getElementById('dossierImageCaption');
    if (mainImg) mainImg.src = url;
    if (capEl) {
      capEl.innerHTML = `<strong>${this.escapeHtml(caption)}</strong>${desc ? `<br><small style="opacity:0.8;">${this.escapeHtml(desc)}</small>` : ''}`;
    }

    document.querySelectorAll('.dossier-thumb-btn').forEach(b => b.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');
  },

  /* ==========================================================================
     ОНЛАЙН-ДИКТОР TTS
     ========================================================================== */
  toggleHeroTTS(heroId) {
    const hero = heroesDatabase.find(h => h.id === heroId);
    if (!hero) return;

    if (!window.TTSNarrator) {
      (window.MemorialToast || this).showToast("Модуль диктора не поддерживается вашим браузером или находится в режиме оффлайн.", "warning");
      return;
    }

    if (TTSNarrator.isSpeaking && !TTSNarrator.isPaused) {
      TTSNarrator.pause();
    } else if (TTSNarrator.isPaused) {
      TTSNarrator.resume();
    } else {
      const textToRead = `${hero.name}. Годы жизни: ${hero.dates?.years || ''}. Специальность в колледже: ${hero.education?.specialty || ''}. Воинское подразделение: ${hero.military?.rank || ''} ${hero.military?.unit || ''}. Описание подвига: ${hero.deed}. ${hero.quote ? `Памятная цитата: ${hero.quote}` : ''}`;
      const deedElement = document.querySelector('.dossier-deed-text');
      TTSNarrator.speakText(textToRead, deedElement);
      if (window.AchievementsEngine) {
        window.AchievementsEngine.trackAudioListened();
      }
    }
  },

  /* ==========================================================================
     ДЕЙСТВИЯ: СВЕЧИ И ЦВЕТЫ
     ========================================================================== */
  lightCandleSafe(heroId, event) {
    if (typeof TributeSecurity !== 'undefined') {
      TributeSecurity.verifyAndExecuteTribute('candle', heroId, event, (newCount, meta) => {
        this.onTributeSuccess('candle', heroId, newCount, meta);
      });
    } else {
      if (event && !event.isTrusted) return;
      AppState.candles[heroId] = (AppState.candles[heroId] || 0) + 1;
      localStorage.setItem('srmk_museum_candles_v3', JSON.stringify(AppState.candles));
      this.onTributeSuccess('candle', heroId, AppState.candles[heroId]);
    }
  },

  layFlowerSafe(heroId, event) {
    if (typeof TributeSecurity !== 'undefined') {
      TributeSecurity.verifyAndExecuteTribute('flowers', heroId, event, (newCount, meta) => {
        this.onTributeSuccess('flowers', heroId, newCount, meta);
      });
    } else {
      if (typeof TechModules !== 'undefined') {
        TechModules.layCarnationFlower(event);
      }
    }
  },

  async onTributeSuccess(type, heroId, newCount, meta) {
    if (type === 'candle') {
      AppState.candles[heroId] = newCount;
      localStorage.setItem('srmk_museum_candles_v3', JSON.stringify(AppState.candles));

      if (window.AchievementsEngine) {
        window.AchievementsEngine.trackCandleLit(heroId);
      }

      if (window.HallAnalytics && typeof HallAnalytics.trackCandleTribute === 'function') {
        HallAnalytics.trackCandleTribute(heroId);
      }

      if (window.CloudSync?.isLive) {
        const cloudCount = await CloudSync.pushCandle(heroId);
        if (Number.isFinite(cloudCount)) {
          AppState.candles[heroId] = cloudCount;
          localStorage.setItem('srmk_museum_candles_v3', JSON.stringify(AppState.candles));
        }
      }

      const countDisplay = document.getElementById('candleCountDisplay');
      if (countDisplay) countDisplay.textContent = AppState.candles[heroId];

      this.updateMemorialStats();
      this.renderCardsGrid();
      this.renderMemorialPlaques();
      this.playChimeSound(880, 0.35);
    }

    if (type === 'flowers') {
      if (window.AchievementsEngine) {
        window.AchievementsEngine.trackFlowersLaid();
      }

      if (window.CloudSync?.isLive) {
        await CloudSync.pushFlower(heroId);
        const counters = await CloudSync.fetchAllCounters();
        if (counters) {
          AppState.flowersCount = counters.flowers;
          if (this.dom.flowersDisplay) this.dom.flowersDisplay.textContent = counters.flowers;
        }
      }
      this.playMemorialBellSynthesizer();

      const flower = document.createElement('div');
      flower.className = 'floating-flower-anim';
      flower.textContent = '💐';
      flower.style.left = '50%';
      flower.style.top = '65%';
      document.body.appendChild(flower);
      setTimeout(() => flower.remove(), 2400);
    }
  },

  updateMemorialStats() {
    const total = Object.values(AppState.candles || {}).reduce((a, b) => a + b, 0);
    if (this.dom.totalCandlesDisplay) this.dom.totalCandlesDisplay.textContent = total;
    if (this.dom.statHeroCandles) this.dom.statHeroCandles.textContent = total;
    if (this.dom.flowersDisplay && AppState.flowersCount) {
      this.dom.flowersDisplay.textContent = AppState.flowersCount;
    }
  },

  updateCandlesStats() {
    this.updateMemorialStats();
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
    if (window.TTSNarrator) TTSNarrator.stop();
    if (this.dom.heroModal) this.dom.heroModal.classList.remove('active');
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
     СЕНСОРНЫЕ ЖЕСТЫ (СВАЙПЫ)
     ========================================================================== */
  initTouchGestures() {
    const modal = this.dom.heroModal;
    if (!modal) return;

    modal.addEventListener('touchstart', (e) => {
      AppState.touchStartX = e.changedTouches[0].screenX;
      AppState.touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    modal.addEventListener('touchend', (e) => {
      AppState.touchEndX = e.changedTouches[0].screenX;
      AppState.touchEndY = e.changedTouches[0].screenY;
      this.handleTouchGesture();
    }, { passive: true });
  },

  handleTouchGesture() {
    const deltaX = AppState.touchEndX - AppState.touchStartX;
    const deltaY = AppState.touchEndY - AppState.touchStartY;

    if (Math.abs(deltaX) > 70 && Math.abs(deltaY) < 60) {
      if (deltaX < 0) this.navigateHero(1);
      if (deltaX > 0) this.navigateHero(-1);
    }

    if (deltaY > 120 && AppState.touchStartY < 150) {
      this.closeModal();
    }
  },

  /* ==========================================================================
     РЕЖИМЫ УСТРОЙСТВ, ПРОЕКТОР И ИНТЕРАКТИВНАЯ ДОСКА
     ========================================================================== */
  restoreDeviceMode() {
    try {
      const savedMode = localStorage.getItem('srmk_device_mode');
      const urlParams = new URLSearchParams(window.location.search);
      const isParamProjector = urlParams.get('mode') === 'projector' || window.location.hash === '#projector';
      if (savedMode === 'projector' || isParamProjector) {
        this.setDeviceMode('projector', false);
      }
    } catch (e) {}
  },

  setDeviceMode(mode, showNotice = true) {
    const desktopBtn = document.getElementById('btnModeDesktop');
    const projectorBtn = document.getElementById('btnModeProjector');

    if (mode === 'projector') {
      document.body.classList.add('projector-board-mode');
      AppState.isProjectorMode = true;
      if (desktopBtn) desktopBtn.classList.remove('active');
      if (projectorBtn) projectorBtn.classList.add('active');
      try { localStorage.setItem('srmk_device_mode', 'projector'); } catch (e) {}
      if (showNotice) {
        this.showToast("Режим интерактивной доски / проектора активирован: крупный шрифт 18px и сенсорные зоны.", "info");
      }
    } else {
      document.body.classList.remove('projector-board-mode');
      AppState.isProjectorMode = false;
      if (desktopBtn) desktopBtn.classList.add('active');
      if (projectorBtn) projectorBtn.classList.remove('active');
      try { localStorage.setItem('srmk_device_mode', 'desktop'); } catch (e) {}
      if (showNotice) {
        this.showToast("Стандартный режим рабочего стола активирован.", "info");
      }
    }
  },

  toggleProjectorMode() {
    this.setDeviceMode(AppState.isProjectorMode ? 'desktop' : 'projector');
  },

  /* ==========================================================================
     ВСЕРОССИЙСКАЯ МИНУТА МОЛЧАНИЯ (ИНТЕРАКТИВНЫЙ МЕТРОНОМ И ВЕЧНЫЙ ОГОНЬ)
     ========================================================================== */
  getAudioContext() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      if (!AppState.audioContext) {
        AppState.audioContext = new AudioCtx();
      }
      if (AppState.audioContext.state === 'suspended') {
        AppState.audioContext.resume().catch(() => {});
      }
      return AppState.audioContext;
    } catch (e) {
      return null;
    }
  },

  startMinuteOfSilence() {
    const overlay = document.getElementById('silenceOverlay');
    if (!overlay) return;

    // Разблокировка Web Audio Context на пользовательском жесте
    this.getAudioContext();

    AppState.silenceSecondsLeft = 60;
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    const clock = document.getElementById('silenceCountdownClock');
    const statusText = document.getElementById('silenceStatusText');
    const flame = document.querySelector('.silence-candle-flame');
    if (clock) clock.textContent = '60';
    if (statusText) statusText.textContent = 'Звучит мемориальный метроном (60 уд/мин)';

    // Запуск метронома (1 удар в секунду)
    this.playMetronomeTick();
    if (flame) {
      flame.style.transform = 'scale(1.15)';
      setTimeout(() => { if (flame) flame.style.transform = ''; }, 120);
    }

    clearInterval(AppState.silenceTimer);
    AppState.silenceTimer = setInterval(() => {
      AppState.silenceSecondsLeft--;
      if (clock) clock.textContent = AppState.silenceSecondsLeft;

      if (AppState.silenceSecondsLeft > 0) {
        this.playMetronomeTick();
        if (flame) {
          flame.style.transform = 'scale(1.15)';
          setTimeout(() => { if (flame) flame.style.transform = ''; }, 120);
        }
      } else {
        this.stopMinuteOfSilence(true);
      }
    }, 1000);
  },

  stopMinuteOfSilence(isFinished = false) {
    clearInterval(AppState.silenceTimer);
    AppState.silenceTimer = null;
    const overlay = document.getElementById('silenceOverlay');
    document.body.style.overflow = '';

    if (isFinished) {
      this.playBellChimeSound();
      this.lightCandleSafe('general', null);
      if (window.AchievementsEngine) {
        window.AchievementsEngine.trackCandleLit('minute_of_silence');
      }

      const clock = document.getElementById('silenceCountdownClock');
      const statusText = document.getElementById('silenceStatusText');
      if (clock) clock.textContent = '🕊';
      if (statusText) statusText.textContent = 'Минута молчания завершена. Свеча памяти зажжена!';

      setTimeout(() => {
        if (overlay) overlay.classList.remove('active');
        this.showToast("Вечная слава павшим героям Отечества! Ваша Свеча Памяти зажжена.", "info");
      }, 2600);
    } else {
      if (overlay) overlay.classList.remove('active');
    }
  },

  playMetronomeTick() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.035);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch (e) {}
  },

  playBellChimeSound() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      [220, 440, 660].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.25 / (idx + 1), ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 3.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 3.6);
      });
    } catch (e) {}
  },

  /* ==========================================================================
     ПУЛЬТ ПРЕПОДАВАТЕЛЯ: СЦЕНАРИЙ УРОКА МУЖЕСТВА И ТАЙМЕР ЗАНЯТИЯ
     ========================================================================== */
  selectLessonPhase(phaseIndex, shouldScroll = true) {
    AppState.activeLessonPhase = phaseIndex;
    const cards = document.querySelectorAll('.lesson-step-card');
    cards.forEach((card, idx) => {
      card.classList.toggle('active', idx === phaseIndex);
    });

    this.updateLessonProgressBar();

    if (!shouldScroll) return;

    if (phaseIndex === 0) {
      const memorial = document.getElementById('memorial');
      if (memorial) memorial.scrollIntoView({ behavior: 'smooth' });
      this.playChimeSound(660, 0.2);
      this.showToast("Этап 1 (00:00 – 05:00): Вводное слово, Гимн РФ и миссия Урока Мужества.", "info");
    } else if (phaseIndex === 1) {
      const heroes = document.getElementById('heroes-grid');
      if (heroes) heroes.scrollIntoView({ behavior: 'smooth' });
      this.playChimeSound(784, 0.2);
      this.showToast("Этап 2 (05:00 – 20:00): 20 Героев СРМК — связь гражданской специальности и ратного подвига.", "info");
    } else if (phaseIndex === 2) {
      this.startMinuteOfSilence();
    } else if (phaseIndex === 3) {
      this.showToast("Этап 4 (21:00 – 35:00): Интерактивный блиц-квест. Переход в квест...", "info");
      setTimeout(() => { window.location.href = 'quiz.html'; }, 1000);
    } else if (phaseIndex === 4) {
      this.openLessonReportModal();
    }
  },

  nextLessonPhase() {
    const nextIdx = Math.min(4, AppState.activeLessonPhase + 1);
    this.selectLessonPhase(nextIdx);
  },

  prevLessonPhase() {
    const prevIdx = Math.max(0, AppState.activeLessonPhase - 1);
    this.selectLessonPhase(prevIdx);
  },

  updateLessonProgressBar() {
    const bar = document.getElementById('lessonProgressBar');
    if (!bar) return;
    const totalSeconds = 45 * 60;
    const elapsedSeconds = totalSeconds - AppState.lessonSecondsLeft;
    const pct = Math.min(100, Math.max(0, (elapsedSeconds / totalSeconds) * 100));
    bar.style.width = `${pct}%`;
  },

  toggleLessonTimer() {
    const clock = document.getElementById('lessonTimerClock');
    const toggleBtn = document.getElementById('btnLessonTimerToggle');

    if (AppState.isLessonTimerRunning) {
      clearInterval(AppState.lessonTimer);
      AppState.isLessonTimerRunning = false;
      if (toggleBtn) toggleBtn.textContent = '▶ Старт';
    } else {
      AppState.isLessonTimerRunning = true;
      if (toggleBtn) toggleBtn.textContent = '⏸ Пауза';

      AppState.lessonTimer = setInterval(() => {
        if (AppState.lessonSecondsLeft > 0) {
          AppState.lessonSecondsLeft--;
          const mins = Math.floor(AppState.lessonSecondsLeft / 60).toString().padStart(2, '0');
          const secs = (AppState.lessonSecondsLeft % 60).toString().padStart(2, '0');
          if (clock) clock.textContent = `${mins}:${secs}`;

          this.updateLessonProgressBar();

          // Автономный переход этапов по ходу 45-минутного занятия:
          // 45:00 - 40:00 (0-5 мин) => Этап 0
          // 40:00 - 25:00 (5-20 мин) => Этап 1
          // 25:00 - 24:00 (20-21 мин) => Этап 2 (Минута молчания)
          // 24:00 - 10:00 (21-35 мин) => Этап 3 (Квест)
          // 10:00 - 00:00 (35-45 мин) => Этап 4 (Итоги и Акт)
          const elapsed = (45 * 60) - AppState.lessonSecondsLeft;
          let calculatedPhase = 0;
          if (elapsed >= 35 * 60) {
            calculatedPhase = 4;
          } else if (elapsed >= 21 * 60) {
            calculatedPhase = 3;
          } else if (elapsed >= 20 * 60) {
            calculatedPhase = 2;
          } else if (elapsed >= 5 * 60) {
            calculatedPhase = 1;
          }

          if (calculatedPhase !== AppState.activeLessonPhase) {
            AppState.activeLessonPhase = calculatedPhase;
            const cards = document.querySelectorAll('.lesson-step-card');
            cards.forEach((card, idx) => {
              card.classList.toggle('active', idx === calculatedPhase);
            });
            this.playChimeSound(660, 0.25);
            if (calculatedPhase === 2) {
              this.showToast("Наступило время Всероссийской минуты молчания!", "info");
              this.startMinuteOfSilence();
            } else {
              this.showToast(`Автоматический переход: Этап ${calculatedPhase + 1} урока активирован.`, "info");
            }
          }
        } else {
          clearInterval(AppState.lessonTimer);
          AppState.isLessonTimerRunning = false;
          if (toggleBtn) toggleBtn.textContent = '▶ Старт';
          this.playBellChimeSound();
          this.showToast("45 минут занятия завершены. Время подведения итогов и рефлексии!", "info");
        }
      }, 1000);
    }
  },

  resetLessonTimer() {
    clearInterval(AppState.lessonTimer);
    AppState.isLessonTimerRunning = false;
    AppState.lessonSecondsLeft = 45 * 60;
    const clock = document.getElementById('lessonTimerClock');
    const toggleBtn = document.getElementById('btnLessonTimerToggle');
    if (clock) clock.textContent = '45:00';
    if (toggleBtn) toggleBtn.textContent = '▶ Старт';
    this.selectLessonPhase(0, false);
    this.updateLessonProgressBar();
  },

  /* ==========================================================================
     РАЗДАТОЧНЫЕ МАТЕРИАЛЫ И ОТЧЕТНЫЙ АКТ-ПРОТОКОЛ ДЛЯ ПЕДАГОГА
     ========================================================================== */
  openLessonReportModal() {
    const modal = document.getElementById('lessonReportModal');
    if (!modal) return;
    const dateInput = document.getElementById('reportLessonDate');
    if (dateInput && !dateInput.value) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }
    const teacherInput = document.getElementById('reportTeacherName');
    const groupInput = document.getElementById('reportGroupName');
    try {
      const savedTeacher = localStorage.getItem('srmk_teacher_name');
      if (savedTeacher && teacherInput) teacherInput.value = savedTeacher;
      const savedGroup = localStorage.getItem('srmk_group_name');
      if (savedGroup && groupInput) groupInput.value = savedGroup;
    } catch (e) {}
    modal.classList.add('active');
  },

  closeLessonReportModal() {
    const modal = document.getElementById('lessonReportModal');
    if (modal) modal.classList.remove('active');
  },

  /**
   * Безопасная печать через скрытый iframe (без блокировки всплывающих окон)
   */
  printHtmlContent(title, htmlBody) {
    let iframe = document.getElementById('srmk_print_frame');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'srmk_print_frame';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.opacity = '0';
      iframe.style.pointerEvents = 'none';
      document.body.appendChild(iframe);
    }
    const frameDoc = iframe.contentWindow || iframe.contentDocument;
    const d = frameDoc.document || frameDoc;
    d.open();
    d.write(`
      <!DOCTYPE html>
      <html lang="ru">
      <head>
        <meta charset="UTF-8">
        <title>${this.escapeHtml(title)}</title>
        <style>
          @page { margin: 12mm 15mm; }
          body { font-family: 'Times New Roman', serif; color: #000; background: #fff; margin: 0; padding: 10mm; line-height: 1.5; }
        </style>
      </head>
      <body>
        ${htmlBody}
      </body>
      </html>
    `);
    d.close();
    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (e) {
        window.print();
      }
    }, 300);
  },

  printLessonReport() {
    const teacher = document.getElementById('reportTeacherName')?.value || 'Гента А. В.';
    const group = document.getElementById('reportGroupName')?.value || 'ИСиП-242';
    const students = document.getElementById('reportStudentsCount')?.value || '25';
    const topic = document.getElementById('reportLessonTopic')?.value || '«Быть воином — жить вечно»';
    const date = document.getElementById('reportLessonDate')?.value || new Date().toLocaleDateString('ru-RU');

    try {
      localStorage.setItem('srmk_teacher_name', teacher);
      localStorage.setItem('srmk_group_name', group);
    } catch (e) {}

    this.closeLessonReportModal();

    const reportHtml = `
      <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 24px;">
        <h3 style="margin: 0 0 6px; text-transform: uppercase; font-size: 13pt;">Министерство образования Ставропольского края</h3>
        <p style="margin: 0; font-size: 11pt;">ГБПОУ «Ставропольский региональный многопрофильный колледж»</p>
        <p style="margin: 0; font-size: 11pt;">Мемориально-образовательный комплекс «Быть воином — жить вечно»</p>
      </div>

      <div style="text-align: center; font-size: 16pt; font-weight: bold; margin: 25px 0 20px; text-transform: uppercase;">
        АКТ-ПРОТОКОЛ<br><span style="font-size:12pt; font-weight:normal;">о проведении Всероссийского Урока Мужества</span>
      </div>

      <p style="text-indent: 25px; text-align: justify; font-size: 12pt;">
        Настоящим подтверждается, что на базе ГБПОУ «Ставропольский региональный многопрофильный колледж» 
        с использованием цифрового мемориального комплекса было проведено патриотическо-воспитательное занятие 
        в рамках Всероссийской акции «Карта доблести: хранители подвигов».
      </p>

      <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #333; font-size: 12pt; font-weight: bold; width: 35%; background: #f5f5f5;">Тема занятия:</td>
          <td style="padding: 8px 12px; border: 1px solid #333; font-size: 12pt;">${this.escapeHtml(topic)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #333; font-size: 12pt; font-weight: bold; background: #f5f5f5;">Учебная группа:</td>
          <td style="padding: 8px 12px; border: 1px solid #333; font-size: 12pt;">${this.escapeHtml(group)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #333; font-size: 12pt; font-weight: bold; background: #f5f5f5;">Количество обучающихся:</td>
          <td style="padding: 8px 12px; border: 1px solid #333; font-size: 12pt;">${this.escapeHtml(students)} чел.</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #333; font-size: 12pt; font-weight: bold; background: #f5f5f5;">Преподаватель / Разработчик:</td>
          <td style="padding: 8px 12px; border: 1px solid #333; font-size: 12pt;">${this.escapeHtml(teacher)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #333; font-size: 12pt; font-weight: bold; background: #f5f5f5;">Дата проведения:</td>
          <td style="padding: 8px 12px; border: 1px solid #333; font-size: 12pt;">${this.escapeHtml(date)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #333; font-size: 12pt; font-weight: bold; background: #f5f5f5;">Использованные модули:</td>
          <td style="padding: 8px 12px; border: 1px solid #333; font-size: 12pt;">Интерактивный Мемориал Славы, Книга Памяти 20 героев, Всероссийская минута молчания, квест-викторина</td>
        </tr>
      </table>

      <div style="display: flex; justify-content: space-between; margin-top: 45px; font-size: 12pt;">
        <div>
          Преподаватель: <span style="width: 200px; border-bottom: 1px solid #000; display: inline-block;"></span> (${this.escapeHtml(teacher)})
        </div>
        <div>
          Зам. директора по ВР: <span style="width: 200px; border-bottom: 1px solid #000; display: inline-block;"></span> / Смирнова Е. В. /
        </div>
      </div>

      <div style="margin-top: 40px; text-align: right; font-size: 10pt; color: #555;">
        М.П. ГБПОУ СРМК • г. Ставрополь, ${this.escapeHtml(date)} г.
      </div>
    `;

    this.printHtmlContent('Акт проведения Урока Мужества — ГБПОУ СРМК', reportHtml);
  },

  printLessonHandouts() {
    if (typeof heroesDatabase === 'undefined' || heroesDatabase.length === 0) return;
    const heroesSample = heroesDatabase.slice(0, 4);

    const handoutsHtml = `
      <h3 style="text-align:center; margin-bottom:18px; font-size:14pt;">РАЗДАТОЧНЫЙ МАТЕРИАЛ ДЛЯ ПАРТ: 20 ГЕРОЕВ СРМК</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15mm;">
        ${heroesSample.map(h => `
          <div style="border: 2px solid #8a1c22; padding: 14px; page-break-inside: avoid; border-radius: 4px;">
            <div style="font-weight: bold; font-size: 13pt; color: #8a1c22; text-align: center; margin-bottom: 6px;">${this.escapeHtml(h.name)}</div>
            <div style="font-size: 10pt; text-align: center; color: #333; margin-bottom: 8px;">${this.escapeHtml(h.education?.specialty || 'Выпускник СРМК')} • ${this.escapeHtml(h.dates?.years || '')}</div>
            <p style="font-size:10pt; line-height:1.4;">${h.deed ? this.escapeHtml(h.deed.substring(0, 180)) + '...' : ''}</p>
            ${h.quote ? `<div style="font-style: italic; font-size: 9pt; border-left: 2px solid #c5a059; padding-left: 8px; margin: 8px 0;">«${this.escapeHtml(h.quote)}»</div>` : ''}
            <div style="text-align: center; margin-top: 10px; font-size: 9pt; color: #555;">
              <strong>QR-код досье:</strong> отсканируйте камерой на сайте музея
            </div>
          </div>
        `).join('')}
      </div>
    `;

    this.printHtmlContent('Раздаточные карточки парт — ГБПОУ СРМК', handoutsHtml);
  },

  printGroupQuizSheet() {
    const quizHtml = `
      <div style="text-align: center; border-bottom: 1px solid #000; padding-bottom: 8px; margin-bottom: 16px;">
        <strong>ГБПОУ «Ставропольский региональный многопрофильный колледж»</strong><br>
        Бланк экспресс-тестирования «Дорогами мужества 20 героев»
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 18px; font-weight: bold;">
        <span>ФИО студента: ____________________________________</span>
        <span>Группа: ________</span>
        <span>Оценка: _____</span>
      </div>
      <div style="margin-bottom: 12px;">1. Сколько выпускников колледжа увековечено на Мемориале Славы во дворе СРМК? (Варианты: А) 12; Б) 20; В) 15; Г) 25)</div>
      <div style="margin-bottom: 12px;">2. В каком знаменитом полку ВДВ служил разведчик-санитар Николай Вечёрка? (Варианты: А) 247-й ДШП; Б) 104-й ДШП; В) 76-я дивизия; Г) 45-й полк СпН)</div>
      <div style="margin-bottom: 12px;">3. Какую гражданскую специальность получил в колледже кавалер Ордена Мужества Дмитрий Самохин? (Варианты: А) Сварщик; Б) Электромеханик; В) Пожарный; Г) Программист)</div>
      <div style="margin-bottom: 12px;">4. Какой номер носил экипаж машины огневой поддержки сержанта Шамиля Назырова? (Варианты: А) «Машина Жизни»; Б) «Гром-1»; В) «Буран»; Г) «Звезда»)</div>
      <div style="margin-bottom: 12px;">5. В каком городе расположен Мемориальный комплекс выпускников колледжа? (Варианты: А) Невинномысск; Б) Ставрополь; В) Пятигорск; Г) Кисловодск)</div>
      <div style="margin-top: 30px; font-style: italic; color: #444;">Ответы сдаются преподавателю для проверки и внесения в Зал Славы.</div>
    `;

    this.printHtmlContent('Бланк тестирования Урока Мужества — ГБПОУ СРМК', quizHtml);
  },

  /* ==========================================================================
     ВИДЖЕТ «ГЕРОЙ ДНЯ / ВСПОМНИМ ВЫПУСКНИКА» (С АВТОНОМНОЙ СМЕНОЙ)
     ========================================================================== */
  renderFeaturedHero(targetIndex = null) {
    const card = document.getElementById('featuredHeroCard');
    if (!card || typeof heroesDatabase === 'undefined' || heroesDatabase.length === 0) return;

    if (targetIndex !== null) {
      AppState.spotlightHeroIndex = (targetIndex + heroesDatabase.length) % heroesDatabase.length;
    } else if (typeof AppState.spotlightHeroIndex !== 'number' || AppState.spotlightHeroIndex === 0) {
      const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
      AppState.spotlightHeroIndex = dayOfYear % heroesDatabase.length;
    }

    const hero = heroesDatabase[AppState.spotlightHeroIndex];
    const fallbackAvatar = (typeof ArchiveService !== 'undefined') ? ArchiveService.generateFallbackAvatar(hero) : FALLBACK_HERO_AVATAR;
    const photo = hero.media?.photo || fallbackAvatar;

    card.innerHTML = `
      <div class="spotlight-avatar-wrap">
        <img src="${photo}" alt="${this.escapeHtml(hero.name)}" class="spotlight-avatar" onerror="this.onerror=null; this.src='${fallbackAvatar}';">
      </div>
      <div class="spotlight-info">
        <div class="spotlight-kicker" style="display:flex; justify-content:space-between; align-items:center;">
          <span>Герой дня • Навечно в строю</span>
          <span style="font-size:0.75rem; color:#8b96a5; letter-spacing:0.5px;">${AppState.spotlightHeroIndex + 1} из ${heroesDatabase.length}</span>
        </div>
        <h3 class="spotlight-name">${this.escapeHtml(hero.name)}</h3>
        <div class="spotlight-meta">
          ${this.escapeHtml(hero.education?.specialty || 'Выпускник СРМК')} • ${this.escapeHtml(hero.dates?.years || '')}
        </div>
        ${hero.quote ? `<p class="spotlight-quote">«${this.escapeHtml(hero.quote)}»</p>` : ''}
      </div>
      <div class="spotlight-actions" style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
        <button class="btn btn-secondary" onclick="App.prevSpotlightHero(event)" type="button" title="Предыдущий выпускник" style="padding:8px 12px; font-size:0.85rem;" aria-label="Предыдущий герой">
          ◀
        </button>
        <button class="btn btn-secondary" onclick="App.nextSpotlightHero(event)" type="button" title="Следующий выпускник" style="padding:8px 12px; font-size:0.85rem;" aria-label="Следующий герой">
          ▶
        </button>
        <button class="btn btn-secondary" onclick="App.openModal('${hero.id}')" type="button" style="padding:8px 14px; font-size:0.8rem;">
          Архивное досье →
        </button>
        <button class="btn btn-secondary" onclick="App.lightCandleSafe('${hero.id}', event)" type="button" style="padding:8px 12px; font-size:0.8rem; border-color:#c5a059; color:#dfba6d;">
          🕯 Свеча
        </button>
      </div>
    `;

    if (!card._hasHoverEvents) {
      card.addEventListener('mouseenter', () => { AppState.isSpotlightPaused = true; });
      card.addEventListener('mouseleave', () => { AppState.isSpotlightPaused = false; });
      card._hasHoverEvents = true;
    }
  },

  nextSpotlightHero(e) {
    if (e) e.stopPropagation();
    this.renderFeaturedHero(AppState.spotlightHeroIndex + 1);
  },

  prevSpotlightHero(e) {
    if (e) e.stopPropagation();
    this.renderFeaturedHero(AppState.spotlightHeroIndex - 1);
  },

  startSpotlightAutoPlay() {
    clearInterval(AppState.spotlightInterval);
    AppState.spotlightInterval = setInterval(() => {
      if (!AppState.isSpotlightPaused && (!AppState.heroModal || !AppState.heroModal.classList.contains('active'))) {
        this.nextSpotlightHero();
      }
    }, 12000);
  },

  /* ==========================================================================
     СКРОЛЛ-ШПИОН ДЛЯ МОБИЛЬНОЙ ПАНЕЛИ
     ========================================================================== */
  initMobileScrollSpy() {
    const heroesBtn = document.getElementById('mobileBarHeroes');
    const lessonBtn = document.getElementById('mobileBarLesson');
    const silenceBtn = document.getElementById('mobileBarSilence');
    if (!heroesBtn && !lessonBtn && !silenceBtn) return;

    window.addEventListener('scroll', () => {
      const scrollPos = window.scrollY + 250;
      const heroesEl = document.getElementById('heroes-grid');
      const lessonEl = document.getElementById('teacherConsole');
      const memorialEl = document.getElementById('memorial');

      if (lessonBtn && lessonEl && scrollPos >= lessonEl.offsetTop && scrollPos < lessonEl.offsetTop + lessonEl.offsetHeight) {
        lessonBtn.classList.add('active');
        if (heroesBtn) heroesBtn.classList.remove('active');
        if (silenceBtn) silenceBtn.classList.remove('active');
      } else if (heroesBtn && heroesEl && scrollPos >= heroesEl.offsetTop && scrollPos < heroesEl.offsetTop + heroesEl.offsetHeight) {
        heroesBtn.classList.add('active');
        if (lessonBtn) lessonBtn.classList.remove('active');
        if (silenceBtn) silenceBtn.classList.remove('active');
      } else if (silenceBtn && memorialEl && scrollPos >= memorialEl.offsetTop && scrollPos < memorialEl.offsetTop + memorialEl.offsetHeight) {
        silenceBtn.classList.add('active');
        if (heroesBtn) heroesBtn.classList.remove('active');
        if (lessonBtn) lessonBtn.classList.remove('active');
      } else {
        if (heroesBtn) heroesBtn.classList.remove('active');
        if (lessonBtn) lessonBtn.classList.remove('active');
        if (silenceBtn) silenceBtn.classList.remove('active');
      }
    }, { passive: true });
  },

  /* ==========================================================================
     РЕЖИМ ПРЕЗЕНТАЦИИ «УРОК МУЖЕСТВА» (ОБНОВЛЕННЫЙ АВТОПИЛОТ)
     ========================================================================== */
  startPresentationMode() {
    this.selectLessonPhase(0);
    this.toggleProjectorMode();
  },

  stopPresentationMode() {
    AppState.isPresentationRunning = false;
    clearInterval(AppState.presentationTimer);
  },

  /* ==========================================================================
     ИНТЕРАКТИВНАЯ КАРТА БОЕВОГО ПУТИ (ЯНДЕКС КАРТЫ + АВТОНОМНЫЙ ТАКТИЧЕСКИЙ ВЕКТОР)
     ========================================================================== */
  initInteractiveMapSafe() {
    const mapElement = document.getElementById('interactiveBattleMap');
    if (!mapElement) return;

    this.bindTheatreControls();

    // 1. Попытка инициализировать Яндекс Карты API
    if (typeof ymaps !== 'undefined') {
      try {
        ymaps.ready(() => {
          try {
            AppState.mapInstance = new ymaps.Map('interactiveBattleMap', {
              center: [47.5, 36.5],
              zoom: 6,
              controls: ['zoomControl', 'fullscreenControl']
            }, {
              suppressMapOpenBlock: true
            });

            AppState.mapInstance.behaviors.disable('scrollZoom');

            const srmkCoords = typeof MUSEUM_CONFIG !== 'undefined' ? MUSEUM_CONFIG.coords : [45.0448, 41.9691];
            const srmkPlacemark = new ymaps.Placemark(srmkCoords, {
              balloonContentHeader: '<strong style="color:#8a1c22; font-size:14px;">ГБПОУ СРМК</strong>',
              balloonContentBody: '<small>г. Ставрополь, пр. Юности, 3</small><br><span style="font-size:12px; color:#555;">Альма-матер всех 20 героев</span>'
            }, {
              preset: 'islands#yellowDotIcon',
              iconColor: '#c5a059'
            });
            AppState.mapInstance.geoObjects.add(srmkPlacemark);

            if (typeof MuseumAPI !== 'undefined') {
              const markers = MuseumAPI.getMapMarkers();
              markers.forEach(m => {
                const heroPlacemark = new ymaps.Placemark(m.coords, {
                  balloonContentHeader: `<strong style="color:#8a1c22; font-size:14px;">${m.name}</strong>`,
                  balloonContentBody: `
                    <small>${m.rank}</small><br>
                    <span>📍 ${m.location}</span><br>
                    <button onclick="App.openModal('${m.id}')" style="margin-top:8px; background:#8a1c22; color:#fff; border:none; padding:6px 10px; border-radius:2px; cursor:pointer; font-size:12px; width:100%;">
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
                  strokeOpacity: 0.55
                });
                AppState.mapInstance.geoObjects.add(polyline);
                AppState.mapPolylines.push(polyline);
              });
            }
          } catch (innerErr) {
            console.warn("[Музей] Яндекс Карты перешли в автономный тактический режим:", innerErr);
            this.renderOfflineTacticalMap();
          }
        });
      } catch (err) {
        this.renderOfflineTacticalMap();
      }
    } else {
      // Офлайн режим: отрисовка интерактивной тактической векторной карты
      this.renderOfflineTacticalMap();
    }
  },

  bindTheatreControls() {
    document.querySelectorAll('.theatre-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.theatre-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const theatre = btn.dataset.theatre;

        document.querySelectorAll('.timeline-theatre-card').forEach(card => {
          card.style.display = (theatre === 'all' || card.dataset.theatreCard === theatre) ? 'flex' : 'none';
        });

        if (theatre === 'dnieper') App.focusMap([46.6, 32.7], 8, 'dnieper');
        if (theatre === 'zaporozhye') App.focusMap([47.45, 35.8], 8, 'zaporozhye');
        if (theatre === 'donbass') App.focusMap([48.1, 37.7], 8, 'donbass');
        if (theatre === 'kursk') App.focusMap([51.3, 35.2], 9, 'kursk');
        if (theatre === 'all') App.focusMap([47.5, 36.5], 6, 'all');
      });
    });
  },

  renderOfflineTacticalMap() {
    const mapElement = document.getElementById('interactiveBattleMap');
    if (!mapElement) return;

    mapElement.innerHTML = `
      <div class="tactical-svg-container" style="position:relative; width:100%; height:100%; background:#0a0c10; overflow:hidden; user-select:none;">
        <svg viewBox="0 0 1000 500" style="width:100%; height:100%; display:block;" id="tacticalMapSvg">
          <defs>
            <radialGradient id="tacSrmkGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#c5a059" stop-opacity="0.4"/>
              <stop offset="100%" stop-color="#c5a059" stop-opacity="0"/>
            </radialGradient>
            <radialGradient id="tacHeroGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#e11d48" stop-opacity="0.4"/>
              <stop offset="100%" stop-color="#e11d48" stop-opacity="0"/>
            </radialGradient>
            <pattern id="tacGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(197, 160, 89, 0.08)" stroke-width="1"/>
            </pattern>
          </defs>

          <!-- Тактическая координатная сетка -->
          <rect width="1000" height="500" fill="url(#tacGrid)"/>

          <!-- Концентрические радиолокационные круги от Ставрополя -->
          <circle cx="830" cy="380" r="140" fill="none" stroke="rgba(197, 160, 89, 0.12)" stroke-width="1" stroke-dasharray="4,4"/>
          <circle cx="830" cy="380" r="280" fill="none" stroke="rgba(197, 160, 89, 0.08)" stroke-width="1" stroke-dasharray="6,6"/>
          <circle cx="830" cy="380" r="460" fill="none" stroke="rgba(197, 160, 89, 0.05)" stroke-width="1" stroke-dasharray="8,8"/>

          <!-- Золотые пунктирные векторы боевого пути из Ставрополя -->
          <line x1="830" y1="380" x2="220" y2="350" stroke="#c5a059" stroke-width="2" stroke-dasharray="6,4" stroke-opacity="0.7" id="ray-dnieper"/>
          <line x1="830" y1="380" x2="380" y2="320" stroke="#c5a059" stroke-width="2" stroke-dasharray="6,4" stroke-opacity="0.7" id="ray-zaporozhye"/>
          <line x1="830" y1="380" x2="520" y2="230" stroke="#c5a059" stroke-width="2" stroke-dasharray="6,4" stroke-opacity="0.7" id="ray-donbass"/>
          <line x1="830" y1="380" x2="440" y2="100" stroke="#c5a059" stroke-width="2" stroke-dasharray="6,4" stroke-opacity="0.7" id="ray-kursk"/>

          <!-- УЗЕЛ 1: СТАВРОПОЛЬ • ГБПОУ СРМК -->
          <g transform="translate(830, 380)" style="cursor:pointer;" onclick="App.showTacticalInfo('srmk')">
            <circle r="36" fill="url(#tacSrmkGlow)"/>
            <circle r="14" fill="#141720" stroke="#c5a059" stroke-width="2.5"/>
            <circle r="5" fill="#c5a059"/>
            <text x="0" y="-22" text-anchor="middle" fill="#c5a059" font-family="'Cinzel', serif" font-weight="900" font-size="12" letter-spacing="1">СТАВРОПОЛЬ</text>
            <text x="0" y="28" text-anchor="middle" fill="#f1f3f7" font-family="'Montserrat', sans-serif" font-weight="700" font-size="10">ГБПОУ СРМК (Альма-матер)</text>
          </g>

          <!-- УЗЕЛ 2: РУБЕЖ I • ДНЕПРОВСКИЙ ПЛАЦДАРМ -->
          <g transform="translate(220, 350)" class="tac-node" id="tac-node-dnieper" style="cursor:pointer;" onclick="App.showTacticalInfo('dnieper')">
            <circle r="32" fill="url(#tacHeroGlow)"/>
            <circle r="12" fill="#141720" stroke="#8a1c22" stroke-width="2.5"/>
            <circle r="4" fill="#8a1c22"/>
            <text x="0" y="-18" text-anchor="middle" fill="#ffffff" font-family="'Cinzel', serif" font-weight="700" font-size="11">РУБЕЖ I • ДНЕПР</text>
            <text x="0" y="24" text-anchor="middle" fill="#9da6b3" font-family="'Montserrat', sans-serif" font-size="9.5">Херсон • Антоновский мост (5 героев)</text>
          </g>

          <!-- УЗЕЛ 3: РУБЕЖ II • ЗАПОРОЖСКИЙ ЩИТ -->
          <g transform="translate(380, 320)" class="tac-node" id="tac-node-zaporozhye" style="cursor:pointer;" onclick="App.showTacticalInfo('zaporozhye')">
            <circle r="32" fill="url(#tacHeroGlow)"/>
            <circle r="12" fill="#141720" stroke="#8a1c22" stroke-width="2.5"/>
            <circle r="4" fill="#8a1c22"/>
            <text x="0" y="-18" text-anchor="middle" fill="#ffffff" font-family="'Cinzel', serif" font-weight="700" font-size="11">РУБЕЖ II • ЗАПОРОЖЬЕ</text>
            <text x="0" y="24" text-anchor="middle" fill="#9da6b3" font-family="'Montserrat', sans-serif" font-size="9.5">Орехов • Пологи • Токмак (4 героя)</text>
          </g>

          <!-- УЗЕЛ 4: РУБЕЖ III • ДУГА ДОНБАССА -->
          <g transform="translate(520, 230)" class="tac-node" id="tac-node-donbass" style="cursor:pointer;" onclick="App.showTacticalInfo('donbass')">
            <circle r="36" fill="url(#tacHeroGlow)"/>
            <circle r="14" fill="#141720" stroke="#e11d48" stroke-width="2.5"/>
            <circle r="5" fill="#e11d48"/>
            <text x="0" y="-20" text-anchor="middle" fill="#ffffff" font-family="'Cinzel', serif" font-weight="700" font-size="12">РУБЕЖ III • ДОНБАСС</text>
            <text x="0" y="26" text-anchor="middle" fill="#9da6b3" font-family="'Montserrat', sans-serif" font-size="9.5">Авдеевка • Угледар • Бахмут (10 героев)</text>
          </g>

          <!-- УЗЕЛ 5: РУБЕЖ IV • КУРСКОЕ ПРИГРАНИЧЬЕ -->
          <g transform="translate(440, 100)" class="tac-node" id="tac-node-kursk" style="cursor:pointer;" onclick="App.showTacticalInfo('kursk')">
            <circle r="30" fill="url(#tacHeroGlow)"/>
            <circle r="11" fill="#141720" stroke="#8a1c22" stroke-width="2.5"/>
            <circle r="4" fill="#8a1c22"/>
            <text x="0" y="-16" text-anchor="middle" fill="#ffffff" font-family="'Cinzel', serif" font-weight="700" font-size="11">РУБЕЖ IV • КУРСК</text>
            <text x="0" y="24" text-anchor="middle" fill="#9da6b3" font-family="'Montserrat', sans-serif" font-size="9.5">Приграничная полоса • Связь (Н. Назаренко)</text>
          </g>
        </svg>

        <!-- Информационная плашка сектора -->
        <div id="tacInfoBox" style="position:absolute; bottom:16px; left:20px; right:20px; background:rgba(20,23,32,0.95); border:1px solid rgba(197,160,89,0.35); padding:12px 18px; border-radius:4px; display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap; backdrop-filter:blur(10px); box-shadow:0 8px 24px rgba(0,0,0,0.8);">
          <div id="tacInfoText" style="font-size:0.86rem; color:#d8deea;">
            <strong style="color:#c5a059;">Интерактивный план боевого пути:</strong> Выберите рубеж на карте или в кнопках выше, чтобы изучить подвиги выпускников СРМК.
          </div>
          <button type="button" class="spec-filter-btn" onclick="App.openModal('nazyrov-sh-r')" style="border-color:#c5a059; color:#c5a059; font-size:0.8rem; padding:6px 14px;">
            Открыть досье героев →
          </button>
        </div>
      </div>
    `;
  },

  showTacticalInfo(sector) {
    const box = document.getElementById('tacInfoText');
    if (!box) return;

    this.playChimeSound(640, 0.15);

    if (sector === 'srmk') {
      box.innerHTML = `<strong style="color:#c5a059;">ГБПОУ СРМК (г. Ставрополь, пр. Юности, 3):</strong> Альма-матер всех 20 выпускников-героев. Открытие архитектурного Мемориала Славы состоялось 26 сентября 2025 года.`;
    } else if (sector === 'dnieper') {
      box.innerHTML = `<strong style="color:#e11d48;">Днепровский рубеж (Херсон / Антоновский мост):</strong> 5 героев колледжа — Н. Вечёрка (разведчик-санитар ВДВ), М. Елагин, Н. Горлов, Ш. Назыров (водитель «Машины жизни»), И. Сербиенко.`;
    } else if (sector === 'zaporozhye') {
      box.innerHTML = `<strong style="color:#e11d48;">Запорожский щит (Орехов / Пологи / Токмак):</strong> 4 героя — Д. Самохин (Орден Мужества № 83029), Н. Сополев (спасатель МЧС), К. Луценко (сапер), И. Пономарчук.`;
    } else if (sector === 'donbass') {
      box.innerHTML = `<strong style="color:#e11d48;">Огненная дуга Донбасса:</strong> 10 героев — С. Мартынов (Угледар), М. Ярышев (Авдеевка), И. Чупин (Покровск), А. Григорьев, Н. Брынза, В. Петухов, С. Белов, П. Шартов, И. Лукьяненко, В. Бутов.`;
    } else if (sector === 'kursk') {
      box.innerHTML = `<strong style="color:#e11d48;">Курское приграничье:</strong> 20-летний связист Никита Назаренко, выпускник IT-кафедры 2024 года, восстановивший связь узлов управления ценой собственной жизни.`;
    }
  },

  focusMap(coords, zoom = 8, theatreName = 'all') {
    if (AppState.mapInstance) {
      AppState.mapInstance.setCenter(coords, zoom, {
        checkZoomRange: true,
        duration: 700
      });
      this.playChimeSound(480, 0.2);
    } else {
      if (theatreName && theatreName !== 'all') {
        this.showTacticalInfo(theatreName);
        const node = document.getElementById(`tac-node-${theatreName}`);
        if (node) {
          node.style.transform = 'scale(1.2)';
          setTimeout(() => { node.style.transform = 'none'; }, 600);
        }
      }
    }
  },

  /* ==========================================================================
     АУДИОПЛЕЕР ЭКСКУРСИИ (MP3)
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

    // Анонимный учет прослушивания аудиоэкскурсии в зале
    if (window.HallAnalytics && typeof HallAnalytics.trackAudioListen === 'function') {
      HallAnalytics.trackAudioListen(AppState.currentHeroId, `${heroName} • ${trackLabel}`);
    }

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
     АУДИОЭКСКУРСИЯ И СИНТЕЗАТОРЫ ЗВУКА
     ========================================================================== */
  startGeneralTour() {
    const audioPath = 'assets/audio/guides/general-tour.mp3';

    if (window.AchievementsEngine) {
      window.AchievementsEngine.trackAudioListened();
    }

    // 1. Запуск аудиофайла записи через встроенный плеер
    this.playAudio(audioPath, 'Вводная экскурсия музея СРМК', 'Обзор экспозиции');

    // 2. Интерактивное центрирование карты на Ставрополе
    if (AppState.mapInstance && typeof this.focusMap === 'function') {
      this.focusMap([45.0448, 41.9691], 10);
    }

    // 3. Динамическая подсветка карточек героев, упоминаемых в тексте экскурсии
    const featuredHeroes = ['yaryshev-m-v', 'nazyrov-sh-r', 'vecherka-n-a', 'nazarenko-n-s'];
    let highlightIdx = 0;

    if (this._tourInterval) clearInterval(this._tourInterval);

    this._tourInterval = setInterval(() => {
      if (!AppState.isAudioPlaying) {
        clearInterval(this._tourInterval);
        return;
      }

      const heroId = featuredHeroes[highlightIdx];
      const card = document.querySelector(`.hero-card button[onclick*="${heroId}"]`)?.closest('.hero-card');
      
      if (card) {
        card.style.transition = 'transform 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease';
        card.style.borderColor = 'var(--accent-brass, #c5a059)';
        card.style.boxShadow = '0 0 20px rgba(197, 160, 89, 0.4)';
        card.style.transform = 'translateY(-4px) scale(1.02)';

        setTimeout(() => {
          card.style.borderColor = '';
          card.style.boxShadow = '';
          card.style.transform = '';
        }, 2800);
      }

      highlightIdx = (highlightIdx + 1) % featuredHeroes.length;
    }, 4000);
  },
  /* ==========================================================================
     WEB AUDIO СИНТЕЗАТОРЫ
     ========================================================================== */
  playChimeSound(freq = 480, duration = 0.3) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!AppState.audioContext) AppState.audioContext = new AudioCtx();
      
      const ctx = AppState.audioContext;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, freq * 1.25), now + duration);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration);

      // Очистка аудио-узлов из памяти браузера
      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    } catch (e) {
      console.warn('[Web Audio] Ошибка синтезатора Chime:', e);
    }
  },

  playMemorialBellSynthesizer() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!AppState.audioContext) AppState.audioContext = new AudioCtx();
      
      const ctx = AppState.audioContext;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const overtones = [220, 330, 440, 554];
      const now = ctx.currentTime;

      overtones.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        const decay = 2.8 + idx * 0.4;
        const volume = 0.2 / (idx + 1);

        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + decay);

        // Очистка аудио-узлов из памяти браузера
        osc.onended = () => {
          osc.disconnect();
          gain.disconnect();
        };
      });
    } catch (e) {
      console.warn('[Web Audio] Ошибка синтезатора Колокола:', e);
    }
  },
  initAmbientParticles() {
    if (document.getElementById('ambientSparksCanvas')) return;

    const canvas = document.createElement('canvas');
    canvas.id = 'ambientSparksCanvas';
    canvas.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:0; opacity:0.32;';
    document.body.prepend(canvas);

    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }, { passive: true });

    const particles = Array.from({ length: 26 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 1,
      speedY: Math.random() * 0.4 + 0.15,
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
  },

  escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, tag => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag]));
  },

  parseMarkdown(md) {
    if (!md) return '';
    
    const inline = text => text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>');
    
    const lines = md.trim().split(/\r?\n/);
    const blocks = [];
    let paragraph = [];
    let list = [];

    const flushParagraph = () => {
      if (paragraph.length) {
        blocks.push(`<p class="md-paragraph">${inline(paragraph.join(' ').trim())}</p>`);
        paragraph = [];
      }
    };
    
    const flushList = () => {
      if (list.length) {
        blocks.push(`<ul class="md-list">${list.map(item => `<li>${inline(item)}</li>`).join('')}</ul>`);
        list = [];
      }
    };

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) {
        flushParagraph();
        flushList();
      } else if (/^###\s/.test(trimmed)) {
        flushParagraph(); flushList();
        blocks.push(`<h4 class="md-h4">${inline(trimmed.slice(4))}</h4>`);
      } else if (/^##\s/.test(trimmed)) {
        flushParagraph(); flushList();
        blocks.push(`<h3 class="md-h3">${inline(trimmed.slice(3))}</h3>`);
      } else if (/^#\s/.test(trimmed)) {
        flushParagraph(); flushList();
        blocks.push(`<h2 class="md-h2">${inline(trimmed.slice(2))}</h2>`);
      } else if (/^>\s?/.test(trimmed)) {
        flushParagraph(); flushList();
        blocks.push(`<blockquote class="md-blockquote">${inline(trimmed.replace(/^>\s?/, ''))}</blockquote>`);
      } else if (/^---+$/.test(trimmed)) {
        flushParagraph(); flushList();
        blocks.push('<hr class="md-hr">');
      } else if (/^[-*]\s+/.test(trimmed)) {
        flushParagraph();
        list.push(trimmed.replace(/^[-*]\s+/, ''));
      } else {
        flushList();
        paragraph.push(trimmed);
      }
    });

    flushParagraph();
    flushList();
    return blocks.join('');
  }
};

window.AppState = AppState;
window.App = App;