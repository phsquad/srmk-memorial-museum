/**
 * ============================================================================
 * МОДУЛЬ ГЛОБАЛЬНОЙ СИНХРОНИЗАЦИИ: js/cloud-sync.js
 * Реальное время (WebSockets) для свечей, цветов и Стены Памяти
 * ============================================================================
 */

'use strict';

const CloudConfig = {
  // ❗️ ВСТАВЬТЕ СЮДА ВАШИ ДАННЫЕ ИЗ ШАГА 3:
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
        console.log("[CloudSync] 🌐 Подключено к глобальному Realtime-хабу Supabase.");
      } catch (err) {
        console.warn("[CloudSync] Ошибка подключения к облаку, работа в локальном режиме:", err);
      }
    } else {
      console.warn("[CloudSync] Ключи Supabase не настроены. Сайт работает в автономном LocalStorage-режиме.");
    }
  },

  /**
   * Подписка на живые события со всей страны (WebSockets)
   */
  subscribeRealtime() {
    if (!this.client) return;

    // 1. Живой пересчет свечей и цветов
    this.client
      .channel('realtime_memorial_counters')
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
            if (candleDisplay && AppState.currentHeroId === row.hero_id) {
              candleDisplay.textContent = row.candles;
            }
          }
        }

        if (typeof TechModules !== 'undefined') {
          TechModules.syncFlowerCounters();
        }
      })
      .subscribe();

    // 2. Живое появление новых отзывов на Стене Памяти
    this.client
      .channel('realtime_guestbook')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guestbook_tributes' }, (payload) => {
        if (typeof GuestbookEngine !== 'undefined') {
          if (payload.eventType === 'INSERT') {
            const exists = GuestbookEngine.tributes.some(t => t.id === payload.new.id);
            if (!exists) {
              GuestbookEngine.tributes.unshift(payload.new);
              GuestbookEngine.renderWall();
              GuestbookEngine.updateStats();
              GuestbookEngine.showToast(`Новое послание от ${payload.new.author}!`);
            }
          } else if (payload.eventType === 'UPDATE') {
            const idx = GuestbookEngine.tributes.findIndex(t => t.id === payload.new.id);
            if (idx !== -1) {
              GuestbookEngine.tributes[idx] = payload.new;
              GuestbookEngine.renderWall();
              GuestbookEngine.updateStats();
            }
          } else if (payload.eventType === 'DELETE') {
            GuestbookEngine.tributes = GuestbookEngine.tributes.filter(t => t.id === payload.old.id);
            GuestbookEngine.renderWall();
            GuestbookEngine.updateStats();
          }
        }
      })
      .subscribe();
  },

  /* ==========================================================================
     СВЕЧИ И ЦВЕТЫ
     ========================================================================== */
  async fetchAllCounters() {
    if (!this.isLive) return null;
    try {
      const { data, error } = await this.client.from('memorial_counters').select('*');
      if (error) throw error;
      
      const candlesMap = {};
      let totalFlowers = 0;
      data.forEach(r => {
        candlesMap[r.hero_id] = r.candles;
        totalFlowers += (r.flowers || 0);
      });
      return { candles: candlesMap, flowers: totalFlowers };
    } catch (e) {
      return null;
    }
  },

  async pushCandle(heroId) {
    if (!this.isLive) return null;
    try {
      const { data, error } = await this.client.rpc('increment_hero_candle', { target_hero_id: heroId });
      if (error) throw error;
      return data;
    } catch (e) {
      return null;
    }
  },

  async pushFlower(heroId, count = 2) {
    if (!this.isLive) return null;
    try {
      const { data, error } = await this.client.rpc('increment_hero_flower', { target_hero_id: heroId, qty: count });
      if (error) throw error;
      return data;
    } catch (e) {
      return null;
    }
  },

  /* ==========================================================================
     СТЕНА ПАМЯТИ
     ========================================================================== */
  async fetchTributes() {
    if (!this.isLive) return null;
    try {
      const { data, error } = await this.client
        .from('guestbook_tributes')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    } catch (e) {
      return null;
    }
  },

  async sendTribute(tributeObj) {
    if (!this.isLive) return false;
    try {
      const { error } = await this.client.from('guestbook_tributes').insert([tributeObj]);
      if (error) throw error;
      return true;
    } catch (e) {
      return false;
    }
  },

  async toggleFlame(tributeId, delta) {
    if (!this.isLive) return null;
    try {
      const { data, error } = await this.client.rpc('toggle_tribute_flame', { target_tribute_id: tributeId, delta: delta });
      if (error) throw error;
      return data;
    } catch (e) {
      return null;
    }
  },

  async deleteTribute(tributeId) {
    if (!this.isLive) return false;
    try {
      const { error } = await this.client.from('guestbook_tributes').delete().eq('id', tributeId);
      return !error;
    } catch (e) {
      return false;
    }
  }
};

window.CloudSync = CloudSync;
document.addEventListener('DOMContentLoaded', () => CloudSync.init());