/**
 * ============================================================================
 * ГЛОБАЛЬНАЯ СИНХРОНИЗАЦИЯ OMNI-SYNC: js/cloud-sync.js (v4.0 Master)
 * ============================================================================
 */

'use strict';

const CloudConfig = {
  // Реальные ключи проекта Supabase.
  SUPABASE_URL: "https://qtafcczydgyrganrpkof.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0YWZjY3p5ZGd5cmdhbnJwa29mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwNTg5MDEsImV4cCI6MjEwNDYzNDkwMX0.i_hFegr6BHix6eFEasgyICDE6Lcy5wbwbU6dArG-wFg"
};

const CloudSync = {
  client: null,
  isLive: false,

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
    if (typeof supabase !== 'undefined' && CloudConfig.SUPABASE_URL.indexOf('ВАШ_PROJECT_ID') === -1) {
      try {
        this.client = supabase.createClient(CloudConfig.SUPABASE_URL, CloudConfig.SUPABASE_ANON_KEY);
        this.isLive = true;
        this.subscribeRealtime();
        console.log("[CloudSync] 🌐 OMNI-SYNC подключен. Все модули работают в реальном времени.");
      } catch (err) {
        console.warn("[CloudSync] Ошибка подключения к облаку:", err);
      }
    }
  },

  subscribeRealtime() {
    if (!this.client) return;

    // Слушатель счетчиков (Свечи и Цветы)
    this.client.channel('realtime_counters')
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

    // Слушатель Стены Памяти
    this.client.channel('realtime_guestbook')
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
    const { data } = await this.client.rpc('increment_hero_candle', { target_hero_id: heroId });
    return data;
  },
  async pushFlower(heroId, count = 2) {
    if (!this.isLive) return null;
    const { data } = await this.client.rpc('increment_hero_flower', { target_hero_id: heroId, qty: count });
    return data;
  },

  // --- МЕТОДЫ СТЕНЫ ПАМЯТИ ---
  async fetchTributes() {
    if (!this.isLive) return null;
    const { data, error } = await this.client.from('guestbook_tributes').select('*').order('is_pinned', { ascending: false }).order('created_at', { ascending: false });
    if (error) {
      console.error('[CloudSync] Ошибка загрузки Стены Памяти:', error);
      return null;
    }
    return data ? data.map(row => this.normalizeTribute(row)) : [];
  },
  async sendTribute(tributeObj) {
    if (!this.isLive) return false;
    const { error } = await this.client.from('guestbook_tributes').insert([this.serializeTribute(tributeObj)]);
    if (error) console.error('[CloudSync] Ошибка публикации послания:', error);
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
    if (error) console.error("Ошибка регистрации сертификатов:", error);
    return !error;
  },
  async verifyCertificate(serial) {
    if (!this.isLive) return null;
    const { data } = await this.client.from('certificates_registry').select('*').eq('serial', serial).single();
    return data;
  },

  // --- МЕТОДЫ КВИЗА (НОВОЕ) ---
  async saveQuizResult(name, score) {
    if (!this.isLive) return false;
    await this.client.from('quiz_leaderboard').insert([{ student_name: name, score: score }]);
    return true;
  }
};

window.CloudSync = CloudSync;
document.addEventListener('DOMContentLoaded', () => CloudSync.init());