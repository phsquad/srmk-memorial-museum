/**
 * ============================================================================
 * ВИРТУАЛЬНЫЙ МУЗЕЙ ГБПОУ СРМК: «БЫТЬ ВОИНОМ — ЖИТЬ ВЕЧНО»
 * Главный логический контроллер веб-приложения (js/app.js v5.0 Master)
 * 
 * Разработчики: Андреев А. И., науч. рук. Генте А. В., Бледных Е. В.
 * ============================================================================
 */

'use strict';

// 1. Глобальное реактивное состояние музея
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
  mapLines: [],
  candles: JSON.parse(localStorage.getItem('srmk_museum_candles') || '{}'),
  audioContext: null
};

// Запасной векторный силуэт по умолчанию
const DEFAULT_FALLBACK_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='500' viewBox='0 0 400 500'%3E%3Crect width='400' height='500' fill='%23141820'/%3E%3Cpath d='M200 190c33.1 0 60-26.9 60-60s-26.9-60-60-60-60 26.9-60 60 26.9 60 60 60zm0 30c-48 0-108 24-108 72v48h216v-48c0-48-60-72-108-72z' fill='%239e1b20' opacity='0.4'/%3E%3Cpolygon points='200,380 205,395 220,395 208,405 212,420 200,410 188,420 192,405 180,395 195,395' fill='%23d4af37'/%3E%3Ctext x='50%25' y='92%25' dominant-baseline='middle' text-anchor='middle' fill='%239aa2b1' font-family='sans-serif' font-size='13'%3EГБПОУ СРМК • НАВЕЧНО В ПАМЯТИ%3C/text%3E%3C/svg%3E";

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

