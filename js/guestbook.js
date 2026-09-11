/**
 * ============================================================================
 * ДВИЖОК ЦИФРОВОЙ СТЕНЫ ПАМЯТИ И ОТЗЫВОВ
 * Файл: js/guestbook.js (v3.0 Ultra Enterprise Edition)
 * Мемориально-образовательный комплекс ГБПОУ СРМК «Быть воином — жить вечно»
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
  adminPassword: '2026',

  // Параметры пагинации
  pageSize: 9,
  currentPage: 1,

  // Шаблоны быстрых посланий
  presetWishes: [
    "🕯 Вечная память героям СРМК!",
    "🕊 Помним, гордимся, чтим ваш подвиг!",
    "🎖 Низкий поклон защитникам Отечества!",
    "🎓 Спасибо за мирное небо, сокурсник!",
    "⭐️ Навсегда в сердцах студентов и преподавателей!"
  ],

  async init() {
    this.populateHeroDropdowns();
    this.bindDOMEvents();
    this.injectPresetChips();
    
    // Задержка 400 мс для инициализации подключения Supabase через CloudSync
    setTimeout(async () => {
      await this.loadData();
      this.renderWall();
      this.updateStats();
    }, 400);

    console.log("[GuestbookEngine v3.0] Цифровая Стена Памяти и модерация готовы к работе.");
  },

  /**
   * 1. Загрузка данных (Облако Supabase ➔ LocalStorage Fallback)
   */
  async loadData() {
    if (typeof CloudSync !== 'undefined' && CloudSync.isLive) {
      const cloudData = await CloudSync.fetchTributes();
      if (cloudData && Array.isArray(cloudData)) {
        this.tributes = cloudData.map(t => this.normalizeTributeFields(t));
        this.userFlames = JSON.parse(localStorage.getItem('srmk_user_flames_v3') || '{}');
        return;
      }
    }
    // Fallback: Загрузка локальных данных
    const raw = localStorage.getItem('srmk_guestbook_entries_v3');
    this.tributes = raw ? JSON.parse(raw).map(t => this.normalizeTributeFields(t)) : [];
    this.userFlames = JSON.parse(localStorage.getItem('srmk_user_flames_v3') || '{}');
  },

  /**
   * 2. Нормализация полей (Двухконтурная защита от разницы наименований в DB и JS)
   */
  normalizeTributeFields(item) {
    return {
      id: item.id || ("tr-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4)),
      author: item.author || "Анонимный гость",
      role: item.role || "guest",
      role_label: item.role_label || item.roleLabel || "Гость мемориала",
      dedication_id: item.dedication_id || item.dedicationId || "general",
      dedication_name: item.dedication_name || item.dedicationName || "Общему Мемориалу Славы",
      message: item.message || "",
      theme: item.theme || "theme-parchment",
      flames: Number(item.flames) || 0,
      is_pinned: Boolean(item.is_pinned ?? item.isPinned ?? false),
      is_verified: Boolean(item.is_verified ?? item.isVerified ?? false),
      date: item.date || item.created_at || new Date().toLocaleDateString('ru-RU')
    };
  },

  /**
   * 3. Прием Realtime-сообщений из других городов через WebSockets
   */
  receiveRealtimeTribute(rawTribute) {
    const newTribute = this.normalizeTributeFields(rawTribute);
    const exists = this.tributes.some(t => t.id === newTribute.id);
    
    if (!exists) {
      this.tributes.unshift(newTribute);
      this.renderWall();
      this.updateStats();
      this.playChime(880);
      this.showToast(`🌍 Новое послание из другого города от: ${this.escapeHtml(newTribute.author)}!`, "info");
    }
  },

  updateRealtimeTribute(rawTribute) {
    const updated = this.normalizeTributeFields(rawTribute);
    const idx = this.tributes.findIndex(t => t.id === updated.id);
    if (idx !== -1) {
      this.tributes[idx] = updated;
      this.renderWall();
      this.updateStats();
    }
  },

  /**
   * 4. Отправка нового послания
   */
  async handleSubmit(e) {
    e.preventDefault();

    const authorInput = document.getElementById('inputAuthorName');
    const roleSelect = document.getElementById('inputAuthorRole');
    const heroSelect = document.getElementById('inputDedicationHero');
    const messageInput = document.getElementById('inputMessageText');
    const themeRadio = document.querySelector('input[name="cardTheme"]:checked');

    if (!authorInput || !messageInput) return;

    const author = authorInput.value.trim();
    const role = roleSelect ? roleSelect.value : 'guest';
    const roleLabel = roleSelect ? roleSelect.options[roleSelect.selectedIndex].text : 'Гость';

    const dedicationId = heroSelect ? heroSelect.value : 'general';
    let dedicationName = 'Общему Мемориалу Славы';
    if (heroSelect && heroSelect.selectedIndex !== -1) {
      dedicationName = heroSelect.options[heroSelect.selectedIndex].text
        .replace('⭐️ Памяти ', '')
        .replace('🕊 ', '')
        .replace('⭐️ ', '');
    }

    const message = messageInput.value.trim();
    const theme = themeRadio ? themeRadio.value : 'theme-parchment';

    if (!author || !message) {
      this.showToast("Пожалуйста, заполните ваше имя и текст послания!", "warn");
      return;
    }

    const newTribute = {
      id: "tr-" + Date.now(),
      author: author,
      role: role,
      role_label: roleLabel,
      dedication_id: dedicationId,
      dedication_name: dedicationName,
      message: message,
      theme: theme,
      flames: 1,
      is_pinned: false,
      is_verified: (role === 'teacher' || role === 'family'),
      date: new Date().toLocaleDateString('ru-RU')
    };

    // А) Публикация в облако Supabase
    let savedToCloud = false;
    if (typeof CloudSync !== 'undefined' && CloudSync.isLive) {
      savedToCloud = await CloudSync.sendTribute(newTribute);
    }

    // Б) Сохранение в локальный список
    this.tributes.unshift(newTribute);
    this.userFlames[newTribute.id] = true;
    this.saveStorage();

    this.closeModal();
    this.currentPage = 1; // Сброс на первую страницу
    this.renderWall();
    this.updateStats();

    const form = document.getElementById('tributeForm');
    if (form) form.reset();

    this.playChime(880);
    this.showToast(savedToCloud || typeof CloudSync === 'undefined' || !CloudSync.isLive
      ? "Ваше послание опубликовано в вечной Книге Памяти!"
      : "Сохранено локально на вашем устройстве.", "info");
  },

  /**
   * 5. Зажжение / Гашение лампады (Лайки с синхронизацией)
   */
  async toggleFlame(tributeId) {
    const tribute = this.tributes.find(t => t.id === tributeId);
    if (!tribute) return;

    let delta = 0;
    if (!this.userFlames[tributeId]) {
      tribute.flames = (tribute.flames || 0) + 1;
      this.userFlames[tributeId] = true;
      delta = 1;
      this.playChime(784);
    } else {
      tribute.flames = Math.max(0, (tribute.flames || 1) - 1);
      delete this.userFlames[tributeId];
      delta = -1;
      this.playChime(523);
    }

    this.saveStorage();
    this.renderWall();

    if (typeof CloudSync !== 'undefined' && CloudSync.isLive) {
      await CloudSync.toggleFlame(tributeId, delta);
    }
  },

  /**
   * 6. ОТРИСОВКА СТЕНЫ ПАМЯТИ С ПАГИНАЦИЕЙ И ФИЛЬТРАМИ
   */
  renderWall() {
    const container = document.getElementById('wallGridContainer');
    if (!container) return;

    const query = this.searchQuery.toLowerCase().trim();

    // Фильтрация
    let filtered = this.tributes.filter(item => {
      const matchHero = (this.activeFilterHero === 'all') || (item.dedication_id === this.activeFilterHero);
      const matchRole = (this.activeFilterRole === 'all') || (item.role === this.activeFilterRole);
      let matchQuery = true;
      if (query) {
        matchQuery = (item.author && item.author.toLowerCase().includes(query)) ||
                     (item.message && item.message.toLowerCase().includes(query)) ||
                     (item.dedication_name && item.dedication_name.toLowerCase().includes(query));
      }
      return matchHero && matchRole && matchQuery;
    });

    // Сортировка: Сначала закрепленные, затем свежие
    filtered.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return 0;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; background: var(--bg-surface); border: 1px solid var(--border-hairline); border-radius: 4px;">
          <p style="font-size: 1.15rem; color: #fff; margin-bottom: 8px;">Посланий по выбранному фильтру не найдено</p>
          <small style="color: var(--text-tertiary);">Станьте первым, кто зажжет лампаду памяти и напишет памятное слово!</small>
        </div>
      `;
      return;
    }

    // Лимит отображения (Пагинация)
    const visibleCount = this.currentPage * this.pageSize;
    const paginatedItems = filtered.slice(0, visibleCount);
    const hasMore = filtered.length > visibleCount;

    container.innerHTML = paginatedItems.map(tribute => {
      const isLit = !!this.userFlames[tribute.id];
      const isPinned = tribute.is_pinned;
      const isVerified = tribute.is_verified;

      return `
        <article class="tribute-card ${tribute.theme || 'theme-parchment'} ${isPinned ? 'pinned' : ''}" id="${tribute.id}">
          <div>
            <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:8px;">
              ${isPinned ? `<span style="background:var(--accent-granite); color:#fff; font-size:0.65rem; font-weight:800; padding:2px 6px; border-radius:2px;">📌 ЗАКРЕПЛЕНО</span>` : ''}
              ${isVerified ? `<span style="background:var(--bg-elevated); border:1px solid var(--border-accent); color:var(--accent-brass); font-size:0.65rem; font-weight:700; padding:2px 6px; border-radius:2px;">🛡 ВЕРИФИЦИРОВАНО</span>` : ''}
            </div>

            <div class="card-header-row">
              <div class="author-info">
                <span class="author-name">${this.escapeHtml(tribute.author)}</span>
                <span class="role-pill">${this.escapeHtml(tribute.role_label)}</span>
              </div>
              <span class="tribute-date">${tribute.date || ''}</span>
            </div>

            <div class="dedication-badge">🕊 Посвящение: <strong>${this.escapeHtml(tribute.dedication_name)}</strong></div>
            <p class="tribute-body-text">«${this.escapeHtml(tribute.message)}»</p>
          </div>

          <div class="card-footer-row">
            <button class="btn-flame-tribute ${isLit ? 'active' : ''}" onclick="GuestbookEngine.toggleFlame('${tribute.id}')" type="button" aria-label="Зажечь лампаду">
              <span>🕯</span> <span class="flame-count">${tribute.flames || 0}</span>
            </button>
            <span class="card-seal-icon">⭐️</span>
          </div>
        </article>
      `;
    }).join('');

    // Кнопка «Загрузить еще»
    if (hasMore) {
      const loadMoreWrap = document.createElement('div');
      loadMoreWrap.style.cssText = 'grid-column: 1/-1; text-align: center; margin-top: 20px;';
      loadMoreWrap.innerHTML = `
        <button onclick="GuestbookEngine.loadMore()" class="btn-open-form" style="background: var(--bg-elevated); border: 1px solid var(--border-accent); color: var(--accent-brass); font-size: 0.85rem; padding: 10px 24px;">
          Загрузить еще послания (${filtered.length - visibleCount}) ↓
        </button>
      `;
      container.appendChild(loadMoreWrap);
    }
  },

  loadMore() {
    this.currentPage++;
    this.renderWall();
  },

  /**
   * 7. ИНТЕРАКТИВНЫЕ ЧИПСЫ БЫСТРЫХ ШАБЛОНОВ (PRESETS)
   */
  injectPresetChips() {
    const modalArea = document.querySelector('.gb-dialog form');
    if (!modalArea || document.getElementById('presetChipsBar')) return;

    const chipsBar = document.createElement('div');
    chipsBar.id = 'presetChipsBar';
    chipsBar.style.cssText = 'margin-bottom: 12px; display: flex; flex-wrap: wrap; gap: 6px;';

    chipsBar.innerHTML = `
      <span style="font-size: 0.7rem; color: var(--text-tertiary); width: 100%; font-weight: 700; text-transform: uppercase;">Быстрый выбор текста:</span>
      ${this.presetWishes.map(wish => `
        <button type="button" class="preset-chip-btn" onclick="GuestbookEngine.applyPresetText('${wish.replace(/'/g, "\\'")}')" 
                style="background: var(--bg-elevated); border: 1px solid var(--border-hairline); color: var(--text-secondary); padding: 4px 8px; border-radius: 2px; font-size: 0.72rem; cursor: pointer; transition: all 0.2s;">
          ${wish}
        </button>
      `).join('')}
    `;

    const textareaField = document.getElementById('inputMessageText')?.closest('.form-field');
    if (textareaField) {
      textareaField.parentNode.insertBefore(chipsBar, textareaField);
    }
  },

  applyPresetText(text) {
    const textarea = document.getElementById('inputMessageText');
    if (!textarea) return;
    textarea.value = text;
    this.updateCharCount();
    this.showToast("Шаблон текста подставлен в форму!", "info");
  },

  /**
   * 8. ПОЛНОЦЕННАЯ ПАНЕЛЬ МОДЕРАЦИИ АРХИВА (Ctrl+Shift+M или Клик в подвале)
   */
  openModeratorPrompt() {
    const pwd = prompt("Введите пароль модератора Стены Памяти СРМК (2026):", "");
    if (pwd === this.adminPassword) {
      const choice = prompt(
        "⚙️ ПАНЕЛЬ МОДЕРАЦИИ СТЕНЫ ПАМЯТИ СРМК:\n\n" +
        "1 — Закрепить / Открепить последнее послание\n" +
        "2 — Присвоить статус «Верифицировано музеем» последнему посланию\n" +
        "3 — Удалить последнее послание из стены\n" +
        "4 — Сбросить локальный кэш записей\n" +
        "5 — Скачать всю Стену Памяти в формате JSON\n\n" +
        "Введите номер действия (1-5):", "1"
      );

      if (choice === "1" && this.tributes.length > 0) {
        this.tributes[0].is_pinned = !this.tributes[0].is_pinned;
        this.saveStorage();
        this.renderWall();
        alert(`Послание от «${this.tributes[0].author}» ${this.tributes[0].is_pinned ? 'закреплено вверху' : 'откреплено'}.`);
      } else if (choice === "2" && this.tributes.length > 0) {
        this.tributes[0].is_verified = !this.tributes[0].is_verified;
        this.saveStorage();
        this.renderWall();
        alert(`Посланию от «${this.tributes[0].author}» ${this.tributes[0].is_verified ? 'присвоен знак верификации' : 'снят знак верификации'}.`);
      } else if (choice === "3" && this.tributes.length > 0) {
        const removed = this.tributes.shift();
        this.saveStorage();
        this.renderWall();
        this.updateStats();
        alert(`Послание от «${removed.author}» удалено.`);
      } else if (choice === "4") {
        localStorage.removeItem('srmk_guestbook_entries_v3');
        location.reload();
      } else if (choice === "5") {
        this.exportTributesJSON();
      }
    } else if (pwd !== null) {
      alert("Отказ в доступе: Неверный пароль модератора.");
    }
  },

  exportTributesJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.tributes, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `Стена_Памяти_СРМК_${Date.now()}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
  },

  /**
   * 9. ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ И ИНТЕРФЕЙС
   */
  populateHeroDropdowns() {
    const filterSelect = document.getElementById('gbHeroFilterSelect');
    const formSelect = document.getElementById('inputDedicationHero');
    
    if (typeof heroesDatabase !== 'undefined' && Array.isArray(heroesDatabase)) {
      heroesDatabase.forEach(hero => {
        if (filterSelect) filterSelect.innerHTML += `<option value="${hero.id}">⭐️ ${hero.name}</option>`;
        if (formSelect) formSelect.innerHTML += `<option value="${hero.id}">⭐️ Памяти ${hero.name}</option>`;
      });
    }
  },

  updateStats() {
    const msgEl = document.getElementById('totalMessagesStat');
    if (msgEl) msgEl.textContent = this.tributes.length;

    const totalFlames = this.tributes.reduce((acc, t) => acc + (t.flames || 0), 0);
    const flamesEl = document.getElementById('totalFlamesStat');
    if (flamesEl) flamesEl.textContent = totalFlames;
  },

  saveStorage() {
    localStorage.setItem('srmk_guestbook_entries_v3', JSON.stringify(this.tributes));
    localStorage.setItem('srmk_user_flames_v3', JSON.stringify(this.userFlames));
  },

  bindDOMEvents() {
    document.getElementById('btnOpenModalForm')?.addEventListener('click', () => this.openModal());
    
    const searchInput = document.getElementById('gbSearchInput');
    if (searchInput) {
      let debounceTimer;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          this.searchQuery = e.target.value;
          this.currentPage = 1;
          this.renderWall();
        }, 120);
      });
    }

    document.getElementById('gbHeroFilterSelect')?.addEventListener('change', (e) => { 
      this.activeFilterHero = e.target.value; 
      this.currentPage = 1;
      this.renderWall(); 
    });

    document.getElementById('gbRoleFilterSelect')?.addEventListener('change', (e) => { 
      this.activeFilterRole = e.target.value; 
      this.currentPage = 1;
      this.renderWall(); 
    });

    const textarea = document.getElementById('inputMessageText');
    if (textarea) {
      textarea.addEventListener('input', () => this.updateCharCount());
    }

    const form = document.getElementById('tributeForm');
    if (form) {
      form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    // Горячие клавиши модерации Ctrl+Shift+M
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'M' || e.key === 'm' || e.key === 'Ь' || e.key === 'ь')) {
        e.preventDefault();
        this.openModeratorPrompt();
      }
    });
  },

  updateCharCount() {
    const textarea = document.getElementById('inputMessageText');
    const counter = document.getElementById('charCount');
    if (textarea && counter) {
      counter.textContent = textarea.value.length;
    }
  },

  openModal() { 
    const modal = document.getElementById('gbModal');
    if (modal) {
      modal.classList.add('active'); 
      document.body.style.overflow = 'hidden';
    }
  },

  closeModal() { 
    const modal = document.getElementById('gbModal');
    if (modal) {
      modal.classList.remove('active'); 
      document.body.style.overflow = 'auto';
    }
  },

  playChime(freq = 660) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!this.audioCtx) this.audioCtx = new AudioCtx();
      const ctx = this.audioCtx;
      if (ctx.state === 'suspended') ctx.resume();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      
      osc.connect(gain); 
      gain.connect(ctx.destination);
      osc.start(); 
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {}
  },

  escapeHtml(str) { 
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag])); 
  },
  
  showToast(msg, type = "info") {
    const toast = document.getElementById('gbToast');
    if (toast) { 
      toast.textContent = msg; 
      toast.className = `gb-toast active ${type}`;
      setTimeout(() => toast.classList.remove('active'), 3200); 
    }
  }
};

window.GuestbookEngine = GuestbookEngine;
document.addEventListener('DOMContentLoaded', () => GuestbookEngine.init());