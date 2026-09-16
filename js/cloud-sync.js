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
  // Публичный защищенный шлюз Supabase
  SUPABASE_URL: "https://qtafcczydgyrganrpkof.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0YWZjY3p5ZGd5cmdhbnJwa29mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwNTg5MDEsImV4cCI6MjEwNDYzNDkwMX0.i_hFegr6BHix6eFEasgyICDE6Lcy5wbwbU6dArG-wFg"
};

const CloudSync = {
  client: null,
  isLive: false,
  channels: [],

  normalizeTribute(row) {
    if (!row) return null;
    return {
      ...row,
      roleLabel: row.roleLabel ?? row.role_label,
      dedicationId: row.dedicationId ?? row.dedication_id,
      dedicationName: row.dedicationName ?? row.dedication_name,
      isPinned: Boolean(row.isPinned ?? row.is_pinned ?? false),
      isVerified: Boolean(row.isVerified ?? row.is_verified ?? false)
    };
  },

  serializeTribute(tribute) {
    return {
      id: tribute.id,
      author: tribute.author,
      role: tribute.role,
      role_label: tribute.roleLabel ?? tribute.role_label,
      dedication_id: tribute.dedicationId ?? tribute.dedication_id,
      dedication_name: tribute.dedicationName ?? tribute.dedication_name,
      message: tribute.message,
      theme: tribute.theme,
      date: tribute.date,
      flames: tribute.flames || 0,
      is_pinned: Boolean(tribute.isPinned ?? tribute.is_pinned),
      is_verified: Boolean(tribute.isVerified ?? tribute.is_verified)
    };
  },

  init() {
    if (this.isLive) return;
    if (typeof supabase !== 'undefined' && CloudConfig.SUPABASE_URL && !CloudConfig.SUPABASE_URL.includes('ВАШ_PROJECT_ID')) {
      try {
        this.client = supabase.createClient(CloudConfig.SUPABASE_URL, CloudConfig.SUPABASE_ANON_KEY, {
          realtime: {
            params: {
              eventsPerSecond: 10
            }
          }
        });
        this.isLive = true;
        this.subscribeRealtime();
        console.log("[CloudSync v5.0] 🌐 OMNI-SYNC онлайн. Realtime-каналы активированы.");
      } catch (err) {
        console.warn("[CloudSync] Ошибка инициализации Supabase клиента:", err);
      }
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
  },

  reconnect() {
    if (!this.client) {
      this.init();
    } else {
      this.subscribeRealtime();
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
      const { data, error } = await this.client.rpc('increment_hero_candle', { target_hero_id: heroId });
      if (error) {
        // Запасной вызов старой функции
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
      const { data, error } = await this.client.rpc('increment_hero_flower', { target_hero_id: heroId, qty: count });
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
      const { error } = await this.client.from('guestbook_tributes').insert([this.serializeTribute(tributeObj)]);
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
      const { data, error } = await this.client.rpc('toggle_tribute_flame', {
        target_tribute_id: tributeId,
        delta: delta
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
  async saveQuizResult(name, score, group = null, totalQuestions = 10) {
    if (!this.isLive || !this.client) return false;
    try {
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
  }
};

window.CloudSync = CloudSync;
document.addEventListener('DOMContentLoaded', () => CloudSync.init());
window.addEventListener('online', () => CloudSync.reconnect());
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') CloudSync.reconnect();
});