/**
 * ============================================================================
 * ЛОГИКА ГЕНЕРАТОРА «ПАРТА ГЕРОЯ»: js/desk-qr.js (v1.0 Master)
 * Выбор из 20 героев, привязка к аудиториям, QR-генерация и пакетная печать
 * ============================================================================
 */

'use strict';

const DeskQREngine = {
  selectedHeroId: "nazyrov-sh-r",
  mode: "single",            // 'single' | 'all'
  orientation: "landscape",   // 'landscape' | 'portrait'
  theme: "theme-parchment",   // 'theme-parchment' | 'theme-clean'

  init() {
    this.populateHeroDropdown();
    this.bindControls();
    this.renderPreview();
    console.log("[DeskQR] Конструктор Парт Героев готов.");
  },

  /**
   * 1. Заполнение выпадающего списка 20 героями
   */
  populateHeroDropdown() {
    const select = document.getElementById('selectHero');
    if (!select) return;

    select.innerHTML = '';
    const list = (typeof heroesDatabase !== 'undefined') ? heroesDatabase : [];

    list.forEach(hero => {
      const opt = document.createElement('option');
      opt.value = hero.id;
      opt.textContent = `${hero.name} (${hero.education?.specialty || 'СРМК'})`;
      if (hero.id === this.selectedHeroId) opt.selected = true;
      select.appendChild(opt);
    });
  },

  /**
   * 2. Привязка элементов управления
   */
  bindControls() {
    document.getElementById('selectHero').addEventListener('change', (e) => {
      this.selectedHeroId = e.target.value;
      this.renderPreview();
    });

    // Режим печати (Один / Все 20)
    document.getElementById('modeSingleBtn').addEventListener('click', (e) => this.setMode('single', e.target));
    document.getElementById('modeAllBtn').addEventListener('click', (e) => this.setMode('all', e.target));

    // Ориентация
    document.getElementById('orientLandscapeBtn').addEventListener('click', (e) => this.setOrientation('landscape', e.target));
    document.getElementById('orientPortraitBtn').addEventListener('click', (e) => this.setOrientation('portrait', e.target));

    // Тема
    document.getElementById('themeParchmentBtn').addEventListener('click', (e) => this.setTheme('theme-parchment', e.target));
    document.getElementById('themeCleanBtn').addEventListener('click', (e) => this.setTheme('theme-clean', e.target));

    // Живой ввод кабинета и наставника
    document.getElementById('inputClassroom').addEventListener('input', () => this.renderPreview());
    document.getElementById('inputTeacher').addEventListener('input', () => this.renderPreview());

    // Печать
    document.getElementById('btnPrintPlaque').addEventListener('click', () => window.print());

    // Автоподбор кабинета
    document.getElementById('btnQuickFillAll').addEventListener('click', () => {
      const hero = heroesDatabase.find(h => h.id === this.selectedHeroId);
      if (hero) {
        const spec = hero.education?.specialty || '';
        if (spec.includes('электр')) {
          document.getElementById('inputClassroom').value = 'Мастерская электромонтажа № 104';
        } else if (spec.includes('свар')) {
          document.getElementById('inputClassroom').value = 'Сварочно-производственный комплекс № 2';
        } else if (spec.includes('пожарн') || spec.includes('мчс')) {
          document.getElementById('inputClassroom').value = 'Кабинет защиты в ЧС № 302';
        } else if (spec.includes('сетей') || spec.includes('компьютер')) {
          document.getElementById('inputClassroom').value = 'Лаборатория сетевого администрирования IT-201';
        } else if (spec.includes('авто')) {
          document.getElementById('inputClassroom').value = 'Лаборатория диагностики двигателей № 12';
        } else {
          document.getElementById('inputClassroom').value = 'Учебная аудитория спецдисциплин № 205';
        }
        this.renderPreview();
        this.showToast('Аудитория подобрана по специальности!');
      }
    });
  },

  setMode(mode, btn) {
    this.mode = mode;
    document.querySelectorAll('#modeSingleBtn, #modeAllBtn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('selectHero').disabled = (mode === 'all');
    this.renderPreview();
  },

  setOrientation(orient, btn) {
    this.orientation = orient;
    document.querySelectorAll('#orientLandscapeBtn, #orientPortraitBtn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    this.renderPreview();
  },

  setTheme(theme, btn) {
    this.theme = theme;
    document.querySelectorAll('#themeParchmentBtn, #themeCleanBtn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    this.renderPreview();
  },

  /**
   * 3. Генерация DOM таблички А4
   */
  renderPreview() {
    const container = document.getElementById('previewContainer');
    if (!container) return;
    container.innerHTML = '';

    const classroom = document.getElementById('inputClassroom').value;
    const teacher = document.getElementById('inputTeacher').value;

    if (this.mode === 'single') {
      const hero = heroesDatabase.find(h => h.id === this.selectedHeroId) || heroesDatabase[0];
      container.appendChild(this.createPlaqueDOM(hero, classroom, teacher));
    } else {
      // Пакетный режим: формируем все 20 парт подряд
      heroesDatabase.forEach(hero => {
        container.appendChild(this.createPlaqueDOM(hero, classroom, teacher));
      });
    }
  },

  createPlaqueDOM(hero, classroom, teacher) {
    const sheet = document.createElement('article');
    const isPortrait = this.orientation === 'portrait';
    sheet.className = `plaque-sheet ${this.theme} ${isPortrait ? 'orient-portrait' : ''}`;

    const photoSrc = hero.media?.photo || 'assets/images/memorial-bg.jpg';
    const qrTargetUrl = new URL(`index.html#hero-${encodeURIComponent(hero.id)}`, window.location.href).href;
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(qrTargetUrl)}`;

    sheet.innerHTML = `
      <div class="plaque-frame-outer"></div>
      <div class="plaque-frame-inner"></div>
      <div class="plaque-corner corner-tl"></div>
      <div class="plaque-corner corner-tr"></div>
      <div class="plaque-corner corner-bl"></div>
      <div class="plaque-corner corner-br"></div>

      <!-- Шапка -->
      <header class="plaque-header">
        <div class="plaque-project-title">ПАРТА ГЕРОЯ • МЕМОРИАЛ СЛАВЫ</div>
        <div class="plaque-college-sub">ГБПОУ «Ставропольский региональный многопрофильный колледж»</div>
      </header>

      <!-- Центральный блок -->
      <div class="plaque-grid-content">
        
        <!-- Левая колонка: Фото + QR -->
        <div class="plaque-left-col">
          <div class="plaque-photo-frame">
            <img src="${photoSrc}" alt="${hero.name}" onerror="this.src='assets/images/memorial-bg.jpg'">
          </div>
          <div class="plaque-qr-box">
            <img src="${qrApiUrl}" alt="QR" class="plaque-qr-img">
            <div class="plaque-qr-text">
              Наведите камеру<br>для перехода<br>в цифровой музей
            </div>
          </div>
        </div>

        <!-- Правая колонка: Биография и Подвиг -->
        <div class="plaque-right-col">
          <div class="plaque-hero-name">${hero.name}</div>
          <div class="plaque-years-badge">${hero.dates?.years || 'Навечно в строю'}</div>

          <div class="plaque-info-block">
            <strong>Специальность и учеба в колледже:</strong>
            ${hero.education?.specialty || 'Выпускник СРМК'} (${hero.education?.period || 'Годы учебы'})
            ${hero.education?.honors ? ` • <em>${hero.education.honors}</em>` : ''}
          </div>

          <div class="plaque-info-block">
            <strong>Ратный подвиг и воинский долг:</strong>
            ${hero.military?.rank || 'Воин ВС РФ'} ${hero.military?.unit ? `• ${hero.military.unit}` : ''}<br>
            ${hero.deed || 'Сведения о боевом пути и подвиге верифицированы архивами колледжа.'}
          </div>

          ${hero.quote ? `
            <div class="plaque-quote-box">
              «${hero.quote}»
            </div>
          ` : ''}

          <div class="plaque-info-block">
            <strong>Государственные награды:</strong>
            ${(hero.awards || ['Орден Мужества (посмертно)']).join(', ')}
          </div>
        </div>

      </div>

      <!-- Подвал -->
      <footer class="plaque-footer">
        <div><span class="plaque-room-badge">${classroom}</span></div>
        <div>${teacher}</div>
        <div>Мемориальный реестр ГБПОУ СРМК • Всероссийский проект «Карта доблести»</div>
      </footer>
    `;

    return sheet;
  },

  showToast(msg) {
    const toast = document.getElementById('deskToast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('active');
    setTimeout(() => toast.classList.remove('active'), 2500);
  }
};

document.addEventListener('DOMContentLoaded', () => DeskQREngine.init());