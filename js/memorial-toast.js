/**
 * ============================================================================
 * ЕДИНАЯ СИСТЕМА УВЕДОМЛЕНИЙ И ДИАЛОГОВ: js/memorial-toast.js
 * Заменяет window.alert/window.confirm на доступные элегантные мемориальные тосты
 * Мемориально-образовательный комплекс ГБПОУ СРМК «Быть воином — жить вечно»
 * ============================================================================
 */

'use strict';

const MemorialToast = {
  container: null,
  audioCtx: null,

  init() {
    if (this.container) return;
    let el = document.getElementById('memorialToastContainer');
    if (!el) {
      el = document.createElement('div');
      el.id = 'memorialToastContainer';
      el.className = 'memorial-toast-container';
      el.setAttribute('aria-live', 'polite');
      el.setAttribute('aria-atomic', 'true');
      document.body.appendChild(el);
    }
    this.container = el;
  },

  playChime(frequency = 660) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.audioCtx) this.audioCtx = new AudioCtx();
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.04, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.36);
    } catch (e) {
      // Audio autoplay policy catch
    }
  },

  show(message, type = 'info', duration = 3500) {
    this.init();

    const toast = document.createElement('div');
    toast.className = `memorial-toast toast-${type}`;
    toast.setAttribute('role', 'alert');

    let icon = 'ℹ️';
    if (type === 'success') icon = '✓';
    if (type === 'error') icon = '⚠️';
    if (type === 'warning') icon = '⚡';
    if (type === 'tribute') icon = '🕯';

    toast.innerHTML = `
      <span class="toast-icon" aria-hidden="true">${icon}</span>
      <div class="toast-message">${message}</div>
      <button type="button" class="toast-close-btn" aria-label="Закрыть">&times;</button>
    `;

    const closeBtn = toast.querySelector('.toast-close-btn');
    closeBtn.addEventListener('click', () => {
      this.dismiss(toast);
    });

    this.container.appendChild(toast);
    this.playChime(type === 'error' ? 330 : 720);

    // Trigger reflow for CSS animation
    requestAnimationFrame(() => {
      toast.classList.add('toast-visible');
    });

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(toast);
      }, duration);
    }

    return toast;
  },

  dismiss(toast) {
    if (!toast || toast._dismissing) return;
    toast._dismissing = true;
    toast.classList.remove('toast-visible');
    toast.classList.add('toast-hiding');
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }
};

window.MemorialToast = MemorialToast;
window.showToast = (msg, type, dur) => MemorialToast.show(msg, type, dur);

document.addEventListener('DOMContentLoaded', () => MemorialToast.init());
