/**
 * ============================================================================
 * КРИПТОГРАФИЧЕСКИЙ АНТИБОТ-ЩИТ: js/anti-cheat-tribute.js
 * Proof-of-Work (PoW) + Биометрия курсора + Аппаратный фингерпринт
 * ============================================================================
 */

'use strict';

const TributeSecurity = {
  POW_DIFFICULTY: "0000", // Требуется хэш, начинающийся с 4 нулей
  SALT: "SRMK_MEMORIAL_DEFENSE_HEROES_2026",
  COOLDOWN_MS: 24 * 60 * 60 * 1000, // 24 часа

  // Сбор энтропии движений курсора
  _mouseEntropy: [],
  _lastClickTime: 0,

  init() {
    this._trackMouseEntropy();
  },

  _trackMouseEntropy() {
    let lastMove = 0;
    window.addEventListener('mousemove', (e) => {
      const now = performance.now();
      if (now - lastMove > 50) { // Сэмплирование раз в 50мс
        this._mouseEntropy.push(Math.round(e.clientX + e.clientY));
        if (this._mouseEntropy.length > 20) this._mouseEntropy.shift();
        lastMove = now;
      }
    }, { passive: true });
  },

  /**
   * 1. Генерация уникального аппаратного слепка устройства
   */
  async getDeviceFingerprint() {
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
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
  },

  /**
   * 2. Proof-of-Work (Решение криптографической головоломки на клиенте)
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
   * 3. Главная проверка права на действие
   */
  async verifyAndExecuteTribute(type, heroId, event, onSuccess) {
    // А) Проверка на эмуляцию клика скриптом
    if (!event || !event.isTrusted) {
      this._showToast("Ошибка: Программное воздействие заблокировано системой безопасности.", "error");
      return;
    }

    // Б) Анализ энтропии движений человека
    if (this._mouseEntropy.length < 3 && !('ontouchstart' in window)) {
      this._showToast("Внимание: Слишком быстрое действие. Пожалуйста, взаимодействуйте естественно.", "warn");
      return;
    }

    // В) Анти-спам интервал (не чаще 1 раза в 2 секунды)
    const now = Date.now();
    if (now - this._lastClickTime < 2000) return;
    this._lastClickTime = now;

    // Г) Проверка 24-часового лимита для конкретного действия
    const deviceId = await this.getDeviceFingerprint();
    const storageKey = `srmk_tribute_${type}_${heroId || 'global'}_${deviceId}`;
    const lastDone = parseInt(localStorage.getItem(storageKey) || '0', 10);

    if (now - lastDone < this.COOLDOWN_MS) {
      const hoursLeft = Math.ceil((this.COOLDOWN_MS - (now - lastDone)) / (1000 * 60 * 60));
      this._showToast(`Вы уже почтили память сегодня. Повторное действие будет доступно через ${hoursLeft} ч.`, "info");
      return;
    }

    // Д) Запуск решения Proof-of-Work задачи
    this._showToast("Криптографическая верификация...", "info");
    const challenge = `${deviceId}_${heroId}_${Date.now()}`;
    const solution = await this.solveProofOfWork(challenge);

    if (!solution) {
      this._showToast("Ошибка валидации вычислений.", "error");
      return;
    }

    // Е) Успешная фиксация в защищенном хранилище
    localStorage.setItem(storageKey, now.toString());
    
    // Подпись счетчика
    let vault = JSON.parse(localStorage.getItem('srmk_tribute_vault') || '{}');
    const actionKey = `${type}_${heroId}`;
    vault[actionKey] = (vault[actionKey] || 0) + 1;
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
    setTimeout(() => toast.classList.remove('active'), 3500);
  }
};

window.TributeSecurity = TributeSecurity;
document.addEventListener('DOMContentLoaded', () => TributeSecurity.init());