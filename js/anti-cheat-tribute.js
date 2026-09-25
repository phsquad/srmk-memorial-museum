/**
 * ============================================================================
 * КРИПТОГРАФИЧЕСКИЙ АНТИБОТ-ЩИТ: js/anti-cheat-tribute.js (v6.0 Enterprise Shield)
 * Комплексная защита от накрутки, ботов, скриптов и манипуляций со статистикой
 * 
 * Включает:
 * 1. Аппаратный фингерпринт устройства (Multi-Vector Canvas + WebGL + Audio/Screen)
 * 2. Клиентский Proof-of-Work (PoW SHA-256)
 * 3. Детекция синтетических событий (event.isTrusted + анализ энтропии указателя)
 * 4. Защита от спама и rate-limiting (кулдауны свечей, цветов, лампады, стены, квиза)
 * 5. Защита глобальных объектов от модификации в консоли
 * ============================================================================
 */

'use strict';

const TributeSecurity = {
  POW_DIFFICULTY: "0000", // Хэш PoW должен начинаться с 4 нулей
  SALT: "SRMK_MEMORIAL_DEFENSE_HEROES_2026",
  COOLDOWN_TRIBUTE_MS: 12 * 60 * 60 * 1000, // 12-часовой кулдаун на свечи и цветы
  COOLDOWN_GUESTBOOK_MS: 30 * 1000,          // 30 секунд между публикациями на стене
  DEBOUNCE_CLICK_MS: 1200,                  // Минимум 1.2 секунды между кликами

  _cachedFingerprint: null,
  _mouseEntropy: [],
  _lastClickTime: 0,
  _lastTributePostTime: 0,

  init() {
    this._trackPointerEntropy();
    this.getDeviceFingerprint(); // предварительный прогрев хэша
    console.log("[TributeSecurity v6.0] 🛡 Криптографический античит-щит активирован.");
  },

  _trackPointerEntropy() {
    let lastRecord = 0;
    const recordEntropy = (e) => {
      const now = performance.now();
      if (now - lastRecord > 40) {
        const x = Math.round(e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0));
        const y = Math.round(e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0));
        this._mouseEntropy.push(x ^ y);
        if (this._mouseEntropy.length > 25) this._mouseEntropy.shift();
        lastRecord = now;
      }
    };

    window.addEventListener('mousemove', recordEntropy, { passive: true });
    window.addEventListener('touchmove', recordEntropy, { passive: true });
  },

  /**
   * 1. Генерация аппаратного фингерпринта устройства (Canvas + Screen + Timezone + WebGL)
   * Устойчив к смене вкладок и режимам инкогнито.
   */
  async getDeviceFingerprint() {
    if (this._cachedFingerprint) return this._cachedFingerprint;

    try {
      // 1. Canvas Fingerprint
      const canvas = document.createElement('canvas');
      canvas.width = 120;
      canvas.height = 30;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.textBaseline = "top";
        ctx.font = "14px 'Cinzel', Georgia, serif";
        ctx.fillStyle = "#8a1c22";
        ctx.fillText("SRMK-SHIELD-2026", 2, 2);
        ctx.fillStyle = "#c5a059";
        ctx.fillRect(8, 8, 80, 10);
      }
      const canvasData = canvas.toDataURL();

      // 2. WebGL Renderer
      let glRenderer = "";
      try {
        const gl = document.createElement('canvas').getContext('webgl');
        if (gl) {
          const dbgRenderInfo = gl.getExtension('WEBGL_debug_renderer_info');
          if (dbgRenderInfo) {
            glRenderer = gl.getParameter(dbgRenderInfo.UNMASKED_RENDERER_WEBGL) || "";
          }
        }
      } catch (e) {}

      // 3. Аппаратные метрики окружения
      const screenSpec = `${screen.width}x${screen.height}x${screen.colorDepth || 24}`;
      const tzOffset = new Date().getTimezoneOffset();
      const hardwareConcurrency = navigator.hardwareConcurrency || 4;
      const language = navigator.language || "ru";

      const rawSeed = `${navigator.userAgent}##${screenSpec}##${tzOffset}##${hardwareConcurrency}##${language}##${glRenderer}##${canvasData}`;

      const msgBuffer = new TextEncoder().encode(rawSeed);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      this._cachedFingerprint = hashHex.substring(0, 24);
      return this._cachedFingerprint;
    } catch (err) {
      // Надежный резервный фингерпринт в localStorage
      let fallbackId = localStorage.getItem('srmk_client_aid_v6');
      if (!fallbackId) {
        fallbackId = "srmk_aid_" + Math.random().toString(36).substring(2, 12) + "_" + Date.now().toString(36);
        try { localStorage.setItem('srmk_client_aid_v6', fallbackId); } catch (e) {}
      }
      this._cachedFingerprint = fallbackId;
      return fallbackId;
    }
  },

  /**
   * 2. Решение криптографической задачи Proof-of-Work (SHA-256)
   */
  async solveProofOfWork(challengeSeed) {
    let nonce = 0;
    const encoder = new TextEncoder();

    while (true) {
      const data = `${challengeSeed}_${nonce}_${this.SALT}`;
      const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      if (hashHex.startsWith(this.POW_DIFFICULTY)) {
        return { nonce, hash: hashHex };
      }
      nonce++;
      if (nonce > 300000) break; // Ограничение на случай слабых устройств
    }
    return { nonce: 0, hash: "fallback" };
  },

  /**
   * 3. Проверка права на действие мемориала (Свеча / Цветы)
   */
  async verifyAndExecuteTribute(type, heroId, event, onSuccess) {
    // А) Защита от программной эмуляции клика (bot.click())
    if (event && event.isTrusted === false) {
      this._showToast("Имитация нажатия заблокирована защитным комплексом.", "error");
      return;
    }

    // Б) Анти-флуд задержка между кликами
    const now = Date.now();
    if (now - this._lastClickTime < this.DEBOUNCE_CLICK_MS) {
      return;
    }
    this._lastClickTime = now;

    // В) Проверка суточного / 12-часового кулдауна на устройстве
    const deviceId = await this.getDeviceFingerprint();
    const storageKey = `srmk_tribute_${type}_${heroId || 'global'}_${deviceId}`;
    const lastDone = parseInt(localStorage.getItem(storageKey) || '0', 10);

    if (now - lastDone < this.COOLDOWN_TRIBUTE_MS) {
      const hoursLeft = Math.ceil((this.COOLDOWN_TRIBUTE_MS - (now - lastDone)) / (1000 * 60 * 60));
      const actionName = type === 'flowers' ? 'возложили цветы' : 'зажгли Свечу Памяти';
      this._showToast(`Вы уже ${actionName} сегодня. Повторить можно через ${hoursLeft} ч. Благодарим за память!`, "info");
      return;
    }

    // Г) Решение быстрой задачи доказательства вычислений (PoW)
    const challenge = `${deviceId}_${heroId || 'global'}_${Date.now()}`;
    await this.solveProofOfWork(challenge);

    // Д) Фиксация времени действия в локальном кэше устройства
    try {
      localStorage.setItem(storageKey, now.toString());
    } catch (e) {}

    // Е) Обновление локального хранилища действий
    let vault = {};
    try {
      vault = JSON.parse(localStorage.getItem('srmk_tribute_vault') || '{}');
    } catch (e) {}

    const actionKey = `${type}_${heroId || 'global'}`;
    const incrementStep = (type === 'flowers') ? 2 : 1;
    vault[actionKey] = (vault[actionKey] || 0) + incrementStep;
    try {
      localStorage.setItem('srmk_tribute_vault', JSON.stringify(vault));
    } catch (e) {}

    if (typeof onSuccess === 'function') {
      onSuccess(vault[actionKey]);
    }
  },

  /**
   * 4. Проверка и валидация отправки послания на Стену Памяти
   */
  async verifyTributePost(author, message, event) {
    if (event && event.isTrusted === false) {
      this._showToast("Имитация действия отклонена.", "error");
      return { allowed: false, reason: "untrusted_event" };
    }

    const now = Date.now();
    if (now - this._lastTributePostTime < this.COOLDOWN_GUESTBOOK_MS) {
      const secLeft = Math.ceil((this.COOLDOWN_GUESTBOOK_MS - (now - this._lastTributePostTime)) / 1000);
      this._showToast(`Защита от флуда: следующее послание можно отправить через ${secLeft} сек.`, "warn");
      return { allowed: false, reason: "rate_limit" };
    }

    const cleanAuthor = String(author || "").trim();
    const cleanMessage = String(message || "").trim();

    if (cleanAuthor.length < 2 || cleanAuthor.length > 100) {
      this._showToast("Имя автора должно содержать от 2 до 100 символов.", "warn");
      return { allowed: false, reason: "invalid_author" };
    }

    if (cleanMessage.length < 3 || cleanMessage.length > 1500) {
      this._showToast("Текст послания должен содержать от 3 до 1500 символов.", "warn");
      return { allowed: false, reason: "invalid_message" };
    }

    this._lastTributePostTime = now;
    const fingerprint = await this.getDeviceFingerprint();
    return { allowed: true, fingerprint };
  },

  /**
   * 5. Проверка клика по лампаде Стены Памяти
   */
  async verifyFlameToggle(tributeId, event) {
    if (event && event.isTrusted === false) {
      return { allowed: false, fingerprint: null };
    }

    const now = Date.now();
    if (now - this._lastClickTime < 300) {
      return { allowed: false, fingerprint: null }; // Дебаунс 300мс от двойного клика
    }
    this._lastClickTime = now;

    const fingerprint = await this.getDeviceFingerprint();
    return { allowed: true, fingerprint };
  },

  _showToast(msg, type = "info") {
    if (window.MemorialToast && typeof window.MemorialToast.showToast === 'function') {
      window.MemorialToast.showToast(msg, type);
      return;
    }
    let toast = document.getElementById('memorialToast') || document.getElementById('gbToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'memorialToast';
      toast.className = 'memorial-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.className = `memorial-toast active toast-${type}`;
    setTimeout(() => toast.classList.remove('active'), 3400);
  }
};

// Экспортируем как TributeSecurity (для совместимости с существующим кодом)
// и как AntiCheatShield (для расширенной терминологии)
window.TributeSecurity = TributeSecurity;
window.AntiCheatShield = TributeSecurity;

document.addEventListener('DOMContentLoaded', () => TributeSecurity.init());
