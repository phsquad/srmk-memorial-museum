/**
 * ============================================================================
 * ДВИЖОК СТЕНЫ ПАМЯТИ: js/guestbook.js (Глобальная версия)
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

  async init() {
    this.populateHeroDropdowns();
    this.bindDOMEvents();
    
    // Ждем 0.5 сек, чтобы CloudSync успел подключиться к Supabase
    setTimeout(async () => {
      await this.loadData();
      this.renderWall();
      this.updateStats();
    }, 500);
    
    console.log("[Guestbook] Стена Памяти готова к глобальной синхронизации.");
  },

  /**
   * 1. Загрузка данных (Сначала из Облака, если нет интернета - из LocalStorage)
   */
  async loadData() {
    if (typeof CloudSync !== 'undefined' && CloudSync.isLive) {
      const cloudData = await CloudSync.fetchTributes();
      if (cloudData) {
        this.tributes = cloudData;
        this.userFlames = JSON.parse(localStorage.getItem('srmk_user_flames_v2') || '{}');
        return;
      }
    }
    // Fallback (Локальный режим)
    const raw = localStorage.getItem('srmk_guestbook_entries_v2');
    this.tributes = raw ? JSON.parse(raw) : [];
    this.userFlames = JSON.parse(localStorage.getItem('srmk_user_flames_v2') || '{}');
  },

  /**
   * 2. Получение чужого сообщения из другого города (Realtime)
   */
  receiveRealtimeTribute(newTribute) {
    // Проверяем, нет ли уже этого сообщения (чтобы не дублировать свое же)
    const exists = this.tributes.some(t => t.id === newTribute.id);
    if (!exists) {
      this.tributes.unshift(newTribute);
      this.renderWall();
      this.updateStats();
      this.playChime(880); // Звуковой сигнал
      this.showToast(`🌍 Новое послание из другого города от: ${newTribute.author}!`);
    }
  },

  updateRealtimeTribute(updatedTribute) {
    const idx = this.tributes.findIndex(t => t.id === updatedTribute.id);
    if (idx !== -1) {
      this.tributes[idx] = updatedTribute;
      this.renderWall();
    }
  },

  /**
   * 3. Отправка нашего сообщения в Облако
   */
  async handleSubmit(e) {
    e.preventDefault();

    const author = document.getElementById('inputAuthorName').value.trim();
    const roleSelect = document.getElementById('inputAuthorRole');
    const role = roleSelect.value;
    const roleLabel = roleSelect.options[roleSelect.selectedIndex].text;

    const heroSelect = document.getElementById('inputDedicationHero');
    const dedicationId = heroSelect.value;
    let dedicationName = heroSelect.options[heroSelect.selectedIndex].text.replace('⭐️ Памяти ', '').replace('🕊 ', '');

    const message = document.getElementById('inputMessageText').value.trim();
    const theme = document.querySelector('input[name="cardTheme"]:checked')?.value || 'theme-parchment';

    if (!author || !message) return;

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
      is_verified: (role === 'teacher' || role === 'family')
    };

    // 1. Отправляем в глобальное облако Supabase
    let savedToCloud = false;
    if (typeof CloudSync !== 'undefined' && CloudSync.isLive) {
      savedToCloud = await CloudSync.sendTribute(newTribute);
    }

    // 2. Добавляем себе на экран
    this.tributes.unshift(newTribute);
    this.userFlames[newTribute.id] = true;
    localStorage.setItem('srmk_guestbook_entries_v2', JSON.stringify(this.tributes));
    localStorage.setItem('srmk_user_flames_v2', JSON.stringify(this.userFlames));

    this.closeModal();
    this.renderWall();
    this.updateStats();
    document.getElementById('tributeForm').reset();
    
    this.playChime(880);
    this.showToast(savedToCloud || typeof CloudSync === 'undefined' || !CloudSync.isLive
      ? "Ваше послание опубликовано в глобальной Книге Памяти!"
      : "Облако не приняло послание. Оно сохранено только на этом устройстве.");
  },

  /**
   * 4. Зажжение лампады (Синхронизация лайков)
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

    localStorage.setItem('srmk_user_flames_v2', JSON.stringify(this.userFlames));
    this.renderWall();

    // Отправляем лайк в облако
    if (typeof CloudSync !== 'undefined' && CloudSync.isLive) {
      await CloudSync.toggleFlame(tributeId, delta);
    }
  },

  // --- ОСТАЛЬНЫЕ ФУНКЦИИ (Отрисовка, Звук, UI) ---
  renderWall() {
    const container = document.getElementById('wallGridContainer');
    if (!container) return;

    const query = this.searchQuery.toLowerCase().trim();
    const filtered = this.tributes.filter(item => {
      const matchHero = (this.activeFilterHero === 'all') || (item.dedication_id === this.activeFilterHero);
      const matchRole = (this.activeFilterRole === 'all') || (item.role === this.activeFilterRole);
      let matchQuery = true;
      if (query) {
        matchQuery = item.author.toLowerCase().includes(query) || item.message.toLowerCase().includes(query);
      }
      return matchHero && matchRole && matchQuery;
    });

    if (filtered.length === 0) {
      container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 50px; color: #fff;">Посланий пока нет. Станьте первым!</div>`;
      return;
    }

    container.innerHTML = filtered.map(tribute => {
      const isLit = !!this.userFlames[tribute.id];
      return `
        <article class="tribute-card ${tribute.theme}" id="${tribute.id}">
          <div>
            <div class="card-header-row">
              <div class="author-info">
                <span class="author-name">${this.escapeHtml(tribute.author)}</span>
                <span class="role-pill">${tribute.role_label}</span>
              </div>
            </div>
            <div class="dedication-badge">🕊 Посвящение: <strong>${this.escapeHtml(tribute.dedication_name)}</strong></div>
            <p class="tribute-body-text">«${this.escapeHtml(tribute.message)}»</p>
          </div>
          <div class="card-footer-row">
            <button class="btn-flame-tribute ${isLit ? 'active' : ''}" onclick="GuestbookEngine.toggleFlame('${tribute.id}')">
              <span>🕯</span> <span class="flame-count">${tribute.flames || 0}</span>
            </button>
          </div>
        </article>
      `;
    }).join('');
  },

  populateHeroDropdowns() {
    const filterSelect = document.getElementById('gbHeroFilterSelect');
    const formSelect = document.getElementById('inputDedicationHero');
    if (typeof heroesDatabase !== 'undefined') {
      heroesDatabase.forEach(hero => {
        if (filterSelect) filterSelect.innerHTML += `<option value="${hero.id}">⭐️ ${hero.name}</option>`;
        if (formSelect) formSelect.innerHTML += `<option value="${hero.id}">⭐️ Памяти ${hero.name}</option>`;
      });
    }
  },

  updateStats() {
    const msgEl = document.getElementById('totalMessagesStat');
    if (msgEl) msgEl.textContent = this.tributes.length;
  },

  bindDOMEvents() {
    document.getElementById('btnOpenModalForm')?.addEventListener('click', () => this.openModal());
    document.getElementById('gbSearchInput')?.addEventListener('input', (e) => { this.searchQuery = e.target.value; this.renderWall(); });
    document.getElementById('gbHeroFilterSelect')?.addEventListener('change', (e) => { this.activeFilterHero = e.target.value; this.renderWall(); });
    document.getElementById('gbRoleFilterSelect')?.addEventListener('change', (e) => { this.activeFilterRole = e.target.value; this.renderWall(); });
  },

  openModal() { document.getElementById('gbModal')?.classList.add('active'); },
  closeModal() { document.getElementById('gbModal')?.classList.remove('active'); },

  playChime(freq = 660) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!this.audioCtx) this.audioCtx = new AudioCtx();
      const ctx = this.audioCtx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
  },

  escapeHtml(str) { return str ? str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag])) : ''; },
  showToast(msg) {
    const toast = document.getElementById('gbToast');
    if (toast) { toast.textContent = msg; toast.classList.add('active'); setTimeout(() => toast.classList.remove('active'), 3000); }
  }
};

window.GuestbookEngine = GuestbookEngine;

document.addEventListener('DOMContentLoaded', () => GuestbookEngine.init());