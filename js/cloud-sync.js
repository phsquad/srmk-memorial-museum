/**
 * ============================================================================
 * ГЛОБАЛЬНАЯ СИНХРОНИЗАЦИЯ OMNI-SYNC: js/cloud-sync.js (v5.0 Ultra Master)
 * Мемориально-образовательный комплекс ГБПОУ СРМК «Быть воином — жить вечно»
 * 
 * Включает:
 * 1. Безопасную Realtime-синхронизацию счетчиков свечей и цветов
 * 2. Realtime-вещание Стены Памяти (WebSockets)
 * 3. Реестр верификации сертификатов и пакетную регистрацию
 * 4. Глобальный Зал Славы (Квиз-рейтинг)
 * ============================================================================
 */

'use strict';

const CloudConfig = {
  get SUPABASE_URL() {
    if (typeof window !== 'undefined' && window.SRMK_CONFIG && window.SRMK_CONFIG.SUPABASE_URL) {
      return window.SRMK_CONFIG.SUPABASE_URL;
    }
    return "https://qtafcczydgyrganrpkof.supabase.co";
  },
  get SUPABASE_ANON_KEY() {
    if (typeof window !== 'undefined' && window.SRMK_CONFIG && window.SRMK_CONFIG.SUPABASE_ANON_KEY) {
      return window.SRMK_CONFIG.SUPABASE_ANON_KEY;
    }
    return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0YWZjY3p5ZGd5cmdhbnJwa29mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwNTg5MDEsImV4cCI6MjEwNDYzNDkwMX0.i_hFegr6BHix6eFEasgyICDE6Lcy5wbwbU6dArG-wFg";
  }
};

