/**
 * ============================================================================
 * ЛОГИКА МЕТОДИЧЕСКОГО КАБИНЕТА: js/methodology.js (v3.0 Dual-Mode)
 * ============================================================================
 */

'use strict';

const Methodology = {
  currentMode: 'constructor', // 'constructor' | 'master'

  init() {
    this.bindTabs();
    const hash = window.location.hash.replace('#', '');
    const validTabs = ['constructor-view', 'cards-view', 'integration-view', 'fgos-view'];
    this.switchMode(hash === 'master' ? 'master' : 'constructor', false);
    this.activateTab(validTabs.includes(hash) ? hash : 'constructor-view', false);

    window.addEventListener('hashchange', () => {
      const nextHash = window.location.hash.replace('#', '');
      if (nextHash === 'master' || nextHash === 'constructor') this.switchMode(nextHash, false);
      if (validTabs.includes(nextHash)) this.activateTab(nextHash, false);
    });
  },

  /**
   * 1. Переключение между Конструктором с нуля и Защищенным Эталоном
   */
  switchMode(mode, updateUrl = true) {
    this.currentMode = mode;

    const btnConst = document.getElementById('btnModeConstructor');
    const btnMaster = document.getElementById('btnModeMaster');
    const constTab = document.getElementById('tab-constructor-view');
    const masterContainer = document.getElementById('masterExampleContainer');
    const masterCard = document.getElementById('masterPlanContent');

    if (mode === 'master') {
      btnConst.classList.remove('active');
      btnMaster.classList.add('active');
      btnConst.setAttribute('aria-pressed', 'false');
      btnMaster.setAttribute('aria-pressed', 'true');

      constTab.hidden = true;
      masterContainer.hidden = false;
      document.body.classList.add('master-mode');

      // Активируем защитный скрипт для эталона
      if (typeof MasterProtection !== 'undefined') {
        MasterProtection.enable(masterCard);
      }

      this.showToast("🔒 Включен защищенный режим просмотра эталона СРМК.");
    } else {
      btnMaster.classList.remove('active');
      btnConst.classList.add('active');
      btnMaster.setAttribute('aria-pressed', 'false');
      btnConst.setAttribute('aria-pressed', 'true');

      masterContainer.hidden = true;
      constTab.hidden = false;
      document.body.classList.remove('master-mode');

      // Отключаем защиту для собственного конструктора
      if (typeof MasterProtection !== 'undefined') {
        MasterProtection.disable(masterCard);
      }

      this.showToast("✏️ Вы в режиме конструктора с нуля. Заполните форму.");
    }

    if (updateUrl) history.replaceState(null, '', `#${mode}`);
  },

  /**
   * 2. Очистить форму Конструктора (С нуля)
   */
  clearConstructorForm() {
    document.getElementById('customLessonForm').reset();
    document.getElementById('userPlanResult').style.display = 'none';
    document.getElementById('cardQ1Display').textContent = '1. Почему водовоз Шамиля Назырова называли «Машиной жизни»?';
    document.getElementById('cardQ2Display').textContent = '2. Как профессиональная подготовка помогала выпускникам спасать товарищей?';
    this.showToast("🧹 Форма полностью очищена. Введите свои данные с нуля.");
  },

  /**
   * 3. Сформировать пользовательский индивидуальный план
   */
  generateCustomPlan() {
    const form = document.getElementById('customLessonForm');
    if (!form.reportValidity()) return;

    const teacher = document.getElementById('inputTeacher').value.trim() || 'ФИО Преподавателя';
    const role = document.getElementById('inputRole').value.trim() || 'Преподаватель СПО';
    const discipline = document.getElementById('inputDiscipline').value.trim() || 'Учебная дисциплина';
    const group = document.getElementById('inputGroup').value.trim() || 'Учебная группа';
    const topic = document.getElementById('inputTopic').value.trim() || 'Тема патриотического урока';
    const q1 = document.getElementById('inputQ1').value.trim();
    const q2 = document.getElementById('inputQ2').value.trim();

    const planContent = document.getElementById('userPlanContent');
    const resultBox = document.getElementById('userPlanResult');
    const safe = value => this.escapeHtml(value);

    planContent.innerHTML = `
      <div class="meta-doc-header">
        <div><strong>Организация:</strong> ГБПОУ «Ставропольский региональный многопрофильный колледж»</div>
        <div><strong>Разработчик:</strong> ${safe(teacher)} (${safe(role)})</div>
        <div><strong>Дисциплина / Группа:</strong> ${safe(discipline)} • ${safe(group)}</div>
        <div><strong>Тема урока:</strong> ${safe(topic)}</div>
      </div>

      <div class="table-responsive">
        <table class="method-table">
          <thead>
            <tr>
              <th>Этап и время</th>
              <th>Деятельность преподавателя (${safe(teacher)})</th>
              <th>Деятельность студентов (${safe(group)})</th>
              <th>Интеграция ресурсов</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>1. Организация</strong><br><small>3 мин</small></td>
              <td>Приветствие. Включение Колокола Памяти. Постановка целей по теме: «${safe(topic)}».</td>
              <td>Восприятие темы, сканирование вводного QR-кода.</td>
              <td>Синтезатор колокола, сайт музея.</td>
            </tr>
            <tr>
              <td><strong>2. Исследование</strong><br><small>25 мин</small></td>
              <td>Организация работы микрогрупп с карточками. Индивидуальные консультации.</td>
              <td>Работа в 4 секторах ТВД, прослушивание аудиогидов, поиск архивов ЦАМО.</td>
              <td>Раздел «Книга Памяти» и аудиогиды MP3.</td>
            </tr>
            <tr>
              <td><strong>3. Рефлексия</strong><br><small>17 мин</small></td>
              <td>Подведение итогов. Организация зажжения свечей и выписки сертификатов.</td>
              <td>Зажжение свечей памяти, генерация именных наградных листов.</td>
              <td>Модули <code>certificate.html</code> и <code>verify.html</code>.</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;

    if (q1) {
      const q1El = document.getElementById('cardQ1Display');
      if (q1El) q1El.textContent = `1. ${q1}`;
    }
    const q2El = document.getElementById('cardQ2Display');
    if (q2El) q2El.textContent = q2 ? `2. ${q2}` : '2. Как профессиональная подготовка помогала выпускникам спасать товарищей?';

    resultBox.style.display = 'block';
    resultBox.scrollIntoView({ behavior: 'smooth' });

    this.showToast("⚡ Ваш индивидуальный план успешно сформирован!");
  },

  activateTab(tabName, updateUrl = true) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `tab-${tabName}`);
    });
    if (updateUrl) history.replaceState(null, '', `#${tabName}`);
  },

  bindTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activateTab(btn.dataset.tab);
      });
    });
  },

  escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[character]));
  },

  async copyText(elementId, successMsg = "Скопировано!") {
    const el = document.getElementById(elementId);
    if (!el) return;
    const text = el.innerText || el.textContent;
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      const helper = document.createElement('textarea');
      helper.value = text;
      helper.style.position = 'fixed';
      helper.style.opacity = '0';
      document.body.appendChild(helper);
      helper.select();
      document.execCommand('copy');
      helper.remove();
    }
    this.showToast(successMsg);
  },

  exportToWord(containerId, filename = 'Мой_план_урока') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>${filename}</title></head>
      <body>
        <div style="text-align:center;">
          <h2>ГБПОУ «Ставропольский региональный многопрофильный колледж»</h2>
          <h3>ИНДИВИДУАЛЬНЫЙ ПЛАН УРОКА МУЖЕСТВА</h3>
        </div>
        ${container.innerHTML}
      </body></html>
    `;

    const blob = new Blob(['\ufeff' + html], { type: 'application/msword;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.doc`;
    link.click();
    this.showToast("Файл Word (.doc) с вашим планом скачан!");
  },

  showToast(msg) {
    const toast = document.getElementById('methodToast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('active');
    setTimeout(() => toast.classList.remove('active'), 3200);
  }
};

document.addEventListener('DOMContentLoaded', () => Methodology.init());