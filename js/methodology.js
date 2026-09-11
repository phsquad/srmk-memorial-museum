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
    this.bindProtectionEvents();
    this.setCopyrightMode(false, false);
    console.log("[Methodology] Модуль конструктора обновлен.");
  },

  setCopyrightMode(isProtected, notify = true) {
    this.isCopyrightProtected = isProtected;

    const editBtn = document.getElementById('btnModeEdit');
    const protectBtn = document.getElementById('btnModeProtect');
    const watermark = document.getElementById('watermarkOverlay');
    const wrappers = document.querySelectorAll('.protected-wrapper');
    const exportBtns = document.querySelectorAll('.btn-export-lockable');

    if (isProtected) {
      editBtn?.classList.remove('active');
      protectBtn?.classList.add('active');
      editBtn?.setAttribute('aria-pressed', 'false');
      protectBtn?.setAttribute('aria-pressed', 'true');

      if (watermark) watermark.style.display = 'flex';

      wrappers.forEach(w => w.classList.add('copyright-locked'));
      exportBtns.forEach(b => b.classList.add('disabled-lock'));

      if (notify) this.showToast("🔒 Режим защиты авторских прав включен. Доступен ТОЛЬКО ПРОСМОТР.");
    } else {
      protectBtn?.classList.remove('active');
      editBtn?.classList.add('active');
      editBtn?.setAttribute('aria-pressed', 'true');
      protectBtn?.setAttribute('aria-pressed', 'false');

      if (watermark) watermark.style.display = 'none';

      wrappers.forEach(w => w.classList.remove('copyright-locked'));
      exportBtns.forEach(b => b.classList.remove('disabled-lock'));

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

    const teacher = document.getElementById('constructTeacherName').value || 'Генте А. В.';
    const role = document.getElementById('constructTeacherRole').value || 'Преподаватель';
    const discipline = document.getElementById('constructDiscipline').value || 'История России';
    const group = document.getElementById('constructGroup').value || 'Группа';
    const topic = document.getElementById('constructTopic').value || 'Урок Мужества';
    const q1 = document.getElementById('constructQ1').value;
    const q2 = document.getElementById('constructQ2').value;

    this.saveConstructorData();

    document.getElementById('displayTeacher').textContent = teacher;
    document.getElementById('displayRole').textContent = role;
    document.getElementById('displayDiscipline').textContent = discipline;
    document.getElementById('displayGroup').textContent = group;
    document.getElementById('displayTopic').textContent = topic;
    document.getElementById('mapOwnerSubtitle').textContent = `Разработчик: ${teacher} • Дисциплина: ${discipline} (${group})`;

    if (q1) document.getElementById('displayQ1').textContent = q1;
    if (q2) document.getElementById('displayQ2').textContent = q2;

    this.showToast("⚡ Данные успешно применены ко всем материалам!");

    // Переходим на вкладку Технологической карты
    const mapTabBtn = document.querySelector('.tab-btn[data-tab="tech-maps"]');
    if (mapTabBtn) mapTabBtn.click();
  },

  bindTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = `tab-${btn.dataset.tab}`;

        tabButtons.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        const targetContent = document.getElementById(targetId);
        if (targetContent) targetContent.classList.add('active');
      });
    });
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