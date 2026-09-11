/**
 * ============================================================================
 * ЛОГИКА МЕТОДИЧЕСКОГО КАБИНЕТА: js/methodology.js (v2.1)
 * ============================================================================
 */

'use strict';

const Methodology = {
  storageKey: 'srmk_methodology_constructor_v1',
  isCopyrightProtected: false,

  init() {
    this.restoreConstructorData();
    this.bindTabs();
    this.bindConstructorFields();
    this.bindProtectionEvents();
    this.setCopyrightMode(false, false);
    this.openTabFromHash();
    window.addEventListener('hashchange', () => this.openTabFromHash());
    console.log("[Methodology] Модуль конструктора обновлен.");
  },

  setCopyrightMode(isProtected, notify = true) {
    this.isCopyrightProtected = isProtected;

    const editBtn = document.getElementById('btnModeEdit');
    const protectBtn = document.getElementById('btnModeProtect');
    const watermark = document.getElementById('watermarkOverlay');
    const wrappers = document.querySelectorAll('.protected-wrapper');
    const exportBtns = document.querySelectorAll('.btn-export-lockable');
    const constructorFields = document.querySelectorAll('#tab-constructor input, #tab-constructor select');
    const generateBtn = document.querySelector('.btn-generate-plan');

    if (isProtected) {
      editBtn?.classList.remove('active');
      protectBtn?.classList.add('active');
      editBtn?.setAttribute('aria-pressed', 'false');
      protectBtn?.setAttribute('aria-pressed', 'true');

      if (watermark) watermark.style.display = 'flex';

      wrappers.forEach(w => w.classList.add('copyright-locked'));
      exportBtns.forEach(b => b.classList.add('disabled-lock'));
      constructorFields.forEach(field => { field.disabled = true; });
      if (generateBtn) generateBtn.disabled = true;

      if (notify) this.showToast("🔒 Режим защиты авторских прав включен. Доступен ТОЛЬКО ПРОСМОТР.");
    } else {
      protectBtn?.classList.remove('active');
      editBtn?.classList.add('active');
      editBtn?.setAttribute('aria-pressed', 'true');
      protectBtn?.setAttribute('aria-pressed', 'false');

      if (watermark) watermark.style.display = 'none';

      wrappers.forEach(w => w.classList.remove('copyright-locked'));
      exportBtns.forEach(b => b.classList.remove('disabled-lock'));
      constructorFields.forEach(field => { field.disabled = false; });
      if (generateBtn) generateBtn.disabled = false;

      if (notify) this.showToast("✏️ Режим конструктора включен. Вы можете редактировать план.");
    }
  },

  bindProtectionEvents() {
    document.addEventListener('copy', (e) => {
      if (this.isCopyrightProtected) {
        e.preventDefault();
        this.showToast("🔒 Материал защищен авторским правом ГБПОУ СРМК. Копирование запрещено.");
      }
    });

    document.addEventListener('contextmenu', (e) => {
      if (this.isCopyrightProtected) {
        e.preventDefault();
        this.showToast("🔒 Правая кнопка мыши заблокирована в режиме защиты.");
      }
    });
  },

  applyConstructorData() {
    if (this.isCopyrightProtected) {
      this.showToast("Переключитесь в режим «Интерактивный конструктор» для редактирования!");
      return;
    }

    const readValue = (id, fallback = '') => document.getElementById(id)?.value.trim() || fallback;
    const teacher = readValue('constructTeacherName', 'Генте А. В.');
    const role = readValue('constructTeacherRole', 'Преподаватель');
    const discipline = readValue('constructDiscipline', 'История России');
    const group = readValue('constructGroup', 'Группа');
    const topic = readValue('constructTopic', 'Урок Мужества');
    const q1 = readValue('constructQ1');
    const q2 = readValue('constructQ2');

    this.saveConstructorData();

    document.getElementById('displayTeacher').textContent = teacher;
    document.getElementById('displayRole').textContent = role;
    document.getElementById('displayDiscipline').textContent = discipline;
    document.getElementById('displayGroup').textContent = group;
    document.getElementById('displayTopic').textContent = topic;
    document.getElementById('mapOwnerSubtitle').textContent = `Разработчик: ${teacher} • Дисциплина: ${discipline} (${group})`;

    document.getElementById('displayQ1').textContent = q1 || 'Вопрос будет добавлен автором.';
    document.getElementById('displayQ2').textContent = q2 || 'Вопрос будет добавлен автором.';

    this.showToast("⚡ Данные успешно применены ко всем материалам!");

    // Переходим на вкладку Технологической карты
    this.activateTab('tech-maps');
  },

  bindConstructorFields() {
    document.querySelectorAll('#tab-constructor input, #tab-constructor select').forEach(field => {
      field.addEventListener('input', () => this.saveConstructorData());
      field.addEventListener('change', () => this.saveConstructorData());
    });
  },

  bindTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.activateTab(btn.dataset.tab);
      });
    });
  },

  activateTab(tabName, updateHash = true) {
    const targetContent = document.getElementById(`tab-${tabName}`);
    const targetButton = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
    if (!targetContent || !targetButton) return;

    document.querySelectorAll('.tab-btn').forEach(button => {
      const active = button === targetButton;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
    });
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content === targetContent);
    });
    if (updateHash) history.replaceState(null, '', `#${tabName}`);
  },

  openTabFromHash() {
    const tabName = window.location.hash.slice(1);
    if (tabName) this.activateTab(tabName, false);
  },

  async copyText(elementId, successMessage = "Скопировано!") {
    if (this.isCopyrightProtected) {
      this.showToast("🔒 Скачивание и копирование заблокировано разработчиком.");
      return;
    }

    const el = document.getElementById(elementId);
    if (!el) return;

    try {
      await this.writeToClipboard(el.innerText || el.textContent);
      this.showToast(successMessage);
    } catch (err) {
      this.showToast("Ошибка копирования.", "error");
    }
  },

  copyCardText(cardId) {
    if (this.isCopyrightProtected) {
      this.showToast("🔒 Копирование карточек заблокировано в режиме защиты.");
      return;
    }
    const card = document.getElementById(cardId);
    if (card) {
      this.writeToClipboard(card.innerText).then(() => {
        this.showToast("Карточка скопирована!");
      }).catch(() => this.showToast("Ошибка копирования.", "error"));
    }
  },

  async writeToClipboard(text) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const helper = document.createElement('textarea');
    helper.value = text;
    helper.setAttribute('readonly', '');
    helper.style.position = 'fixed';
    helper.style.opacity = '0';
    document.body.appendChild(helper);
    helper.select();
    const copied = document.execCommand('copy');
    helper.remove();
    if (!copied) throw new Error('Clipboard API is unavailable');
  },

  saveConstructorData() {
    const data = {};
    ['TeacherName', 'TeacherRole', 'Discipline', 'Group', 'Topic', 'Q1', 'Q2'].forEach(field => {
      const input = document.getElementById(`construct${field}`);
      if (input) data[field] = input.value;
    });
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      this.showToast("Данные применены только для текущего сеанса.", "error");
    }
  },

  restoreConstructorData() {
    try {
      const data = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
      Object.entries(data).forEach(([field, value]) => {
        const input = document.getElementById(`construct${field}`);
        if (input && typeof value === 'string') input.value = value;
      });
    } catch (error) {
      try {
        localStorage.removeItem(this.storageKey);
      } catch (storageError) {
      }
    }
  },

  printSingleCard(cardId) {
    if (this.isCopyrightProtected) {
      this.showToast("🔒 Печать заблокирована в режиме защиты авторских прав.");
      return;
    }
    const card = document.getElementById(cardId);
    if (!card) return;

    document.querySelectorAll('.print-target').forEach(item => item.classList.remove('print-target'));
    card.classList.add('print-target');
    document.body.classList.add('printing-card');

    const cleanup = () => {
      document.body.classList.remove('printing-card');
      card.classList.remove('print-target');
      window.removeEventListener('afterprint', cleanup);
    };

    window.addEventListener('afterprint', cleanup);
    window.print();
  },

  exportToWord(containerId, filename = 'Технологическая_карта_СРМК') {
    if (this.isCopyrightProtected) {
      this.showToast("🔒 Скачивание Word-файла заблокировано в режиме защиты!");
      return;
    }

    const container = document.getElementById(containerId);
    if (!container) return;

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>${filename}</title></head>
      <body>
        <div style="text-align: center;">
          <h2>ГБПОУ «Ставропольский региональный многопрофильный колледж»</h2>
          <h3>ИНДИВИДУАЛЬНАЯ ТЕХНОЛОГИЧЕСКАЯ КАРТА УРОКА</h3>
        </div>
        ${container.innerHTML}
      </body></html>
    `;

    const blob = new Blob(['\ufeff' + htmlContent], { type: 'application/msword;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.doc`;
    link.click();
    URL.revokeObjectURL(link.href);

    this.showToast("Файл Word (.doc) скачан!");
  },

  showToast(message) {
    const toast = document.getElementById('methodToast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('active');
    setTimeout(() => toast.classList.remove('active'), 3200);
  }
};

document.addEventListener('DOMContentLoaded', () => Methodology.init());