/**
 * ============================================================================
 * ДВИЖОК ИНТЕРАКТИВНОЙ ЧИТАЛКИ: js/reader.js (v15.0 Telegram Rich Edition)
 * Мемориально-образовательный комплекс ГБПОУ СРМК «Быть воином — жить вечно»
 * 
 * Включает:
 * 1. Флюидное масштабирование (DPI / Viewport scaling)
 * 2. Двойной режим: 3D Фолиант & Telegram-хроника (Rich Message Stream)
 * 3. Интерактивные спойлеры с мерцающей маской (Tap-to-Reveal)
 * 4. Разворачивающиеся цитаты (Expandable blockquotes)
 * 5. Моноширинные архивные штампы с копированием в 1 клик
 * 6. Голосовой плеер аудиогида с визуализацией волны (Waveform) и скоростями 1x/1.5x/2x
 * 7. Живые реакции эмодзи (Telegram Reaction Burst) с сохранением
 * 8. Модальное окно просмотра фотографий с зумом (Photo Lightbox)
 * 9. Контекстная плавающая панель выделения текста (Copy / Quote / TTS)
 * 10. Полноэкранный режим и индикатор прогресса чтения
 * ============================================================================
 */

'use strict';

const ReaderEngine = {
  currentBook: null,
  currentSpreadIdx: 0,
  currentViewMode: 'folio', // 'folio' | 'telegram'
  fontScales: [0.85, 1.0, 1.15, 1.3],
  fontScaleLabels: ['85%', '100%', '115%', '130%'],
  fontScaleIdx: 1,
  audioSpeedIdx: 0,
  audioSpeeds: [1.0, 1.5, 2.0],
  audioContext: null,
  audioEl: null,
  isPlayingAudio: false,
  reactionsData: {},
  selectedText: '',
  waveformBarsCount: 28,

  init() {
    this.audioEl = document.getElementById('readerAudioElement');
    this.loadPreferences();
    this.updateFilterButtonsMeta();
    this.renderShelf();
    this.bindEvents();
    this.setupAudioListeners();
    this.setupSelectionListener();

    // Проверка хэша URL для прямого перехода к тому
    let linkedHero = window.location.hash.replace('#', '');
    if (linkedHero === 'prologue-master-cover') {
      linkedHero = 'prologue-memorial-opening';
    }
    if (linkedHero) {
      this.openBook(linkedHero, false);
    }
    console.log("[ReaderEngine v15.0 Telegram Rich Edition] Модуль активирован.");
  },

  /**
   * Загрузка сохраненных настроек пользователя (LocalStorage)
   */
  loadPreferences() {
    try {
      const savedMode = localStorage.getItem('srmk_reader_mode');
      if (savedMode === 'telegram' || savedMode === 'folio') {
        this.currentViewMode = savedMode;
      }
      const savedScale = localStorage.getItem('srmk_reader_scale_idx');
      if (savedScale !== null && !isNaN(parseInt(savedScale, 10))) {
        this.fontScaleIdx = Math.max(0, Math.min(this.fontScales.length - 1, parseInt(savedScale, 10)));
      }
      this.applyFontScale();

      const savedReactions = localStorage.getItem('srmk_reader_reactions_v1');
      if (savedReactions) {
        this.reactionsData = JSON.parse(savedReactions);
      }
    } catch (e) {
      console.warn("Ошибка чтения настроек читалки:", e);
    }
  },

  /**
   * 1. Безопасное получение канонического архива (21 том)
   */
  getArchive() {
    if (typeof window.GRAND_MEMORY_BOOK_ARCHIVE !== 'undefined' && Array.isArray(window.GRAND_MEMORY_BOOK_ARCHIVE) && window.GRAND_MEMORY_BOOK_ARCHIVE.length > 0) {
      return window.GRAND_MEMORY_BOOK_ARCHIVE;
    }
    if (typeof MEMORY_BOOK_PROLOGUE !== 'undefined') {
      return [MEMORY_BOOK_PROLOGUE];
    }
    return [];
  },

  /**
   * 2. Обновление счетчиков в кнопках фильтрации
   */
  updateFilterButtonsMeta() {
    const list = this.getArchive();
    const leftCount = list.filter(b => b.plaque === 'left').length;
    const rightCount = list.filter(b => b.plaque === 'right').length;
    const totalCount = list.length;

    const allBtn = document.querySelector('.shelf-filter-btn[data-filter="all"]');
    const leftBtn = document.querySelector('.shelf-filter-btn[data-filter="left"]');
    const rightBtn = document.querySelector('.shelf-filter-btn[data-filter="right"]');

    if (allBtn) allBtn.textContent = `Все книги (${totalCount})`;
    if (leftBtn) leftBtn.textContent = `Левая плита (${leftCount})`;
    if (rightBtn) rightBtn.textContent = `Правая плита (${rightCount})`;
  },

  /**
   * 3. Процедурный синтезатор шелеста страниц (Web Audio API)
   */
  playPageTurnSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.audioContext) this.audioContext = new AudioCtx();
      if (this.audioContext.state === 'suspended') this.audioContext.resume();

      const ctx = this.audioContext;
      const bufferSize = ctx.sampleRate * 0.14;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(850, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.14);
      filter.Q.value = 3.2;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.09, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
    } catch (e) {
      // Игнорируем в тихом окружении
    }
  },

  /**
   * 4. Отрисовка интерактивной книжной полки (Флюидная сетка)
   */
  renderShelf() {
    const grid = document.getElementById('bookshelfGrid');
    if (!grid) return;

    const query = (document.getElementById('shelfSearchInput')?.value || '').toLowerCase().trim();
    const filterBtn = document.querySelector('.shelf-filter-btn.active');
    const filter = filterBtn ? filterBtn.dataset.filter : 'all';

    const list = this.getArchive();

    const filtered = list.filter(hero => {
      let matchFilter = true;
      if (filter === 'left') matchFilter = hero.plaque === 'left';
      if (filter === 'right') matchFilter = hero.plaque === 'right';

      let matchSearch = true;
      if (query) {
        matchSearch = (hero.name && hero.name.toLowerCase().includes(query)) ||
          (hero.specialty && hero.specialty.toLowerCase().includes(query)) ||
          (hero.military && hero.military.toLowerCase().includes(query));
      }
      return matchFilter && matchSearch;
    });

    grid.innerHTML = filtered.map((hero, idx) => {
      const volNum = hero.volNum || `Том ${idx + 1}`;
      const photoSrc = hero.photo || hero.media?.photo || 'assets/images/cover-master.jpg';
      const specText = hero.specialty || hero.education?.specialty || 'Выпускник колледжа';
      const isMaster = hero.plaque === 'general';

      return `
        <article class="book-spine-card ${isMaster ? 'master-tome' : ''}" tabindex="0" role="button" aria-label="Открыть фолиант: ${this.escapeHtml(hero.name)}" 
                 onclick="ReaderEngine.openBook('${hero.id}')" 
                 onkeydown="if(event.key === 'Enter' || event.key === ' ') { event.preventDefault(); ReaderEngine.openBook('${hero.id}'); }">
          <div class="book-spine-vol">${volNum} • ${hero.plaque === 'left' ? 'Левая плита' : (hero.plaque === 'right' ? 'Правая плита' : 'ГБПОУ СРМК')}</div>
          <div class="book-spine-portrait">
            <img src="${photoSrc}" alt="${this.escapeHtml(hero.name)}" onerror="this.src='assets/images/cover-master.jpg'">
          </div>
          <h4 class="book-spine-title">${this.escapeHtml(hero.name)}</h4>
          <p class="book-spine-spec">${this.escapeHtml(specText)}</p>
          <button class="book-spine-btn" type="button">Раскрыть том</button>
        </article>
      `;
    }).join('');
  },

  /**
   * 5. Открытие фолианта героя
   */
  openBook(heroId, updateHash = true) {
    const archive = this.getArchive();
    let book = archive.find(b => b.id === heroId);

    if (window.AchievementsEngine) {
      window.AchievementsEngine.trackReaderOpened();
    }

    if (!book && heroId === 'prologue-master-cover') {
      book = archive.find(b => b.id === 'prologue-memorial-opening');
    }

    if (!book && typeof heroesDatabase !== 'undefined') {
      const h = heroesDatabase.find(x => x.id === heroId);
      if (h) {
        const photo = h.media?.photo || 'assets/images/cover-master.jpg';
        book = {
          id: h.id,
          volNum: "Том Летописи",
          chapterNum: "Глава памяти",
          name: h.name,
          years: h.dates?.years || `${h.dates?.birth || ''} — ${h.dates?.death || ''}`,
          specialty: h.education?.specialty || "Выпускник СРМК",
          photo: photo,
          audioFile: h.media?.audioGuide || `assets/audio/guides/${h.id}.mp3`,
          shortSnippet: h.quote || h.deed || "Служение Отечеству и верность воинскому долгу.",
          pages: [
            {
              spreadNum: "Разворот I (Стр. 1–2)",
              chapterTitle: "Хроника ратного подвига",
              leftHtml: `
                <div class="page-header-meta"><span>ГБПОУ СРМК</span><span>АРХИВНЫЙ МЕДАЛЬОН</span></div>
                <div class="page-visual-frame"><img src="${photo}" alt="${this.escapeHtml(h.name)}" onerror="this.src='assets/images/cover-master.jpg'"></div>
                <div class="page-quote-box">«${this.escapeHtml(h.quote || 'Верность воинскому долгу и памяти студенческого братства.')}»</div>
                <div class="page-number-footer">Стр. 1</div>
              `,
              rightHtml: `
                <div class="page-header-meta"><span>АРХИВ КНИГИ ПАМЯТИ</span><span>ГЛАВА I</span></div>
                <h3 class="page-chapter-title">Хроника подвига</h3>
                <div class="page-story-text">
                  <span class="drop-cap">${h.name[0]}</span>${this.escapeHtml(h.deed || 'Сведения о боевом пути и ратном подвиге героя-выпускника верифицированы архивами колледжа.')}
                </div>
                <div class="page-number-footer">Стр. 2</div>
              `
            }
          ]
        };
      }
    }

    if (!book) return;

    this.currentBook = book;
    this.currentSpreadIdx = 0;

    // Метаданные шапки читалки
    document.getElementById('readerVolBadge').textContent = book.volNum || "Том Летописи";
    document.getElementById('readerHeroTitle').textContent = book.name;

    // Наполнение закрепленного свидетельства (Telegram Pinned Message)
    const pinnedBanner = document.getElementById('readerPinnedBanner');
    const pinnedContent = document.getElementById('pinnedBannerContent');
    if (pinnedBanner && pinnedContent) {
      pinnedContent.textContent = book.shortSnippet || book.pages?.[0]?.chapterTitle || `Летопись ратного подвига: ${book.name}`;
      pinnedBanner.style.display = 'block';
    }

    // Переключение экранов
    document.getElementById('shelfView').style.display = 'none';
    document.getElementById('bookReaderView').style.display = 'flex';
    document.getElementById('btnReturnToShelf').style.display = 'inline-block';
    document.body.classList.add('reader-is-open');

    if (updateHash) {
      history.replaceState(null, '', `#${book.id}`);
    }

    this.applyViewModeUI();

    if (this.currentViewMode === 'telegram') {
      this.renderTelegramFeed();
    } else {
      this.playPageTurnSound();
      this.renderSpread();
    }

    this.updateReadingProgress();
  },

  closeBook() {
    this.stopAudio();
    document.getElementById('bookReaderView').style.display = 'none';
    document.getElementById('shelfView').style.display = 'block';
    document.getElementById('btnReturnToShelf').style.display = 'none';
    document.body.classList.remove('reader-is-open');
    this.currentBook = null;
    
    if (window.location.hash) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  },

  /**
   * 6. Переключение режимов: 3D Фолиант vs Telegram Хроника
   */
  setViewMode(mode) {
    if (mode !== 'folio' && mode !== 'telegram') return;
    this.currentViewMode = mode;
    try {
      localStorage.setItem('srmk_reader_mode', mode);
    } catch (e) {}

    this.applyViewModeUI();

    if (mode === 'telegram') {
      this.renderTelegramFeed();
    } else {
      this.playPageTurnSound();
      this.renderSpread();
    }
    this.updateReadingProgress();
  },

  applyViewModeUI() {
    const isTg = this.currentViewMode === 'telegram';
    const folioEl = document.getElementById('folioBookElement');
    const feedEl = document.getElementById('telegramFeedElement');
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    const dotsTrack = document.getElementById('pageDotsTrack');
    const paginationDisplay = document.getElementById('paginationDisplay');

    document.getElementById('btnModeFolio')?.classList.toggle('active', !isTg);
    document.getElementById('btnModeTelegram')?.classList.toggle('active', isTg);

    if (folioEl) folioEl.style.display = isTg ? 'none' : 'grid';
    if (feedEl) feedEl.style.display = isTg ? 'flex' : 'none';

    if (prevBtn) prevBtn.style.display = isTg ? 'none' : '';
    if (nextBtn) nextBtn.style.display = isTg ? 'none' : '';
    if (dotsTrack) dotsTrack.style.display = isTg ? 'none' : 'flex';

    if (isTg && paginationDisplay) {
      paginationDisplay.textContent = 'Хроника Telegram · Сводная лента сообщений';
    }
  },

  /**
   * 7. Масштабирование шрифта (Scale A- / 100% / A+)
   */
  changeFontScale(delta) {
    const newIdx = this.fontScaleIdx + delta;
    if (newIdx >= 0 && newIdx < this.fontScales.length) {
      this.fontScaleIdx = newIdx;
      this.applyFontScale();
      try {
        localStorage.setItem('srmk_reader_scale_idx', String(newIdx));
      } catch (e) {}
    }
  },

  applyFontScale() {
    const scale = this.fontScales[this.fontScaleIdx];
    const label = this.fontScaleLabels[this.fontScaleIdx];
    document.documentElement.style.setProperty('--reader-zoom', scale);
    const indicator = document.getElementById('scaleIndicator');
    if (indicator) indicator.textContent = label;
  },

  /**
   * 8. Индикатор прогресса чтения
   */
  updateReadingProgress() {
    const fill = document.getElementById('readerProgressFill');
    if (!fill || !this.currentBook) return;

    if (this.currentViewMode === 'telegram') {
      const feed = document.getElementById('telegramFeedElement');
      if (feed && feed.scrollHeight > feed.clientHeight) {
        const pct = Math.min(100, Math.max(10, Math.round((feed.scrollTop / (feed.scrollHeight - feed.clientHeight)) * 100)));
        fill.style.width = `${pct}%`;
      } else {
        fill.style.width = '100%';
      }
    } else {
      const total = this.currentBook.pages?.length || 1;
      const current = this.currentSpreadIdx + 1;
      const pct = Math.round((current / total) * 100);
      fill.style.width = `${pct}%`;
    }
  },

  scrollToPinned() {
    if (this.currentViewMode === 'telegram') {
      const firstCard = document.querySelector('.tg-message-card');
      if (firstCard) firstCard.scrollIntoView({ behavior: 'smooth' });
    } else {
      this.goToSpread(0);
      const quote = document.querySelector('.page-quote-box');
      if (quote) {
        quote.style.transition = 'box-shadow 0.3s';
        quote.style.boxShadow = '0 0 16px rgba(197, 160, 89, 0.8)';
        setTimeout(() => quote.style.boxShadow = '', 1500);
      }
    }
  },

  /**
   * 9. Отрисовка 3D Фолианта с интеграцией Rich-составляющих
   */
  renderSpread() {
    if (!this.currentBook || !this.currentBook.pages) return;

    const spread = this.currentBook.pages[this.currentSpreadIdx] || this.currentBook.pages[0];
    const leftEl = document.getElementById('pageLeftContent');
    const rightEl = document.getElementById('pageRightContent');

    if (leftEl) {
      leftEl.innerHTML = this.enrichFolioHtml(spread.leftHtml, 'left');
    }
    if (rightEl) {
      rightEl.innerHTML = this.enrichFolioHtml(spread.rightHtml, 'right');
    }

    leftEl?.scrollTo({ top: 0, behavior: 'instant' });
    rightEl?.scrollTo({ top: 0, behavior: 'instant' });
    document.getElementById('folioBookElement')?.scrollTo({ top: 0, behavior: 'instant' });

    const total = this.currentBook.pages.length;
    const paginationEl = document.getElementById('paginationDisplay');
    if (paginationEl) {
      paginationEl.textContent = `${spread.spreadNum || `Разворот ${this.currentSpreadIdx + 1}`} из ${total}`;
    }

    const dotsTrack = document.getElementById('pageDotsTrack');
    if (dotsTrack) {
      dotsTrack.innerHTML = this.currentBook.pages.map((_, i) =>
        `<button class="page-dot ${i === this.currentSpreadIdx ? 'active' : ''}" 
                 aria-label="Открыть ${i + 1}-й разворот" 
                 aria-pressed="${i === this.currentSpreadIdx}" 
                 onclick="ReaderEngine.goToSpread(${i})" type="button"></button>`
      ).join('');
    }

    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    if (prevBtn) prevBtn.style.visibility = this.currentSpreadIdx > 0 ? 'visible' : 'hidden';
    if (nextBtn) nextBtn.style.visibility = this.currentSpreadIdx < total - 1 ? 'visible' : 'hidden';

    this.updateReadingProgress();
  },

  /**
   * Обогащение классических страниц элементами Telegram Rich formatting
   */
  enrichFolioHtml(rawHtml, side) {
    if (!rawHtml) return '';
    let enriched = rawHtml;

    // Обертка кликабельных фото для зума
    enriched = enriched.replace(
      /<div class="page-visual-frame"><img src="([^"]+)" alt="([^"]+)"([^>]*)><\/div>/g,
      `<div class="page-visual-frame" role="button" tabindex="0" title="Нажмите для увеличения фотографии" onclick="ReaderEngine.openLightbox('$1', '$2')">
         <img src="$1" alt="$2"$3>
       </div>`
    );

    // Добавление интерактивных реакций на правой странице
    if (side === 'right' && !enriched.includes('tg-reactions-row')) {
      const reactionsHtml = this.generateReactionsHtml(this.currentBook.id);
      enriched = enriched.replace('<div class="page-number-footer">', `${reactionsHtml}<div class="page-number-footer">`);
    }

    return enriched;
  },

  /**
   * 10. Отрисовка Telegram-хроники (Stream of Telegram Rich Messages)
   */
  renderTelegramFeed() {
    const feed = document.getElementById('telegramFeedElement');
    if (!feed || !this.currentBook) return;

    const b = this.currentBook;
    const photo = b.photo || 'assets/images/cover-master.jpg';
    const codeId = `СРМК-${(b.id || 'HERO').toUpperCase()}-2026`;

    let cardsHtml = '';

    // Заголовок Telegram-канала / Хроники
    const channelHeader = `
      <div class="tg-feed-hero-header">
        <div class="tg-channel-avatar">
          <img src="${photo}" alt="${this.escapeHtml(b.name)}" onerror="this.src='assets/images/cover-master.jpg'">
        </div>
        <div>
          <div class="tg-channel-title">${this.escapeHtml(b.name)}</div>
          <div class="tg-channel-meta">Архивная хроника • ${this.escapeHtml(b.volNum || 'Том памяти')} • ГБПОУ СРМК</div>
        </div>
      </div>
    `;

    // Карточка 1: Официальная депеша с аудиогидом (Waveform) и фото
    cardsHtml += `
      <article class="tg-message-card">
        <div class="tg-forward-banner">
          <span class="tg-forward-arrow">↩</span>
          <span>Переслано из: Архивно-мемориальный отдел ГБПОУ СРМК · Центральный архив МО РФ</span>
        </div>
        <div class="tg-photo-card" onclick="ReaderEngine.openLightbox('${photo}', '${this.escapeHtml(b.name)}')">
          <img src="${photo}" alt="${this.escapeHtml(b.name)}" onerror="this.src='assets/images/cover-master.jpg'">
          <span class="tg-photo-zoom-hint">🔍 Нажмите для зума</span>
        </div>

        <!-- Telegram Voice Note аудиогида -->
        <div class="tg-voice-note" id="tgVoiceNoteCard">
          <button class="tg-voice-play-btn" id="tgVoicePlayBtn" onclick="ReaderEngine.toggleHeroAudio()" type="button" aria-label="Воспроизвести аудиогид">
            ▶
          </button>
          <div class="tg-voice-body">
            <div class="tg-voice-label">
              <span>🎙 Голосовая сводка подвига</span>
              <span class="tg-voice-timer" id="tgVoiceTimerDisplay">00:00</span>
            </div>
            <div class="tg-waveform-track" id="tgWaveformTrack" onclick="ReaderEngine.seekAudioFromWaveform(event)">
              ${this.generateWaveformBarsHtml()}
            </div>
          </div>
          <div class="tg-voice-controls-right">
            <button class="tg-speed-toggle-btn" id="tgSpeedBtn" onclick="ReaderEngine.cycleAudioSpeed(this)" type="button" title="Скорость воспроизведения">1.0x</button>
          </div>
        </div>

        <p style="margin-top:10px; line-height:1.6;">
          <strong>Воинское звание и рубеж:</strong> ${this.escapeHtml(b.military || 'Воин ВС РФ')}.<br>
          <strong>Годы жизни:</strong> ${this.escapeHtml(b.years || 'Вечная слава')}.
        </p>

        <div class="tg-msg-footer">
          <span class="tg-msg-time">Архив № 1</span>
          <span class="tg-checks" title="Доставлено в вечность">✓✓</span>
        </div>
      </article>
    `;

    // Карточка 2: Специальность, Студенческие годы, Цитата и Реестровый штамп
    cardsHtml += `
      <article class="tg-message-card">
        <div class="tg-quote-block">
          <div class="tg-quote-header">
            <span>📜 Выписка из личного дела выпускника</span>
          </div>
          <div class="tg-quote-body" id="tgQuoteBody">
            «${this.escapeHtml(b.shortSnippet || b.pages?.[0]?.chapterTitle || 'Верность воинскому долгу и памяти студенческого братства.')}»
          </div>
        </div>

        <p style="margin-top:10px; line-height:1.6;">
          <strong>Специальность ФГОС СПО:</strong> ${this.escapeHtml(b.specialty || 'Выпускник колледжа')}.<br>
          <strong>Реестровый архивный номер:</strong>
          <span class="tg-mono-stamp">
            <code>${codeId}</code>
            <button class="tg-copy-btn" onclick="ReaderEngine.copyArchivalCode('${codeId}', this)" title="Скопировать номер" type="button">📋</button>
          </span>
        </p>

        <div class="tg-msg-footer">
          <span class="tg-msg-time">Архив № 2</span>
          <span class="tg-checks">✓✓</span>
        </div>
      </article>
    `;

    // Карточка 3: Поминутная хроника подвига со спойлерами (Tap to reveal)
    const deedText = b.deed || b.pages?.[1]?.chapterTitle || b.pages?.[0]?.chapterTitle || 'Сведения о боевом пути и ратном подвиге героя-выпускника верифицированы архивами колледжа.';
    cardsHtml += `
      <article class="tg-message-card">
        <div class="tg-forward-banner">
          <span class="tg-forward-arrow">⚔️</span>
          <span>Боевое донесение и обстоятельства подвига</span>
        </div>
        <h4 style="font-family:var(--font-serif); color:var(--accent-brass); margin-bottom:8px;">Хроника ратной доблести</h4>
        <p style="line-height:1.75;">
          ${this.escapeHtml(deedText)}
        </p>
        <p style="margin-top:12px; line-height:1.6; font-size:0.92rem;">
          🔍 <em>Тактические детали операции (нажмите, чтобы раскрыть архивный гриф):</em><br>
          <span class="tg-spoiler" onclick="ReaderEngine.toggleSpoiler(this)" role="button" tabindex="0" title="Нажмите для снятия грифа секретности">
            Участок рубежа: ${this.escapeHtml(b.location || 'Зона проведения СВО')}. Личный состав подразделения выполнил задачу без отступления.
          </span>
        </p>

        <div class="tg-msg-footer">
          <span class="tg-msg-time">Архив № 3</span>
          <span class="tg-checks">✓✓</span>
        </div>
      </article>
    `;

    // Карточка 4: Государственные награды и Живые Реакции (Reactions Row)
    const awardsText = Array.isArray(b.awards) ? b.awards.join(', ') : (b.awards || 'Орден Мужества посмертно');
    cardsHtml += `
      <article class="tg-message-card">
        <h4 style="font-family:var(--font-serif); color:#ef4444; margin-bottom:8px;">Навечно в строю</h4>
        <p style="line-height:1.6;">
          <strong>Государственные награды:</strong> ${this.escapeHtml(awardsText)}.<br>
          Имя героя высечено золотом на гранитном Мемориале Славы СРМК.
        </p>

        <!-- Живые реакции эмодзи -->
        ${this.generateReactionsHtml(b.id)}

        <div class="tg-msg-footer">
          <span class="tg-msg-time">Архив № 4</span>
          <span class="tg-checks">✓✓</span>
        </div>
      </article>
    `;

    feed.innerHTML = channelHeader + cardsHtml;
    feed.scrollTop = 0;

    // Обновление прогресса при скролле ленты
    feed.onscroll = () => this.updateReadingProgress();
  },

  /**
   * Генерация полосок волны (Waveform Bars)
   */
  generateWaveformBarsHtml() {
    let bars = '';
    const heights = [6, 12, 18, 10, 22, 14, 8, 24, 18, 12, 20, 16, 10, 22, 24, 18, 12, 14, 20, 10, 8, 16, 22, 14, 10, 16, 12, 6];
    for (let i = 0; i < heights.length; i++) {
      bars += `<div class="tg-wave-bar" id="waveBar_${i}" style="height:${heights[i]}px;"></div>`;
    }
    return bars;
  },

  /**
   * 11. Интерактивный спойлер: снятие/возврат маски
   */
  toggleSpoiler(el) {
    if (!el) return;
    el.classList.toggle('revealed');
    this.playPageTurnSound();
  },

  /**
   * 12. Копирование архивного номера в буфер обмена
   */
  copyArchivalCode(text, btnEl) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      if (btnEl) {
        btnEl.classList.add('copied');
        btnEl.textContent = '✓';
        setTimeout(() => {
          btnEl.classList.remove('copied');
          btnEl.textContent = '📋';
        }, 1800);
      }
      this.showToast(`Реестровый номер «${text}» скопирован в буфер!`);
    }).catch(() => {
      this.showToast(`Код: ${text}`);
    });
  },

  /**
   * 13. Живые эмодзи-реакции (Telegram Reactions Burst)
   */
  generateReactionsHtml(heroId) {
    const emojis = ['🕯️', '🎖️', '⭐️', '🕊️', '💔'];
    const heroReactions = this.reactionsData[heroId] || {};

    const chips = emojis.map((emoji, idx) => {
      const baseCount = 124 + (idx * 37) + (heroId.length * 9);
      const userAdded = heroReactions[emoji] ? 1 : 0;
      const count = baseCount + userAdded;
      const isActive = userAdded > 0;

      return `
        <button class="tg-reaction-chip ${isActive ? 'active' : ''}" 
                onclick="ReaderEngine.triggerReaction('${heroId}', '${emoji}', this, event)" 
                type="button" aria-label="Поставить реакцию ${emoji}">
          <span>${emoji}</span>
          <span class="count">${count}</span>
        </button>
      `;
    }).join('');

    return `
      <div class="tg-reactions-row" role="group" aria-label="Реакции памяти">
        ${chips}
      </div>
    `;
  },

  triggerReaction(heroId, emoji, chipEl, event) {
    if (!this.reactionsData[heroId]) {
      this.reactionsData[heroId] = {};
    }

    const current = !!this.reactionsData[heroId][emoji];
    this.reactionsData[heroId][emoji] = !current;

    try {
      localStorage.setItem('srmk_reader_reactions_v1', JSON.stringify(this.reactionsData));
    } catch (e) {}

    // Обновление цифры
    const countEl = chipEl?.querySelector('.count');
    if (countEl) {
      let val = parseInt(countEl.textContent, 10) || 0;
      val = !current ? val + 1 : Math.max(0, val - 1);
      countEl.textContent = val;
    }
    chipEl?.classList.toggle('active', !current);

    // Анимация взрыва частиц эмодзи
    if (!current && event) {
      this.spawnReactionParticle(emoji, event.clientX, event.clientY);
    }

    if (window.AchievementsEngine && !current) {
      window.AchievementsEngine.trackCandleLit();
    }
  },

  spawnReactionParticle(emoji, x, y) {
    const particle = document.createElement('div');
    particle.className = 'flying-reaction-particle';
    particle.textContent = emoji;
    particle.style.left = `${x || window.innerWidth / 2}px`;
    particle.style.top = `${y || window.innerHeight / 2}px`;
    particle.style.setProperty('--dx', `${(Math.random() - 0.5) * 80}px`);
    document.body.appendChild(particle);

    setTimeout(() => {
      particle.remove();
    }, 1200);
  },

  /**
   * 14. Аудиогид тома и управление скоростями (1.0x / 1.5x / 2.0x)
   */
  setupAudioListeners() {
    if (!this.audioEl) return;

    this.audioEl.addEventListener('timeupdate', () => {
      if (!this.audioEl.duration) return;
      const progress = this.audioEl.currentTime / this.audioEl.duration;
      const barIdx = Math.floor(progress * this.waveformBarsCount);

      // Подсветка пройденных полосок волны
      for (let i = 0; i < this.waveformBarsCount; i++) {
        const bar = document.getElementById(`waveBar_${i}`);
        if (bar) {
          bar.classList.toggle('played', i <= barIdx);
        }
      }

      // Таймер
      const timerDisplay = document.getElementById('tgVoiceTimerDisplay');
      if (timerDisplay) {
        const curM = Math.floor(this.audioEl.currentTime / 60);
        const curS = Math.floor(this.audioEl.currentTime % 60);
        const durM = Math.floor(this.audioEl.duration / 60);
        const durS = Math.floor(this.audioEl.duration % 60);
        timerDisplay.textContent = `${curM}:${curS < 10 ? '0' : ''}${curS} / ${durM}:${durS < 10 ? '0' : ''}${durS}`;
      }
    });

    this.audioEl.addEventListener('ended', () => {
      this.stopAudio();
    });
  },

  toggleHeroAudio() {
    if (!this.currentBook || !this.audioEl) return;

    const navBtn = document.getElementById('readerAudioToggleBtn');
    const playBtn = document.getElementById('tgVoicePlayBtn');

    if (this.isPlayingAudio) {
      this.stopAudio();
    } else {
      this.audioEl.src = this.currentBook.audioFile;
      this.audioEl.playbackRate = this.audioSpeeds[this.audioSpeedIdx];
      this.audioEl.play().then(() => {
        this.isPlayingAudio = true;
        if (window.AchievementsEngine) {
          window.AchievementsEngine.trackAudioListened();
        }
        if (navBtn) {
          navBtn.classList.add('playing');
          navBtn.textContent = '❚❚ Пауза';
        }
        if (playBtn) playBtn.textContent = '❚❚';
      }).catch(() => {
        this.showToast('Аудиофайл главы подготавливается к публикации.');
      });
    }
  },

  stopAudio() {
    if (this.audioEl) {
      this.audioEl.pause();
      this.isPlayingAudio = false;
      const navBtn = document.getElementById('readerAudioToggleBtn');
      const playBtn = document.getElementById('tgVoicePlayBtn');
      if (navBtn) {
        navBtn.classList.remove('playing');
        navBtn.textContent = '🎧 Аудиогид';
      }
      if (playBtn) playBtn.textContent = '▶';
    }
  },

  cycleAudioSpeed(btnEl) {
    this.audioSpeedIdx = (this.audioSpeedIdx + 1) % this.audioSpeeds.length;
    const speed = this.audioSpeeds[this.audioSpeedIdx];
    if (this.audioEl) this.audioEl.playbackRate = speed;
    if (btnEl) btnEl.textContent = `${speed.toFixed(1)}x`;
  },

  seekAudioFromWaveform(event) {
    if (!this.audioEl || !this.audioEl.duration) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    this.audioEl.currentTime = ratio * this.audioEl.duration;
  },

  /**
   * 15. Модальное окно просмотра фотографий с зумом (Photo Lightbox)
   */
  openLightbox(src, caption) {
    const modal = document.getElementById('readerLightboxModal');
    const img = document.getElementById('lightboxImage');
    const capEl = document.getElementById('lightboxCaption');
    if (!modal || !img) return;

    img.src = src;
    if (capEl) capEl.textContent = caption || 'Архивная фотокарточка • ГБПОУ СРМК';
    modal.classList.add('active');
  },

  closeLightbox() {
    const modal = document.getElementById('readerLightboxModal');
    if (modal) modal.classList.remove('active');
  },

  /**
   * 16. Контекстная плавающая панель выделения текста (Selection Bar)
   */
  setupSelectionListener() {
    const bar = document.getElementById('readerSelectionBar');
    if (!bar) return;

    document.addEventListener('selectionchange', () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();
      if (!text || text.length < 3 || !document.body.classList.contains('reader-is-open')) {
        bar.style.display = 'none';
        this.selectedText = '';
        return;
      }

      this.selectedText = text;
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      bar.style.display = 'flex';
      bar.style.left = `${Math.max(10, Math.min(window.innerWidth - 220, rect.left + (rect.width / 2) - 100))}px`;
      bar.style.top = `${Math.max(10, rect.top - 46)}px`;
    });
  },

  copySelectedText() {
    if (!this.selectedText) return;
    navigator.clipboard.writeText(this.selectedText).then(() => {
      this.showToast('Фрагмент скопирован в буфер обмена!');
      document.getElementById('readerSelectionBar').style.display = 'none';
    });
  },

  quoteSelectedText() {
    if (!this.selectedText) return;
    this.showToast(`Цитата сохранена: «${this.selectedText.slice(0, 45)}...»`);
    document.getElementById('readerSelectionBar').style.display = 'none';
  },

  speakSelectedText() {
    if (!this.selectedText || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(this.selectedText);
    utter.lang = 'ru-RU';
    utter.rate = 1.0;
    window.speechSynthesis.speak(utter);
    this.showToast('Озвучивание выбранного фрагмента...');
    document.getElementById('readerSelectionBar').style.display = 'none';
  },

  /**
   * 17. Полноэкранный режим
   */
  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  },

  nextPage() {
    if (!this.currentBook || !this.currentBook.pages) return;
    if (this.currentSpreadIdx < this.currentBook.pages.length - 1) {
      this.currentSpreadIdx++;
      this.playPageTurnSound();
      this.renderSpread();
    }
  },

  prevPage() {
    if (!this.currentBook || !this.currentBook.pages) return;
    if (this.currentSpreadIdx > 0) {
      this.currentSpreadIdx--;
      this.playPageTurnSound();
      this.renderSpread();
    }
  },

  goToSpread(idx) {
    if (!this.currentBook || !this.currentBook.pages) return;
    this.currentSpreadIdx = idx;
    this.playPageTurnSound();
    this.renderSpread();
  },

  bindEvents() {
    document.getElementById('shelfSearchInput')?.addEventListener('input', () => this.renderShelf());

    document.querySelectorAll('.shelf-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.shelf-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.renderShelf();
      });
    });

    document.querySelectorAll('.theme-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        document.querySelectorAll('.theme-dot').forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
        const theme = dot.dataset.theme;
        const book = document.getElementById('folioBookElement');
        const feed = document.getElementById('telegramFeedElement');
        if (book) book.className = `folio-book-3d ${theme}`;
        if (feed) feed.className = `tg-feed-container ${theme}`;
      });
    });

    document.addEventListener('keydown', (e) => {
      if (!this.currentBook) return;
      if (e.key === 'ArrowRight' && this.currentViewMode === 'folio') this.nextPage();
      if (e.key === 'ArrowLeft' && this.currentViewMode === 'folio') this.prevPage();
      if (e.key === 'Escape') {
        const modal = document.getElementById('readerLightboxModal');
        if (modal?.classList.contains('active')) {
          this.closeLightbox();
        } else {
          this.closeBook();
        }
      }
      if (e.key === ' ' && e.target === document.body) {
        e.preventDefault();
        this.toggleHeroAudio();
      }
    });

    window.addEventListener('hashchange', () => {
      const heroId = window.location.hash.replace('#', '');
      if (heroId && heroId !== this.currentBook?.id) {
        this.openBook(heroId, false);
      }
    });

    let touchStartX = 0;
    const stage = document.querySelector('.book-stage-wrapper');
    if (stage) {
      stage.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });

      stage.addEventListener('touchend', e => {
        if (this.currentViewMode !== 'folio') return;
        const deltaX = e.changedTouches[0].screenX - touchStartX;
        if (deltaX < -60) this.nextPage();
        if (deltaX > 60) this.prevPage();
      }, { passive: true });
    }
  },

  escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, tag => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag]));
  },

  showToast(msg) {
    const toast = document.getElementById('readerToast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('active');
    setTimeout(() => toast.classList.remove('active'), 2800);
  }
};

window.ReaderEngine = ReaderEngine;
document.addEventListener('DOMContentLoaded', () => ReaderEngine.init());