const App = {
  /**
   * Точка входа в приложение
   */
  init() {
    this.cacheDOM();
    this.bindEvents();
    this.initAmbientParticles();
    this.renderMemorialPlaques();
    this.renderSpecialtyFilters();
    this.renderCardsGrid();
    this.initInteractiveMap();
    this.updateCandlesStats();
    this.checkDeepLink();
    console.log(`[Музей СРМК] Архитектурное ядро запущено. В реестре: ${heroesDatabase.length} героев.`);
  },

  /**
   * Кеширование элементов DOM
   */
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

      // Модальные окна
      heroModal: document.getElementById('heroModal'),
      modalOverlay: document.getElementById('modalOverlay'),
      modalCloseBtn: document.getElementById('modalCloseBtn'),
      modalBody: document.getElementById('modalHeroContent'),
      passportModal: document.getElementById('passportModal'),

      // Аудиоплеер
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
   * Привязка глобальных слушателей событий
   */
  bindEvents() {
    // Живой поиск с задержкой (Debounce)
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

    // Модальное окно досье
    if (this.dom.modalCloseBtn) this.dom.modalCloseBtn.addEventListener('click', () => this.closeModal());
    if (this.dom.modalOverlay) this.dom.modalOverlay.addEventListener('click', () => this.closeModal());

    // Клавиатурная навигация и горячие клавиши
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

    // Аудиоплеер
    this.initAudioPlayerEvents();

    // Кнопка вводной экскурсии
    if (this.dom.btnGeneralTour) {
      this.dom.btnGeneralTour.addEventListener('click', () => {
        this.playAudio('assets/audio/guides/general-tour.mp3', 'Вводная экскурсия музея СРМК', 'Обзор мемориальной экспозиции');
      });
    }

    // Слушатель изменения хэша для дип-линкинга
    window.addEventListener('hashchange', () => this.checkDeepLink());
  },

  /* ==========================================================================
     1. СИНТЕЗАТОР ЗВУКОВЫХ ЭФФЕКТОВ (WEB AUDIO API)
     ========================================================================== */
  playChimeSound(freq = 520, duration = 0.35) {
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
      osc.frequency.exponentialRampToValueAtTime(freq * 1.4, ctx.currentTime + duration);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  },

  /* ==========================================================================
     2. ИНТЕРАКТИВНЫЙ МЕМОРИАЛ «ЗВЕЗДА ПАМЯТИ» (ЗАЛ I)
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

      const hasCandle = AppState.candles[hero.id] ? '🕯️ ' : '';
      item.innerHTML = `
        <span class="plaque-hero-name">${hasCandle}${hero.name}</span>
        <span class="plaque-arrow">➔</span>
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
        this.dom.leftPlaque.appendChild(item);
      } else if (hero.plaque === 'right') {
        this.dom.rightPlaque.appendChild(item);
      }
    });
  },

  /* ==========================================================================
     3. ФИЛЬТРАЦИЯ ПО СПЕЦИАЛЬНОСТЯМ КОЛЛЕДЖА
     ========================================================================== */
  renderSpecialtyFilters() {
    if (!this.dom.specialtyContainer) return;

    const specialties = [
      { id: 'all', label: 'Все направления' },
      { id: 'fire', label: '🚒 МЧС и спасатели' },
      { id: 'weld', label: '⚡ Сварочное дело' },
      { id: 'electro', label: '💡 Электротехника' },
      { id: 'auto', label: '🚗 Автотранспорт' },
      { id: 'it', label: '💻 IT и сети' },
      { id: 'mech', label: '⚙️ Машиностроение' }
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
        this.playChimeSound(600, 0.15);
        this.renderCardsGrid();
      });
    });
  },

  /* ==========================================================================
     4. СЕТКА КАРТОЧЕК ВЫПУСКНИКОВ (ЗАЛ II)
     ========================================================================== */
  renderCardsGrid() {
    if (!this.dom.cardsContainer) return;
    this.dom.cardsContainer.innerHTML = '';

    const filtered = heroesDatabase.filter(hero => {
      // Поисковая фильтрация
      let matchesSearch = true;
      if (AppState.searchQuery) {
        const q = AppState.searchQuery;
        matchesSearch = hero.name.toLowerCase().includes(q) ||
          (hero.education?.specialty && hero.education.specialty.toLowerCase().includes(q)) ||
          (hero.deed && hero.deed.toLowerCase().includes(q)) ||
          (hero.military?.unit && hero.military.unit.toLowerCase().includes(q)) ||
          (hero.awards && hero.awards.some(a => a.toLowerCase().includes(q)));
      }

      // Фильтрация по специальности
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
        <div class="empty-search-alert" style="grid-column: 1/-1; text-align:center; padding: 50px; color: var(--text-muted);">
          <p style="font-size: 1.3rem; margin-bottom: 8px;">Записи не найдены</p>
          <small>Попробуйте сбросить поисковый запрос или выбрать другую категорию</small>
        </div>
      `;
      return;
    }

    filtered.forEach(hero => {
      const photoSrc = (typeof ArchiveService !== 'undefined')
        ? (hero.media?.photo || ArchiveService.generateFallbackAvatar(hero))
        : (hero.media?.photo || DEFAULT_FALLBACK_AVATAR);

      const yearsText = hero.dates?.years || `${hero.dates?.birth || ''} — ${hero.dates?.death || ''}`;
      const specialtyText = hero.education?.specialty || "Выпускник колледжа";
      const candleCount = AppState.candles[hero.id] || 0;

      const card = document.createElement('article');
      card.className = 'hero-card';
      card.innerHTML = `
        <div class="hero-card-img-wrap">
          <img src="${photoSrc}" alt="${hero.name}" class="hero-card-img" loading="lazy">
          <span class="hero-card-badge">СВО</span>
          ${candleCount > 0 ? `<span class="hero-candle-badge" title="Зажжено свечей памяти">🕯️ ${candleCount}</span>` : ''}
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

      // Прикрепление каскадного обработчика изображений
      const imgEl = card.querySelector('.hero-card-img');
      if (typeof ArchiveService !== 'undefined') {
        ArchiveService.attachSmartImageFallback(imgEl, hero);
      }

      this.dom.cardsContainer.appendChild(card);
    });
  },

  /* ==========================================================================
     5. МОДАЛЬНОЕ ОКНО ДОСЬЕ ГЕРОЯ С ИНТЕГРАЦИЯМИ
     ========================================================================== */
  openModal(id) {
    const hero = heroesDatabase.find(h => h.id === id);
    if (!hero) return;

    AppState.currentHeroId = id;
    window.location.hash = `hero-${id}`;

    const currentIndex = heroesDatabase.findIndex(h => h.id === id);
    const prevHero = heroesDatabase[currentIndex - 1] || heroesDatabase[heroesDatabase.length - 1];
    const nextHero = heroesDatabase[currentIndex + 1] || heroesDatabase[0];

    const photoSrc = (typeof ArchiveService !== 'undefined')
      ? (hero.media?.photo || ArchiveService.generateFallbackAvatar(hero))
      : (hero.media?.photo || DEFAULT_FALLBACK_AVATAR);

    const audioSrc = hero.media?.audioGuide || "";
    const yearsText = hero.dates?.years || `${hero.dates?.birth || ''} — ${hero.dates?.death || ''}`;
    const specialtyText = hero.education?.specialty || "Выпускник СРМК";
    const rankText = hero.military ? `${hero.military.rank || ''} ${hero.military.unit ? `• ${hero.military.unit}` : ''}` : "Воин ВС РФ";
    const deedText = hero.deed || "Сведения о боевом пути и подвиге уточняются в архивах колледжа.";
    const awardsArray = hero.awards || [];
    const documentsArray = hero.media?.documents || [];
    const candleCount = AppState.candles[hero.id] || 0;

    // Генерация открытых ссылок на госреестры через sources.js
    const sources = (typeof ArchiveService !== 'undefined')
      ? ArchiveService.getHeroSources(hero)
      : [];

    // Генерация QR-кода для школьной парты
    const qrTargetUrl = `${window.location.origin}${window.location.pathname}#hero-${hero.id}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(qrTargetUrl)}`;

    // Генерация визуальных бейджей наград
    const awardsHTML = awardsArray.map(awardTitle => {
      if (typeof ArchiveService !== 'undefined') {
        const visual = ArchiveService.getAwardVisual(awardTitle);
        return `
          <div class="award-tag" title="${visual.criteria || ''}">
            ${visual.badge ? `<img src="${visual.badge}" alt="Знак" style="width:18px; height:18px; object-fit:contain; vertical-align:middle; margin-right:4px;">` : '🎖️'}
            <span>${visual.name}</span>
          </div>
        `;
      }
      return `<span class="award-tag">🎖️ ${awardTitle}</span>`;
    }).join('');

    this.dom.modalBody.innerHTML = `
      <div class="dossier-nav-bar">
        <button class="dossier-nav-btn" onclick="App.openModal('${prevHero.id}')" title="${prevHero.name}" type="button">❮ Предыдущий</button>
        <span class="dossier-nav-counter">${currentIndex + 1} из ${heroesDatabase.length}</span>
        <button class="dossier-nav-btn" onclick="App.openModal('${nextHero.id}')" title="${nextHero.name}" type="button">Следующий ❯</button>
      </div>

      <div class="dossier-layout">
        <div class="dossier-sidebar">
          <div class="dossier-img-frame">
            <img src="${photoSrc}" alt="${hero.name}" class="dossier-img" id="modalDossierImg">
          </div>

          <button class="dossier-candle-btn ${candleCount > 0 ? 'active' : ''}" onclick="App.lightCandle('${hero.id}')" type="button">
            🕯️ Зажечь Свечу Памяти (<span id="candleCountDisplay">${candleCount}</span>)
          </button>

          ${audioSrc ? `
            <button class="dossier-btn-audio" onclick="App.playAudio('${audioSrc}', '${hero.name.replace(/'/g, "\\'")}', 'Аудиогид памяти')" type="button">
              <span>🎧</span> Слушать аудиогид
            </button>
          ` : `
            <button class="dossier-btn-audio disabled" disabled type="button">
              <span>🎧</span> Аудиозапись готовится
            </button>
          `}

          <!-- Кнопка генератора постеров для соцсетей -->
          <button class="dossier-action-btn" onclick="if(typeof TechModules !== 'undefined') TechModules.generateSocialPoster('${hero.id}')" type="button" title="Создать постер 1080x1080">
            <span>🖼️</span> Скачать постер для соцсетей
          </button>

          <button class="dossier-action-btn" onclick="App.printHeroDossier()" type="button">
            <span>🖨️</span> Распечатать для Урока Мужества
          </button>

          <!-- Локальный загрузчик фото из семейного архива -->
          <label class="dossier-action-btn" style="text-align:center; display:block; cursor:pointer;">
            <span>📷</span> Прикрепить фото из архива
            <input type="file" accept="image/*" style="display:none;" onchange="if(typeof ArchiveService !== 'undefined') ArchiveService.uploadFamilyPhoto('${hero.id}', this, () => App.openModal('${hero.id}'))">
          </label>

          <div class="dossier-qr-box">
            <img src="${qrUrl}" alt="QR код парты героя" class="dossier-qr-img">
            <span class="dossier-qr-label">QR-код для «Парты Героя»</span>
          </div>
        </div>

        <div class="dossier-main">
          <h2 class="dossier-name" id="modalHeroTitle">${hero.name}</h2>
          
          <div class="dossier-meta-grid">
            <div><span class="meta-label">Годы жизни:</span> <strong>${yearsText}</strong></div>
            <div><span class="meta-label">Специальность в СРМК:</span> <strong>${specialtyText}</strong></div>
            <div><span class="meta-label">Воинское звание и часть:</span> <strong>${rankText}</strong></div>
            ${hero.education?.honors ? `<div><span class="meta-label">Диплом и квалификация:</span> <strong>${hero.education.honors}</strong></div>` : ''}
            ${hero.dates?.birth ? `<div><span class="meta-label">Дата рождения:</span> <strong>${hero.dates.birth}</strong></div>` : ''}
          </div>

          <h4 class="dossier-block-title">Государственные и боевые награды:</h4>
          <div class="dossier-awards-list">
            ${awardsHTML || '<span class="award-tag">Награды уточняются</span>'}
          </div>

          <h4 class="dossier-block-title">Хроника подвига и боевой путь:</h4>
          <p class="dossier-deed-text">${deedText}</p>

          ${hero.quote ? `
            <blockquote class="dossier-quote">
              «${hero.quote}»
            </blockquote>
          ` : ''}

          ${documentsArray.length > 0 ? `
            <h4 class="dossier-block-title">Оцифрованные архивные свидетельства:</h4>
            <ul class="dossier-docs-list">
              ${documentsArray.map(doc => `<li>📂 ${doc}</li>`).join('')}
            </ul>
          ` : ''}

          <!-- Блок верификации по открытым реестрам -->
          <h4 class="dossier-block-title">Верификация в официальных источниках:</h4>
          <div class="dossier-sources-grid">
            ${sources.map(s => `
              <a href="${s.url}" target="_blank" rel="noopener noreferrer" class="source-link-card">
                <span class="source-badge" style="font-size:0.7rem; color:var(--gold-accent);">${s.badge}</span>
                <strong>${s.title}</strong>
                <small>${s.desc}</small>
              </a>
            `).join('')}
          </div>

          ${hero.memorialStatus ? `
            <div class="dossier-memorial-box">
              <strong>Мемориальный статус в колледже:</strong> ${hero.memorialStatus}
            </div>
          ` : ''}
        </div>
      </div>
    `;

    // Прикрепляем автообработку картинки
    const modalImg = document.getElementById('modalDossierImg');
    if (modalImg && typeof ArchiveService !== 'undefined') {
      ArchiveService.attachSmartImageFallback(modalImg, hero);
    }

    this.dom.heroModal.classList.add('active');
    this.dom.heroModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Фокус на карте при открытии
    if (hero.mapCoords && AppState.mapInstance) {
      AppState.mapInstance.flyTo([hero.mapCoords.lat, hero.mapCoords.lng], 8, { duration: 1.2 });
    }
  },

  /**
   * Зажжение виртуальной свечи памяти
   */
  lightCandle(heroId) {
    AppState.candles[heroId] = (AppState.candles[heroId] || 0) + 1;
    localStorage.setItem('srmk_museum_candles', JSON.stringify(AppState.candles));
    
    this.playChimeSound(880, 0.35);

    const countDisplay = document.getElementById('candleCountDisplay');
    if (countDisplay) countDisplay.textContent = AppState.candles[heroId];
    
    this.updateCandlesStats();
    this.renderCardsGrid();
    this.renderMemorialPlaques();
  },

  updateCandlesStats() {
    const total = Object.values(AppState.candles).reduce((a, b) => a + b, 0);
    if (this.dom.totalCandlesDisplay) {
      this.dom.totalCandlesDisplay.textContent = total;
    }
    if (this.dom.statHeroCandles) {
      this.dom.statHeroCandles.textContent = total;
    }
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
      this.dom.heroModal.setAttribute('aria-hidden', 'true');
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
     6. РЕЖИМ «УРОК МУЖЕСТВА» (ПОЛНОЭКРАННОЕ СЛАЙД-ШОУ ДЛЯ ДОСОК)
     ========================================================================== */
  startPresentationMode() {
    if (AppState.isPresentationRunning) {
      this.stopPresentationMode();
      return;
    }

    AppState.isPresentationRunning = true;
    let index = 0;
    this.openModal(heroesDatabase[index].id);
    this.playChimeSound(550, 0.4);

    AppState.presentationTimer = setInterval(() => {
      index = (index + 1) % heroesDatabase.length;
      this.openModal(heroesDatabase[index].id);
    }, 12000);

    console.log("[Урок Мужества] Полноэкранный режим активирован (интервал: 12 сек).");
  },

  stopPresentationMode() {
    AppState.isPresentationRunning = false;
    clearInterval(AppState.presentationTimer);
    console.log("[Урок Мужества] Полноэкранный режим остановлен.");
  },

  /* ==========================================================================
     7. АУДИОПЛЕЕР С ПЕРЕМОТКОЙ И ИНДИКАТОРОМ
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

  playAudio(src, heroName, trackLabel = "Аудиогид") {
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
     8. ИНТЕРАКТИВНАЯ КАРТА LEAFLET: ВЕКТОРНЫЕ ТРЕКИ И ФОКУС
     ========================================================================== */
  initInteractiveMap() {
    const mapElement = document.getElementById('interactiveBattleMap');
    if (!mapElement || typeof L === 'undefined') return;

    // Инициализация карты с центром на Юге России
    AppState.mapInstance = L.map('interactiveBattleMap', {
      scrollWheelZoom: false
    }).setView([47.2, 38.5], 6);

    // Подключение темных тайлов CARTO Dark Matter
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 18
    }).addTo(AppState.mapInstance);

    // 1. Исходный пункт: ГБПОУ СРМК (Ставрополь)
    const srmkCoords = MUSEUM_CONFIG.coords;
    const srmkIcon = L.divIcon({
      className: 'srmk-map-pin',
      html: `<div style="background:#d4af37; color:#000; font-weight:900; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid #fff; box-shadow:0 0 16px #d4af37; font-size:11px;">СРМК</div>`,
      iconSize: [28, 28]
    });

    L.marker(srmkCoords, { icon: srmkIcon }).addTo(AppState.mapInstance)
      .bindPopup(`
        <div style="font-family:sans-serif; padding:4px;">
          <strong style="color:#9e1b20; font-size:14px;">ГБПОУ СРМК</strong><br>
          <small>г. Ставрополь, пр. Юности, 3</small><br>
          <span style="font-size:12px; color:#555;">Альма-матер всех 20 героев</span>
        </div>
      `);

    // 2. Расстановка меток героев и пунктирных линий трека
    const markers = MuseumAPI.getMapMarkers();
    markers.forEach(m => {
      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `<div style="background-color: ${m.badgeColor}; width:16px; height:16px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 12px ${m.badgeColor};"></div>`,
        iconSize: [16, 16]
      });

      const leafletMarker = L.marker(m.coords, { icon: customIcon }).addTo(AppState.mapInstance);
      leafletMarker.bindPopup(`
        <div style="color:#111; font-family:sans-serif; padding:4px;">
          <strong style="color:#9e1b20; font-size:14px;">${m.name}</strong><br>
          <small>${m.rank}</small><br>
          <span>📍 ${m.location}</span><br>
          <button onclick="App.openModal('${m.id}')" style="margin-top:8px; background:#9e1b20; color:#fff; border:none; padding:5px 8px; border-radius:4px; cursor:pointer; font-size:12px; width:100%;">
            Открыть архивное досье
          </button>
        </div>
      `);
      AppState.mapMarkers[m.id] = leafletMarker;

      // Отрисовка луча подвига от СРМК к точке боевых действий
      const line = L.polyline([srmkCoords, m.coords], {
        color: '#d4af37',
        weight: 1.5,
        opacity: 0.35,
        dashArray: '4, 8'
      }).addTo(AppState.mapInstance);
      AppState.mapLines.push(line);
    });

    // 3. Обработчик фильтров театров военных действий (ТВД)
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

        if (theatre === 'dnieper') App.focusMap([46.6, 32.7], 8);
        if (theatre === 'zaporozhye') App.focusMap([47.45, 35.8], 8);
        if (theatre === 'donbass') App.focusMap([48.1, 37.7], 8);
        if (theatre === 'kursk') App.focusMap([51.3, 35.2], 9);
        if (theatre === 'all') App.focusMap([47.5, 36.5], 6);
      });
    });
  },

  focusMap(coords, zoom = 8) {
    if (AppState.mapInstance) {
      AppState.mapInstance.flyTo(coords, zoom, { duration: 1.5 });
      this.playChimeSound(500, 0.2);
    }
  },

  /* ==========================================================================
     9. ФОНОВЫЕ ИСКРЫ ПАМЯТИ (HTML5 CANVAS)
     ========================================================================== */
  initAmbientParticles() {
    const canvas = document.createElement('canvas');
    canvas.id = 'ambientSparksCanvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '0';
    canvas.style.opacity = '0.35';
    document.body.prepend(canvas);

    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const particles = Array.from({ length: 28 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 1,
      speedY: Math.random() * 0.5 + 0.2,
      speedX: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.6 + 0.2
    }));

    function animate() {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#d4af37';

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

// Экспорт объекта App в глобальную область видимости
window.App = App;