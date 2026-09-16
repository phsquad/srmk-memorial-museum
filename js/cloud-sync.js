/**
 * ============================================================================
 * ГЛОБАЛЬНАЯ СИНХРОНИЗАЦИЯ OMNI-SYNC: js/cloud-sync.js (v4.0 Master)
 * ============================================================================
 */

'use strict';

// Logger для CloudSync
const cloudLogger = {
  level: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 3 : 1,
  log(...args) { if (this.level >= 3) console.log('[CloudSync]', ...args); },
  warn(...args) { if (this.level >= 2) console.warn('[CloudSync]', ...args); },
  error(...args) { if (this.level >= 1) console.error('[CloudSync]', ...args); }
};

const CloudConfig = {
  // Реальные ключи проекта Supabase.
  SUPABASE_URL: "https://qtafcczydgyrganrpkof.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0YWZjY3p5ZGd5cmdhbnJwa29mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwNTg5MDEsImV4cCI6MjEwNDYzNDkwMX0.i_hFegr6BHix6eFEasgyICDE6Lcy5wbwbU6dArG-wFg"
};

const CloudSync = {
  client: null,
  isLive: false,
  channels: [],

  normalizeTribute(row) {
    return {
      ...row,
      roleLabel: row.roleLabel ?? row.role_label,
      dedicationId: row.dedicationId ?? row.dedication_id,
      dedicationName: row.dedicationName ?? row.dedication_name,
      isPinned: row.isPinned ?? row.is_pinned ?? false,
      isVerified: row.isVerified ?? row.is_verified ?? false
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
    if (typeof supabase !== 'undefined' && CloudConfig.SUPABASE_URL.indexOf('ВАШ_PROJECT_ID') === -1) {
      try {
        this.client = supabase.createClient(CloudConfig.SUPABASE_URL, CloudConfig.SUPABASE_ANON_KEY);
        this.isLive = true;
        this.subscribeRealtime();
        cloudLogger.log("🌐 OMNI-SYNC подключен. Все модули работают в реальном времени.");
      } catch (err) {
        cloudLogger.warn("Ошибка подключения к облаку:", err);
      }
    }
  },

  subscribeRealtime() {
    if (!this.client) return;

    this.channels.forEach(channel => this.client.removeChannel(channel));
    this.channels = [];

    // Слушатель счетчиков (Свечи и Цветы)
    const countersChannel = this.client.channel('realtime_counters')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'memorial_counters' }, (payload) => {
        const row = payload.new;
        if (!row) return;
        if (window.AppState) {
          AppState.candles[row.hero_id] = row.candles;
          if (window.App) {
            App.updateCandlesStats();
            App.renderCardsGrid();
            App.renderMemorialPlaques();
            const candleDisplay = document.getElementById('candleCountDisplay');
            if (candleDisplay && AppState.currentHeroId === row.hero_id) candleDisplay.textContent = row.candles;
          }
        }
        this.fetchAllCounters().then(data => {
          const flowersDisplay = document.getElementById('flowersCountDisplay');
          if (data && flowersDisplay) flowersDisplay.textContent = data.flowers;
        });
      }).subscribe();
    this.channels.push(countersChannel);

    // Слушатель Стены Памяти
    const guestbookChannel = this.client.channel('realtime_guestbook')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guestbook_tributes' }, (payload) => {
        if (typeof GuestbookEngine !== 'undefined') {
          if (payload.eventType === 'INSERT') GuestbookEngine.receiveRealtimeTribute(payload.new);
          if (payload.eventType === 'UPDATE') GuestbookEngine.updateRealtimeTribute(payload.new);
          if (payload.eventType === 'DELETE') {
            GuestbookEngine.tributes = GuestbookEngine.tributes.filter(t => t.id !== payload.old.id);
            GuestbookEngine.saveStorage();
            GuestbookEngine.renderWall();
            GuestbookEngine.updateStats();
          }
        }
      }).subscribe();
    this.channels.push(guestbookChannel);
  },

  reconnect() {
    if (!this.client) return;
    this.subscribeRealtime();
  },

  // --- МЕТОДЫ СВЕЧЕЙ И ЦВЕТОВ ---
  async fetchAllCounters() {
    if (!this.isLive) return null;
    const { data } = await this.client.from('memorial_counters').select('*');
    const candlesMap = {};
    let totalFlowers = 0;
    if (data) data.forEach(r => { candlesMap[r.hero_id] = r.candles; totalFlowers += (r.flowers || 0); });
    return { candles: candlesMap, flowers: totalFlowers };
  },
  async pushCandle(heroId) {
    if (!this.isLive) return null;
    const { data, error } = await this.client.rpc('increment_hero_candle', { target_hero_id: heroId });
    if (error) cloudLogger.error('Не удалось зажечь свечу:', error);
    return data;
  },
  async pushFlower(heroId, count = 2) {
    if (!this.isLive) return null;
    const { data, error } = await this.client.rpc('increment_hero_flower', { target_hero_id: heroId, qty: count });
    if (error) cloudLogger.error('Не удалось возложить цветы:', error);
    return data;
  },

  // --- МЕТОДЫ СТЕНЫ ПАМЯТИ ---
  async fetchTributes() {
    if (!this.isLive) return null;
    const { data, error } = await this.client.from('guestbook_tributes').select('*').order('is_pinned', { ascending: false }).order('created_at', { ascending: false });
    if (error) {
      cloudLogger.error('Ошибка загрузки Стены Памяти:', error);
      return null;
    }
    return data ? data.map(row => this.normalizeTribute(row)) : [];
  },
  async sendTribute(tributeObj) {
    if (!this.isLive) return false;
    const { error } = await this.client.from('guestbook_tributes').insert([this.serializeTribute(tributeObj)]);
    if (error) cloudLogger.error('Ошибка публикации послания:', error);
    return !error;
  },
  async toggleFlame(tributeId, delta) {
    if (!this.isLive) return null;
    const { data, error } = await this.client.rpc('toggle_tribute_flame', {
      target_tribute_id: tributeId,
      delta: delta
    });
    if (error) return null;
    return data;
  },

  // --- МЕТОДЫ СЕРТИФИКАТОВ (НОВОЕ) ---
  async registerCertificate(certObj) {
    if (!this.isLive) return false;
    const { error } = await this.client.from('certificates_registry').insert([certObj]);
    return !error;
  },
  async registerCertificatesBatch(certArray) {
    if (!this.isLive) return false;
    const { error } = await this.client.from('certificates_registry').insert(certArray);
    if (error) cloudLogger.error("Ошибка регистрации сертификатов:", error);
    return !error;
  },
  async verifyCertificate(serial) {
    if (!this.isLive) return null;
    const { data, error } = await this.client.from('certificates_registry').select('*').eq('serial', serial).maybeSingle();
    if (error) cloudLogger.error('Ошибка проверки сертификата:', error);
    return data;
  },

  // --- МЕТОДЫ КВИЗА (НОВОЕ) ---
  async saveQuizResult(name, score, group = null, totalQuestions = 10) {
    if (!this.isLive) return false;
    const { error } = await this.client.from('quiz_results').insert([{
      student_name: name,
      group_name: group,
      score,
      total_questions: totalQuestions
    }]);
    if (error) cloudLogger.error('Ошибка сохранения результата викторины:', error);
    return !error;
  },
  async getQuizResults(limit = 10) {
    if (!this.isLive) return null;
    const { data, error } = await this.client
      .from('quiz_results')
      .select('student_name, group_name, score, total_questions, completed_at')
      .order('score', { ascending: false })
      .order('completed_at', { ascending: true })
      .limit(limit);
    if (error) {
      cloudLogger.error('Ошибка загрузки рейтинга:', error);
      return null;
    }
    return data || [];
  }
};

window.CloudSync = CloudSync;
document.addEventListener('DOMContentLoaded', () => CloudSync.init());
window.addEventListener('online', () => CloudSync.reconnect());
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') CloudSync.reconnect();
});
