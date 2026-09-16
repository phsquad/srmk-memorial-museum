/**
 * ============================================================================
 * ЛОГИКА МЕТОДИЧЕСКОГО КАБИНЕТА: js/methodology.js (v4.0 Ultra Master)
 * Мемориально-образовательный комплекс ГБПОУ СРМК «Быть воином — жить вечно»
 * 
 * Включает:
 * 1. Конструктор индивидуального плана Урока Мужества по ФГОС СПО
 * 2. ГОСТ-экспорт в MS Word (.doc) со встроенными стилями MSO и сеткой таблиц
 * 3. Интеграцию с защищенным эталоном (MasterProtection)
 * 4. Управление вкладками компетенций, карточек и спецкурсов
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

    console.log("[Methodology v4.0 Master] Методический кабинет и генератор Word-планов готовы.");
  },

  /**
   * 1. Переключение между Конструктором и Защищенным Эталоном
   */
  switchMode(mode, updateUrl = true) {
    this.currentMode = mode;

    const btnConst = document.getElementById('btnModeConstructor');
    const btnMaster = document.getElementById('btnModeMaster');
    const constTab = document.getElementById('tab-constructor-view');
    const masterContainer = document.getElementById('masterExampleContainer');
    const masterCard = document.getElementById('masterPlanContent');

    if (mode === 'master') {
      btnConst?.classList.remove('active');
      btnMaster?.classList.add('active');
      btnConst?.setAttribute('aria-pressed', 'false');
      btnMaster?.setAttribute('aria-pressed', 'true');

      if (constTab) constTab.hidden = true;
      if (masterContainer) masterContainer.hidden = false;
      document.body.classList.add('master-mode');

      // Активируем защитный скрипт от копирования и печати
      if (typeof MasterProtection !== 'undefined' && masterCard) {
        MasterProtection.enable(masterCard);
      }

      this.showToast("🔒 Включен режим защищенного просмотра эталона СРМК.");
    } else {
      btnMaster?.classList.remove('active');
      btnConst?.classList.add('active');
      btnMaster?.setAttribute('aria-pressed', 'false');
      btnConst?.setAttribute('aria-pressed', 'true');

      if (masterContainer) masterContainer.hidden = true;
      if (constTab) constTab.hidden = false;
      document.body.classList.remove('master-mode');

      // Отключаем защиту для собственного конструктора
      if (typeof MasterProtection !== 'undefined' && masterCard) {
        MasterProtection.disable(masterCard);
      }

      this.showToast("✏️ Вы в режиме конструктора с нуля. Заполните форму.");
    }

    if (updateUrl) history.replaceState(null, '', `#${mode}`);
  },

  /**
   * 2. Очистить форму Конструктора
   */
  clearConstructorForm() {
    document.getElementById('customLessonForm')?.reset();
    const resultBox = document.getElementById('userPlanResult');
    if (resultBox) resultBox.style.display = 'none';

    const q1 = document.getElementById('cardQ1Display');
    const q2 = document.getElementById('cardQ2Display');
    if (q1) q1.textContent = '1. Почему водовоз Шамиля Назырова называли «Машиной жизни»?';
    if (q2) q2.textContent = '2. Как профессиональная подготовка помогала выпускникам спасать товарищей?';

    this.showToast("🧹 Форма очищена. Заполните данные для нового занятия.");
  },

  /**
   * 3. Сформировать пользовательский индивидуальный план урока
   */
  generateCustomPlan() {
    const form = document.getElementById('customLessonForm');
    if (form && !form.reportValidity()) return;

    const teacher = document.getElementById('inputTeacher')?.value.trim() || 'Иванов Иван Иванович';
    const role = document.getElementById('inputRole')?.value.trim() || 'Преподаватель высшей категории';
    const discipline = document.getElementById('inputDiscipline')?.value.trim() || 'История России / ОБЗР';
    const group = document.getElementById('inputGroup')?.value.trim() || 'Группа 1 курса';
    const topic = document.getElementById('inputTopic')?.value.trim() || 'Ратный подвиг выпускников колледжа в защите Отечества';
    const q1 = document.getElementById('inputQ1')?.value.trim();
    const q2 = document.getElementById('inputQ2')?.value.trim();

    const planContent = document.getElementById('userPlanContent');
    const resultBox = document.getElementById('userPlanResult');
    const safe = value => this.escapeHtml(value);

    const question1Text = q1 || 'Почему водовоз Шамиля Назырова бойцы на передовой называли «Машиной жизни»?';
    const question2Text = q2 || 'Как профессиональная подготовка в мастерских СРМК помогала выпускникам спасать жизни товарищей?';

    if (planContent) {
      planContent.innerHTML = `
        <div class="meta-doc-header">
          <div><strong>Образовательная организация:</strong> ГБПОУ «Ставропольский региональный многопрофильный колледж»</div>
          <div><strong>Разработчик урока:</strong> ${safe(teacher)} (${safe(role)})</div>
          <div><strong>Дисциплина / Учебная группа:</strong> ${safe(discipline)} • ${safe(group)}</div>
          <div><strong>Тема занятия:</strong> «${safe(topic)}»</div>
          <div><strong>Методическая база:</strong> Цифровой комплекс «Быть воином — жить вечно» (Всероссийская акция «Карта доблести»)</div>
        </div>

        <div style="margin: 14px 0; padding: 12px; background: rgba(197, 160, 89, 0.08); border-left: 3px solid var(--accent-brass); font-size: 0.85rem;">
          <strong>Цель занятия:</strong> Формирование гражданско-патриотической позиции и профессиональной гордости студентов СПО на примерах ратного подвига 20 выпускников колледжа — участников СВО.<br>
          <strong>Формируемые компетенции (ФГОС СПО):</strong> ОК 01 (Поиск и анализ источников), ОК 04 (Командная работа в микрогруппах), ОК 06 (Гражданская идентичность и сохранение исторической памяти).
        </div>

        <div class="table-responsive">
          <table class="method-table">
            <thead>
              <tr>
                <th style="width: 14%;">Этап и время</th>
                <th style="width: 28%;">Деятельность преподавателя (${safe(teacher)})</th>
                <th style="width: 26%;">Деятельность студентов (${safe(group)})</th>
                <th style="width: 18%;">Интеграция ресурсов музея</th>
                <th style="width: 14%;">Компетенции</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>1. Организационный</strong><br><small>3 мин</small></td>
                <td>Вступительное слово. Включение Колокола Памяти. Постановка целей по теме: «${safe(topic)}».</td>
                <td>Настраиваются на восприятие темы. Считывают вводный QR-код стенда.</td>
                <td>Синтезатор Колокола Памяти, главная витрина <code>index.html</code>.</td>
                <td><strong>Личностные:</strong> эмоциональный настрой.</td>
              </tr>
              <tr>
                <td><strong>2. Вводная экскурсия</strong><br><small>7 мин</small></td>
                <td>Демонстрация 2.5D-модели Мемориала Славы СРМК. Запуск обзорного аудиогида.</td>
                <td>Изучают гранитные плиты, находят выпускников своей специальности.</td>
                <td>Зал I: Мемориал «Звезда Памяти», файл <code>general-tour.mp3</code>.</td>
                <td><strong>ОК 06:</strong> историческая преемственность.</td>
              </tr>
              <tr>
                <td><strong>3. Исследование в группах</strong><br><small>18 мин</small></td>
                <td>Делит группу на 4 сектора ТВД (Днепр, Запорожье, Донбасс, Курск). Консультирует по карточкам.</td>
                <td>
                  Работают с архивными досье и 3D-фолиантом.<br>
                  <em>Вопрос группы 1:</em> ${safe(question1Text)}<br>
                  <em>Вопрос группы 2:</em> ${safe(question2Text)}
                </td>
                <td>Модули <code>memory-book.html</code>, <code>reader.html</code>, аудиоочерки героев.</td>
                <td><strong>ОК 01, ОК 04:</strong> анализ первоисточников.</td>
              </tr>
              <tr>
                <td><strong>4. Топография подвига</strong><br><small>7 мин</small></td>
                <td>Модерирует выступления спикеров групп. Активирует секторы на карте ТВД.</td>
                <td>Презентуют результаты, показывают траектории подвига от Ставрополя до точек боев.</td>
                <td>Интерактивная карта Яндекс (API v2.1), Зал III.</td>
                <td><strong>Метапредметные:</strong> гео-аналитика.</td>
              </tr>
              <tr>
                <td><strong>5. Цифровой трибьют</strong><br><small>5 мин</small></td>
                <td>Организует Вахту Памяти колледжа. Объясняет работу криптографической защиты свечей (PoW).</td>
                <td>Нажимают «Зажечь Свечу Памяти» и «Возложить живые гвоздики», оставляют слова на Стене Памяти.</td>
                <td>Модули <code>guestbook.html</code>, защита <code>TributeSecurity</code>.</td>
                <td><strong>Личностные:</strong> сопричастность.</td>
              </tr>
              <tr>
                <td><strong>6. Рефлексия и сертификация</strong><br><small>5 мин</small></td>
                <td>Подводит итоги занятия. Направляет студентов на регистрацию наградных сертификатов.</td>
                <td>Проходят квиз-тест или оформляют именной сертификат участника Урока Мужества.</td>
                <td>Модули <code>quiz.html</code>, <code>certificate.html</code>, <code>verify.html</code>.</td>
                <td><strong>ОК 06:</strong> гражданская зрелость.</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
    }

    if (q1) {
      const q1El = document.getElementById('cardQ1Display');
      if (q1El) q1El.textContent = `1. ${q1}`;
    }
    const q2El = document.getElementById('cardQ2Display');
    if (q2El) q2El.textContent = q2 ? `2. ${q2}` : '2. Как профессиональная подготовка помогала выпускникам спасать товарищей?';

    if (resultBox) {
      resultBox.style.display = 'block';
      resultBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    this.showToast("⚡ Индивидуальный план успешно сформирован!");
  },

  /**
   * 4. Активация навигационных вкладок
   */
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

  /**
   * 5. ЭКСПОРТ В MICROSOFT WORD (.DOC) С ПОЛНЫМ НАБОРОМ СТИЛЕЙ ПО ГОСТ
   */
  exportToWord(containerId, filename = 'План_Урока_Мужества_СРМК') {
    const container = document.getElementById(containerId);
    if (!container) {
      this.showToast("Сначала сформируйте план урока с помощью кнопки «⚡ Сформировать мой план»!");
      return;
    }

    const teacher = document.getElementById('inputTeacher')?.value.trim() || 'Преподаватель ГБПОУ СРМК';
    const role = document.getElementById('inputRole')?.value.trim() || 'Преподаватель высшей категории';
    const dateStr = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

    // Полный HTML-шаблон для Microsoft Word с поддержкой MSO XML и точных стилей
    const wordHTML = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office'
            xmlns:w='urn:schemas-microsoft-com:office:word'
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${this.escapeHtml(filename)}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page Section1 {
            size: 210mm 297mm; /* A4 книжный */
            margin: 20mm 15mm 20mm 20mm;
            mso-header-margin: 10mm;
            mso-footer-margin: 10mm;
            mso-paper-source: 0;
          }
          div.Section1 { 
            page: Section1; 
          }
          body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 11.5pt;
            line-height: 1.35;
            color: #000000;
            background-color: #ffffff;
          }
          .doc-header-block {
            text-align: center;
            margin-bottom: 16pt;
          }
          .ministry-title {
            font-size: 10pt;
            font-weight: bold;
            text-transform: uppercase;
            color: #8a1c22;
            margin-bottom: 3pt;
          }
          .college-title {
            font-size: 12pt;
            font-weight: bold;
            color: #111111;
            margin-bottom: 6pt;
          }
          .doc-main-title {
            font-size: 15pt;
            font-weight: bold;
            color: #8a1c22;
            text-transform: uppercase;
            letter-spacing: 1pt;
            margin: 10pt 0 4pt 0;
          }
          .doc-sub-title {
            font-size: 11pt;
            font-style: italic;
            color: #444444;
            margin-bottom: 14pt;
          }
          .meta-doc-header {
            border: 1.5pt solid #8a1c22;
            background-color: #fcf8ee;
            padding: 10pt 12pt;
            margin-bottom: 14pt;
            font-size: 10.5pt;
          }
          .meta-doc-header div {
            margin-bottom: 4pt;
          }
          .meta-doc-header strong {
            color: #8a1c22;
          }
          table.method-table {
            width: 100%;
            border-collapse: collapse;
            border: 1.5pt solid #8a1c22;
            margin-top: 10pt;
            margin-bottom: 16pt;
            font-size: 10pt;
          }
          table.method-table th {
            background-color: #f4ead0;
            color: #8a1c22;
            border: 1pt solid #8a1c22;
            padding: 6pt 8pt;
            font-weight: bold;
            text-align: center;
          }
          table.method-table td {
            border: 0.75pt solid #999999;
            padding: 6pt 8pt;
            vertical-align: top;
          }
          table.method-table td strong {
            color: #111111;
          }
          table.method-table td small {
            color: #555555;
            font-size: 8.5pt;
          }
          table.method-table code {
            font-family: monospace;
            background-color: #f0f0f0;
            padding: 1pt 3pt;
          }
          .sign-footer-table {
            width: 100%;
            border-collapse: collapse;
            border: none;
            margin-top: 24pt;
            font-size: 10.5pt;
          }
          .sign-footer-table td {
            border: none;
            padding: 4pt 0;
          }
        </style>
      </head>
      <body>
        <div class="Section1">
          
          <div class="doc-header-block">
            <div class="ministry-title">Министерство образования Ставропольского края</div>
            <div class="college-title">ГБПОУ «Ставропольский региональный многопрофильный колледж»</div>
            <div class="doc-main-title">Технологическая карта Урока Мужества</div>
            <div class="doc-sub-title">На базе цифрового мемориального комплекса «Быть воином — жить вечно»</div>
          </div>

          ${container.innerHTML}

          <table class="sign-footer-table">
            <tr>
              <td style="width: 50%; text-align: left;">
                <strong>Разработчик:</strong><br>
                ${this.escapeHtml(role)}<br>
                __________________ / ${this.escapeHtml(teacher)} /
              </td>
              <td style="width: 50%; text-align: right;">
                <strong>Куратор музея СРМК:</strong><br>
                Преподаватель высшей категории<br>
                __________________ / А. В. Генте /
              </td>
            </tr>
            <tr>
              <td colspan="2" style="text-align: center; padding-top: 18pt; font-size: 9pt; color: #777;">
                Документ сформирован в Цифровом методическом кабинете ГБПОУ СРМК • Дата: ${dateStr}
              </td>
            </tr>
          </table>

        </div>
      </body>
      </html>
    `;

    // Создание Blob с BOM (\ufeff) для корректного отображения кириллицы в MS Word
    const blob = new Blob(['\ufeff' + wordHTML], { type: 'application/msword;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${Date.now()}.doc`;
    link.click();
    URL.revokeObjectURL(link.href);

    this.showToast("📥 Файл Word (.doc) с полным ГОСТ-оформлением скачан!");
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

  escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, character => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[character]));
  },

  showToast(msg) {
    const toast = document.getElementById('methodToast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('active');
    setTimeout(() => toast.classList.remove('active'), 3200);
  }
};

window.Methodology = Methodology;
document.addEventListener('DOMContentLoaded', () => Methodology.init());