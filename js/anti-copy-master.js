/**
 * ============================================================================
 * СКРИПТ ЗАЩИТЫ ЭТАЛОННОГО ОБРАЗЦА: js/anti-copy-master.js
 * Блокировка Ctrl+C, Ctrl+P, Ctrl+A, контекстного меню и выделения текста
 * ============================================================================
 */

'use strict';

const MasterProtection = {
  isActive: false,

  /**
   * Активация защиты для конкретного DOM-элемента
   */
  enable(containerEl) {
    if (!containerEl) return;
    this.isActive = true;
    containerEl.classList.add('master-copy-protected');

    // 1. Блокировка контекстного меню (правая кнопка мыши)
    containerEl.addEventListener('contextmenu', this._blockEvent);

    // 2. Блокировка выделения текста
    containerEl.addEventListener('selectstart', this._blockEvent);
    containerEl.addEventListener('dragstart', this._blockEvent);

    // 3. Блокировка горячих клавиш клавиатуры (Ctrl+C, Ctrl+A, Ctrl+P, Ctrl+S, F12)
    window.addEventListener('keydown', this._blockKeyShortcuts, true);

    console.log("[MasterProtection] 🔒 Защита эталонного образца активна.");
  },

  /**
   * Деактивация защиты (для собственного конструктора пользователя)
   */
  disable(containerEl) {
    if (!containerEl) return;
    this.isActive = false;
    containerEl.classList.remove('master-copy-protected');

    containerEl.removeEventListener('contextmenu', this._blockEvent);
    containerEl.removeEventListener('selectstart', this._blockEvent);
    containerEl.removeEventListener('dragstart', this._blockEvent);
    window.removeEventListener('keydown', this._blockKeyShortcuts, true);

    console.log("[MasterProtection] 🔓 Защита деактивирована.");
  },

  _blockEvent(e) {
    e.preventDefault();
    if (typeof Methodology !== 'undefined') {
      Methodology.showToast("🔒 Эталонный образец защищен! Копирование и скачивание заблокированы.");
    }
  },

  _blockKeyShortcuts(e) {
    if (!MasterProtection.isActive) return;

    // Блокировка Ctrl+C, Ctrl+A, Ctrl+P, Ctrl+S, F12
    const isCtrl = e.ctrlKey || e.metaKey;
    const key = e.key.toLowerCase();

    if (
      (isCtrl && (key === 'c' || key === 'с' || key === 'a' || key === 'ф' || key === 'p' || key === 'з' || key === 's' || key === 'ы')) ||
      e.key === 'F12'
    ) {
      e.preventDefault();
      e.stopPropagation();
      if (typeof Methodology !== 'undefined') {
        Methodology.showToast("🔒 Этот эталонный образец доступен только для ознакомления на экране.");
      }
    }
  }
};

window.MasterProtection = MasterProtection;