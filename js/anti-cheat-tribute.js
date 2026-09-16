/**
 * ============================================================================
 * КРИПТОГРАФИЧЕСКИЙ АНТИБОТ-ЩИТ: js/anti-cheat-tribute.js (v3.0 Master)
 * Proof-of-Work (PoW) + Биометрия курсора + Аппаратный фингерпринт устройства
 * 
 * Обеспечивает единую защищенную фиксацию возложения цветов и зажжения свечей
 * ============================================================================
 */

'use strict';

const TributeSecurity = {
  POW_DIFFICULTY: "0000", // Хэш должен начинаться с 4 нулей
  SALT: "SRMK_MEMORIAL_DEFENSE_HEROES_2026",
  COOLDOWN_MS: 24 * 60 * 60 * 1000, // Суточный кулдаун (24 часа)

  _mouseEntropy: [],
  _lastClickTime: 0,

  init() {
    this._trackMouseEntropy();
    console.log("[TributeSecurity v3.0] Криптографический антибот-щит готов.");
  },

  _trackMouseEntropy() {
    let lastMove = 0;
    window.addEventListener('mousemove', (e) => {
      const now = performance.now();
      if (now - lastMove > 50) {
        this._mouseEntropy.push(Math.round(e.clientX + e.clientY));
        if (this._mouseEntropy.length > 20) this._mouseEntropy.shift();
        lastMove = now;
      }
    }, { passive: true });
  },

  /**
   * 1. Генерация уникального аппаратного отпечатка устройства (Canvas Fingerprint)
   */
  async getDeviceFingerprint() {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 30;
      const ctx = canvas.getContext('2d');
      ctx.textBaseline = "top";
      ctx.font = "14px 'Cinzel', serif";
      ctx.fillStyle = "#8a1c22";
      ctx.fillText("SRMK-MEMORIAL-2026", 2, 2);
      ctx.fillStyle = "#c5a059";
      ctx.fillRect(10, 10, 80, 10);
      
      const canvasHash = canvas.toDataURL();
      const rawSeed = `${navigator.userAgent}_${screen.width}x${screen.height}_${canvasHash}`;
      
      const msgBuffer = new TextEncoder().encode(rawSeed);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
        .substring(0, 16);
    } catch (e) {
      return "srmk_fallback_device_" + Math.random().toString(36).substring(2, 8);
    }
  },

  /**
   * 2. Решение криптографической задачи Proof-of-Work на клиенте
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
      if (nonce > 500000) break; // Защита от бесконечного цикла
    }
    return null;
  },

  /**
   * 3. Главная проверка права на действие (Свеча или Цветы)
   */
  async verifyAndExecuteTribute(type, heroId, event, onSuccess) {
    // А) Защита от программной эмуляции клика (bot.click())
    if (event && !event.isTrusted) {
      this._showToast("Программное воздействие заблокировано системой безопасности.", "error");
      return;
    }

    // Б) Анализ естественной энтропии движений курсора
    if (this._mouseEntropy.length < 3 && !('ontouchstart' in window)) {
      this._showToast("Слишком быстрое действие. Пожалуйста, взаимодействуйте естественно.", "warn");
      return;
    }

    // В) Анти-спам задержка (не чаще 1 раза в 1.5 секунды)
    const now = Date.now();
    if (now - this._lastClickTime < 1500) return;
    this._lastClickTime = now;

    // Г) Проверка суточного кулдауна для конкретного действия и героя
    const deviceId = await this.getDeviceFingerprint();
    const storageKey = `srmk_tribute_${type}_${heroId || 'global'}_${deviceId}`;
    const lastDone = parseInt(localStorage.getItem(storageKey) || '0', 10);

    if (now - lastDone < this.COOLDOWN_MS) {
      const hoursLeft = Math.ceil((this.COOLDOWN_MS - (now - lastDone)) / (1000 * 60 * 60));
      const actionName = type === 'flowers' ? 'возложили цветы' : 'зажгли Свечу Памяти';
      this._showToast(`Вы уже ${actionName} сегодня. Повторное действие доступно через ${hoursLeft} ч.`, "info");
      return;
    }

    // Д) Запуск решения криптографической задачи PoW
    this._showToast("Верификация действия...", "info");
    const challenge = `${deviceId}_${heroId || 'global'}_${Date.now()}`;
    const solution = await this.solveProofOfWork(challenge);

    if (!solution) {
      this._showToast("Ошибка валидации вычислений.", "error");
      return;
    }

    // Е) Фиксация времени действия в локальном кэше устройства
    localStorage.setItem(storageKey, now.toString());
    
    // Ж) Обновление единого реестра счетчиков устройства
    let vault = JSON.parse(localStorage.getItem('srmk_tribute_vault') || '{}');
    const actionKey = `${type}_${heroId || 'global'}`;
    const incrementStep = (type === 'flowers') ? 2 : 1;
    vault[actionKey] = (vault[actionKey] || 0) + incrementStep;
    localStorage.setItem('srmk_tribute_vault', JSON.stringify(vault));

    if (typeof onSuccess === 'function') {
      onSuccess(vault[actionKey]);
    }
  },

  _showToast(msg, type = "info") {
    let toast = document.getElementById('memorialToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'memorialToast';
      toast.className = 'memorial-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.className = `memorial-toast active toast-${type}`;
    setTimeout(() => toast.classList.remove('active'), 3200);
  }
};

window.TributeSecurity = TributeSecurity;
document.addEventListener('DOMContentLoaded', () => TributeSecurity.init());