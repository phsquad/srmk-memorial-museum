/**
 * ============================================================================
 * ЕДИНАЯ СИСТЕМА ДОСТИЖЕНИЙ И ВОИНСКИХ ЗВАНИЙ: js/achievements-engine.js
 * Мемориально-образовательный комплекс ГБПОУ СРМК «Быть воином — жить вечно»
 * 
 * Включает:
 * 1. 16 наградных боевых бейджей (испытания квиза + действия в музее)
 * 2. 8 воинских рангов с прогрессией очков опыта (XP)
 * 3. Кросс-модульную фиксацию свечей, цветов, аудиогидов, чтения Книги Памяти
 * 4. Интерактивную витрину наград и модальное окно достижений
 * ============================================================================
 */

'use strict';

const AchievementsEngine = {
  // 8 ВОИНСКИХ РАНГОВ
  RANKS: [
    { id: 'private',     title: 'Рядовой',                 minXP: 0,    maxXP: 149,  icon: '🎖',  insignia: '1 полоса' },
    { id: 'gefreiter',   title: 'Ефрейтор',                minXP: 150,  maxXP: 349,  icon: '🎖🎖', insignia: '2 полосы' },
    { id: 'jr_sergeant', title: 'Младший сержант',         minXP: 350,  maxXP: 699,  icon: '⭐️',   insignia: '1 лычка' },
    { id: 'sergeant',    title: 'Сержант',                 minXP: 700,  maxXP: 1199, icon: '⭐️⭐️', insignia: '2 лычки' },
    { id: 'starshina',   title: 'Старшина',                minXP: 1200, maxXP: 1799, icon: '⭐️⭐️⭐️', insignia: 'Шеврон' },
    { id: 'jr_lieut',    title: 'Младший лейтенант',       minXP: 1800, maxXP: 2499, icon: '🌟',   insignia: 'Офицерская звезда' },
    { id: 'captain',     title: 'Гвардии капитан',         minXP: 2500, maxXP: 3499, icon: '🌟🌟', insignia: 'Гвардейский знак' },
    { id: 'custodian',   title: 'Хранитель Мемориала',     minXP: 3500, maxXP: 99999, icon: '👑',  insignia: 'Золотая медаль' }
  ],

  // 16 БОЕВЫХ И МУЗЕЙНЫХ ДОСТИЖЕНИЙ
  BADGES: [
    // --- Категория: Знания и Квест ---
    {
      id: 'badge_first_blood',
      category: 'quiz',
      icon: '🎯',
      title: 'Боевое крещение',
      desc: 'Завершите любое тестирование исторического квеста музея.',
      xp: 50
    },
    {
      id: 'badge_sharpshooter',
      category: 'quiz',
      icon: '⚡',
      title: 'Снайпер фактов',
      desc: 'Ответьте правильно на 5 вопросов квеста подряд без ошибок.',
      xp: 100
    },
    {
      id: 'badge_winner',
      category: 'quiz',
      icon: '🏆',
      title: 'Кавалер доблести',
      desc: 'Сдайте норматив квеста (8 и более баллов из 10).',
      xp: 150
    },
    {
      id: 'badge_perfect',
      category: 'quiz',
      icon: '👑',
      title: 'Абсолютный триумф',
      desc: 'Наберите максимальные 100% баллов без единой ошибки.',
      xp: 250
    },
    {
      id: 'badge_speedrun',
      category: 'quiz',
      icon: '⏱',
      title: 'Молниеносный ответ',
      desc: 'Дайте верный ответ на вопрос квеста быстрее чем за 5 секунд.',
      xp: 75
    },
    {
      id: 'badge_no_hints',
      category: 'quiz',
      icon: '🧠',
      title: 'Своим умом',
      desc: 'Пройдите квест целиком, не использовав ни одной подсказки.',
      xp: 120
    },
    {
      id: 'badge_marathon',
      category: 'quiz',
      icon: '🎖',
      title: 'Железная стойкость',
      desc: 'Пройдите «Большой марафон: 20 героев» от начала до конца.',
      xp: 300
    },
    {
      id: 'badge_historian',
      category: 'quiz',
      icon: '📜',
      title: 'Летописец СРМК',
      desc: 'Пройдите все 4 тематических направления исторического квеста.',
      xp: 250
    },

    // --- Категория: Музейные действия и Память ---
    {
      id: 'badge_candle_light',
      category: 'memorial',
      icon: '🕯',
      title: 'Свеча Памяти',
      desc: 'Зажгите виртуальную лампаду на Мемориале Славы колледжа.',
      xp: 50
    },
    {
      id: 'badge_vigil',
      category: 'memorial',
      icon: '🔥',
      title: 'Вечный дозор',
      desc: 'Зажгите свечи памяти как минимум 5 разным выпускникам-героям.',
      xp: 150
    },
    {
      id: 'badge_flowers',
      category: 'memorial',
      icon: '💐',
      title: 'Алые гвоздики',
      desc: 'Возложите цветы к Мемориалу Славы павших воинов.',
      xp: 50
    },
    {
      id: 'badge_audio_listener',
      category: 'memorial',
      icon: '🎧',
      title: 'Голос подвига',
      desc: 'Прослушайте аудиоэкскурсию музея или личный аудиогид героя.',
      xp: 60
    },
    {
      id: 'badge_reader',
      category: 'memorial',
      icon: '📖',
      title: 'Хранитель летописи',
      desc: 'Изучите биографические очерки в Электронной Книге Памяти.',
      xp: 75
    },
    {
      id: 'badge_desk_builder',
      category: 'memorial',
      icon: '🪑',
      title: 'За партой Героя',
      desc: 'Сформируйте настенную или настольную памятную табличку А4 с QR-кодом.',
      xp: 100
    },
    {
      id: 'badge_tribute_writer',
      category: 'memorial',
      icon: '🕊',
      title: 'Слово благодарности',
      desc: 'Оставьте памятное послание на цифровой Стене Памяти музея.',
      xp: 80
    },
    {
      id: 'badge_certified',
      category: 'memorial',
      icon: '📜',
      title: 'Наградной лист',
      desc: 'Оформите именной Сертификат участника с уникальным номером реестра.',
      xp: 150
    }
  ],

  init() {
    this.ensureState();
    this.injectUI();
    this.updateHeaderRankDisplay();
    window.addEventListener('srmk-achievements-updated', () => this.updateHeaderRankDisplay());
    console.log(`[AchievementsEngine] Ядро активно. Текущий ранг: ${this.getCurrentRank().title} (${this.getXP()} XP)`);
  },

  injectUI() {
    // 1. Добавление кнопки ранга в шапку сайта (если есть .header-actions)
    const headerActions = document.querySelector('.site-header .header-actions');
    if (headerActions && !document.getElementById('btnHeaderRankBadge')) {
      const rankBtn = document.createElement('button');
      rankBtn.id = 'btnHeaderRankBadge';
      rankBtn.className = 'btn-header-rank-badge';
      rankBtn.type = 'button';
      rankBtn.title = 'Ваш воинский ранг и наградные бейджи';
      rankBtn.onclick = () => this.openModal();
      // Вставляем перед кнопкой сертификата или паспорта
      const certBtn = headerActions.querySelector('.btn-header-cert');
      if (certBtn) {
        headerActions.insertBefore(rankBtn, certBtn);
      } else {
        headerActions.appendChild(rankBtn);
      }
    }

    // 2. Добавление пункта в мобильное меню (если есть .mobile-drawer .drawer-content)
    const drawerContent = document.querySelector('.mobile-drawer .drawer-content');
    if (drawerContent && !document.getElementById('drawerAchievementsLink')) {
      const drawerLink = document.createElement('button');
      drawerLink.id = 'drawerAchievementsLink';
      drawerLink.className = 'drawer-link drawer-rank-link';
      drawerLink.type = 'button';
      drawerLink.style.cssText = 'text-align:left; background:transparent; border:none; cursor:pointer; width:100%;';
      drawerLink.onclick = () => {
        const drawer = document.getElementById('mobileDrawer');
        if (drawer) drawer.classList.remove('open');
        this.openModal();
      };
      // Вставляем перед "Реестр верификации"
      const verLink = drawerContent.querySelector('a[href*="verify.html"]');
      if (verLink) {
        drawerContent.insertBefore(drawerLink, verLink);
      } else {
        drawerContent.appendChild(drawerLink);
      }
    }

    // 3. Плавающий компактный индикатор ранга в нижнем правом углу
    if (!document.getElementById('floatingRankWidget')) {
      const floatEl = document.createElement('div');
      floatEl.id = 'floatingRankWidget';
      floatEl.className = 'floating-rank-widget';
      floatEl.onclick = () => this.openModal();
      floatEl.title = 'Воинский ранг и 16 боевых наград (нажмите для открытия)';
      document.body.appendChild(floatEl);
    }
  },

  updateHeaderRankDisplay() {
    const rank = this.getCurrentRank();
    const xp = this.getXP();
    const unlocked = this.getUnlockedBadges().length;

    const hdrBtn = document.getElementById('btnHeaderRankBadge');
    if (hdrBtn) {
      hdrBtn.innerHTML = `<span class="rank-btn-icon">${rank.icon}</span> <span class="rank-btn-title">${rank.title}</span> <span class="rank-btn-xp">${xp} XP</span>`;
    }

    const drawerLink = document.getElementById('drawerAchievementsLink');
    if (drawerLink) {
      drawerLink.innerHTML = `🎖 Звание: <strong>${rank.title}</strong> (${xp} XP) • ${unlocked}/16 наград`;
    }

    const floatEl = document.getElementById('floatingRankWidget');
    if (floatEl) {
      floatEl.innerHTML = `
        <div class="fl-rank-icon">${rank.icon}</div>
        <div class="fl-rank-meta">
          <span class="fl-rank-title">${rank.title}</span>
          <span class="fl-rank-xp">${xp} XP</span>
        </div>
      `;
    }

    // Если открыто модальное окно — обновим его
    if (document.getElementById('achievementsModal')?.classList.contains('active')) {
      this.renderModalContent();
    }
  },

  openModal() {
    let modal = document.getElementById('achievementsModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'achievementsModal';
      modal.className = 'achievements-modal-overlay';
      modal.innerHTML = `
        <div class="achievements-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="modalRankHeaderTitle">
          <div class="achieve-modal-header">
            <div style="display:flex; align-items:center; gap:12px;">
              <span style="font-size:1.8rem;">🏛</span>
              <div>
                <h2 id="modalRankHeaderTitle" style="font-family:'Cinzel',serif; font-size:1.3rem; color:var(--primary-gold,#c5a059); margin:0;">
                  Наградная палата и воинские чины
                </h2>
                <span style="font-size:0.8rem; color:#9da6b3;">Мемориально-образовательный комплекс ГБПОУ СРМК</span>
              </div>
            </div>
            <button class="achieve-modal-close" onclick="AchievementsEngine.closeModal()" type="button" aria-label="Закрыть">✕</button>
          </div>
          <div class="achieve-modal-body" id="achieveModalBody">
            <!-- Динамический рендер содержимого -->
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      // Закрытие по клику на фон и Escape
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModal();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) this.closeModal();
      });
    }

    this.activeTab = 'all';
    this.renderModalContent();
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  },

  closeModal() {
    const modal = document.getElementById('achievementsModal');
    if (modal) {
      modal.classList.remove('active');
    }
    document.body.style.overflow = '';
  },

  renderModalContent() {
    const body = document.getElementById('achieveModalBody');
    if (!body) return;

    const rank = this.getCurrentRank();
    const nextRank = this.getNextRank();
    const xp = this.getXP();
    const progress = this.getRankProgressPercent();
    const unlocked = this.getUnlockedBadges();
    const totalBadges = this.BADGES.length;
    const filter = this.activeTab || 'all';

    let filteredBadges = this.BADGES;
    if (filter === 'quiz') filteredBadges = this.BADGES.filter(b => b.category === 'quiz');
    else if (filter === 'memorial') filteredBadges = this.BADGES.filter(b => b.category === 'memorial');
    else if (filter === 'unlocked') filteredBadges = this.BADGES.filter(b => unlocked.includes(b.id));

    body.innerHTML = `
      <!-- Карточка текущего воинского чина -->
      <div class="modal-rank-card">
        <div class="rank-badge-large">
          <span class="rank-large-icon">${rank.icon}</span>
        </div>
        <div class="rank-card-info">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:8px;">
            <div>
              <span style="font-size:0.75rem; text-transform:uppercase; letter-spacing:1.5px; color:#c5a059; font-weight:700;">Ваше текущее звание:</span>
              <h3 style="font-family:'Cinzel',serif; font-size:1.4rem; color:#ffffff; margin:2px 0 6px;">${rank.title}</h3>
              <span class="rank-insignia-pill">${rank.insignia}</span>
            </div>
            <div style="text-align:right;">
              <span style="font-size:1.4rem; font-weight:900; color:#c5a059;">${xp} XP</span>
              <div style="font-size:0.75rem; color:#9da6b3;">
                ${nextRank ? `До «${nextRank.title}»: ${nextRank.minXP - xp} XP` : 'Максимальный чин'}
              </div>
            </div>
          </div>

          <div class="modal-rank-progress-track" style="margin-top:14px;">
            <div class="modal-rank-progress-fill" style="width:${progress}%;"></div>
          </div>

          <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:#9da6b3; margin-top:6px;">
            <span>${rank.minXP} XP</span>
            <span>Прогресс: ${progress}%</span>
            <span>${nextRank ? nextRank.minXP + ' XP' : '∞'}</span>
          </div>
        </div>
      </div>

      <!-- Лестница званий -->
      <div class="ranks-ladder-container">
        <div class="ranks-ladder-title">Иерархия званий комплекса:</div>
        <div class="ranks-ladder-scroll">
          ${this.RANKS.map(r => {
            const isCurrent = r.id === rank.id;
            const isAchieved = xp >= r.minXP;
            return `
              <div class="ladder-rank-step ${isCurrent ? 'current' : ''} ${isAchieved ? 'achieved' : 'locked'}">
                <span class="step-icon">${r.icon}</span>
                <span class="step-title">${r.title}</span>
                <span class="step-xp">${r.minXP} XP</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Фильтры наград -->
      <div class="achieve-tabs-bar">
        <button type="button" class="achieve-tab-btn ${filter === 'all' ? 'active' : ''}" onclick="AchievementsEngine.setTab('all')">
          Все награды (${totalBadges})
        </button>
        <button type="button" class="achieve-tab-btn ${filter === 'quiz' ? 'active' : ''}" onclick="AchievementsEngine.setTab('quiz')">
          Квест и знания (8)
        </button>
        <button type="button" class="achieve-tab-btn ${filter === 'memorial' ? 'active' : ''}" onclick="AchievementsEngine.setTab('memorial')">
          Музей и память (8)
        </button>
        <button type="button" class="achieve-tab-btn ${filter === 'unlocked' ? 'active' : ''}" onclick="AchievementsEngine.setTab('unlocked')">
          Полученные (${unlocked.length})
        </button>
      </div>

      <!-- Сетка наградных бейджей -->
      <div class="achieve-badges-grid">
        ${filteredBadges.map(b => {
          const isUnlocked = unlocked.includes(b.id);
          return `
            <div class="achieve-badge-card ${isUnlocked ? 'unlocked' : 'locked'}">
              <div class="badge-card-top">
                <span class="badge-card-icon">${b.icon}</span>
                <span class="badge-status-tag ${isUnlocked ? 'tag-unlocked' : 'tag-locked'}">
                  ${isUnlocked ? '✓ Открыто' : '🔒 Закрыто'}
                </span>
              </div>
              <h4 class="badge-card-title">${b.title}</h4>
              <p class="badge-card-desc">${b.desc}</p>
              <div class="badge-card-footer">
                <span class="badge-xp-reward">+${b.xp} XP</span>
                <span class="badge-cat-label">${b.category === 'quiz' ? 'Квест' : 'Музей'}</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Быстрые действия для набора очков -->
      <div class="achieve-quick-actions">
        <span style="font-size:0.85rem; color:#9da6b3;">Как повысить воинский чин:</span>
        <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:8px;">
          <a href="quiz.html" class="achieve-action-chip">⚔️ Пройти исторический квест (+50–250 XP)</a>
          <a href="index.html#memorial" class="achieve-action-chip">🕯 Зажечь Свечу Памяти (+15 XP)</a>
          <a href="index.html#memorial" class="achieve-action-chip">💐 Возложить живые гвоздики (+20 XP)</a>
          <a href="desk-qr.html" class="achieve-action-chip">🪑 Создать Парту Героя (+50 XP)</a>
          <a href="memory-book.html" class="achieve-action-chip">📖 Читать Книгу Памяти (+25 XP)</a>
          <a href="guestbook.html" class="achieve-action-chip">🕊 Оставить послание (+40 XP)</a>
        </div>
      </div>
    `;
  },

  setTab(tab) {
    this.activeTab = tab;
    this.renderModalContent();
  },

  ensureState() {
    try {
      if (!localStorage.getItem('srmk_user_xp')) {
        localStorage.setItem('srmk_user_xp', '0');
      }
      if (!localStorage.getItem('srmk_unlocked_badges')) {
        // По умолчанию разблокируем "Свечу памяти", если свечи уже зажигались
        const candles = JSON.parse(localStorage.getItem('srmk_museum_candles_v3') || '{}');
        const initial = [];
        if (Object.keys(candles).length > 0) initial.push('badge_candle_light');
        localStorage.setItem('srmk_unlocked_badges', JSON.stringify(initial));
      }
      if (!localStorage.getItem('srmk_achievements_stats')) {
        localStorage.setItem('srmk_achievements_stats', JSON.stringify({
          candlesLitHeroes: [],
          flowersLaid: 0,
          audioHeard: 0,
          chaptersRead: 0,
          quizzesPassed: 0,
          modesCompleted: []
        }));
      }
    } catch (e) {
      console.warn('[AchievementsEngine] Ошибка чтения LocalStorage:', e);
    }
  },

  getXP() {
    try {
      return parseInt(localStorage.getItem('srmk_user_xp') || '0', 10);
    } catch (e) {
      return 0;
    }
  },

  addXP(amount, reason = "") {
    if (amount <= 0) return;
    const oldXP = this.getXP();
    const oldRank = this.getRankByXP(oldXP);
    const newXP = oldXP + amount;

    try {
      localStorage.setItem('srmk_user_xp', String(newXP));
    } catch (e) {}

    const newRank = this.getRankByXP(newXP);

    // Уведомление о начислении опыта
    if (window.MemorialToast && reason) {
      MemorialToast.show(`+${amount} XP: ${reason}`, 'tribute', 2500);
    }

    // Проверка повышения воинского звания
    if (newRank.id !== oldRank.id) {
      this.celebrateRankUp(newRank);
    }

    this.dispatchUpdateEvent();
  },

  getRankByXP(xp) {
    for (let i = this.RANKS.length - 1; i >= 0; i--) {
      if (xp >= this.RANKS[i].minXP) return this.RANKS[i];
    }
    return this.RANKS[0];
  },

  getCurrentRank() {
    return this.getRankByXP(this.getXP());
  },

  getNextRank() {
    const current = this.getCurrentRank();
    const idx = this.RANKS.findIndex(r => r.id === current.id);
    return idx < this.RANKS.length - 1 ? this.RANKS[idx + 1] : null;
  },

  getRankProgressPercent() {
    const current = this.getCurrentRank();
    const next = this.getNextRank();
    if (!next) return 100;
    const xp = this.getXP();
    const range = next.minXP - current.minXP;
    const currentProgress = xp - current.minXP;
    return Math.min(100, Math.max(0, Math.round((currentProgress / range) * 100)));
  },

  getUnlockedBadges() {
    try {
      return JSON.parse(localStorage.getItem('srmk_unlocked_badges') || '[]');
    } catch (e) {
      return [];
    }
  },

  isBadgeUnlocked(badgeId) {
    return this.getUnlockedBadges().includes(badgeId);
  },

  unlockBadge(badgeId) {
    const badge = this.BADGES.find(b => b.id === badgeId);
    if (!badge) return false;

    const unlocked = this.getUnlockedBadges();
    if (unlocked.includes(badgeId)) return false;

    unlocked.push(badgeId);
    try {
      localStorage.setItem('srmk_unlocked_badges', JSON.stringify(unlocked));
    } catch (e) {}

    // Начисление XP за достижение
    this.addXP(badge.xp);

    // Торжественное уведомление
    if (window.MemorialToast) {
      MemorialToast.show(`🎖 Получена награда: <strong>${badge.title}</strong> (+${badge.xp} XP)`, 'success', 4500);
    }
    this.playCelebrationSound();
    this.dispatchUpdateEvent();
    return true;
  },

  celebrateRankUp(newRank) {
    setTimeout(() => {
      if (window.MemorialToast) {
        MemorialToast.show(`⭐️ ПОВЫШЕНИЕ В ЗВАНИИ! Вам присвоен чин: <strong>${newRank.title}</strong> ${newRank.icon}`, 'success', 5000);
      }
      this.playFanfareSound();
    }, 400);
  },

  playFanfareSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.12);
        gain.gain.setValueAtTime(0.25, now + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 0.6);
      });
    } catch (e) {}
  },

  playCelebrationSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      [784, 988, 1174].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0.15, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.4);
      });
    } catch (e) {}
  },

  dispatchUpdateEvent() {
    window.dispatchEvent(new CustomEvent('srmk-achievements-updated', {
      detail: {
        xp: this.getXP(),
        rank: this.getCurrentRank(),
        unlockedCount: this.getUnlockedBadges().length,
        totalBadges: this.BADGES.length
      }
    }));
  },

  // Вспомогательные трекеры для действий в музее
  trackCandleLit(heroId) {
    try {
      const stats = JSON.parse(localStorage.getItem('srmk_achievements_stats') || '{}');
      stats.candlesLitHeroes = stats.candlesLitHeroes || [];
      if (!stats.candlesLitHeroes.includes(heroId)) {
        stats.candlesLitHeroes.push(heroId);
      }
      localStorage.setItem('srmk_achievements_stats', JSON.stringify(stats));

      this.unlockBadge('badge_candle_light');
      this.addXP(15, "Свеча Памяти герою");

      if (stats.candlesLitHeroes.length >= 5) {
        this.unlockBadge('badge_vigil');
      }
    } catch (e) {}
  },

  trackFlowersLaid() {
    this.unlockBadge('badge_flowers');
    this.addXP(20, "Возложение гвоздик");
  },

  trackAudioListened() {
    this.unlockBadge('badge_audio_listener');
    this.addXP(30, "Прослушивание аудиоэкскурсии");
  },

  trackReaderOpened() {
    this.unlockBadge('badge_reader');
    this.addXP(25, "Изучение Книги Памяти");
  },

  trackDeskGenerated() {
    this.unlockBadge('badge_desk_builder');
    this.addXP(50, "Оформление Парты Героя");
  },

  trackTributeWritten() {
    this.unlockBadge('badge_tribute_writer');
    this.addXP(40, "Послание на Стене Памяти");
  },

  trackCertificateIssued() {
    this.unlockBadge('badge_certified');
    this.addXP(100, "Верификация в реестре сертификатов");
  }
};

window.AchievementsEngine = AchievementsEngine;
document.addEventListener('DOMContentLoaded', () => AchievementsEngine.init());
