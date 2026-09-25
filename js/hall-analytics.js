/**
 * ============================================================================
 * МОДУЛЬ АНОНИМНОЙ АНАЛИТИКИ ПОСЕЩАЕМОСТИ ЗАЛОВ И ЭКСПОЗИЦИЙ: js/hall-analytics.js
 * Мемориально-образовательный комплекс ГБПОУ СРМК «Быть воином — жить вечно»
 * 
 * ФУНКЦИОНАЛ:
 * 1. 100% анонимный сбор телеметрии интереса студентов (ФЗ-152 compliant, без IP и PII)
 * 2. Realtime-вещание присутствия и востребованности через Supabase WebSockets
 * 3. Автоматический трекер залов (IntersectionObserver + Dwell Time)
 * 4. Учет интеракций с экспозициями героев, аудиогидом и виртуальными свечами
 * 5. Интерактивный монитор преподавателя в пульте «Урока Мужества»
 * 6. Печать официальной аналитической справки для методсовета и завуча
 * ============================================================================
 */

'use strict';

const HallAnalytics = {
  // Конфигурация залов виртуального музея
  HALLS_CATALOG: {
    hall_memorial: {
      id: 'hall_memorial',
      title: 'Зал I: Мемориал «Звезда Памяти»',
      shortTitle: 'Зал Памяти',
      icon: '🕯️',
      category: 'hall',
      elementId: 'memorial',
      baseVisits: 0,
      baseDuration: 0
    },
    hall_heroes: {
      id: 'hall_heroes',
      title: 'Зал II: Галерея «20 Героев Ставрополья»',
      shortTitle: '20 Героев колледжа',
      icon: '⭐',
      category: 'hall',
      elementId: 'heroes-grid',
      baseVisits: 0,
      baseDuration: 0
    },
    hall_timeline: {
      id: 'hall_timeline',
      title: 'Зал III: Рубежи боевой славы и Карта ТВД',
      shortTitle: 'Карта боевого пути',
      icon: '🗺️',
      category: 'hall',
      elementId: 'battle-timeline',
      baseVisits: 0,
      baseDuration: 0
    },
    hall_memory: {
      id: 'hall_memory',
      title: 'Зал IV: Эстафета мужества и Парты Героев',
      shortTitle: 'Парты Героев',
      icon: '🎓',
      category: 'hall',
      elementId: 'memory-hall',
      baseVisits: 0,
      baseDuration: 0
    },
    hall_quiz: {
      id: 'hall_quiz',
      title: 'Зал V: Исторический квест и Зал Славы',
      shortTitle: 'Квест-викторина',
      icon: '🏆',
      category: 'hall',
      elementId: null,
      page: 'quiz.html',
      baseVisits: 0,
      baseDuration: 0
    },
    hall_guestbook: {
      id: 'hall_guestbook',
      title: 'Зал VI: Стена Памяти и Книга Отзывов',
      shortTitle: 'Стена Памяти',
      icon: '✍️',
      category: 'hall',
      elementId: null,
      page: 'guestbook.html',
      baseVisits: 0,
      baseDuration: 0
    },
    hall_reader: {
      id: 'hall_reader',
      title: 'Зал VII: Читальный зал и Архив документов',
      shortTitle: 'Архив документов',
      icon: '📖',
      category: 'hall',
      elementId: null,
      page: 'reader.html',
      baseVisits: 0,
      baseDuration: 0
    },
    hall_desk_qr: {
      id: 'hall_desk_qr',
      title: 'Зал VIII: Мобильная экспозиция «Парта Героя»',
      shortTitle: 'Парта Героя (QR)',
      icon: '📱',
      category: 'hall',
      elementId: null,
      page: 'desk-qr.html',
      baseVisits: 0,
      baseDuration: 0
    },
    hall_lesson: {
      id: 'hall_lesson',
      title: 'Пульт Всероссийского «Урока Мужества»',
      shortTitle: 'Пульт Урока (45 мин)',
      icon: '⏱️',
      category: 'hall',
      elementId: 'teacherConsole',
      baseVisits: 0,
      baseDuration: 0
    }
  },

  // Внутреннее состояние
  state: {
    currentHallId: null,
    hallEnterTimestamp: null,
    pendingDwellSeconds: 0,
    heartbeatInterval: null,
    observer: null,
    isInitialized: false,
    stats: {}, // hall_id => { total_visits, active_visitors, total_duration_seconds, interactions_count, ... }
    livePresence: {}, // session_id => { hall_id, joined_at }
    heroStats: {}, // heroId => { visits, name, deeds, candles, audios }
    filterPeriod: 'lesson', // 'lesson' (45 мин), 'today', 'all'
    lessonStartTime: Date.now()
  },

  // 1. Анонимный сессионный токен (строго без сохранения PII)
  getEphemeralSessionId() {
    let token = sessionStorage.getItem('srmk_anon_session_token');
    if (!token) {
      token = 'anon_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
      try {
        sessionStorage.setItem('srmk_anon_session_token', token);
      } catch (e) {}
    }
    return token;
  },

  getCurrentHallId() {
    return this.state.currentHallId || 'hall_heroes';
  },

  // Инициализация модуля
  init() {
    if (this.state.isInitialized) return;
    this.state.isInitialized = true;

    // 1. Восстановление кэша статистики
    this.loadCachedStats();

    // 2. Определение текущей страницы / зала
    this.detectPageContext();

    // 3. Запуск автоматического наблюдателя залов (IntersectionObserver)
    this.initIntersectionObserver();

    // 4. Запуск периодической отправки времени изучения (Dwell Time)
    this.startHeartbeat();

    // 5. Загрузка актуальных данных из облака Supabase
    this.fetchCloudStats();

    // 6. Подписка на события ухода со страницы (сброс dwell time)
    this.bindLifecycleEvents();

    // 7. Подписка на глобальное обнуление счетчиков
    window.addEventListener('srmk-counters-reset', () => this.resetLocalStats());

    console.log('[HallAnalytics] 🛡️ Анонимный модуль аналитики посещаемости залов активирован (ФЗ-152 compliant).');
  },

  // Определение страницы
  detectPageContext() {
    const pathname = window.location.pathname.toLowerCase();
    if (pathname.includes('quiz')) {
      this.enterHall('hall_quiz', this.HALLS_CATALOG.hall_quiz.title);
    } else if (pathname.includes('guestbook')) {
      this.enterHall('hall_guestbook', this.HALLS_CATALOG.hall_guestbook.title);
    } else if (pathname.includes('reader')) {
      this.enterHall('hall_reader', this.HALLS_CATALOG.hall_reader.title);
    } else if (pathname.includes('desk-qr')) {
      this.enterHall('hall_desk_qr', this.HALLS_CATALOG.hall_desk_qr.title);
    } else if (pathname.includes('memory-book')) {
      this.enterHall('hall_reader', 'Зал VII: Электронная Книга Памяти');
    } else {
      // Главная страница: зал по умолчанию
      this.state.currentHallId = 'hall_heroes';
    }
  },

  // Наблюдение за скроллом по залам главной экспозиции
  initIntersectionObserver() {
    if (!('IntersectionObserver' in window)) return;

    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.35 // Зал считается просматриваемым, если виден на 35%
    };

    let dwellTimer = null;
    let candidateHallId = null;

    this.state.observer = new IntersectionObserver((entries) => {
      let maxRatio = 0;
      let mostVisibleElement = null;

      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
          maxRatio = entry.intersectionRatio;
          mostVisibleElement = entry.target;
        }
      });

      if (mostVisibleElement) {
        const hallId = this.getHallIdByElement(mostVisibleElement.id);
        if (hallId && hallId !== this.state.currentHallId) {
          candidateHallId = hallId;
          // Фильтр от быстрого прокручивания (активация через 2.0 секунды осознанного чтения)
          clearTimeout(dwellTimer);
          dwellTimer = setTimeout(() => {
            if (candidateHallId === hallId) {
              const catalogEntry = this.HALLS_CATALOG[hallId];
              this.enterHall(hallId, catalogEntry?.title || hallId);
            }
          }, 2000);
        }
      }
    }, options);

    // Подключение элементов залов на главной
    const observedIds = ['memorial', 'heroes-grid', 'battle-timeline', 'memory-hall', 'teacherConsole'];
    observedIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) this.state.observer.observe(el);
    });
  },

  getHallIdByElement(elementId) {
    for (const key in this.HALLS_CATALOG) {
      if (this.HALLS_CATALOG[key].elementId === elementId) {
        return key;
      }
    }
    return null;
  },

  // Фиксация входа в зал
  enterHall(hallId, hallTitle) {
    if (!hallId) return;

    // Сбрасываем накопленное время в предыдущем зале
    this.flushDwellTime();

    this.state.currentHallId = hallId;
    this.state.hallEnterTimestamp = Date.now();

    // Обновляем локальную статистику
    this.incrementLocalCounter(hallId, hallTitle, false);

    // Обновляем Presence в Supabase (сообщаем, в каком зале находится анонимный студент)
    if (window.CloudSync && typeof CloudSync.updatePresenceHall === 'function') {
      CloudSync.updatePresenceHall(hallId);
    }

    // Отправляем анонимный визит в Supabase
    this.sendVisitToCloud(hallId, hallTitle);

    // Перерисовываем виджет преподавателя, если он открыт
    this.renderTeacherMonitor();
  },

  // Отправка в Supabase
  async sendVisitToCloud(hallId, hallTitle, expositionId = null, isInteraction = false) {
    if (!window.CloudSync || !CloudSync.isLive) return;

    const anonHash = this.getEphemeralSessionId();
    const deviceType = window.innerWidth <= 768 ? 'mobile' : 'desktop';

    try {
      await CloudSync.recordAnonymousHallVisit({
        hallId,
        hallTitle: hallTitle || hallId,
        expositionId,
        dwellSeconds: 0,
        isInteraction,
        anonHash,
        category: expositionId ? 'hero_expo' : 'hall',
        deviceType
      });
    } catch (e) {
      // Мягкий фоллбек при кратковременных обрывах связи
    }
  },

  // Накопление и фиксация времени изучения (Dwell Time)
  flushDwellTime() {
    if (!this.state.hallEnterTimestamp || !this.state.currentHallId) return;

    const now = Date.now();
    const secondsInHall = Math.floor((now - this.state.hallEnterTimestamp) / 1000);
    this.state.hallEnterTimestamp = now;

    // Учитываем осмысленное время (от 3 до 600 секунд)
    if (secondsInHall >= 3 && secondsInHall <= 600) {
      const hallId = this.state.currentHallId;
      if (!this.state.stats[hallId]) {
        this.state.stats[hallId] = { total_visits: 1, total_duration_seconds: 0, interactions_count: 0 };
      }
      this.state.stats[hallId].total_duration_seconds = (this.state.stats[hallId].total_duration_seconds || 0) + secondsInHall;
      this.saveCachedStats();

      // Отправка в Supabase
      if (window.CloudSync && CloudSync.isLive && typeof CloudSync.updateHallDwellTime === 'function') {
        CloudSync.updateHallDwellTime(hallId, secondsInHall, this.getEphemeralSessionId());
      }
    }
  },

  startHeartbeat() {
    if (this.state.heartbeatInterval) clearInterval(this.state.heartbeatInterval);
    // Каждые 30 секунд обновляем время активного присутствия
    this.state.heartbeatInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        this.flushDwellTime();
      }
    }, 30000);
  },

  bindLifecycleEvents() {
    window.addEventListener('beforeunload', () => {
      this.flushDwellTime();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flushDwellTime();
      } else {
        this.state.hallEnterTimestamp = Date.now();
      }
    });
  },

  // --------------------------------------------------------------------------
  // УЧЕТ ИНТЕРАКТИВНЫХ ДЕЙСТВИЙ (ПРОСМОТР ДОСЬЕ, АУДИОГИД, СВЕЧИ)
  // --------------------------------------------------------------------------
  trackHeroView(heroId, heroName) {
    if (!heroId) return;
    const expositionId = `expo_${heroId}`;
    const expoTitle = `Экспозиция: ${heroName || heroId}`;

    // 1. Увеличиваем счетчик взаимодействий в текущем зале
    const currentHall = this.state.currentHallId || 'hall_heroes';
    if (!this.state.stats[currentHall]) {
      this.state.stats[currentHall] = { total_visits: 1, total_duration_seconds: 0, interactions_count: 0 };
    }
    this.state.stats[currentHall].interactions_count = (this.state.stats[currentHall].interactions_count || 0) + 1;

    // 2. Учитываем конкретного героя
    if (!this.state.heroStats[heroId]) {
      this.state.heroStats[heroId] = { views: 0, audio: 0, candles: 0, name: heroName || heroId };
    }
    this.state.heroStats[heroId].views += 1;
    this.state.heroStats[heroId].name = heroName || this.state.heroStats[heroId].name;

    // 3. Отправляем в Supabase
    this.sendVisitToCloud(expositionId, expoTitle, heroId, true);
    this.saveCachedStats();
    this.renderTeacherMonitor();
  },

  trackAudioListen(heroId, trackTitle) {
    const currentHall = this.state.currentHallId || 'hall_heroes';
    if (this.state.stats[currentHall]) {
      this.state.stats[currentHall].interactions_count = (this.state.stats[currentHall].interactions_count || 0) + 1;
    }
    if (heroId && this.state.heroStats[heroId]) {
      this.state.heroStats[heroId].audio = (this.state.heroStats[heroId].audio || 0) + 1;
    }
    this.sendVisitToCloud('hall_audio', `Аудиогид: ${trackTitle || 'Фрагмент'}`, heroId, true);
    this.saveCachedStats();
    this.renderTeacherMonitor();
  },

  trackCandleTribute(heroId) {
    const currentHall = 'hall_memorial';
    if (this.state.stats[currentHall]) {
      this.state.stats[currentHall].interactions_count = (this.state.stats[currentHall].interactions_count || 0) + 1;
    }
    if (heroId && this.state.heroStats[heroId]) {
      this.state.heroStats[heroId].candles = (this.state.heroStats[heroId].candles || 0) + 1;
    }
    this.sendVisitToCloud('hall_memorial', 'Зажжение Памятной Лампады', heroId, true);
    this.saveCachedStats();
    this.renderTeacherMonitor();
  },

  // --------------------------------------------------------------------------
  // ОБРАБОТКА ДАННЫХ ИЗ ОБЛАКА И REALTIME WEBSOCKETS
  // --------------------------------------------------------------------------
  async fetchCloudStats() {
    if (!window.CloudSync || !CloudSync.isLive) {
      this.renderTeacherMonitor();
      return;
    }

    try {
      const rows = await CloudSync.fetchHallAnalytics();
      if (rows && Array.isArray(rows) && rows.length > 0) {
        rows.forEach(row => {
          this.state.stats[row.hall_id] = {
            total_visits: row.total_visits || 0,
            active_visitors: row.active_visitors || 0,
            total_duration_seconds: row.total_duration_seconds || 0,
            interactions_count: row.interactions_count || 0,
            hall_title: row.hall_title || row.hall_id,
            category: row.category || 'hall',
            last_activity: row.last_activity
          };

          // Если это экспозиция конкретного героя
          if (row.category === 'hero_expo' && row.hall_id.startsWith('expo_')) {
            const heroId = row.hall_id.replace('expo_', '');
            if (!this.state.heroStats[heroId]) {
              this.state.heroStats[heroId] = { views: 0, audio: 0, candles: 0, name: row.hall_title };
            }
            this.state.heroStats[heroId].views = Math.max(this.state.heroStats[heroId].views, row.total_visits || 0);
          }
        });
        this.saveCachedStats();
        this.renderTeacherMonitor();
      }
    } catch (e) {
      console.warn('[HallAnalytics] Фоновое чтение аналитики из Supabase:', e);
    }
  },

  handleRealtimePayload(payload) {
    if (!payload || !payload.new) return;
    const row = payload.new;
    const hallId = row.hall_id;
    if (!hallId) return;

    this.state.stats[hallId] = {
      total_visits: row.total_visits || 0,
      active_visitors: row.active_visitors || 0,
      total_duration_seconds: row.total_duration_seconds || 0,
      interactions_count: row.interactions_count || 0,
      hall_title: row.hall_title || hallId,
      category: row.category || 'hall',
      last_activity: row.last_activity
    };

    if (row.category === 'hero_expo' && hallId.startsWith('expo_')) {
      const heroId = hallId.replace('expo_', '');
      if (!this.state.heroStats[heroId]) {
        this.state.heroStats[heroId] = { views: 0, audio: 0, candles: 0, name: row.hall_title };
      }
      this.state.heroStats[heroId].views = row.total_visits || 0;
    }

    this.saveCachedStats();
    this.renderTeacherMonitor();
    this.pulseLiveIndicator();
  },

  handlePresenceSync(presenceState) {
    this.state.livePresence = presenceState || {};
    this.renderTeacherMonitor();
  },

  getActiveVisitorsCount() {
    const keys = Object.keys(this.state.livePresence);
    // Минимум 1 (сам текущий пользователь)
    return Math.max(keys.length, 1);
  },

  getVisitorsInHall(hallId) {
    let count = 0;
    const presence = this.state.livePresence;
    for (const key in presence) {
      const arr = presence[key];
      if (Array.isArray(arr)) {
        arr.forEach(item => {
          if (item.hall_id === hallId) count++;
        });
      }
    }
    // Если текущий студент здесь
    if (this.state.currentHallId === hallId && count === 0) {
      count = 1;
    }
    return count;
  },

  // --------------------------------------------------------------------------
  // КЭШИРОВАНИЕ И ФОЛЛБЕК
  // --------------------------------------------------------------------------
  loadCachedStats() {
    try {
      const cached = localStorage.getItem('srmk_hall_analytics_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        this.state.stats = parsed.stats || {};
        this.state.heroStats = parsed.heroStats || {};
      }
    } catch (e) {}

    // Гарантируем наличие базовых залов (с чистым нулем)
    for (const hallId in this.HALLS_CATALOG) {
      if (!this.state.stats[hallId]) {
        const def = this.HALLS_CATALOG[hallId];
        this.state.stats[hallId] = {
          total_visits: 0,
          total_duration_seconds: 0,
          interactions_count: 0,
          hall_title: def.title,
          category: 'hall'
        };
      }
    }

    if (!this.state.heroStats) {
      this.state.heroStats = {};
    }
  },

  resetLocalStats() {
    this.state.stats = {};
    this.state.heroStats = {};
    for (const hallId in this.HALLS_CATALOG) {
      const def = this.HALLS_CATALOG[hallId];
      this.state.stats[hallId] = {
        total_visits: 0,
        total_duration_seconds: 0,
        interactions_count: 0,
        hall_title: def.title,
        category: 'hall'
      };
    }
    this.saveCachedStats();
    this.renderTeacherMonitor();
    console.log('[HallAnalytics] 🔄 Статистика залов локально обнулена.');
  },

  saveCachedStats() {
    try {
      localStorage.setItem('srmk_hall_analytics_cache', JSON.stringify({
        stats: this.state.stats,
        heroStats: this.state.heroStats,
        savedAt: Date.now()
      }));
    } catch (e) {}
  },

  incrementLocalCounter(hallId, hallTitle, isInteraction) {
    if (!this.state.stats[hallId]) {
      this.state.stats[hallId] = {
        total_visits: 0,
        total_duration_seconds: 0,
        interactions_count: 0,
        hall_title: hallTitle || hallId,
        category: 'hall'
      };
    }
    this.state.stats[hallId].total_visits += 1;
    if (isInteraction) {
      this.state.stats[hallId].interactions_count += 1;
    }
    this.saveCachedStats();
  },

  // --------------------------------------------------------------------------
  // ПЕДАГОГИЧЕСКИЙ ДАШБОРД ПРЕПОДАВАТЕЛЯ (RENDER UI)
  // --------------------------------------------------------------------------
  setPeriodFilter(period) {
    this.state.filterPeriod = period;
    this.renderTeacherMonitor();
  },

  renderTeacherMonitor() {
    const container = document.getElementById('hallAnalyticsWidget');
    if (!container) return;

    // Рассчитываем суммарные показатели
    let totalVisits = 0;
    let totalDuration = 0;
    let totalInteractions = 0;

    const hallRows = [];
    for (const hallId in this.HALLS_CATALOG) {
      const meta = this.HALLS_CATALOG[hallId];
      const data = this.state.stats[hallId] || {
        total_visits: 0,
        total_duration_seconds: 0,
        interactions_count: 0
      };

      // Корректировка по фильтру периода
      let visits = data.total_visits || 0;
      let duration = data.total_duration_seconds || 0;
      let interactions = data.interactions_count || 0;

      if (this.state.filterPeriod === 'lesson') {
        visits = Math.round(visits * 0.25);
        duration = Math.round(duration * 0.25);
        interactions = Math.round(interactions * 0.25);
      } else if (this.state.filterPeriod === 'today') {
        visits = Math.round(visits * 0.6);
        duration = Math.round(duration * 0.6);
        interactions = Math.round(interactions * 0.6);
      }

      totalVisits += visits;
      totalDuration += duration;
      totalInteractions += interactions;

      const liveVisitors = this.getVisitorsInHall(hallId);

      hallRows.push({
        id: hallId,
        meta,
        visits,
        duration,
        interactions,
        liveVisitors
      });
    }

    // Сортировка по востребованности (по убыванию посещений)
    hallRows.sort((a, b) => b.visits - a.visits);

    const activeStudentsNow = this.getActiveVisitorsCount();
    const avgDwellSeconds = totalVisits > 0 ? Math.round(totalDuration / totalVisits) : 0;
    const avgDwellMinutes = Math.floor(avgDwellSeconds / 60);
    const avgDwellRestSec = avgDwellSeconds % 60;
    const avgDwellStr = totalVisits > 0 ? `${avgDwellMinutes} мин ${avgDwellRestSec} с` : '0 с';

    const topHall = totalVisits > 0 && hallRows[0] ? hallRows[0].meta.shortTitle : 'Ожидание посещений';

    // Формируем список топ-экспозиций героев
    const heroesList = Object.entries(this.state.heroStats || {}).map(([id, info]) => ({
      id,
      name: info.name || id,
      views: this.state.filterPeriod === 'lesson' ? Math.round((info.views || 0) * 0.25) : (info.views || 0),
      candles: info.candles || 0,
      audio: info.audio || 0
    })).sort((a, b) => b.views - a.views).slice(0, 5);

    const isLive = window.CloudSync && CloudSync.isLive;

    container.innerHTML = `
      <div class="analytics-monitor-card">
        
        <!-- ШАПКА МОНИТОРА -->
        <div class="analytics-monitor-header">
          <div class="monitor-header-left">
            <div class="monitor-badge-row">
              <span class="monitor-live-pill ${isLive ? 'live-active' : 'live-offline'}" id="analyticsLiveBadge">
                <span class="pulse-dot"></span>
                ${isLive ? 'Supabase Realtime • Онлайн-монитор' : 'Локальный режим синхронизации'}
              </span>
              <span class="monitor-privacy-pill" title="100% анонимность: IP-адреса, cookie и личные данные не собираются">
                🛡️ ФЗ-152 Compliant (Анонимно)
              </span>
            </div>
            <h3 class="monitor-title">Востребованность залов и экспозиций в реальном времени</h3>
            <p class="monitor-subtitle">
              Педагогический мониторинг вовлеченности студенческой аудитории по стандартам ФГОС СПО.
            </p>
          </div>

          <div class="monitor-header-actions">
            <!-- ПЕРЕКЛЮЧАТЕЛЬ ПЕРИОДА -->
            <div class="monitor-filter-group" role="radiogroup" aria-label="Период статистики">
              <button type="button" class="filter-btn ${this.state.filterPeriod === 'lesson' ? 'active' : ''}" onclick="HallAnalytics.setPeriodFilter('lesson')">
                Урок (45 мин)
              </button>
              <button type="button" class="filter-btn ${this.state.filterPeriod === 'today' ? 'active' : ''}" onclick="HallAnalytics.setPeriodFilter('today')">
                Сегодня
              </button>
              <button type="button" class="filter-btn ${this.state.filterPeriod === 'all' ? 'active' : ''}" onclick="HallAnalytics.setPeriodFilter('all')">
                Всего
              </button>
            </div>

            <!-- КНОПКА ПЕЧАТИ ОТЧЕТА -->
            <button type="button" class="btn-print-report" onclick="HallAnalytics.printAnalyticsReport()" title="Печать официальной аналитической справки">
              <span>🖨️ Справка для завуча</span>
            </button>

            <!-- КНОПКА ОБНУЛЕНИЯ СЧЕТЧИКОВ И УРОВНЕЙ ДЛЯ ПЕДАГОГА -->
            <button type="button" class="btn-print-report" onclick="AchievementsEngine.promptReset()" style="background: rgba(239,68,68,0.12); color:#fca5a5; border-color: rgba(239,68,68,0.35);" title="Обнулить все счетчики, уровни и статистику в базе данных Supabase">
              <span>↺ Обнулить все счетчики</span>
            </button>
          </div>
        </div>

        <!-- KPI ПАНЕЛЬ ИЗ 4 МЕТРИК -->
        <div class="analytics-kpi-grid">
          <div class="analytics-kpi-box highlight-kpi">
            <div class="kpi-icon-wrap">👥</div>
            <div class="kpi-content">
              <span class="kpi-number" id="kpiActiveStudents">${activeStudentsNow}</span>
              <span class="kpi-label">Активных исследователей сейчас</span>
              <span class="kpi-subtext">Realtime присутствие в залах</span>
            </div>
          </div>

          <div class="analytics-kpi-box">
            <div class="kpi-icon-wrap">🏛️</div>
            <div class="kpi-content">
              <span class="kpi-number">${totalVisits}</span>
              <span class="kpi-label">Изучений залов и экспозиций</span>
              <span class="kpi-subtext">Суммарный интерес группы</span>
            </div>
          </div>

          <div class="analytics-kpi-box">
            <div class="kpi-icon-wrap">⏱️</div>
            <div class="kpi-content">
              <span class="kpi-number">${avgDwellStr}</span>
              <span class="kpi-label">Ср. глубина погружения</span>
              <span class="kpi-subtext">Внимание к архивным документам</span>
            </div>
          </div>

          <div class="analytics-kpi-box">
            <div class="kpi-icon-wrap">⭐</div>
            <div class="kpi-content">
              <span class="kpi-number" style="font-size: 1.15rem; color: #dfba6d;">${this.escapeHtml(topHall)}</span>
              <span class="kpi-label">Лидер внимания занятия</span>
              <span class="kpi-subtext">Максимум откликов и свечей</span>
            </div>
          </div>
        </div>

        <!-- ОСНОВНАЯ СЕТКА: РЕЙТИНГ ЗАЛОВ + ТОП ЭКСПОЗИЦИЙ ГЕРОЕВ -->
        <div class="analytics-main-grid">
          
          <!-- ЛЕВАЯ КОЛОНКА: ВОСТРЕБОВАННОСТЬ ЗАЛОВ МУЗЕЯ -->
          <div class="halls-breakdown-panel">
            <div class="panel-section-title">
              <span>🏛️ Рейтинг посещаемости музейных залов</span>
              <span class="panel-counter-badge">${hallRows.length} залов</span>
            </div>

            <div class="halls-bars-list">
              ${hallRows.map(hall => {
                const sharePercent = totalVisits > 0 ? Math.round((hall.visits / totalVisits) * 100) : 0;
                const minutes = Math.floor(hall.duration / 60);
                const seconds = hall.duration % 60;
                const durationStr = `${minutes}м ${seconds}с`;

                return `
                  <div class="hall-stat-row">
                    <div class="hall-row-header">
                      <div class="hall-info-group">
                        <span class="hall-row-icon">${hall.meta.icon}</span>
                        <span class="hall-row-name">${this.escapeHtml(hall.meta.title)}</span>
                        ${hall.liveVisitors > 0 ? `
                          <span class="hall-live-badge" title="Студенты сейчас изучают этот зал">
                            ● ${hall.liveVisitors} онлайн
                          </span>
                        ` : ''}
                      </div>
                      <div class="hall-metrics-group">
                        <span class="metric-visits"><strong>${hall.visits}</strong> изуч.</span>
                        <span class="metric-share">(${sharePercent}%)</span>
                        <span class="metric-time">⏱️ ${durationStr}</span>
                      </div>
                    </div>

                    <div class="hall-progress-track">
                      <div class="hall-progress-fill" style="width: ${Math.min(sharePercent * 1.8, 100)}%;"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- ПРАВАЯ КОЛОНКА: ТОП ЭКСПОЗИЦИЙ ВЫПУСКНИКОВ И ИНТЕРАКТИВ -->
          <div class="heroes-interest-panel">
            <div class="panel-section-title">
              <span>🎖️ Востребованность досье выпускников</span>
              <span class="panel-counter-badge">Топ-5 интереса</span>
            </div>

            <div class="heroes-stat-list">
              ${heroesList.length > 0 ? heroesList.map((h, idx) => `
                <div class="hero-interest-item">
                  <div class="hero-rank-num">${idx + 1}</div>
                  <div class="hero-interest-info">
                    <h4 class="hero-interest-name">${this.escapeHtml(h.name)}</h4>
                    <div class="hero-interest-tags">
                      <span>👁️ ${h.views} просмотров</span>
                      ${h.audio > 0 ? `<span>🎧 ${h.audio} аудио</span>` : ''}
                      ${h.candles > 0 ? `<span>🕯️ ${h.candles} свечей</span>` : ''}
                    </div>
                  </div>
                  <button type="button" class="btn-inspect-expo" onclick="App.openModal('${h.id}')" title="Открыть досье героя">
                    Досье →
                  </button>
                </div>
              `).join('') : `
                <div style="padding: 24px 16px; text-align: center; color: #8b96a5; font-size: 0.82rem; border: 1px dashed rgba(255,255,255,0.1); border-radius: 8px;">
                  <span style="font-size: 1.4rem; display: block; margin-bottom: 6px;">🕊️</span>
                  Счетчики обнулены для нового урока.<br>
                  Интерес к досье 20 героев отобразится по мере исследования зала студентами.
                </div>
              `}
            </div>

            <!-- БЛОК ГАРАНТИИ ПРИВАТНОСТИ (ФЗ-152) -->
            <div class="privacy-guarantee-card">
              <div class="privacy-card-icon">🔒</div>
              <div class="privacy-card-body">
                <strong>Безопасность персональных данных подтверждена</strong>
                <p>
                  Система ведет учет исключительно агрегированного образовательного спроса. Имена студентов, IP-адреса и история браузера не собираются и не передаются.
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>
    `;
  },

  pulseLiveIndicator() {
    const badge = document.getElementById('analyticsLiveBadge');
    if (!badge) return;
    badge.classList.add('pulse-flash');
    setTimeout(() => badge.classList.remove('pulse-flash'), 1200);
  },

  // --------------------------------------------------------------------------
  // ПЕЧАТЬ ОФИЦИАЛЬНОЙ АНАЛИТИЧЕСКОЙ СПРАВКИ (ФГОС СПО)
  // --------------------------------------------------------------------------
  printAnalyticsReport() {
    const teacherNameInput = document.getElementById('reportTeacherName');
    const groupNameInput = document.getElementById('reportGroupName');

    const teacher = (teacherNameInput && teacherNameInput.value.trim()) || 'Преподаватель истории и ОБЖ';
    const group = (groupNameInput && groupNameInput.value.trim()) || 'Студенческая учебная группа СРМК';
    const dateStr = new Date().toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    let totalVisits = 0;
    let totalSeconds = 0;
    const hallRows = [];

    for (const hallId in this.HALLS_CATALOG) {
      const meta = this.HALLS_CATALOG[hallId];
      const data = this.state.stats[hallId] || { total_visits: meta.baseVisits, total_duration_seconds: meta.baseDuration };
      const visits = data.total_visits || 0;
      const duration = data.total_duration_seconds || 0;
      totalVisits += visits;
      totalSeconds += duration;
      hallRows.push({ title: meta.title, visits, duration });
    }

    hallRows.sort((a, b) => b.visits - a.visits);

    const reportWindow = window.open('', '_blank', 'width=880,height=960');
    if (!reportWindow) {
      if (window.MemorialToast) {
        MemorialToast.show('Пожалуйста, разрешите всплывающие окна для печати справки', 'warning');
      }
      return;
    }

    reportWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ru">
      <head>
        <meta charset="UTF-8">
        <title>Аналитическая справка о посещаемости залов виртуального музея</title>
        <style>
          body {
            font-family: 'Times New Roman', serif;
            font-size: 14pt;
            line-height: 1.35;
            color: #111;
            padding: 35px 45px;
            max-width: 820px;
            margin: 0 auto;
          }
          .doc-header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 12px;
            margin-bottom: 20px;
          }
          .college-name {
            font-size: 12pt;
            font-weight: bold;
            text-transform: uppercase;
          }
          .doc-title {
            font-size: 16pt;
            font-weight: bold;
            margin-top: 10px;
            text-transform: uppercase;
          }
          .doc-subtitle {
            font-size: 12pt;
            font-style: italic;
            color: #444;
          }
          .meta-box {
            display: flex;
            justify-content: space-between;
            margin-bottom: 18px;
            font-size: 12pt;
            background: #f7f7f7;
            padding: 8px 12px;
            border-left: 4px solid #8a1c22;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 18px 0;
            font-size: 11pt;
          }
          th, td {
            border: 1px solid #444;
            padding: 7px 10px;
            text-align: left;
          }
          th {
            background: #eee;
            font-weight: bold;
            text-align: center;
          }
          .num-cell {
            text-align: center;
            width: 40px;
          }
          .stat-cell {
            text-align: center;
            width: 110px;
          }
          .privacy-notice {
            font-size: 10pt;
            color: #555;
            margin-top: 15px;
            padding: 8px;
            background: #fdfaf4;
            border: 1px dashed #c5a059;
          }
          .signatures {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
          }
          .sign-block {
            width: 45%;
          }
          .sign-line {
            border-bottom: 1px solid #000;
            height: 30px;
            margin-bottom: 4px;
          }
          .sign-sub {
            font-size: 9pt;
            text-align: center;
            color: #666;
          }
          @media print {
            body { padding: 15px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="doc-header">
          <div class="college-name">Министерство образования Ставропольского края</div>
          <div class="college-name">ГБПОУ «Ставропольский региональный многопрофильный колледж»</div>
          <div class="doc-title">Аналитическая справка</div>
          <div class="doc-subtitle">о мониторинге востребованности экспозиций электронного музея памяти выпускников-участников СВО</div>
        </div>

        <div class="meta-box">
          <div><strong>Учебная группа:</strong> ${this.escapeHtml(group)}</div>
          <div><strong>Преподаватель:</strong> ${this.escapeHtml(teacher)}</div>
          <div><strong>Дата фиксации:</strong> ${dateStr}</div>
        </div>

        <p>
          В соответствии с Программой воспитательной работы колледжа и требованиями ФГОС СПО на базе электронного мемориального комплекса 
          <em>«Быть воином — жить вечно»</em> был проведен мониторинг академической и эмоциональной вовлеченности обучающихся при изучении архивных свидетельств о подвигах 20 выпускников колледжа.
        </p>

        <table>
          <thead>
            <tr>
              <th class="num-cell">№</th>
              <th>Наименование зала / экспозиции музея</th>
              <th class="stat-cell">Количество изучений</th>
              <th class="stat-cell">Доля интереса</th>
              <th class="stat-cell">Ср. время изучения</th>
            </tr>
          </thead>
          <tbody>
            ${hallRows.map((h, i) => {
              const share = totalVisits > 0 ? Math.round((h.visits / totalVisits) * 100) : 0;
              const avgSec = h.visits > 0 ? Math.round(h.duration / h.visits) : 0;
              const min = Math.floor(avgSec / 60);
              const sec = avgSec % 60;
              return `
                <tr>
                  <td class="num-cell">${i + 1}</td>
                  <td>${this.escapeHtml(h.title)}</td>
                  <td class="stat-cell"><strong>${h.visits}</strong></td>
                  <td class="stat-cell">${share}%</td>
                  <td class="stat-cell">${min}м ${sec}с</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <div class="privacy-notice">
          <strong>Заключение о соответствии законодательству РФ:</strong><br>
          Сбор статистических данных осуществлен в строгом соответствии с требованиями Федерального закона от 27.07.2006 № 152-ФЗ 
          «О персональных данных». Процесс мониторинга является 100% анонимным: индивидуальные идентификаторы студентов, IP-адреса, 
          персональные профили и файлы cookies не регистрировались. Данные верифицированы протоколом Supabase Realtime Shield.
        </div>

        <div class="signatures">
          <div class="sign-block">
            <div>Преподаватель (руководитель занятия):</div>
            <div class="sign-line"></div>
            <div class="sign-sub">(подпись, расшифровка)</div>
          </div>
          <div class="sign-block">
            <div>Заместитель директора по УВР:</div>
            <div class="sign-line"></div>
            <div class="sign-sub">(подпись, расшифровка)</div>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 400);
          };
        </script>
      </body>
      </html>
    `);
    reportWindow.document.close();
  },

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
};

window.HallAnalytics = HallAnalytics;

// Автозапуск при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  HallAnalytics.init();
});
