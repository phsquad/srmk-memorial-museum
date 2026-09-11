/**
 * ============================================================================
 * ЦЕНТРАЛЬНАЯ ПАНЕЛЬ УПРАВЛЕНИЯ (CMS v3.0 Ultra Enterprise Edition)
 * Файл: js/admin.js
 * Мемориально-образовательный комплекс ГБПОУ СРМК «Быть воином — жить вечно»
 * 
 * Содержит: Полноэкранный Dashboard, CRUD-операции, Canvas 3:4 Auto-Crop,
 * Поиск, Импорт/Экспорт JSON и data.js, фикс ID Mutation и связь с App.js
 * ============================================================================
 */

'use strict';

const AdminCMS = {
  adminPassword: "2026",
  currentHeroId: null,
  originalHeroId: null, // 🔥 Трекинг исходного ID (фикс ID Mutation Glitch)
  tempHeroData: null,
  sidebarSearchQuery: "",

  init() {
    this.createDashboardMarkup();
    this.bindEvents();
    this.applyLocalStorageOverrides();
    console.log("[AdminCMS v3.0 Ultra] Панель управления готова. Вход: Ctrl+Shift+A");
  },

  /**
   * 1. Генерация HTML-разметки полноэкранного дашборда
   */
  createDashboardMarkup() {
    if (document.getElementById('adminDashboard')) return;

    const adminDashboard = document.createElement('div');
    adminDashboard.id = 'adminDashboard';
    adminDashboard.className = 'admin-dashboard';
    adminDashboard.innerHTML = `
      <div class="admin-sidebar">
        <div class="admin-sidebar-header">
          <h3>⚙️ Музей СРМК</h3>
          <button id="adminCloseBtn" class="admin-icon-btn" title="Закрыть админку">&times;</button>
        </div>

        <div class="admin-sidebar-actions">
          <button id="adminAddNewBtn" class="admin-btn-success">+ Добавить героя</button>
        </div>

        <!-- Живой поиск по списку героев -->
        <div style="padding: 0 16px 10px;">
          <input type="text" id="adminSidebarSearch" class="admin-input" placeholder="🔍 Поиск героя в списке..." style="margin-bottom:0; font-size:0.78rem;">
        </div>

        <div class="admin-hero-list" id="adminHeroList">
          <!-- Список героев генерируется динамически -->
        </div>

        <div class="admin-sidebar-footer">
          <button id="adminExportBtn" class="admin-btn-export">📥 Скачать data.js</button>
          <div style="display:flex; gap:6px; margin-top:8px;">
            <button id="adminExportJsonBtn" class="admin-btn-small" style="flex:1; padding:8px 4px;">JSON Экспорт</button>

            <label for="adminImportJsonInput" class="admin-btn-small" style="flex:1; padding:8px 4px; text-align:center; cursor:pointer; margin:0;">
              JSON Импорт
            </label>
            <input type="file" id="adminImportJsonInput" accept=".json" style="display:none;">
          </div>
          <button id="adminResetBtn" class="admin-btn-danger" style="margin-top:8px;">Сбросить правки</button>
        </div>
      </div>

      <div class="admin-main">
        <div class="admin-topbar">
          <h2 id="adminEditorTitle">Редактирование профиля</h2>
          <div style="display:flex; gap:10px; align-items:center;">
            <button id="adminPreviewBtn" class="admin-btn-small" style="padding:9px 14px; background:var(--bg-elevated); border:1px solid var(--border-accent); color:var(--accent-brass); display:none;">
              👁 Просмотр карточки
            </button>
            <button id="adminSaveBtn" class="admin-btn-primary">💾 Сохранить изменения</button>
          </div>
        </div>

        <div class="admin-content-scroll" id="adminFormArea" style="display:none;">
          <div class="admin-grid">
            
            <!-- ЛЕВАЯ КОЛОНКА: ФОТО И БАЗОВЫЕ НАСТРОЙКИ -->
            <div class="admin-col">
              <div class="admin-panel">
                <h4>Фотография (Авто-кадрирование 3:4)</h4>
                <div class="admin-photo-wrap">
                  <img id="admPhotoPreview" src="" alt="Превью">
                </div>
                <input type="file" id="admPhotoInput" accept="image/*" class="admin-file-input">
                <small style="display:block; color:var(--text-tertiary); margin-top:6px; font-size:0.7rem;">
                  Фото автоматически обрезается в пропорции 3:4 (600×800px).
                </small>
              </div>

              <div class="admin-panel">
                <h4>Системные настройки</h4>
                <label>ID героя (уникальный, латиница):</label>
                <input type="text" id="admId" class="admin-input" placeholder="например: petukhov-v-v">
                
                <label>Расположение на мемориале:</label>
                <select id="admPlaque" class="admin-input">
                  <option value="left">Левая плита Мемориала</option>
                  <option value="right">Правая плита Мемориала</option>
                  <option value="none">Не на плите (Книга Памяти)</option>
                </select>

                <label>Категория:</label>
                <select id="admCategory" class="admin-input">
                  <option value="svo_memorial">Герой СВО (Мемориал Славы)</option>
                  <option value="svo_veterans">Ветеран СВО</option>
                  <option value="local_wars">Локальные конфликты</option>
                  <option value="vov">Великая Отечественная война</option>
                </select>

                <label>Специальность (Тег фильтра):</label>
                <select id="admSpecTag" class="admin-input">
                  <option value="fire">МЧС и спасатели</option>
                  <option value="weld">Сварочное дело</option>
                  <option value="electro">Электротехника</option>
                  <option value="auto">Автотранспорт</option>
                  <option value="it">IT и сети</option>
                  <option value="mech">Машиностроение</option>
                </select>
              </div>
            </div>

            <!-- ПРАВАЯ КОЛОНКА: ТЕКСТОВЫЕ ДАННЫЕ И НАГРАДЫ -->
            <div class="admin-col">
              <div class="admin-panel">
                <h4>Личные данные</h4>
                <label>ФИО полностью:*</label>
                <input type="text" id="admName" class="admin-input" placeholder="например: Петухов Владислав Витальевич">
                
                <div class="admin-row">
                  <div>
                    <label>Дата рождения:</label>
                    <input type="text" id="admBirth" class="admin-input" placeholder="18.11.1996">
                  </div>
                  <div>
                    <label>Дата гибели:</label>
                    <input type="text" id="admDeath" class="admin-input" placeholder="15.12.2022">
                  </div>
                  <div>
                    <label>Годы (строка):</label>
                    <input type="text" id="admYears" class="admin-input" placeholder="1996 — 2022">
                  </div>
                </div>
              </div>

              <div class="admin-panel">
                <h4>Обучение в СРМК</h4>
                <label>Специальность (текст):</label>
                <input type="text" id="admEduSpec" class="admin-input" placeholder="например: Пожарная безопасность">
                <div class="admin-row">
                  <div>
                    <label>Период обучения:</label>
                    <input type="text" id="admEduPeriod" class="admin-input" placeholder="2016 — 2020 гг.">
                  </div>
                  <div>
                    <label>Отличия / Квалификация:</label>
                    <input type="text" id="admEduHonors" class="admin-input" placeholder="например: Диплом с отличием, Староста">
                  </div>
                </div>
              </div>

              <div class="admin-panel">
                <h4>Воинская служба и Подвиг</h4>
                <div class="admin-row">
                  <div>
                    <label>Звание:</label>
                    <input type="text" id="admMilRank" class="admin-input" placeholder="например: Гвардии рядовой">
                  </div>
                  <div>
                    <label>Должность/Роль:</label>
                    <input type="text" id="admMilRole" class="admin-input" placeholder="например: Разведчик-санитар">
                  </div>
                </div>
                <label>Воинская часть / Подразделение:</label>
                <input type="text" id="admMilUnit" class="admin-input" placeholder="например: 247-й гв. ДШП ВДВ">

                <label>Описание подвига:*</label>
                <textarea id="admDeed" class="admin-input" rows="4" placeholder="Подробное описание хроники подвига..."></textarea>

                <label>Памятная цитата:</label>
                <input type="text" id="admQuote" class="admin-input" placeholder="например: Никто кроме нас">
              </div>

              <div class="admin-panel">
                <h4>Динамические списки</h4>
                
                <label>Награды:</label>
                <div class="admin-tags-container" id="admAwardsList"></div>
                <div class="admin-add-row">
                  <input type="text" id="newAwardInput" class="admin-input" placeholder="например: Орден Мужества (посмертно)">
                  <button class="admin-btn-small" type="button" onclick="AdminCMS.addArrayItem('awards', 'newAwardInput')">Добавить</button>
                </div>

                <label style="margin-top:12px;">Архивные документы:</label>
                <div class="admin-tags-container" id="admDocsList"></div>
                <div class="admin-add-row">
                  <input type="text" id="newDocInput" class="admin-input" placeholder="например: Диплом СРМК выпуска 2020 г.">
                  <button class="admin-btn-small" type="button" onclick="AdminCMS.addArrayItem('docs', 'newDocInput')">Добавить</button>
                </div>
              </div>

              <div class="admin-panel">
                <h4>География (Для Яндекс Карты)</h4>
                <div class="admin-row">
                  <div>
                    <label>Широта (Lat):</label>
                    <input type="number" step="0.0001" id="admMapLat" class="admin-input" placeholder="47.8500">
                  </div>
                  <div>
                    <label>Долгота (Lng):</label>
                    <input type="number" step="0.0001" id="admMapLng" class="admin-input" placeholder="37.2000">
                  </div>
                </div>
                <label>Название локации:</label>
                <input type="text" id="admMapLoc" class="admin-input" placeholder="например: Угледарское направление">
              </div>

              <button id="adminDeleteBtn" class="admin-btn-danger" style="width:100%; margin-top:20px; padding:12px;" type="button">
                🗑️ Удалить героя из базы
              </button>
            </div>
          </div>
        </div>
        
        <div id="adminEmptyState" class="admin-empty-state">
          <h3>Выберите героя из списка слева или нажмите «+ Добавить героя»</h3>
        </div>
      </div>
    `;
    document.body.appendChild(adminDashboard);
  },

  /**
   * 2. Привязка всех событий
   */
  bindEvents() {
    // Горячие клавиши Ctrl+Shift+A / Ctrl+Shift+Ф
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a' || e.key === 'Ф' || e.key === 'ф')) {
        e.preventDefault();
        this.open();
      }
    });

    document.getElementById('adminCloseBtn')?.addEventListener('click', () => this.close());
    document.getElementById('adminAddNewBtn')?.addEventListener('click', () => this.createNewHero());
    document.getElementById('adminSaveBtn')?.addEventListener('click', () => this.saveCurrentHero());
    document.getElementById('adminExportBtn')?.addEventListener('click', () => this.exportDataJSFile());
    document.getElementById('adminExportJsonBtn')?.addEventListener('click', () => this.exportJSONFile());
    document.getElementById('adminResetBtn')?.addEventListener('click', () => this.resetAllChanges());
    document.getElementById('adminDeleteBtn')?.addEventListener('click', () => this.deleteCurrentHero());
    document.getElementById('adminPreviewBtn')?.addEventListener('click', () => this.previewCurrentHeroInModal());

    // Поиск по боковому списку
    const searchInput = document.getElementById('adminSidebarSearch');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.sidebarSearchQuery = e.target.value.toLowerCase().trim();
        this.renderSidebarList();
      });
    }

    // Загрузка JSON файла
    const jsonInput = document.getElementById('adminImportJsonInput');
    if (jsonInput) {
      jsonInput.addEventListener('change', (e) => this.importJSONFile(e));
    }

    // Авто-кадрирование фото
    const photoInput = document.getElementById('admPhotoInput');
    if (photoInput) {
      photoInput.addEventListener('change', (e) => this.handlePhotoAutoCrop(e));
    }
  },

  open() {
    const entered = prompt("Введите пароль администратора СРМК (2026):", "");
    if (entered === this.adminPassword) {
      this.renderSidebarList();
      document.getElementById('adminDashboard')?.classList.add('active');
      document.body.style.overflow = 'hidden';
      this.showAdminToast("Панель управления CMS v3.0 активна", "info");
    } else if (entered !== null) {
      alert("Отказ в доступе: Неверный пароль.");
    }
  },

  close() {
    document.getElementById('adminDashboard')?.classList.remove('active');
    document.body.style.overflow = 'auto';
  },

  /**
   * 3. Отрисовка фильтруемого списка героев в sidebar
   */
  renderSidebarList() {
    const list = document.getElementById('adminHeroList');
    if (!list) return;
    list.innerHTML = '';

    if (typeof heroesDatabase === 'undefined' || !Array.isArray(heroesDatabase)) return;

    const filtered = heroesDatabase.filter(hero => {
      if (!this.sidebarSearchQuery) return true;
      const q = this.sidebarSearchQuery;
      return (hero.name && hero.name.toLowerCase().includes(q)) ||
             (hero.id && hero.id.toLowerCase().includes(q)) ||
             (hero.education?.specialty && hero.education.specialty.toLowerCase().includes(q));
    });

    if (filtered.length === 0) {
      list.innerHTML = `<div style="padding:15px; color:var(--text-tertiary); font-size:0.78rem; text-align:center;">Герои не найдены</div>`;
      return;
    }

    filtered.forEach(hero => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `admin-list-item ${this.currentHeroId === hero.id ? 'active' : ''}`;
      btn.innerHTML = `<strong>${this.escapeHtml(hero.name || 'Без имени')}</strong><br><small style="opacity:0.75;">${hero.dates?.years || ''}</small>`;
      btn.addEventListener('click', () => this.loadHeroIntoForm(hero.id));
      list.appendChild(btn);
    });
  },

  /**
   * 4. Загрузка данных героя в форму
   */
  loadHeroIntoForm(heroId) {
    this.currentHeroId = heroId;
    this.originalHeroId = heroId; // 🔥 Запоминаем исходный ID (фикс ID Mutation Glitch)
    this.renderSidebarList();

    const hero = heroesDatabase.find(h => h.id === heroId);
    if (!hero) return;

    this.tempHeroData = JSON.parse(JSON.stringify(hero)); // Глубокая копия

    document.getElementById('adminEmptyState').style.display = 'none';
    document.getElementById('adminFormArea').style.display = 'block';
    document.getElementById('adminPreviewBtn').style.display = 'inline-block';
    document.getElementById('adminEditorTitle').textContent = `Редактирование: ${hero.name}`;

    // Заполнение формы
    document.getElementById('admId').value = hero.id || '';
    document.getElementById('admPlaque').value = hero.plaque || 'none';
    document.getElementById('admCategory').value = hero.category || 'svo_memorial';
    document.getElementById('admSpecTag').value = hero.specTag || 'fire';

    document.getElementById('admName').value = hero.name || '';
    document.getElementById('admBirth').value = hero.dates?.birth || '';
    document.getElementById('admDeath').value = hero.dates?.death || '';
    document.getElementById('admYears').value = hero.dates?.years || '';

    document.getElementById('admEduSpec').value = hero.education?.specialty || '';
    document.getElementById('admEduPeriod').value = hero.education?.period || '';
    document.getElementById('admEduHonors').value = hero.education?.honors || '';

    document.getElementById('admMilRank').value = hero.military?.rank || '';
    document.getElementById('admMilRole').value = hero.military?.role || '';
    document.getElementById('admMilUnit').value = hero.military?.unit || '';

    document.getElementById('admDeed').value = hero.deed || '';
    document.getElementById('admQuote').value = hero.quote || '';

    document.getElementById('admMapLat').value = hero.mapCoords?.lat || '';
    document.getElementById('admMapLng').value = hero.mapCoords?.lng || '';
    document.getElementById('admMapLoc').value = hero.mapCoords?.locationName || '';

    // Фото
    const preview = document.getElementById('admPhotoPreview');
    if (preview) {
      preview.src = hero.media?.photo || 
        (typeof ArchiveService !== 'undefined' ? ArchiveService.generateFallbackAvatar(hero) : '');
    }

    this.renderDynamicLists();
  },

  /**
   * 5. Динамические списки наград и документов
   */
  renderDynamicLists() {
    const awardsContainer = document.getElementById('admAwardsList');
    const docsContainer = document.getElementById('admDocsList');

    if (awardsContainer) {
      awardsContainer.innerHTML = (this.tempHeroData.awards || []).map((a, i) =>
        `<span class="admin-tag">${this.escapeHtml(a)} <span class="admin-tag-remove" onclick="AdminCMS.removeArrayItem('awards', ${i})">&times;</span></span>`
      ).join('');
    }

    if (docsContainer) {
      docsContainer.innerHTML = (this.tempHeroData.media?.documents || []).map((d, i) =>
        `<span class="admin-tag">${this.escapeHtml(d)} <span class="admin-tag-remove" onclick="AdminCMS.removeArrayItem('docs', ${i})">&times;</span></span>`
      ).join('');
    }
  },

  addArrayItem(type, inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const val = input.value.trim();
    if (!val) return;

    if (type === 'awards') {
      if (!this.tempHeroData.awards) this.tempHeroData.awards = [];
      this.tempHeroData.awards.push(val);
    } else if (type === 'docs') {
      if (!this.tempHeroData.media) this.tempHeroData.media = {};
      if (!this.tempHeroData.media.documents) this.tempHeroData.media.documents = [];
      this.tempHeroData.media.documents.push(val);
    }

    input.value = '';
    this.renderDynamicLists();
  },

  removeArrayItem(type, index) {
    if (type === 'awards' && this.tempHeroData.awards) {
      this.tempHeroData.awards.splice(index, 1);
    } else if (type === 'docs' && this.tempHeroData.media?.documents) {
      this.tempHeroData.media.documents.splice(index, 1);
    }
    this.renderDynamicLists();
  },

  /**
   * 6. Создание нового героя
   */
  createNewHero() {
    const newId = 'hero-' + Date.now();
    const newHero = {
      id: newId,
      plaque: "none",
      category: "svo_memorial",
      specTag: "fire",
      name: "Новый Герой СРМК",
      dates: { birth: "", death: "", years: "" },
      education: { specialty: "", period: "", honors: "" },
      military: { rank: "", unit: "", role: "" },
      awards: ["Орден Мужества (посмертно)"],
      deed: "",
      quote: "",
      media: { photo: "", audioGuide: "", documents: [] },
      mapCoords: { lat: 45.0448, lng: 41.9691, locationName: "г. Ставрополь" }
    };

    heroesDatabase.unshift(newHero);
    this.saveToLocalStorage();
    this.loadHeroIntoForm(newId);
    this.showAdminToast("Создан новый профиль героя. Заполните данные.", "info");
  },

  /**
   * 7. Удаление героя
   */
  deleteCurrentHero() {
    if (!this.currentHeroId) return;
    if (confirm(`Вы действительно хотите удалить профиль «${this.tempHeroData.name}» из реестра?`)) {
      const idx = heroesDatabase.findIndex(h => h.id === this.originalHeroId || h.id === this.currentHeroId);
      if (idx !== -1) heroesDatabase.splice(idx, 1);

      this.saveToLocalStorage();
      this.currentHeroId = null;
      this.originalHeroId = null;

      document.getElementById('adminFormArea').style.display = 'none';
      document.getElementById('adminPreviewBtn').style.display = 'none';
      document.getElementById('adminEmptyState').style.display = 'flex';

      this.renderSidebarList();
      if (window.App && typeof App.renderCardsGrid === 'function') App.renderCardsGrid();
      this.showAdminToast("Профиль героя удален", "warn");
    }
  },

  /**
   * 8. СОХРАНЕНИЕ ИЗМЕНЕНИЙ (С ПОЛНЫМ УСТРАНЕНИЕМ ID MUTATION GLITCH)
   */
  saveCurrentHero() {
    if (!this.tempHeroData) return;

    const newIdInput = document.getElementById('admId').value.trim();
    const nameInput = document.getElementById('admName').value.trim();

    if (!newIdInput) {
      alert("Ошибка: ID героя не может быть пустым.");
      return;
    }

    if (!nameInput) {
      alert("Ошибка: Укажите ФИО героя.");
      return;
    }

    // Сбор данных из полей формы
    this.tempHeroData.id = newIdInput;
    this.tempHeroData.name = nameInput;
    this.tempHeroData.plaque = document.getElementById('admPlaque').value;
    this.tempHeroData.category = document.getElementById('admCategory').value;
    this.tempHeroData.specTag = document.getElementById('admSpecTag').value;

    this.tempHeroData.dates.birth = document.getElementById('admBirth').value;
    this.tempHeroData.dates.death = document.getElementById('admDeath').value;
    this.tempHeroData.dates.years = document.getElementById('admYears').value;

    this.tempHeroData.education.specialty = document.getElementById('admEduSpec').value;
    this.tempHeroData.education.period = document.getElementById('admEduPeriod').value;
    this.tempHeroData.education.honors = document.getElementById('admEduHonors').value;

    this.tempHeroData.military.rank = document.getElementById('admMilRank').value;
    this.tempHeroData.military.role = document.getElementById('admMilRole').value;
    this.tempHeroData.military.unit = document.getElementById('admMilUnit').value;

    this.tempHeroData.deed = document.getElementById('admDeed').value;
    this.tempHeroData.quote = document.getElementById('admQuote').value;

    this.tempHeroData.mapCoords.lat = parseFloat(document.getElementById('admMapLat').value) || 0;
    this.tempHeroData.mapCoords.lng = parseFloat(document.getElementById('admMapLng').value) || 0;
    this.tempHeroData.mapCoords.locationName = document.getElementById('admMapLoc').value;

    // 🔥 БЕЗУПРЕЧНЫЙ ПОИСК В МАССИВЕ ПО ИСХОДНОМУ ИЛИ НОВОМУ ID:
    let idx = heroesDatabase.findIndex(h => h.id === this.originalHeroId);
    if (idx === -1) {
      idx = heroesDatabase.findIndex(h => h.id === newIdInput);
    }

    if (idx !== -1) {
      heroesDatabase[idx] = JSON.parse(JSON.stringify(this.tempHeroData));
    } else {
      heroesDatabase.unshift(JSON.parse(JSON.stringify(this.tempHeroData)));
    }

    this.currentHeroId = newIdInput;
    this.originalHeroId = newIdInput;

    this.saveToLocalStorage();
    this.renderSidebarList();

    // Синхронизация всех залов музея
    if (window.App) {
      if (typeof App.renderCardsGrid === 'function') App.renderCardsGrid();
      if (typeof App.renderMemorialPlaques === 'function') App.renderMemorialPlaques();
      if (typeof App.initInteractiveMap === 'function') App.initInteractiveMap();
    }

    this.showAdminToast("Изменения успешно сохранены на сайте!", "success");
  },

  /**
   * 9. Быстрый просмотр модального досье
   */
  previewCurrentHeroInModal() {
    if (!this.currentHeroId) return;
    this.close();
    if (window.App && typeof App.openModal === 'function') {
      App.openModal(this.currentHeroId);
    }
  },

  saveToLocalStorage() {
    localStorage.setItem('srmk_admin_db_state', JSON.stringify(heroesDatabase));
  },

  applyLocalStorageOverrides() {
    const savedState = localStorage.getItem('srmk_admin_db_state');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (Array.isArray(parsed) && parsed.length > 0) {
          heroesDatabase.length = 0;
          parsed.forEach(h => heroesDatabase.push(h));
        }
      } catch (e) {
        console.error("[AdminCMS] Ошибка применения LocalStorage:", e);
      }
    }
  },

  resetAllChanges() {
    if (confirm("ВНИМАНИЕ! Это полностью сбросит все добавленные вами изменения и вернет базу данных к исходному файлу data.js. Продолжить?")) {
      localStorage.removeItem('srmk_admin_db_state');
      location.reload();
    }
  },

  /**
   * 10. Авто-кадрирование фотографии 3:4 (HTML5 Canvas 600×800)
   */
  handlePhotoAutoCrop(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 800;
        const ctx = canvas.getContext('2d');

        const targetAspect = 600 / 800;
        const sourceAspect = img.width / img.height;
        let sWidth, sHeight, sx, sy;

        if (sourceAspect > targetAspect) {
          sHeight = img.height;
          sWidth = img.height * targetAspect;
          sx = (img.width - sWidth) / 2;
          sy = 0;
        } else {
          sWidth = img.width;
          sHeight = img.width / targetAspect;
          sx = 0;
          sy = (img.height - sHeight) / 2;
        }

        ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, 600, 800);
        const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

        const preview = document.getElementById('admPhotoPreview');
        if (preview) preview.src = croppedDataUrl;

        if (!this.tempHeroData.media) this.tempHeroData.media = {};
        this.tempHeroData.media.photo = croppedDataUrl;
        this.showAdminToast("Фото обработано и кадрировано (600×800)", "info");
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  },

  /**
   * 11. ЭКСПОРТ ОБНОВЛЕННОГО data.js И JSON
   */
  exportDataJSFile() {
    const fileContent = `/**
 * ============================================================================
 * ЦИФРОВОЙ РЕЕСТР: МЕМОРИАЛ СЛАВЫ ГБПОУ СРМК
 * Сгенерировано через встроенную панель управления AdminCMS v3.0 Ultra
 * ============================================================================
 */

'use strict';

const MUSEUM_CONFIG = ${JSON.stringify(typeof MUSEUM_CONFIG !== 'undefined' ? MUSEUM_CONFIG : {}, null, 2)};

const SPECIALTIES_TAXONOMY = ${JSON.stringify(typeof SPECIALTIES_TAXONOMY !== 'undefined' ? SPECIALTIES_TAXONOMY : {}, null, 2)};

const heroesDatabase = ${JSON.stringify(heroesDatabase, null, 2)};

const MuseumAPI = {
  getAllHeroes: () => heroesDatabase,
  getHeroById: (id) => heroesDatabase.find(h => h.id === id),
  getHeroesByPlaque: (side) => heroesDatabase.filter(h => h.plaque === side),
  getMapMarkers: () => heroesDatabase.map(h => ({
    id: h.id,
    name: h.name,
    rank: h.military?.rank || 'Воин ВС РФ',
    coords: [h.mapCoords?.lat || 45.0448, h.mapCoords?.lng || 41.9691],
    location: h.mapCoords?.locationName || 'г. Ставрополь',
    badgeColor: "#9e1b20"
  }))
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MUSEUM_CONFIG, SPECIALTIES_TAXONOMY, heroesDatabase, MuseumAPI };
}
`;

    const blob = new Blob([fileContent], { type: 'application/javascript;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'data.js';
    link.click();
    URL.revokeObjectURL(link.href);

    this.showAdminToast("Файл data.js сгенерирован и скачан!", "success");
  },

  exportJSONFile() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(heroesDatabase, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `heroesDatabase_SRMK_${Date.now()}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
    this.showAdminToast("База данных экспортирована в JSON", "info");
  },

  importJSONFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].id) {
          heroesDatabase.length = 0;
          parsed.forEach(h => heroesDatabase.push(h));
          this.saveToLocalStorage();
          this.renderSidebarList();
          if (window.App && typeof App.renderCardsGrid === 'function') App.renderCardsGrid();
          alert("Импорт завершен! Загружено героев: " + parsed.length);
        } else {
          alert("Ошибка: Неверный формат JSON файла.");
        }
      } catch (err) {
        alert("Ошибка чтения JSON файла: " + err.message);
      }
    };
    reader.readAsText(file);
  },

  escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, tag => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag]));
  },

  showAdminToast(msg, type = "info") {
    let toast = document.getElementById('adminToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'adminToast';
      toast.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 10000;
        padding: 12px 20px; border-radius: 4px; font-size: 0.85rem; font-weight: 700;
        color: #fff; background: rgba(18, 21, 28, 0.98); border: 1px solid var(--accent-brass);
        box-shadow: 0 10px 30px rgba(0,0,0,0.8); transition: all 0.3s ease; opacity: 0; transform: translateY(-20px);
      `;
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-20px)';
    }, 3000);
  }
};

window.AdminCMS = AdminCMS;
document.addEventListener('DOMContentLoaded', () => AdminCMS.init());