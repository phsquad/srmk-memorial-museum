/**
 * ============================================================================
 * ДВИЖОК 3D-ЧИТАЛКИ И БИБЛИОТЕКИ ФОЛИАНТОВ: js/reader.js (v14.0 Master)
 * Мемориально-образовательный комплекс ГБПОУ СРМК «Быть воином — жить вечно»
 * ============================================================================
 */

'use strict';

const ReaderEngine = {
  currentBook: null,
  currentSpreadIdx: 0,
  audioContext: null,
  audioEl: null,
  isPlayingAudio: false,

  init() {
    this.audioEl = document.getElementById('readerAudioElement');
    this.updateFilterButtonsMeta();
    this.renderShelf();
    this.bindEvents();

    // Чтение хэша для прямого открытия книги
    let linkedHero = window.location.hash.replace('#', '');
    if (linkedHero === 'prologue-master-cover') {
      linkedHero = 'prologue-memorial-opening';
    }
    if (linkedHero) {
      this.openBook(linkedHero, false);
    }
    console.log("[ReaderEngine v14.0 Master] Библиотека из 21 тома готова.");
  },

  /**
   * 1. Безопасное получение полного канонического архива (ровно 21 том)
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
   * 2. Обновление цифр на кнопках фильтров
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
      const bufferSize = ctx.sampleRate * 0.15; // 150 мс
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.15);
      filter.Q.value = 3.5;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
    } catch (e) {
      console.warn("[Web Audio] Звук перелистывания недоступен:", e);
    }
  },

  /**
   * 4. Отрисовка книжной полки
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
          <button class="book-spine-btn" type="button">Раскрыть фолиант</button>
        </article>
      `;
    }).join('');
  },

  /**
   * 5. Раскрытие книги
   */
  openBook(heroId, updateHash = true) {
    const archive = this.getArchive();
    let book = archive.find(b => b.id === heroId);

    // Поддержка старого алиаса хэша
    if (!book && heroId === 'prologue-master-cover') {
      book = archive.find(b => b.id === 'prologue-memorial-opening');
    }

    // Fallback из heroesDatabase на случай отсутствия тома
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
          pages: [
            {
              spreadNum: "Разворот I (Стр. 1–2)",
              chapterTitle: "Хроника ратного подвига",
              leftHtml: `
                <div class="page-header-meta"><span>ГБПОУ СРМК</span><span>АРХИВНЫЙ МЕДАЛЬОН</span></div>
                <div class="page-visual-frame"><img src="${photo}" alt="${this.escapeHtml(h.name)}" onerror="this.src='assets/images/cover-master.jpg'"></div>
                <div class="page-quote-box">«${this.escapeHtml(h.quote || 'Верность воинскому долгу и памяти студенческого братства.')}»</div>
                <p style="font-size:0.85rem; color:#444; line-height:1.4;"><strong>Профессия:</strong> ${this.escapeHtml(h.education?.specialty || 'Выпускник колледжа')}<br><strong>Звание:</strong> ${this.escapeHtml(h.military?.rank || 'Воин ВС РФ')}<br><strong>Рубеж:</strong> ${this.escapeHtml(h.mapCoords?.locationName || 'ТВД')}</p>
                <div class="page-number-footer">Стр. 1</div>
              `,
              rightHtml: `
                <div class="page-header-meta"><span>АРХИВ КНИГИ ПАМЯТИ</span><span>ГЛАВА I</span></div>
                <h3 class="page-chapter-title">Хроника подвига</h3>
                <div class="page-story-text">
                  <span class="drop-cap">${h.name[0]}</span>${this.escapeHtml(h.deed || 'Сведения о боевом пути и ратном подвиге героя-выпускника верифицированы архивами колледжа.')}
                  <p style="margin-top:14px; font-weight:bold; color:#8a1c22;">Награжден Орденом Мужества посмертно. Увековечен на Мемориале Славы СРМК.</p>
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

    document.getElementById('readerVolBadge').textContent = book.volNum || "Том Летописи";
    document.getElementById('readerHeroTitle').textContent = book.name;

    document.getElementById('shelfView').style.display = 'none';
    document.getElementById('bookReaderView').style.display = 'flex';
    document.getElementById('btnReturnToShelf').style.display = 'inline-block';
    document.body.classList.add('reader-is-open');

    if (updateHash) {
      history.replaceState(null, '', `#${book.id}`);
    }

    this.playPageTurnSound();
    this.renderSpread();
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
   * 6. Отрисовка разворота
   */
  renderSpread() {
    if (!this.currentBook || !this.currentBook.pages) return;

    const spread = this.currentBook.pages[this.currentSpreadIdx] || this.currentBook.pages[0];
    const leftEl = document.getElementById('pageLeftContent');
    const rightEl = document.getElementById('pageRightContent');

    if (leftEl) leftEl.innerHTML = spread.leftHtml || '';
    if (rightEl) rightEl.innerHTML = spread.rightHtml || '';

    leftEl?.scrollTo({ top: 0, behavior: 'instant' });
    rightEl?.scrollTo({ top: 0, behavior: 'instant' });
    document.getElementById('folioBookElement')?.scrollTo({ top: 0, behavior: 'instant' });

    const total = this.currentBook.pages.length;
    document.getElementById('paginationDisplay').textContent = `${spread.spreadNum || `Разворот ${this.currentSpreadIdx + 1}`} из ${total}`;

    const dotsTrack = document.getElementById('pageDotsTrack');
    if (dotsTrack) {
      dotsTrack.innerHTML = this.currentBook.pages.map((_, i) =>
        `<button class="page-dot ${i === this.currentSpreadIdx ? 'active' : ''}" 
                 aria-label="Открыть ${i + 1}-й разворот" 
                 aria-pressed="${i === this.currentSpreadIdx}" 
                 onclick="ReaderEngine.goToSpread(${i})" type="button"></button>`
      ).join('');
    }

    document.getElementById('prevPageBtn').style.visibility = this.currentSpreadIdx > 0 ? 'visible' : 'hidden';
    document.getElementById('nextPageBtn').style.visibility = this.currentSpreadIdx < total - 1 ? 'visible' : 'hidden';
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

  /**
   * 7. Аудиогид тома
   */
  toggleHeroAudio() {
    if (!this.currentBook || !this.audioEl) return;

    const btn = document.getElementById('readerAudioToggleBtn');

    if (this.isPlayingAudio) {
      this.stopAudio();
    } else {
      this.audioEl.src = this.currentBook.audioFile;
      this.audioEl.play().then(() => {
        this.isPlayingAudio = true;
        if (btn) {
          btn.classList.add('playing');
          btn.textContent = '❚❚ Пауза аудиогида';
        }
      }).catch(() => {
        this.showToast('Аудиофайл главы подготавливается к публикации.');
      });
    }
  },

  stopAudio() {
    if (this.audioEl) {
      this.audioEl.pause();
      this.audioEl.currentTime = 0;
      this.isPlayingAudio = false;
      const btn = document.getElementById('readerAudioToggleBtn');
      if (btn) {
        btn.classList.remove('playing');
        btn.textContent = '🎧 Слушать аудиогид (MP3)';
      }
    }
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
        if (book) book.className = `folio-book-3d ${theme}`;
      });
    });

    document.addEventListener('keydown', (e) => {
      if (!this.currentBook) return;
      if (e.key === 'ArrowRight') this.nextPage();
      if (e.key === 'ArrowLeft') this.prevPage();
      if (e.key === 'Escape') this.closeBook();
      if (e.key === ' ') {
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