/**
 * ============================================================================
 * ЛОГИКА МЕТОДИЧЕСКОГО КАБИНЕТА: js/methodology.js (v2.0)
 * Конструктор данных + Защита авторских прав (Copyright Lock)
 * ============================================================================
 */

'use strict';

const Methodology = {
  isCopyrightProtected: false,

  init() {
    this.bindTabs();
    this.bindProtectionEvents();
    console.log("[Methodology] Модуль конструктора и защиты авторских прав запущен.");
  },

  /**
   * 1. Включение / Выключение режима защиты авторских прав
   */
  setCopyrightMode(isProtected) {
    this.isCopyrightProtected = isProtected;

    const editBtn = document.getElementById('btnModeEdit');
    const protectBtn = document.getElementById('btnModeProtect');
    const watermark = document.getElementById('watermarkOverlay');
    const wrappers = document.querySelectorAll('.protected-wrapper');
    const exportBtns = document.querySelectorAll('.btn-export-lockable');

    if (isProtected) {
      editBtn.classList.remove('active');
      protectBtn.classList.add('active');

      if (watermark) watermark.style.display = 'flex';

      wrappers.forEach(w => w.classList.add('copyright-locked'));
      exportBtns.forEach(b => b.classList.add('disabled-lock'));

      this.showToast("🔒 Режим защиты авторских прав включен. Доступен ТОЛЬКО ПРОСМОТР.");
    } else {
      protectBtn.classList.remove('active');
      editBtn.classList.add('active');

      if (watermark) watermark.style.display = 'none';

      wrappers.forEach(w => w.classList.remove('copyright-locked'));
      exportBtns.forEach(b => b.classList.remove('disabled-lock'));

      this.showToast("✏️ Режим конструктора включен. Вы можете редактировать и скачивать план.");
    }
  },

  /**
   * 2. Блокировка копирования при включенной защите
   */
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
        this.showToast("🔒 Правая кнопка мыши заблокирована в режиме защиты авторских прав.");
      }
    });
  },

  /**
   * 3. Применение авторских данных из Конструктора
   */
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

    // Обновление заголовков и текста
    document.getElementById('displayTeacher').textContent = teacher;
    document.getElementById('displayRole').textContent = role;
    document.getElementById('displayDiscipline').textContent = discipline;
    document.getElementById('displayGroup').textContent = group;
    document.getElementById('displayTopic').textContent = topic;
    document.getElementById('mapOwnerSubtitle').textContent = `Разработчик: ${teacher} • Дисциплина: ${discipline} (${group})`;

    if (q1) document.getElementById('displayQ1').textContent = q1;
    if (q2) document.getElementById('displayQ2').textContent = q2;

    this.showToast("⚡ Данные успешно применены ко всем материалам!");

    // Автопереход на вкладку технологической карты
    document.querySelector('.tab-btn[data-tab="tech-maps"]').click();
  },

  /**
   * 4. Переключение вкладок
   */
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

  /**
   * 5. Скопировать текст (с проверкой защиты)
   */
  async copyText(elementId, successMessage = "Скопировано!") {
    if (this.isCopyrightProtected) {
      this.showToast("🔒 Скачивание и копирование заблокировано разработчиком.");
      return;
    }

    const el = document.getElementById(elementId);
    if (!el) return;

    try {
      await navigator.clipboard.writeText(el.innerText || el.textContent);
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
    if (card && navigator.clipboard) {
      navigator.clipboard.writeText(card.innerText).then(() => {
        this.showToast("Карточка скопирована!");
      });
    }
  },

  printSingleCard(cardId) {
    if (this.isCopyrightProtected) {
      this.showToast("🔒 Печать заблокирована в режиме защиты авторских прав.");
      return;
    }
    window.print();
  },

  /**
   * 6. Экспорт в Word (.doc) (с проверкой защиты)
   */
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

    this.showToast("Файл Word (.doc) с вашими данными скачан!");
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