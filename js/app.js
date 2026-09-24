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

  // Интерактивный режим «Урок Мужества» (Автопилот-презентация)
  isPresentationRunning: false,
  presentationTimer: null,

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

    // Первичная отрисовка выставочных залов
    this.renderMemorialPlaques();
    this.renderSpecialtyFilters();
    this.renderCardsGrid();
    this.updateMemorialStats();

    // Привязка событий, жесткого роутинга и тач-жестов
    this.bindEvents();
    this.initTouchGestures();
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

    // Горячие клавиши (Esc, Стрелки навигации, P - печать, Пробел - диктор)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.dom.heroModal?.classList.contains('active')) this.closeModal();
      }
      if (this.dom.heroModal?.classList.contains('active')) {
        if (e.key === 'ArrowRight') this.navigateHero(1);
        if (e.key === 'ArrowLeft') this.navigateHero(-1);
        if (e.key === 'p' || e.key === 'P' || e.key === 'з' || e.key === 'З') this.printHeroDossier();
        if (e.key === ' ') {
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
    }
  },

  /* ==========================================================================
     ДЕЙСТВИЯ: СВЕЧИ И ЦВЕТЫ
     ========================================================================== */
  lightCandleSafe(heroId, event) {
    if (typeof TributeSecurity !== 'undefined') {
      TributeSecurity.verifyAndExecuteTribute('candle', heroId, event, (newCount) => {
        this.onTributeSuccess('candle', heroId, newCount);
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
      TributeSecurity.verifyAndExecuteTribute('flowers', heroId, event, (newCount) => {
        this.onTributeSuccess('flowers', heroId, newCount);
      });
    } else {
      if (typeof TechModules !== 'undefined') {
        TechModules.layCarnationFlower(event);
      }
    }
  },

  async onTributeSuccess(type, heroId, newCount) {
    if (type === 'candle') {
      AppState.candles[heroId] = newCount;
      localStorage.setItem('srmk_museum_candles_v3', JSON.stringify(AppState.candles));

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
     РЕЖИМ ПРЕЗЕНТАЦИИ «УРОК МУЖЕСТВА»
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