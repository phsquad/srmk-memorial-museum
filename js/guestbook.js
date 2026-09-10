/**
 * ============================================================================
 * ДВИЖОК ЦИФРОВОЙ СТЕНЫ ПАМЯТИ И КНИГИ ОТЗЫВОВ (ЧИСТЫЙ ВВОД)
 * ГБПОУ СРМК // Проект «Быть воином — жить вечно»
 * Файл: js/guestbook.js (v2.1 Pure Live Input)
 * ============================================================================
 */

'use strict';

const GuestbookEngine = {
  tributes: [],
  userFlames: {},
  audioCtx: null,
  activeFilterHero: 'all',
  activeFilterRole: 'all',
  searchQuery: '',

  // Настройки безопасности и хранилища
  STORAGE_KEY: 'srmk_guestbook_entries_v2',
  FLAMES_KEY: 'srmk_user_flames_v2',
  DRAFT_KEY: 'srmk_gb_draft_message',
  SECURITY_COOLDOWN_MS: 60 * 1000, // 1 минута кулдаун от случайного спама

  // Базовый спам-фильтр ссылок
  STOP_WORDS: ['http://', 'https://', 'www.', '.ru/', '.com/', 'казино', 'crypto', 'ставки'],

  init() {
    this.loadStorage();
    this.populateHeroDropdowns();
    this.bindDOMEvents();
    this.restoreDraft();
    this.renderWall();
    this.updateStats();
    this.checkDeepLink();
    console.log("[Guestbook v2.1] Стена Памяти готова к приему пользовательских записей.");
  },

  /**
   * 1. Загрузка данных (по умолчанию массив пустой — никаких заготовок)
   */
  loadStorage() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      this.tributes = raw ? JSON.parse(raw) : [];
      this.userFlames = JSON.parse(localStorage.getItem(this.FLAMES_KEY) || '{}');
    } catch (e) {
      this.tributes = [];
      this.userFlames = {};
    }
  },

  saveStorage() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.tributes));
    } catch (e) {}
  },

  saveFlames() {
    try {
      localStorage.setItem(this.FLAMES_KEY, JSON.stringify(this.userFlames));
    } catch (e) {}
  },

  /**
   * 2. Заполнение выпадающих списков 20 героями из data.js
   */
  populateHeroDropdowns() {
    const filterSelect = document.getElementById('gbHeroFilterSelect');
    const formSelect = document.getElementById('inputDedicationHero');

    const heroesList = (typeof heroesDatabase !== 'undefined') ? heroesDatabase : [];

    heroesList.forEach(hero => {
      if (filterSelect) {
        const optFilter = document.createElement('option');
        optFilter.value = hero.id;
        optFilter.textContent = `⭐️ ${hero.name}`;
        filterSelect.appendChild(optFilter);
      }

      if (formSelect) {
        const optForm = document.createElement('option');
        optForm.value = hero.id;
        optForm.textContent = `⭐️ Памяти ${hero.name}`;
        formSelect.appendChild(optForm);
      }
    });
  },

  /**
   * 3. Отрисовка стены открыток
   */
  renderWall() {
    const container = document.getElementById('wallGridContainer');
    if (!container) return;

    const query = this.searchQuery.toLowerCase().trim();

    // Сортировка: закрепленные наверху, затем новые к старым
    const sorted = [...this.tributes].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });

    const filtered = sorted.filter(item => {
      const matchHero = (this.activeFilterHero === 'all') || (item.dedicationId === this.activeFilterHero);
      const matchRole = (this.activeFilterRole === 'all') || (item.role === this.activeFilterRole);
      let matchQuery = true;

      if (query) {
        matchQuery = item.author.toLowerCase().includes(query) ||
          item.message.toLowerCase().includes(query) ||
          item.dedicationName.toLowerCase().includes(query);
      }

      return matchHero && matchRole && matchQuery;
    });

    // Экран пустого состояния, если записей еще нет
    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 75px 20px; background: var(--bg-surface); border: 1px dashed var(--border-accent); border-radius: 4px;">
          <div style="font-size: 2.6rem; margin-bottom: 12px; color: var(--accent-brass);">🕊️</div>
          <h3 style="font-family: var(--font-serif); font-size: 1.3rem; color: #fff; margin-bottom: 8px;">Книга отзывов и Стена Памяти открыта</h3>
          <p style="color: var(--text-secondary); max-width: 540px; margin: 0 auto 20px; font-size: 0.92rem;">
            Здесь пока нет опубликованных посланий. Вы можете стать первым, кто напишет слова благодарности, воспоминание или напутствие.
          </p>
          <button class="btn-open-form" onclick="GuestbookEngine.openModal()" type="button" style="padding: 10px 24px; font-size: 0.88rem;">
            ✍️ Написать первое послание
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(tribute => {
      const isLit = !!this.userFlames[tribute.id];
      const pinBadge = tribute.isPinned ? `<span class="tribute-pin-badge" title="Закреплено модератором">📌 В фокусе</span>` : '';
      const verifiedBadge = tribute.isVerified ? `<span class="tribute-verify-seal" title="Верифицировано архивом СРМК">✓ Архив СРМК</span>` : '';

      return `
        <article class="tribute-card ${tribute.theme || 'theme-parchment'}" id="${tribute.id}">
          <div>
            <div class="card-header-row">
              <div class="author-info">
                <span class="author-name">${this.highlightMatch(this.escapeHtml(tribute.author), query)}</span>
                <span class="role-pill">${tribute.roleLabel || 'Гость мемориала'}</span>
              </div>
              <span class="tribute-date">${tribute.date}</span>
            </div>

            <div class="card-meta-badges">
              <div class="dedication-badge">
                🕊 Посвящение: <strong>${this.highlightMatch(this.escapeHtml(tribute.dedicationName), query)}</strong>
              </div>
              ${pinBadge}
              ${verifiedBadge}
            </div>

            <p class="tribute-body-text">«${this.highlightMatch(this.escapeHtml(tribute.message), query)}»</p>
          </div>

          <div class="card-footer-row">
            <button class="btn-flame-tribute ${isLit ? 'active' : ''}" onclick="GuestbookEngine.toggleFlame('${tribute.id}')" type="button" title="Зажечь лампаду памяти">
              <span>🕯</span> <span class="flame-count">${tribute.flames || 0}</span>
            </button>
            
            <div class="card-action-mini-group">
              <button class="btn-card-action" onclick="GuestbookEngine.shareTribute('${tribute.id}')" title="Скопировать прямую ссылку на открытку" type="button">
                🔗
              </button>
              <button class="btn-card-action" onclick="GuestbookEngine.generateSocialPoster('${tribute.id}')" title="Скачать карточку для соцсетей (1080p)" type="button">
                📥
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');
  },

  highlightMatch(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
  },

  /**
   * Процедурный синтез звука лампады (Web Audio API)
   */
  playChime(freq = 660) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.audioCtx) this.audioCtx = new AudioCtx();
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

      const ctx = this.audioCtx;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.4, now + 0.3);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {}
  },

  /**
   * Зажжение / поддержка лампады под открыткой
   */
  toggleFlame(tributeId) {
    const tribute = this.tributes.find(t => t.id === tributeId);
    if (!tribute) return;

    if (!this.userFlames[tributeId]) {
      tribute.flames = (tribute.flames || 0) + 1;
      this.userFlames[tributeId] = true;
      this.playChime(784);
      this.showToast("Вы зажгли лампаду скорби и гордости!");
    } else {
      tribute.flames = Math.max(0, (tribute.flames || 1) - 1);
      delete this.userFlames[tributeId];
      this.playChime(523);
    }

    this.saveStorage();
    this.saveFlames();
    this.renderWall();
    this.updateStats();
  },

  /**
   * Обработка отправки формы добавления отзыва
   */
  handleSubmit(e) {
    e.preventDefault();

    const lastSubmit = parseInt(localStorage.getItem('srmk_gb_last_submit') || '0', 10);
    const now = Date.now();
    if (now - lastSubmit < this.SECURITY_COOLDOWN_MS) {
      this.showToast("Повторная отправка будет доступна через минуту во избежание дублирования.");
      return;
    }

    const author = document.getElementById('inputAuthorName').value.trim();
    const roleSelect = document.getElementById('inputAuthorRole');
    const role = roleSelect.value;
    const roleLabel = roleSelect.options[roleSelect.selectedIndex].text;

    const heroSelect = document.getElementById('inputDedicationHero');
    const dedicationId = heroSelect.value;
    let dedicationName = heroSelect.options[heroSelect.selectedIndex].text.replace('⭐️ Памяти ', '').replace('🕊 ', '');

    const message = document.getElementById('inputMessageText').value.trim();
    const theme = document.querySelector('input[name="cardTheme"]:checked')?.value || 'theme-parchment';

    if (!author || !message) {
      this.showToast("Пожалуйста, заполните имя и текст послания!");
      return;
    }

    if (message.length < 5) {
      this.showToast("Текст послания слишком короткий.");
      return;
    }

    const lower = message.toLowerCase();
    const hasSpam = this.STOP_WORDS.some(word => lower.includes(word));
    if (hasSpam) {
      this.showToast("В тексте обнаружены недопустимые ссылки или реклама.");
      return;
    }

    const newTribute = {
      id: "tr-" + Date.now(),
      author: author,
      role: role,
      roleLabel: roleLabel,
      dedicationId: dedicationId,
      dedicationName: dedicationName,
      message: message,
      theme: theme,
      date: new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      flames: 1,
      isPinned: false,
      isVerified: (role === 'teacher' || role === 'family')
    };

    this.tributes.unshift(newTribute);
    this.userFlames[newTribute.id] = true;
    localStorage.setItem('srmk_gb_last_submit', now.toString());
    localStorage.removeItem(this.DRAFT_KEY);

    this.saveStorage();
    this.saveFlames();
    this.closeModal();
    this.renderWall();
    this.updateStats();

    document.getElementById('tributeForm').reset();
    document.getElementById('charCount').textContent = '0';

    this.playChime(880);
    this.showToast("Ваше послание опубликовано в Книге Памяти!");
  },

  /**
   * Генерация графической открытки 1080x1080 px через Canvas
   */
  generateSocialPoster(tributeId) {
    const tribute = this.tributes.find(t => t.id === tributeId);
    if (!tribute) return;

    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');

    // Фон
    const bg = ctx.createLinearGradient(0, 0, 1080, 1080);
    bg.addColorStop(0, '#161922');
    bg.addColorStop(1, '#090b0e');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1080, 1080);

    // Рамки
    ctx.strokeStyle = '#c5a059';
    ctx.lineWidth = 6;
    ctx.strokeRect(40, 40, 1000, 1000);
    ctx.strokeStyle = 'rgba(138, 28, 34, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(55, 55, 970, 970);

    // Шапка
    ctx.fillStyle = '#c5a059';
    ctx.font = 'bold 24px "Montserrat", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ГБПОУ «СТАВРОПОЛЬСКИЙ РЕГИОНАЛЬНЫЙ МНОГОПРОФИЛЬНЫЙ КОЛЛЕДЖ»', 540, 110);

    ctx.fillStyle = '#8a1c22';
    ctx.font = 'bold 20px "Cinzel", serif';
    ctx.fillText('ЦИФРОВАЯ СТЕНА ПАМЯТИ • «БЫТЬ ВОИНОМ — ЖИТЬ ВЕЧНО»', 540, 150);

    // Посвящение
    ctx.fillStyle = '#c5a059';
    ctx.font = 'bold 28px "Cinzel", serif';
    ctx.fillText(`ПОСВЯЩЕНИЕ: ${tribute.dedicationName.toUpperCase()}`, 540, 240);

    // Текст послания
    ctx.fillStyle = '#f1f3f7';
    ctx.font = 'italic 28px "Lora", Georgia, serif';
    this.wrapText(ctx, `«${tribute.message}»`, 540, 360, 860, 44);

    // Автор и дата
    ctx.fillStyle = '#c5a059';
    ctx.font = 'bold 30px "Montserrat", sans-serif';
    ctx.fillText(tribute.author, 540, 820);

    ctx.fillStyle = '#9da6b3';
    ctx.font = '22px "Montserrat", sans-serif';
    ctx.fillText(`${tribute.roleLabel} • ${tribute.date}`, 540, 865);

    // Подвал
    ctx.fillStyle = '#626a78';
    ctx.font = '18px "Montserrat", sans-serif';
    ctx.fillText('Всероссийская акция «Карта доблести: хранители подвигов» • srmkmuseum', 540, 980);

    const link = document.createElement('a');
    link.download = `Послание_Памяти_${tribute.id}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    this.showToast("Памятная открытка 1080p успешно скачана!");
  },

  wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
  },

  shareTribute(tributeId) {
    const url = `${window.location.origin}${window.location.pathname}#${tributeId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        this.showToast("Прямая ссылка на открытку скопирована!");
      });
    }
  },

  checkDeepLink() {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#tr-')) {
      const targetId = hash.replace('#', '');
      setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('highlight-target-card');
          setTimeout(() => el.classList.remove('highlight-target-card'), 3000);
        }
      }, 300);
    }
  },

  initDraftAutosave() {
    const textarea = document.getElementById('inputMessageText');
    if (textarea) {
      textarea.addEventListener('input', () => {
        localStorage.setItem(this.DRAFT_KEY, textarea.value);
      });
    }
  },

  restoreDraft() {
    const saved = localStorage.getItem(this.DRAFT_KEY);
    const textarea = document.getElementById('inputMessageText');
    const counter = document.getElementById('charCount');
    if (saved && textarea) {
      textarea.value = saved;
      if (counter) counter.textContent = saved.length;
    }
  },

  updateStats() {
    const totalMsgs = this.tributes.length;
    const totalFlames = this.tributes.reduce((sum, item) => sum + (item.flames || 0), 0);

    const msgEl = document.getElementById('totalMessagesStat');
    const flameEl = document.getElementById('totalFlamesStat');

    if (msgEl) msgEl.textContent = totalMsgs;
    if (flameEl) flameEl.textContent = totalFlames;
  },

  bindDOMEvents() {
    document.getElementById('btnOpenModalForm')?.addEventListener('click', () => this.openModal());

    document.getElementById('gbSearchInput')?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      this.renderWall();
    });

    document.getElementById('gbHeroFilterSelect')?.addEventListener('change', (e) => {
      this.activeFilterHero = e.target.value;
      this.renderWall();
    });

    document.getElementById('gbRoleFilterSelect')?.addEventListener('change', (e) => {
      this.activeFilterRole = e.target.value;
      this.renderWall();
    });

    this.initDraftAutosave();

    // Шорткат модератора: Ctrl + Shift + M
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'M' || e.key === 'm' || e.key === 'Ь' || e.key === 'ь')) {
        e.preventDefault();
        this.openModeratorPrompt();
      }
    });
  },

  openModal() {
    document.getElementById('gbModal')?.classList.add('active');
    document.body.style.overflow = 'hidden';
  },

  closeModal() {
    document.getElementById('gbModal')?.classList.remove('active');
    document.body.style.overflow = 'auto';
  },

  /**
   * 8. ПАНЕЛЬ МОДЕРАЦИИ (Пароль 2026)
   */
  openModeratorPrompt() {
    const pwd = prompt("Введите пароль модератора стены (2026):", "");
    if (pwd === "2026") {
      const choice = prompt(
        "ПАНЕЛЬ МОДЕРАТОРА СТЕНЫ ПАМЯТИ:\n" +
        "1 — Закрепить/Открепить отзыв по ID\n" +
        "2 — Поставить гриф «Архив СРМК»\n" +
        "3 — Удалить отзыв по ID\n" +
        "4 — Экспорт всех отзывов в JSON\n" +
        "5 — Экспорт в отчет Word (.doc)\n" +
        "6 — Очистить все отзывы со стены",
        "4"
      );

      if (choice === "1") {
        const id = prompt("Введите ID открытки (например: tr-1715000000000):");
        const tr = this.tributes.find(t => t.id === id);
        if (tr) {
          tr.isPinned = !tr.isPinned;
          this.saveStorage();
          this.renderWall();
          this.showToast(`Статус закрепления для ${id} изменен.`);
        }
      } else if (choice === "2") {
        const id = prompt("Введите ID открытки для верификации архивом:");
        const tr = this.tributes.find(t => t.id === id);
        if (tr) {
          tr.isVerified = true;
          this.saveStorage();
          this.renderWall();
          this.showToast(`Отзыв ${id} верифицирован архивом.`);
        }
      } else if (choice === "3") {
        const id = prompt("Введите ID открытки для удаления:");
        const idx = this.tributes.findIndex(t => t.id === id);
        if (idx !== -1 && confirm(`Удалить отзыв от «${this.tributes[idx].author}»?`)) {
          this.tributes.splice(idx, 1);
          this.saveStorage();
          this.renderWall();
          this.updateStats();
          this.showToast("Отзыв удален.");
        }
      } else if (choice === "4") {
        const blob = new Blob([JSON.stringify(this.tributes, null, 2)], { type: "application/json" });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `Книга_Памяти_СРМК_Отзывы_${Date.now()}.json`;
        a.click();
      } else if (choice === "5") {
        this.exportToWordReport();
      } else if (choice === "6") {
        if (confirm("Вы точно хотите очистить всю Стену Памяти?")) {
          localStorage.removeItem(this.STORAGE_KEY);
          localStorage.removeItem(this.FLAMES_KEY);
          this.loadStorage();
          this.renderWall();
          this.updateStats();
          this.showToast("Стена Памяти очищена.");
        }
      }
    } else if (pwd !== null) {
      alert("Неверный пароль модератора.");
    }
  },

  exportToWordReport() {
    if (this.tributes.length === 0) {
      this.showToast("На стене пока нет записей для экспорта.");
      return;
    }

    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Отчет: Книга Памяти СРМК</title>
      <style>
        body { font-family: 'Times New Roman', serif; padding: 20px; line-height: 1.5; }
        h1 { color: #8a1c22; text-align: center; }
        .tribute-box { border: 1px solid #999; padding: 12px; margin-bottom: 14px; page-break-inside: avoid; }
        .author { font-weight: bold; color: #111; }
        .dedication { color: #8a1c22; font-style: italic; }
      </style>
      </head>
      <body>
        <h1>ГБПОУ СРМК • ЦИФРОВАЯ СТЕНА ПАМЯТИ</h1>
        <p style="text-align:center;"><strong>Сводный реестр отзывов и посланий на ${new Date().toLocaleDateString('ru-RU')}</strong></p>
        <hr/>
        ${this.tributes.map(t => `
          <div class="tribute-box">
            <div class="author">${t.author} (${t.roleLabel}) • ${t.date}</div>
            <div class="dedication">Посвящение: ${t.dedicationName} | Лампад: ${t.flames}</div>
            <p>«${t.message}»</p>
          </div>
        `).join('')}
      </body></html>
    `;

    const blob = new Blob(['\ufeff' + html], { type: 'application/msword;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = "Сводный_реестр_отзывов_СРМК.doc";
    a.click();
    this.showToast("Сводный отчет Word (.doc) сформирован!");
  },

  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  },

  showToast(msg) {
    const toast = document.getElementById('gbToast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('active');
    setTimeout(() => toast.classList.remove('active'), 2800);
  }
};

document.addEventListener('DOMContentLoaded', () => GuestbookEngine.init());