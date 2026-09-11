/**
 * ============================================================================
 * СКРИПТ ЗАЩИТЫ ЭТАЛОННОГО ОБРАЗЦА: js/anti-copy-master.js (v2.0 Ultra)
 * Мемориально-образовательный комплекс ГБПОУ СРМК «Быть воином — жить вечно»
 * 
 * Включает:
 * 1. Блокировку контекстного меню, выделения и перетаскивания
 * 2. Полную блокировку горячих клавиш (Win Ctrl / macOS Cmd + EN/RU раскладки)
 * 3. Динамический водяной знак ГБПОУ СРМК
 * 4. Печатный барьер (@media print)
 * 5. Защиту от скриншотов при потере фокуса окна (Blur)
 * ============================================================================
 */

'use strict';

const MasterProtection = {
  isActive: false,
  protectedElement: null,
  watermarkElement: null,
  printStyleElement: null,

  /**
   * 1. Включение защиты для конкретного DOM-контейнера
   */
  enable(containerEl) {
    if (!containerEl) return;

    // Если защита уже активна, выполняем чистую перезагрузку
    if (this.isActive) {
      this.disable(this.protectedElement);
    }

    this.isActive = true;
    this.protectedElement = containerEl;
    containerEl.classList.add('master-copy-protected');

    // А) Блокировка контекстного меню, выделения и перетаскивания (useCapture = true)
    containerEl.addEventListener('contextmenu', this._blockEvent, true);
    containerEl.addEventListener('selectstart', this._blockEvent, true);
    containerEl.addEventListener('dragstart', this._blockEvent, true);

    // Б) Глобальная блокировка клавиш
    window.addEventListener('keydown', this._blockKeyShortcuts, true);

    // В) Внедрение водяного знака
    this.injectDynamicWatermark(containerEl);

    // Г) Печатный барьер (@media print)
    this.setupPrintProtection();

    // Д) Размытие при потере фокуса (Защита от скриншотеров)
    window.addEventListener('blur', this._handleWindowBlur, false);
    window.addEventListener('focus', this._handleWindowFocus, false);

    console.log("[MasterProtection v2.0] 🔒 Защита эталона ГБПОУ СРМК активирована.");
  },

  /**
   * 2. Выключение защиты (возврат к конструктору)
   */
  disable(containerEl = this.protectedElement) {
    this.isActive = false;

    if (containerEl) {
      containerEl.classList.remove('master-copy-protected');
      containerEl.style.filter = 'none';
      containerEl.removeEventListener('contextmenu', this._blockEvent, true);
      containerEl.removeEventListener('selectstart', this._blockEvent, true);
      containerEl.removeEventListener('dragstart', this._blockEvent, true);
    }

    window.removeEventListener('keydown', this._blockKeyShortcuts, true);
    window.removeEventListener('blur', this._handleWindowBlur, false);
    window.removeEventListener('focus', this._handleWindowFocus, false);

    this.removeWatermark();
    this.removePrintProtection();

    this.protectedElement = null;
    console.log("[MasterProtection v2.0] 🔓 Защита деактивирована.");
  },

  /**
   * 3. Внедрение динамического водяного знака СРМК
   */
  injectDynamicWatermark(containerEl) {
    this.removeWatermark();

    const watermark = document.createElement('div');
    watermark.id = 'srmkMasterWatermark';
    watermark.style.cssText = `
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      pointer-events: none;
      z-index: 10;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      user-select: none !important;
      -webkit-user-select: none !important;
    `;

    const dateStr = new Date().toLocaleDateString('ru-RU');
    watermark.innerHTML = `
      <div style="
        transform: rotate(-22deg);
        font-family: 'Cinzel', Georgia, serif;
        font-size: clamp(1.1rem, 2.8vw, 2.1rem);
        color: rgba(197, 160, 89, 0.16);
        text-align: center;
        font-weight: 900;
        line-height: 1.5;
        letter-spacing: 2px;
        text-transform: uppercase;
      ">
        ОФИЦИАЛЬНЫЙ ЭТАЛОН ГБПОУ СРМК<br>
        <span style="font-size: 0.65em; color: rgba(138, 28, 34, 0.22);">ТОЛЬКО ДЛЯ ОЗНАКОМЛЕНИЯ • ${dateStr}</span>
      </div>
    `;

    if (getComputedStyle(containerEl).position === 'static') {
      containerEl.style.position = 'relative';
    }
    containerEl.appendChild(watermark);
    this.watermarkElement = watermark;
  },

  removeWatermark() {
    if (this.watermarkElement) {
      this.watermarkElement.remove();
      this.watermarkElement = null;
    }
    const existing = document.getElementById('srmkMasterWatermark');
    if (existing) existing.remove();
  },

  /**
   * 4. Печатный барьер (@media print)
   */
  setupPrintProtection() {
    this.removePrintProtection();

    const style = document.createElement('style');
    style.id = 'srmkPrintProtectStyle';
    style.innerHTML = `
      @media print {
        .master-copy-protected, #masterExampleContainer, .master-example {
          display: none !important;
        }
        body::before {
          content: "🔒 ВНИМАНИЕ: Печать эталонного образца ГБПОУ СРМК запрещена локальным актом колледжа. Для собственной работы используйте вкладку «Свой конструктор»!";
          display: block !important;
          padding: 60px 40px;
          font-size: 18pt;
          color: #8a1c22;
          text-align: center;
          font-weight: bold;
          font-family: sans-serif;
          border: 4px solid #8a1c22;
          margin: 40px;
        }
      }
    `;
    document.head.appendChild(style);
    this.printStyleElement = style;
  },

  removePrintProtection() {
    if (this.printStyleElement) {
      this.printStyleElement.remove();
      this.printStyleElement = null;
    }
    const existing = document.getElementById('srmkPrintProtectStyle');
    if (existing) existing.remove();
  },

  /**
   * 5. Размытие при потере фокуса (Защита от скриншотов)
   */
  _handleWindowBlur() {
    if (MasterProtection.isActive && MasterProtection.protectedElement) {
      MasterProtection.protectedElement.style.filter = 'blur(14px)';
      MasterProtection.protectedElement.style.transition = 'filter 0.2s ease';
    }
  },

  _handleWindowFocus() {
    if (MasterProtection.protectedElement) {
      MasterProtection.protectedElement.style.filter = 'none';
    }
  },

  /**
   * 6. Блокировка контекстных событий
   */
  _blockEvent(e) {
    if (!MasterProtection.isActive) return;
    e.preventDefault();
    e.stopPropagation();
    MasterProtection.notifyUser("🔒 Эталонный образец защищен! Копирование, выделение и меню заблокированы.");
  },

  /**
   * 7. Перехват горячих клавиш (EN & RU Layouts, macOS Cmd & Win Ctrl)
   */
  _blockKeyShortcuts(e) {
    if (!MasterProtection.isActive) return;

    const isCtrl = e.ctrlKey || e.metaKey; // Windows Ctrl или macOS Cmd
    const isShift = e.shiftKey;
    const key = e.key ? e.key.toLowerCase() : '';

    // А) Копирование / Печать / Сохранение / Выделение
    const isCopy = isCtrl && (key === 'c' || key === 'с');
    const isSelectAll = isCtrl && (key === 'a' || key === 'ф');
    const isPrint = isCtrl && (key === 'p' || key === 'з');
    const isSave = isCtrl && (key === 's' || key === 'ы');
    const isViewSource = isCtrl && (key === 'u' || key === 'г');

    // Б) DevTools (F12, Ctrl+Shift+I / J / C / K)
    const isF12 = e.key === 'F12';
    const isDevToolsCombo = isCtrl && isShift && (
      key === 'i' || key === 'ш' ||
      key === 'j' || key === 'о' ||
      key === 'c' || key === 'с' ||
      key === 'k' || key === 'л'
    );

    if (isCopy || isSelectAll || isPrint || isSave || isViewSource || isF12 || isDevToolsCombo) {
      e.preventDefault();
      e.stopPropagation();

      let msg = "🔒 Этот эталонный образец доступен только для ознакомления на экране.";
      if (isPrint) msg = "🔒 Печать эталона заблокирована. Воспользуйтесь Конструктором уроков.";
      if (isDevToolsCombo || isF12) msg = "🔒 Просмотр код-структуры эталона заблокирован.";

      MasterProtection.notifyUser(msg);
    }
  },

  notifyUser(msg) {
    if (typeof Methodology !== 'undefined' && typeof Methodology.showToast === 'function') {
      Methodology.showToast(msg);
    } else {
      let toast = document.getElementById('masterProtectToast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'masterProtectToast';
        toast.style.cssText = `
          position: fixed; bottom: 24px; right: 24px; z-index: 10000;
          background: rgba(138, 28, 34, 0.96); border: 1px solid #c5a059;
          color: #ffffff; padding: 12px 20px; border-radius: 4px;
          font-size: 0.85rem; font-weight: 700; box-shadow: 0 10px 30px rgba(0,0,0,0.8);
          transition: all 0.3s ease; opacity: 0; transform: translateY(40px);
        `;
        document.body.appendChild(toast);
      }
      toast.textContent = msg;
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(40px)';
      }, 3000);
    }
  }
};

window.MasterProtection = MasterProtection;