/**
 * ============================================================================
 * ГЛОБАЛЬНАЯ СИНХРОНИЗАЦИЯ OMNI-SYNC: js/cloud-sync.js (v3.0)
 * ============================================================================
 */

'use strict';

const CloudConfig = {
  // ❗️ ВСТАВЬТЕ ВАШИ КЛЮЧИ SUPABASE СЮДА:
  SUPABASE_URL: "https://qtafcczydgyrganrpkof.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0YWZjY3p5ZGd5cmdhbnJwa29mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwNTg5MDEsImV4cCI6MjEwNDYzNDkwMX0.i_hFegr6BHix6eFEasgyICDE6Lcy5wbwbU6dArG-wFg"
};

const CloudSync = {
  client: null,
  isLive: false,

  init() {
    if (typeof supabase !== 'undefined' && CloudConfig.SUPABASE_URL.indexOf('ВАШ_PROJECT_ID') === -1) {
      try {
        this.client = supabase.createClient(CloudConfig.SUPABASE_URL, CloudConfig.SUPABASE_ANON_KEY);
        this.isLive = true;
        this.subscribeRealtime();
        console.log("[CloudSync] 🌐 OMNI-SYNC подключен. Все модули работают в реальном времени.");
      } catch (err) {
        console.warn("[CloudSync] Ошибка подключения к облаку.");
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
        if (typeof TechModules !== 'undefined') TechModules.syncFlowerCounters();
      }).subscribe();

    // Слушатель Стены Памяти
    this.client.channel('realtime_guestbook')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guestbook_tributes' }, (payload) => {
        if (typeof GuestbookEngine !== 'undefined') {
          if (payload.eventType === 'INSERT') {
            GuestbookEngine.tributes.unshift(payload.new);
            GuestbookEngine.renderWall();
            GuestbookEngine.updateStats();
          } else if (payload.eventType === 'UPDATE') {
            const idx = GuestbookEngine.tributes.findIndex(t => t.id === payload.new.id);
            if (idx !== -1) GuestbookEngine.tributes[idx] = payload.new;
            GuestbookEngine.renderWall();
          } else if (payload.eventType === 'DELETE') {
            GuestbookEngine.tributes = GuestbookEngine.tributes.filter(t => t.id === payload.old.id);
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
    const { data } = await this.client.from('guestbook_tributes').select('*').order('is_pinned', { ascending: false }).order('created_at', { ascending: false });
    return data;
  },
  async sendTribute(tributeObj) {
    if (!this.isLive) return false;
    await this.client.from('guestbook_tributes').insert([tributeObj]);
    return true;
  },
  async toggleFlame(tributeId, delta) {
    if (!this.isLive) return null;
    await this.client.rpc('toggle_tribute_flame', { target_tribute_id: tributeId, delta: delta });
  },

  // --- МЕТОДЫ СЕРТИФИКАТОВ (НОВОЕ) ---
  async registerCertificate(certObj) {
    if (!this.isLive) return false;
    const { error } = await this.client.from('certificates_registry').insert([certObj]);
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