const CloudSync = {
  client: null,
  isLive: false,
  status: 'offline', // 'offline' | 'connecting' | 'online' | 'error'
  statusMessage: 'Инициализация...',
  channels: [],

  setStatus(status, message = '') {
    this.status = status;
    this.statusMessage = message;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('srmk-supabase-status', {
        detail: { status, message, isLive: this.isLive, url: CloudConfig.SUPABASE_URL }
      }));
    }
  },

  async testConnection(url, key) {
    if (typeof supabase === 'undefined') {
      return { success: false, message: 'Библиотека supabase-js не подключена' };
    }
    const testUrl = (url || CloudConfig.SUPABASE_URL).trim();
    const testKey = (key || CloudConfig.SUPABASE_ANON_KEY).trim();
    if (!testUrl || testUrl.includes('ВАШ_PROJECT_ID')) {
      return { success: false, message: 'Не указан корректный URL проекта Supabase' };
    }
    try {
      const testClient = supabase.createClient(testUrl, testKey);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const { data, error } = await testClient
        .from('memorial_counters')
        .select('hero_id', { count: 'exact', head: true })
        .abortSignal(controller.signal);

      clearTimeout(timeoutId);

      if (error) {
        if (error.code === 'PGRST116' || error.message?.includes('relation') || error.code === '42P01') {
          return {
            success: true,
            needsMigration: true,
            message: 'Связь есть! Выполните supabase_migration.sql'
          };
        }
        return { success: false, message: error.message || 'Ошибка ответа Supabase' };
      }
      return { success: true, message: 'Подключение активно. База данных доступна.' };
    } catch (err) {
      return { success: false, message: err.name === 'AbortError' ? 'Таймаут соединения (проект недоступен)' : err.message };
    }
  },

  async init() {
    if (this.isLive) return;
    const url = CloudConfig.SUPABASE_URL;
    const key = CloudConfig.SUPABASE_ANON_KEY;

    if (typeof supabase === 'undefined') {
      this.setStatus('offline', 'Автономный режим (библиотека Supabase не загружена)');
      return;
    }

    if (!url || url.includes('ВАШ_PROJECT_ID')) {
      this.setStatus('offline', 'Автономный режим (укажите параметры Supabase)');
      return;
    }

    this.setStatus('connecting', 'Проверка связи с базой данных Supabase...');

    try {
      this.client = supabase.createClient(url, key, {
        realtime: {
          params: {
            eventsPerSecond: 10
          }
        }
      });

      const check = await this.testConnection(url, key);
      if (check.success) {
        this.isLive = true;
        this.setStatus('online', check.needsMigration ? 'Онлайн (требуется SQL миграция)' : 'Supabase Realtime Онлайн');
        this.subscribeRealtime();
        console.log(`[CloudSync v5.5] 🌐 OMNI-SYNC онлайн (${url}). Realtime-каналы активированы.`);
      } else {
        this.isLive = false;
        this.setStatus('offline', `Офлайн-режим: ${check.message}`);
        console.warn(`[CloudSync] ⚠️ Supabase недоступен (${check.message}). Включен автономный режим LocalStorage.`);
      }
    } catch (err) {
      this.isLive = false;
      this.setStatus('error', `Ошибка: ${err.message}`);
      console.warn("[CloudSync] Ошибка инициализации Supabase клиента:", err);
    }
  },

  /**
   * Подписка на Realtime-каналы базы данных с защитой от TypeError
   */
  subscribeRealtime() {
    if (!this.client) return;

    // Очистка старых каналов при повторной подписке
    this.channels.forEach(channel => {
      try {
        this.client.removeChannel(channel);
      } catch (e) {}
    });
    this.channels = [];

    // 1. Слушатель счетчиков мемориала (Свечи и Цветы)
    const countersChannel = this.client.channel('realtime_memorial_counters')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'memorial_counters' }, (payload) => {
        const row = payload.new;
        if (!row) return;

        // Обновляем состояние в глобальном AppState
        if (window.AppState) {
          if (!AppState.candles) AppState.candles = {};
          AppState.candles[row.hero_id] = row.candles || 0;

          // 🔥 БЕЗОПАСНЫЙ ВЫЗОВ ОБНОВЛЕНИЯ ИНТЕРФЕЙСА (Фикс TypeError)
          if (window.App) {
            if (typeof App.updateMemorialStats === 'function') {
              App.updateMemorialStats();
            } else if (typeof App.updateCandlesStats === 'function') {
              App.updateCandlesStats();
            }

            if (typeof App.renderCardsGrid === 'function') App.renderCardsGrid();
            if (typeof App.renderMemorialPlaques === 'function') App.renderMemorialPlaques();

            const candleDisplay = document.getElementById('candleCountDisplay');
            if (candleDisplay && AppState.currentHeroId === row.hero_id) {
              candleDisplay.textContent = row.candles;
            }
          }
        }

        // Обновляем общий счетчик цветов
        this.fetchAllCounters().then(data => {
          if (data) {
            const flowersDisplay = document.getElementById('flowersCountDisplay');
            if (flowersDisplay) flowersDisplay.textContent = data.flowers;
            if (window.AppState) AppState.flowersCount = data.flowers;
          }
        });
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[CloudSync] Канал счетчиков памяти подключен.');
        }
      });
    this.channels.push(countersChannel);

    // 2. Слушатель Стены Памяти (Послания и лампады)
    const guestbookChannel = this.client.channel('realtime_guestbook_feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guestbook_tributes' }, (payload) => {
        if (typeof GuestbookEngine !== 'undefined') {
          if (payload.eventType === 'INSERT' && payload.new) {
            GuestbookEngine.receiveRealtimeTribute(payload.new);
          }
          if (payload.eventType === 'UPDATE' && payload.new) {
            GuestbookEngine.updateRealtimeTribute(payload.new);
          }
          if (payload.eventType === 'DELETE' && payload.old) {
            GuestbookEngine.tributes = GuestbookEngine.tributes.filter(t => t.id !== payload.old.id);
            GuestbookEngine.saveStorage();
            GuestbookEngine.renderWall();
            GuestbookEngine.updateStats();
          }
        }
      })
      .subscribe();
    this.channels.push(guestbookChannel);

    // 3. Слушатель Анонимной Аналитики Залов (Востребованность экспозиций в Realtime)
    const analyticsChannel = this.client.channel('realtime_hall_analytics')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hall_analytics_counters' }, (payload) => {
        if (window.HallAnalytics && typeof HallAnalytics.handleRealtimePayload === 'function') {
          HallAnalytics.handleRealtimePayload(payload);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[CloudSync] 📡 Realtime-канал аналитики залов и экспозиций активен.');
        }
      });
    this.channels.push(analyticsChannel);

    // 4. Realtime Presence-канал (Мгновенное отслеживание активных студентов в залах)
    try {
      const presenceKey = window.HallAnalytics ? HallAnalytics.getEphemeralSessionId() : `anon_${Math.random().toString(36).substring(2, 9)}`;
      const presenceChannel = this.client.channel('hall_live_presence', {
        config: { presence: { key: presenceKey } }
      });

      presenceChannel
        .on('presence', { event: 'sync' }, () => {
          const state = presenceChannel.presenceState();
          if (window.HallAnalytics && typeof HallAnalytics.handlePresenceSync === 'function') {
            HallAnalytics.handlePresenceSync(state);
          }
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            this.presenceChannel = presenceChannel;
            if (window.HallAnalytics && typeof HallAnalytics.getCurrentHallId === 'function') {
              const curHall = HallAnalytics.getCurrentHallId();
              await presenceChannel.track({ hall_id: curHall, joined_at: Date.now() });
            }
          }
        });
      this.channels.push(presenceChannel);
      this.presenceChannel = presenceChannel;
    } catch (presErr) {
      console.warn('[CloudSync] Ошибка настройки Presence канала:', presErr);
    }

    // 5. Слушатель достижений и званий (user_achievements)
    try {
      const achieveChannel = this.client.channel('realtime_user_achievements')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'user_achievements' }, (payload) => {
          if (window.AchievementsEngine && typeof AchievementsEngine.handleCloudUpdate === 'function') {
            AchievementsEngine.handleCloudUpdate(payload.new || payload.old);
          }
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('[CloudSync] 🎖️ Realtime-канал наград и воинских званий подключен к БД.');
          }
        });
      this.channels.push(achieveChannel);
    } catch (achieveErr) {
      console.warn('[CloudSync] Ошибка подключения канала достижений:', achieveErr);
    }

    // 6. Слушатель живой ленты получения наград студентами (achievement_unlock_events)
    try {
      const eventsChannel = this.client.channel('realtime_achievement_events')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'achievement_unlock_events' }, (payload) => {
          if (payload.new) {
            window.dispatchEvent(new CustomEvent('srmk-achievement-unlocked-cloud', { detail: payload.new }));
          }
        })
        .subscribe();
      this.channels.push(eventsChannel);
    } catch (eventsErr) {
      console.warn('[CloudSync] Ошибка подключения ленты наград:', eventsErr);
    }

    // 7. Слушатель НОВОЙ таблицы реальных метрик музея (museum_realtime_metrics)
    try {
      const metricsChannel = this.client.channel('realtime_museum_metrics_hub')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'museum_realtime_metrics' }, (payload) => {
          if (payload.new) {
            window.dispatchEvent(new CustomEvent('srmk-realtime-metrics-updated', { detail: payload.new }));
          }
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('[CloudSync] 🌐 Realtime-вещание таблицы museum_realtime_metrics активно.');
          }
        });
      this.channels.push(metricsChannel);
    } catch (metricErr) {
      console.warn('[CloudSync] Ошибка подключения канала museum_realtime_metrics:', metricErr);
    }
  },

  reconnect() {
    this.isLive = false;
    if (this.client) {
      this.channels.forEach(channel => {
        try { this.client.removeChannel(channel); } catch (e) {}
      });
      this.channels = [];
    }
    this.init();
  },

  // ==========================================================================
  // СИНХРОНИЗАЦИЯ БАЗЫ ГЕРОЕВ (HEROES DATABASE & SEEDER)
  // ==========================================================================
  async fetchHeroes() {
    if (!this.isLive || !this.client) return null;
    try {
      const { data, error } = await this.client.from('heroes_database').select('*');
      if (error) throw error;
      if (data && Array.isArray(data) && data.length > 0) {
        console.log(`[CloudSync] ☁️ Загружено ${data.length} героев из базы Supabase`);
        return data;
      }
      return null;
    } catch (e) {
      console.warn('[CloudSync] Не удалось загрузить героев из базы:', e);
      return null;
    }
  },

  async seedDatabase() {
    if (!this.client) {
      return { success: false, message: 'Supabase клиент не инициализирован' };
    }
    try {
      const heroes = (typeof window.heroesDatabase !== 'undefined' && Array.isArray(window.heroesDatabase))
        ? window.heroesDatabase
        : ((typeof heroesDatabase !== 'undefined' && Array.isArray(heroesDatabase)) ? heroesDatabase : []);

      if (heroes.length === 0) {
        return { success: false, message: 'Локальная база героев (data.js) пуста' };
      }

      // 1. Наполняем heroes_database
      const { data: existingHeroes, error: checkErr } = await this.client
        .from('heroes_database')
        .select('id');

      let insertedCount = 0;
      if (!checkErr) {
        const existingIds = new Set((existingHeroes || []).map(h => h.id));
        const toInsert = heroes.filter(h => !existingIds.has(h.id)).map(h => ({
          id: h.id,
          name: h.name,
          plaque: h.plaque || 'general',
          spec_tag: h.specTag || h.category || h.id,
          dates: h.dates || {},
          education: h.education || {},
          military: h.military || {},
          awards: h.awards || [],
          deed: h.deed || '',
          quote: h.quote || '',
          media: h.media || { photo: h.photo || '', audio: h.audioGuide || '' },
          map_coords: h.mapCoords || {}
        }));

        if (toInsert.length > 0) {
          const { error: insErr } = await this.client.from('heroes_database').upsert(toInsert);
          if (insErr) throw insErr;
          insertedCount = toInsert.length;
        }
      }

      // 2. Инициализируем memorial_counters
      const { data: existingCounters } = await this.client.from('memorial_counters').select('hero_id');
      const counterIds = new Set((existingCounters || []).map(c => c.hero_id));
      const countersToInsert = heroes.filter(h => !counterIds.has(h.id)).map(h => ({
        hero_id: h.id,
        candles: 0,
        flowers: 0,
        last_updated: new Date().toISOString()
      }));

      if (countersToInsert.length > 0) {
        await this.client.from('memorial_counters').upsert(countersToInsert);
      }

      // 3. Заполняем канонические послания на Стене Памяти (если пусто)
      const { data: existingTributes } = await this.client.from('guestbook_tributes').select('id').limit(1);
      if (!existingTributes || existingTributes.length === 0) {
        const seedTributes = [
          {
            id: "tr-seed-1",
            author: "Евгений Викторович Бледных",
            role: "admin",
            role_label: "Директор ГБПОУ СРМК, к.и.н.",
            dedication_id: "general",
            dedication_name: "Общему Мемориалу Славы",
            message: "26 сентября 2025 года мы навечно увековечили подвиг 20 наших ребят. Каждый из них — часть славной истории нашего колледжа. Их мужество служит вечным нравственным ориентиром для каждого поколения студентов СРМК.",
            theme: "theme-parchment",
            flames: 24,
            is_pinned: true,
            is_verified: true,
            date: "26 сентября 2025 г."
          },
          {
            id: "tr-seed-2",
            author: "Владимир Григорьев",
            role: "student",
            role_label: "Студент 3 курса СРМК, автор реквиема",
            dedication_id: "general",
            dedication_name: "Общему Мемориалу Славы",
            message: "Тыл и фронт — един! И сколько б ни потребовалось зим — верим и знаем: мы победим! Вечная слава выпускникам нашего колледжа, шагнувшим в вечность.",
            theme: "theme-clean",
            flames: 19,
            is_pinned: false,
            is_verified: true,
            date: "26 сентября 2025 г."
          },
          {
            id: "tr-seed-3",
            author: "Лариса Ивановна Вечёрка",
            role: "guest",
            role_label: "Мать кавалера Ордена Мужества",
            dedication_id: "vecherka-n-a",
            dedication_name: "Вечёрка Николай Александрович",
            message: "Коленька навсегда останется живым в наших сердцах. Спасибо дирекции колледжа, преподавателям и сокурсникам за сохранение священной памяти.",
            theme: "theme-parchment",
            flames: 31,
            is_pinned: true,
            is_verified: true,
            date: "28 сентября 2025 г."
          }
        ];
        await this.client.from('guestbook_tributes').upsert(seedTributes);
      }

      return {
        success: true,
        message: `База данных синхронизирована! Героев в базе: ${heroes.length} (новых внесено: ${insertedCount}).`
      };
    } catch (e) {
      console.error('[CloudSync] Ошибка наполнения базы:', e);
      return { success: false, message: e.message || 'Ошибка заполнения' };
    }
  },

  // ==========================================================================
  // МЕТОДЫ СВЕЧЕЙ И ЦВЕТОВ
  // ==========================================================================
  async fetchAllCounters() {
    if (!this.isLive || !this.client) return null;
    try {
      const { data, error } = await this.client.from('memorial_counters').select('*');
      if (error) throw error;

      const candlesMap = {};
      let totalFlowers = 0;
      if (data && Array.isArray(data)) {
        data.forEach(r => {
          candlesMap[r.hero_id] = r.candles || 0;
          totalFlowers += (r.flowers || 0);
        });
      }
      return { candles: candlesMap, flowers: totalFlowers };
    } catch (e) {
      console.warn('[CloudSync] Не удалось загрузить счетчики из базы:', e);
      return null;
    }
  },

  async pushCandle(heroId) {
    if (!this.isLive || !this.client) return null;
    try {
      const fingerprint = window.TributeSecurity ? await window.TributeSecurity.getDeviceFingerprint() : null;
      const { data, error } = await this.client.rpc('increment_hero_candle', { 
        target_hero_id: heroId,
        client_fingerprint: fingerprint
      });
      if (error) {
        // Запасной вызов старой функции при отсутствии нового параметра
        const fallback = await this.client.rpc('increment_candle', { p_hero_id: heroId });
        return fallback.data;
      }
      return data;
    } catch (e) {
      console.warn('[CloudSync] Ошибка зажжения свечи:', e);
      return null;
    }
  },

  async pushFlower(heroId, count = 2) {
    if (!this.isLive || !this.client) return null;
    try {
      const fingerprint = window.TributeSecurity ? await window.TributeSecurity.getDeviceFingerprint() : null;
      const { data, error } = await this.client.rpc('increment_hero_flower', { 
        target_hero_id: heroId, 
        qty: count,
        client_fingerprint: fingerprint
      });
      if (error) {
        const fallback = await this.client.rpc('increment_flower', { p_hero_id: heroId });
        return fallback.data;
      }
      return data;
    } catch (e) {
      console.warn('[CloudSync] Ошибка возложения цветов:', e);
      return null;
    }
  },

  // ==========================================================================
  // МЕТОДЫ СТЕНЫ ПАМЯТИ
  // ==========================================================================
  async fetchTributes() {
    if (!this.isLive || !this.client) return null;
    try {
      const { data, error } = await this.client
        .from('guestbook_tributes')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data ? data.map(row => this.normalizeTribute(row)) : [];
    } catch (e) {
      console.warn('[CloudSync] Ошибка загрузки Стены Памяти:', e);
      return null;
    }
  },

  async sendTribute(tributeObj) {
    if (!this.isLive || !this.client) return false;
    try {
      // Античит-нормализация: публичные пользователи не могут самовольно закреплять или верифицировать
      const payload = this.serializeTribute(tributeObj);
      const isAuth = Boolean(this.client.auth?.getUser && (await this.client.auth.getUser()).data?.user);
      if (!isAuth) {
        payload.is_pinned = false;
        payload.is_verified = false;
        payload.flames = 1;
      }
      const { error } = await this.client.from('guestbook_tributes').insert([payload]);
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn('[CloudSync] Ошибка публикации на Стене Памяти:', e);
      return false;
    }
  },

  async toggleFlame(tributeId, delta) {
    if (!this.isLive || !this.client) return null;
    try {
      const fingerprint = window.TributeSecurity ? await window.TributeSecurity.getDeviceFingerprint() : null;
      const { data, error } = await this.client.rpc('toggle_tribute_flame', {
        target_tribute_id: tributeId,
        delta: delta,
        client_fingerprint: fingerprint
      });
      if (error) throw error;
      return data;
    } catch (e) {
      console.warn('[CloudSync] Ошибка переключения лампады:', e);
      return null;
    }
  },

  // ==========================================================================
  // МЕТОДЫ СЕРТИФИКАТОВ
  // ==========================================================================
  async registerCertificate(certObj) {
    if (!this.isLive || !this.client) return false;
    try {
      const { error } = await this.client.from('certificates_registry').insert([certObj]);
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn('[CloudSync] Ошибка регистрации сертификата:', e);
      return false;
    }
  },

  async registerCertificatesBatch(certArray) {
    if (!this.isLive || !this.client) return false;
    try {
      const { error } = await this.client.from('certificates_registry').insert(certArray);
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn('[CloudSync] Ошибка пакетной регистрации сертификатов:', e);
      return false;
    }
  },

  async verifyCertificate(serial) {
    if (!this.isLive || !this.client) return null;
    try {
      const { data, error } = await this.client
        .from('certificates_registry')
        .select('*')
        .eq('serial', serial)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (e) {
      console.warn('[CloudSync] Ошибка верификации сертификата:', e);
      return null;
    }
  },

  // ==========================================================================
  // МЕТОДЫ КВИЗА (ЗАЛ СЛАВЫ)
  // ==========================================================================
  async saveQuizResult(name, score, group = null, totalQuestions = 10, durationSeconds = 0) {
    if (!this.isLive || !this.client) return false;
    try {
      const fingerprint = window.TributeSecurity ? await window.TributeSecurity.getDeviceFingerprint() : null;

      // 1. Попытка защищенной отправки через RPC с валидацией античита
      try {
        const { data: rpcRes, error: rpcErr } = await this.client.rpc('submit_quiz_result', {
          p_student_name: name,
          p_group_name: group,
          p_score: score,
          p_total_questions: totalQuestions,
          p_duration_seconds: durationSeconds || 0,
          client_fingerprint: fingerprint
        });
        if (!rpcErr && rpcRes && rpcRes.success) {
          return true;
        }
      } catch (rpcEx) {
        // Fallback к прямому защищенному insert
      }

      // 2. Стандартный insert с RLS-проверками диапазона
      const { error } = await this.client.from('quiz_results').insert([{
        student_name: name,
        group_name: group,
        score: score,
        total_questions: totalQuestions
      }]);
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn('[CloudSync] Ошибка сохранения результата квиза:', e);
      return false;
    }
  },

  async getQuizResults(limit = 10) {
    if (!this.isLive || !this.client) return null;
    try {
      const { data, error } = await this.client
        .from('quiz_results')
        .select('student_name, group_name, score, total_questions, completed_at')
        .order('score', { ascending: false })
        .order('completed_at', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn('[CloudSync] Ошибка загрузки Зала Славы:', e);
      return null;
    }
  },

  // ==========================================================================
  // МЕТОДЫ АНОНИМНОЙ АНАЛИТИКИ ЗАЛОВ И ЭКСПОЗИЦИЙ (ФЗ-152)
  // ==========================================================================
  async fetchHallAnalytics() {
    if (!this.isLive || !this.client) return null;
    try {
      const { data, error } = await this.client
        .from('hall_analytics_counters')
        .select('*')
        .order('total_visits', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn('[CloudSync] Ошибка загрузки аналитики залов:', e);
      return null;
    }
  },

  async recordAnonymousHallVisit(params) {
    if (!this.isLive || !this.client) return null;
    try {
      const {
        hallId,
        hallTitle,
        expositionId = null,
        dwellSeconds = 0,
        isInteraction = false,
        anonHash = 'anon',
        category = 'hall',
        deviceType = 'desktop'
      } = params;

      // 1. Попытка вызова RPC
      try {
        const { data, error } = await this.client.rpc('record_anonymous_hall_visit', {
          p_hall_id: hallId,
          p_hall_title: hallTitle,
          p_exposition_id: expositionId,
          p_dwell_seconds: dwellSeconds,
          p_is_interaction: isInteraction,
          p_anon_hash: anonHash,
          p_category: category,
          p_device_type: deviceType
        });
        if (!error && data) return data;
      } catch (rpcErr) {
        // Fallback ниже
      }

      // 2. Fallback: прямой upsert в таблицу
      const { data: selectRow } = await this.client
        .from('hall_analytics_counters')
        .select('total_visits, total_duration_seconds, interactions_count')
        .eq('hall_id', hallId)
        .maybeSingle();

      const newVisits = (selectRow?.total_visits || 0) + 1;
      const newDuration = (selectRow?.total_duration_seconds || 0) + dwellSeconds;
      const newInteractions = (selectRow?.interactions_count || 0) + (isInteraction ? 1 : 0);

      const { data: upsertData, error: upsertErr } = await this.client
        .from('hall_analytics_counters')
        .upsert([{
          hall_id: hallId,
          hall_title: hallTitle,
          category: category,
          total_visits: newVisits,
          total_duration_seconds: newDuration,
          interactions_count: newInteractions,
          last_activity: new Date().toISOString()
        }]);

      if (upsertErr) throw upsertErr;
      return upsertData;
    } catch (e) {
      console.warn('[CloudSync] Ошибка отправки визита зала:', e);
      return null;
    }
  },

  async updateHallDwellTime(hallId, addedDwellSeconds, anonHash = 'anon') {
    if (!this.isLive || !this.client) return null;
    try {
      try {
        const { data, error } = await this.client.rpc('update_hall_dwell_time', {
          p_hall_id: hallId,
          p_added_dwell_seconds: addedDwellSeconds,
          p_anon_hash: anonHash
        });
        if (!error) return data;
      } catch (rpcErr) {}

      // Fallback
      const { data: cur } = await this.client
        .from('hall_analytics_counters')
        .select('total_duration_seconds')
        .eq('hall_id', hallId)
        .maybeSingle();

      if (cur) {
        await this.client
          .from('hall_analytics_counters')
          .update({
            total_duration_seconds: (cur.total_duration_seconds || 0) + addedDwellSeconds,
            last_activity: new Date().toISOString()
          })
          .eq('hall_id', hallId);
      }
      return true;
    } catch (e) {
      console.warn('[CloudSync] Ошибка обновления времени в зале:', e);
      return null;
    }
  },

  async updatePresenceHall(hallId) {
    if (!this.presenceChannel) return;
    try {
      await this.presenceChannel.track({
        hall_id: hallId,
        updated_at: Date.now()
      });
    } catch (e) {
      // Игнорируем фоновые задержки presence
    }
  },

  // ==========================================================================
  // МЕТОДЫ ДОСТИЖЕНИЙ И ВОИНСКИХ ЗВАНИЙ (СИНХРОНИЗАЦИЯ С БАЗОЙ ДАННЫХ SUPABASE)
  // ==========================================================================
  async fetchUserAchievements(userId) {
    if (!this.isLive || !this.client || !userId) return null;
    try {
      const { data, error } = await this.client
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (e) {
      console.warn('[CloudSync] Ошибка загрузки достижений из БД:', e);
      return null;
    }
  },

  async syncUserProgress(params) {
    if (!this.isLive || !this.client) return null;
    try {
      const {
        userId,
        studentName = null,
        groupName = null,
        xpDelta = 0,
        rankId = null,
        rankTitle = null,
        newBadgeId = null,
        newBadgeTitle = null,
        badgeIcon = '🎖️',
        badgeCategory = 'museum',
        badgeXp = 0,
        statsJson = null
      } = params;

      if (!userId) return null;

      // 1. Попытка вызова RPC-процедуры в базе
      try {
        const { data, error } = await this.client.rpc('sync_user_achievement_progress', {
          p_user_id: userId,
          p_student_name: studentName,
          p_group_name: groupName,
          p_xp_delta: xpDelta,
          p_rank_id: rankId,
          p_rank_title: rankTitle,
          p_new_badge_id: newBadgeId,
          p_new_badge_title: newBadgeTitle,
          p_badge_icon: badgeIcon,
          p_badge_category: badgeCategory,
          p_badge_xp: badgeXp,
          p_stats_json: statsJson
        });
        if (!error && data) return data;
      } catch (rpcErr) {
        // Fallback ниже
      }

      // 2. Fallback: прямой upsert в таблицу user_achievements
      const { data: cur } = await this.client
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      const existingBadges = Array.isArray(cur?.unlocked_badges) ? cur.unlocked_badges : [];
      let updatedBadges = [...existingBadges];
      if (newBadgeId && !updatedBadges.includes(newBadgeId)) {
        updatedBadges.push(newBadgeId);
      }

      const newXP = Math.max(0, (cur?.xp || 0) + xpDelta);

      const payload = {
        user_id: userId,
        student_name: studentName || cur?.student_name,
        group_name: groupName || cur?.group_name,
        xp: newXP,
        rank_id: rankId || cur?.rank_id || 'private',
        rank_title: rankTitle || cur?.rank_title || 'Рядовой',
        unlocked_badges: updatedBadges,
        stats: statsJson || cur?.stats || {},
        last_active: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: upsertRes, error: upsertErr } = await this.client
        .from('user_achievements')
        .upsert([payload]);

      if (upsertErr) throw upsertErr;

      // Логируем событие получения награды
      if (newBadgeId) {
        try {
          await this.client.from('achievement_unlock_events').insert([{
            user_id: userId,
            student_name: studentName || 'Студент',
            badge_id: newBadgeId,
            badge_title: newBadgeTitle || newBadgeId,
            badge_icon: badgeIcon,
            category: badgeCategory,
            xp_awarded: badgeXp
          }]);
        } catch (evErr) {}
      }

      return { success: true, xp: newXP, badges_count: updatedBadges.length };
    } catch (e) {
      console.warn('[CloudSync] Ошибка синхронизации прогресса достижений с БД:', e);
      return null;
    }
  },

  async fetchRecentAchievements(limit = 10) {
    if (!this.isLive || !this.client) return [];
    try {
      const { data, error } = await this.client
        .from('achievement_unlock_events')
        .select('*')
        .order('unlocked_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn('[CloudSync] Ошибка загрузки ленты наград из БД:', e);
      return [];
    }
  },

  // ==========================================================================
  // ПОЛНОЕ ОБНУЛЕНИЕ ВСЕХ СЧЕТЧИКОВ И УРОВНЕЙ В БАЗЕ ДАННЫХ
  // ==========================================================================
  async resetAllCountersAndLevels() {
    console.log('[CloudSync] 🔄 Запрос на полное обнуление всех счетчиков и уровней...');
    let dbSuccess = false;

    if (this.isLive && this.client) {
      try {
        // 1. Попытка вызова RPC-процедуры
        const { data, error } = await this.client.rpc('reset_all_memorial_counters_and_levels');
        if (!error && data) {
          dbSuccess = true;
          console.log('[CloudSync] ✅ RPC обнуления успешно выполнен в Supabase.');
        } else {
          throw error || new Error('RPC error');
        }
      } catch (rpcErr) {
        // Fallback: прямые обновления через клиент Supabase
        try {
          await this.client.from('memorial_counters').update({ candles: 0, flowers: 0 }).neq('hero_id', '');
          await this.client.from('hall_analytics_counters').update({
            total_visits: 0,
            active_visitors: 0,
            total_duration_seconds: 0,
            interactions_count: 0
          }).neq('hall_id', '');
          await this.client.from('user_achievements').update({
            xp: 0,
            rank_id: 'private',
            rank_title: 'Рядовой',
            unlocked_badges: []
          }).neq('user_id', '');
          await this.client.from('museum_realtime_metrics').update({
            visits_count: 0,
            dwell_seconds: 0,
            candles_count: 0,
            flowers_count: 0,
            audio_listens: 0,
            interactions: 0,
            active_now: 0
          }).neq('metric_id', '');
          dbSuccess = true;
          console.log('[CloudSync] ✅ Прямое обнуление счетчиков в БД выполнено.');
        } catch (directErr) {
          console.warn('[CloudSync] Ошибка обнуления в облаке:', directErr);
        }
      }
    }

    // 2. Локальное обнуление в кэше браузера
    try {
      localStorage.setItem('srmk_user_xp', '0');
      localStorage.setItem('srmk_unlocked_badges', JSON.stringify([]));
      localStorage.setItem('srmk_achievements_stats', JSON.stringify({
        candlesLitHeroes: [],
        flowersLaid: 0,
        audioHeard: 0,
        chaptersRead: 0,
        quizzesPassed: 0,
        modesCompleted: []
      }));
      localStorage.setItem('srmk_museum_candles_v3', JSON.stringify({}));
      localStorage.setItem('srmk_tribute_vault', JSON.stringify({}));
      localStorage.setItem('srmk_user_flames_v3', JSON.stringify({}));
      localStorage.setItem('srmk_hall_analytics_cache', JSON.stringify({ stats: {}, heroStats: {} }));
      localStorage.setItem('quiz_history_records', JSON.stringify([]));
      sessionStorage.removeItem('srmk_anon_session_token');
    } catch (locErr) {}

    // 3. Уведомление всех модулей об обнулении
    window.dispatchEvent(new CustomEvent('srmk-counters-reset', { detail: { dbSuccess } }));

    return { success: true, dbSuccess };
  },

  // ==========================================================================
  // МЕТОДЫ НОВОЙ ТАБЛИЦЫ РЕАЛЬНЫХ ДАННЫХ (museum_realtime_metrics)
  // ==========================================================================
  async fetchRealtimeMetrics() {
    if (!this.isLive || !this.client) return null;
    try {
      const { data, error } = await this.client
        .from('museum_realtime_metrics')
        .select('*');
      if (error) throw error;
      return data;
    } catch (e) {
      return null;
    }
  },

  /**
   * Сбор и привязка 100% РЕАЛЬНЫХ ДАННЫХ из базы данных Supabase
   * (без выдуманных и искусственных цифр, все берется прямо из реальных таблиц)
   */
  async aggregateRealDatabaseMetrics() {
    if (!this.isLive || !this.client) return null;
    try {
      // 1. Читаем реальные свечи и цветы каждого героя
      const { data: memorialRows } = await this.client
        .from('memorial_counters')
        .select('hero_id, candles, flowers, updated_at');

      let realCandlesTotal = 0;
      let realFlowersTotal = 0;
      const heroesMap = {};

      if (Array.isArray(memorialRows)) {
        memorialRows.forEach(r => {
          const c = r.candles || 0;
          const f = r.flowers || 0;
          realCandlesTotal += c;
          realFlowersTotal += f;
          heroesMap[r.hero_id] = {
            heroId: r.hero_id,
            candles: c,
            flowers: f,
            interactions: c + f,
            updatedAt: r.updated_at
          };
        });
      }

      // 2. Читаем реальные послания и лампады Стены Памяти
      let realTributesCount = 0;
      try {
        const { count } = await this.client
          .from('guestbook_tributes')
          .select('*', { count: 'exact', head: true });
        realTributesCount = count || 0;
      } catch (e) {}

      // 3. Читаем реальные сдачи квеста
      let realQuizCount = 0;
      try {
        const { count } = await this.client
          .from('quiz_results')
          .select('*', { count: 'exact', head: true });
        realQuizCount = count || 0;
      } catch (e) {}

      // 4. Читаем реальные выданные сертификаты
      let realCertsCount = 0;
      try {
        const { count } = await this.client
          .from('certificates_registry')
          .select('*', { count: 'exact', head: true });
        realCertsCount = count || 0;
      } catch (e) {}

      const totalInteractions = realCandlesTotal + realFlowersTotal + realTributesCount + realQuizCount + realCertsCount;

      const result = {
        totalCandles: realCandlesTotal,
        totalFlowers: realFlowersTotal,
        totalTributes: realTributesCount,
        totalQuizzes: realQuizCount,
        totalCertificates: realCertsCount,
        totalInteractions: totalInteractions,
        heroesMap: heroesMap,
        heroesRanking: Object.values(heroesMap).sort((a, b) => b.interactions - a.interactions)
      };

      // 5. Синхронизируем эти реальные данные в новую таблицу museum_realtime_metrics
      try {
        await this.client.from('museum_realtime_metrics').upsert([{
          metric_id: 'global_summary',
          category: 'summary',
          title: 'Сводная статистика Мемориального комплекса',
          candles_count: realCandlesTotal,
          flowers_count: realFlowersTotal,
          interactions: totalInteractions,
          metadata: {
            total_tributes: realTributesCount,
            total_quizzes: realQuizCount,
            total_certificates: realCertsCount,
            sync_source: 'live_database_tables'
          },
          last_updated: new Date().toISOString()
        }]);

        const heroUpserts = Object.values(heroesMap).map(h => ({
          metric_id: `hero_${h.heroId}`,
          category: 'hero',
          title: h.heroId,
          candles_count: h.candles,
          flowers_count: h.flowers,
          interactions: h.interactions,
          last_updated: h.updatedAt || new Date().toISOString()
        }));

        if (heroUpserts.length > 0) {
          await this.client.from('museum_realtime_metrics').upsert(heroUpserts);
        }
      } catch (upsertErr) {
        // Фоллбек: таблица будет наполнена при выполнении скрипта миграции
      }

      return result;
    } catch (err) {
      console.warn('[CloudSync] Ошибка агрегации реальных данных из базы:', err);
      return null;
    }
  },

  async recordRealtimeInteraction(metricId, category, title, deltaInteractions = 1, deltaVisits = 0, deltaDwell = 0) {
    if (!this.isLive || !this.client) return false;
    try {
      const { data: cur } = await this.client
        .from('museum_realtime_metrics')
        .select('*')
        .eq('metric_id', metricId)
        .maybeSingle();

      const newVisits = (cur?.visits_count || 0) + deltaVisits;
      const newDwell = (cur?.dwell_seconds || 0) + deltaDwell;
      const newInter = (cur?.interactions || 0) + deltaInteractions;

      await this.client
        .from('museum_realtime_metrics')
        .upsert([{
          metric_id: metricId,
          category: category,
          title: title || cur?.title || metricId,
          visits_count: newVisits,
          dwell_seconds: newDwell,
          interactions: newInter,
          last_updated: new Date().toISOString()
        }]);
      return true;
    } catch (e) {
      return false;
    }
  }
};

window.CloudSync = CloudSync;
document.addEventListener('DOMContentLoaded', () => CloudSync.init());
window.addEventListener('online', () => CloudSync.reconnect());
window.addEventListener('srmk-config-updated', () => {
  console.log('[CloudSync] Настройки Supabase обновлены, переподключение...');
  CloudSync.reconnect();
});
