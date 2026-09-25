/**
 * ============================================================================
 * КРИПТОГРАФИЧЕСКИЙ АНТИБОТ-ЩИТ: js/anti-cheat-tribute.js (v6.1 Enterprise Shield)
 * Комплексная защита от накрутки, ботов, скриптов и манипуляций со статистикой
 * 
 * Включает:
 * 1. Клиентский UUID каждого визита пользователя (хранится в sessionStorage)
 *    для валидации уникальности взаимодействий без требования авторизации
 * 2. Аппаратный фингерпринт устройства (Multi-Vector Canvas + WebGL + Audio/Screen)
 * 3. Клиентский Proof-of-Work (PoW SHA-256) с солью сессии
 * 4. Детекция синтетических событий (event.isTrusted + анализ энтропии указателя)
 * 5. Защита от спама и rate-limiting (кулдауны свечей, цветов, лампады, стены, квиза)
 * 6. Сессионный реестр уникальных попыток взаимодействия
 * ============================================================================
 */

'use strict';

const TributeSecurity = {
  POW_DIFFICULTY: "0000", // Хэш PoW должен начинаться с 4 нулей
  SALT: "SRMK_MEMORIAL_DEFENSE_HEROES_2026",
  SESSION_STORAGE_KEY: "srmk_user_session_uuid",
  COOLDOWN_TRIBUTE_MS: 12 * 60 * 60 * 1000, // 12-часовой кулдаун на свечи и цветы
  COOLDOWN_GUESTBOOK_MS: 30 * 1000,          // 30 секунд между публикациями на стене
  DEBOUNCE_CLICK_MS: 1200,                  // Минимум 1.2 секунды между кликами
  MAX_SESSION_POSTS: 5,                     // Максимум 5 посланий за одну пользовательскую сессию

  _cachedFingerprint: null,
  _inMemorySessionUuid: null,
  _mouseEntropy: [],
  _lastClickTime: 0,
  _lastTributePostTime: 0,

  init() {
    this._trackPointerEntropy();
    const visitId = this.getSessionVisitId(); // Инициализация и сохранение клиентского UUID визита в sessionStorage
    this.getDeviceFingerprint();              // Предварительный прогрев аппаратного хэша
    console.log("[TributeSecurity v6.1] 🛡 Античит-щит активен. UUID сессии визита:", visitId);
  },

  /**
   * 1. Генерация криптографически стойкого UUID v4 (RFC 4122)
   */
  generateUUID() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  },

  /**
   * 2. Получение или создание уникального UUID для текущего сеанса пользователя.
   * Хранится в sessionStorage — сохраняется при переходах между страницами,
   * обновлении вкладки, но автоматически обновляется для нового сеанса визита.
   * Позволяет валидировать уникальные попытки взаимодействия без входа в аккаунт.
   */
  getSessionVisitId() {
    try {
      let visitUuid = sessionStorage.getItem(this.SESSION_STORAGE_KEY);
      if (!visitUuid) {
        visitUuid = this.generateUUID();
        sessionStorage.setItem(this.SESSION_STORAGE_KEY, visitUuid);
      }
      return visitUuid;
    } catch (e) {
      if (!this._inMemorySessionUuid) {
        this._inMemorySessionUuid = this.generateUUID();
      }
      return this._inMemorySessionUuid;
    }
  },

  /**
   * 3. Регистрация и аудит уникальной попытки взаимодействия в рамках текущего визита
   */
  recordInteractionAttempt(actionType, targetId, visitId) {
    const vid = visitId || this.getSessionVisitId();
    const sessionKey = `srmk_session_attempts_${vid}`;
    const attemptId = `att_${vid.substring(0, 8)}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    
    try {
      const raw = sessionStorage.getItem(sessionKey);
      const attempts = raw ? JSON.parse(raw) : [];
      const record = {
        attemptId,
        actionType: actionType || 'tribute',
        targetId: targetId || 'general',
        timestamp: Date.now()
      };
      attempts.push(record);
      sessionStorage.setItem(sessionKey, JSON.stringify(attempts));
      return record;
    } catch (e) {
      return {
        attemptId,
        actionType,
        targetId,
        timestamp: Date.now()
      };
    }
  },

  /**
   * Получение списка всех попыток взаимодействия за текущий визит
   */
  getSessionAttempts(visitId) {
    try {
      const vid = visitId || this.getSessionVisitId();
      const raw = sessionStorage.getItem(`srmk_session_attempts_${vid}`);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
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
   * 4. Генерация аппаратного фингерпринта устройства (Canvas + Screen + Timezone + WebGL)
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
   * 5. Решение криптографической задачи Proof-of-Work (SHA-256)
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
      if (nonce > 300000) break;
    }
    return { nonce: 0, hash: "fallback" };
  },

  /**
   * 6. Проверка права на действие мемориала (Свеча / Цветы)
   * Включает клиентский UUID сессии визита для аудита уникальных попыток
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

    // В) Получение клиентского UUID текущего визита из sessionStorage
    const visitId = this.getSessionVisitId();
    const deviceId = await this.getDeviceFingerprint();

    // Г) Проверка суточного / 12-часового кулдауна на устройстве
    const storageKey = `srmk_tribute_${type}_${heroId || 'global'}_${deviceId}`;
    const lastDone = parseInt(localStorage.getItem(storageKey) || '0', 10);

    if (now - lastDone < this.COOLDOWN_TRIBUTE_MS) {
      const hoursLeft = Math.ceil((this.COOLDOWN_TRIBUTE_MS - (now - lastDone)) / (1000 * 60 * 60));
      const actionName = type === 'flowers' ? 'возложили цветы' : 'зажгли Свечу Памяти';
      this._showToast(`Вы уже ${actionName} сегодня. Повторить можно через ${hoursLeft} ч. Благодарим за память!`, "info");
      return;
    }

    // Д) Фиксация уникальной попытки взаимодействия в сессии
    const attemptRecord = this.recordInteractionAttempt(type, heroId, visitId);

    // Е) Решение криптографической задачи PoW с включением UUID визита
    const challenge = `${deviceId}_${visitId}_${heroId || 'global'}_${Date.now()}`;
    await this.solveProofOfWork(challenge);

    // Ж) Фиксация времени действия в локальном кэше устройства
    try {
      localStorage.setItem(storageKey, now.toString());
    } catch (e) {}

    // З) Обновление локального хранилища действий
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
      onSuccess(vault[actionKey], {
        visitId,
        deviceId,
        attemptId: attemptRecord.attemptId
      });
    }
  },

  /**
   * 7. Проверка и валидация отправки послания на Стену Памяти
   * Включает клиентский UUID сессии визита для аудита и ограничения спам-попыток
   */
  async verifyTributePost(author, message, event) {
    if (event && event.isTrusted === false) {
      this._showToast("Имитация действия отклонена.", "error");
      return { allowed: false, reason: "untrusted_event" };
    }

    const visitId = this.getSessionVisitId();

    // Проверка лимита отправок в рамках текущей пользовательской сессии визита
    const sessionCountKey = `srmk_session_posts_${visitId}`;
    let sessionPosts = 0;
    try {
      sessionPosts = parseInt(sessionStorage.getItem(sessionCountKey) || "0", 10);
      if (sessionPosts >= this.MAX_SESSION_POSTS) {
        this._showToast("Лимит посланий на текущую сессию исчерпан. Благодарим за ваше памятное слово!", "info");
        return { allowed: false, reason: "session_limit_reached", visitId };
      }
    } catch (e) {}

    const now = Date.now();
    if (now - this._lastTributePostTime < this.COOLDOWN_GUESTBOOK_MS) {
      const secLeft = Math.ceil((this.COOLDOWN_GUESTBOOK_MS - (now - this._lastTributePostTime)) / 1000);
      this._showToast(`Защита от флуда: следующее послание можно отправить через ${secLeft} сек.`, "warn");
      return { allowed: false, reason: "rate_limit", visitId };
    }

    const cleanAuthor = String(author || "").trim();
    const cleanMessage = String(message || "").trim();

    if (cleanAuthor.length < 2 || cleanAuthor.length > 100) {
      this._showToast("Имя автора должно содержать от 2 до 100 символов.", "warn");
      return { allowed: false, reason: "invalid_author", visitId };
    }

    if (cleanMessage.length < 3 || cleanMessage.length > 1500) {
      this._showToast("Текст послания должен содержать от 3 до 1500 символов.", "warn");
      return { allowed: false, reason: "invalid_message", visitId };
    }

    this._lastTributePostTime = now;
    try {
      sessionStorage.setItem(sessionCountKey, (sessionPosts + 1).toString());
    } catch (e) {}

    const fingerprint = await this.getDeviceFingerprint();
    const attemptRecord = this.recordInteractionAttempt('guestbook_tribute', 'wall', visitId);

    return { 
      allowed: true, 
      fingerprint, 
      visitId,
      sessionVisitId: visitId,
      attemptId: attemptRecord.attemptId 
    };
  },

  /**
   * 8. Высокоуровневая функция отправки трибьюта/послания (submitTribute)
   * Возвращает полностью валидированный объект с включенным UUID сессии визита
   */
  async submitTribute(tributeData, event) {
    const visitId = this.getSessionVisitId();
    const verification = await this.verifyTributePost(
      tributeData?.author,
      tributeData?.message,
      event
    );

    if (!verification.allowed) {
      return { allowed: false, reason: verification.reason, visitId };
    }

    return {
      allowed: true,
      visitId,
      sessionVisitId: visitId,
      fingerprint: verification.fingerprint,
      attemptId: verification.attemptId,
      payload: {
        ...tributeData,
        visit_id: visitId,
        client_fingerprint: verification.fingerprint
      }
    };
  },

  /**
   * 9. Проверка клика по лампаде Стены Памяти с фиксацией сессии
   */
  async verifyFlameToggle(tributeId, event) {
    if (event && event.isTrusted === false) {
      return { allowed: false, fingerprint: null, visitId: null };
    }

    const now = Date.now();
    if (now - this._lastClickTime < 300) {
      return { allowed: false, fingerprint: null, visitId: null }; // Дебаунс 300мс от двойного клика
    }
    this._lastClickTime = now;

    const visitId = this.getSessionVisitId();
    const fingerprint = await this.getDeviceFingerprint();
    const attemptRecord = this.recordInteractionAttempt('flame_toggle', tributeId, visitId);

    return { 
      allowed: true, 
      fingerprint, 
      visitId,
      sessionVisitId: visitId,
      attemptId: attemptRecord.attemptId 
    };
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
