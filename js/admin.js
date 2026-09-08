/**
 * ============================================================================
 * ВСТРОЕННАЯ АДМИН-ПАНЕЛЬ (CMS v2.0 Pro): js/admin.js
 * Полноэкранный Dashboard, CRUD-операции, динамические списки и экспорт
 * ============================================================================
 */

'use strict';

const AdminCMS = {
  adminPassword: "2026",
  currentHeroId: null,
  tempHeroData: null,

  init() {
    this.createDashboardMarkup();
    this.bindEvents();
    this.applyLocalStorageOverrides();
    console.log("[AdminCMS v2.0] Система управления готова. Вход: Ctrl+Shift+A");
  },

  /**
   * 1. Генерация HTML-разметки полноэкранного дашборда
   */
  createDashboardMarkup() {
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
        <div class="admin-hero-list" id="adminHeroList">
          <!-- Список героев генерируется динамически -->
        </div>
        <div class="admin-sidebar-footer">
          <button id="adminExportBtn" class="admin-btn-export">📥 Скачать data.js</button>
          <button id="adminResetBtn" class="admin-btn-danger" style="margin-top:8px;">Сбросить правки</button>
        </div>
      </div>

      <div class="admin-main">
        <div class="admin-topbar">
          <h2 id="adminEditorTitle">Редактирование профиля</h2>
          <button id="adminSaveBtn" class="admin-btn-primary">💾 Сохранить изменения</button>
        </div>

        <div class="admin-content-scroll" id="adminFormArea" style="display:none;">
          <div class="admin-grid">
            
            <!-- ЛЕВАЯ КОЛОНКА: ФОТО И БАЗА -->
            <div class="admin-col">
              <div class="admin-panel">
                <h4>Фотография (Авто-кадрирование 3:4)</h4>
                <div class="admin-photo-wrap">
                  <img id="admPhotoPreview" src="" alt="Превью">
                </div>
                <input type="file" id="admPhotoInput" accept="image/*" class="admin-file-input">
              </div>

              <div class="admin-panel">
                <h4>Системные настройки</h4>
                <label>ID героя (уникальный, латиница):</label>
                <input type="text" id="admId" class="admin-input" disabled>
                
                <label>Расположение на мемориале:</label>
                <select id="admPlaque" class="admin-input">
                  <option value="left">Левая плита</option>
                  <option value="right">Правая плита</option>
                  <option value="none">Не на плите (Книга Памяти)</option>
                </select>

                <label>Категория:</label>
                <select id="admCategory" class="admin-input">
                  <option value="svo_memorial">Герой СВО (Мемориал)</option>
                  <option value="svo_veterans">Ветеран СВО</option>
                  <option value="local_wars">Локальные конфликты</option>
                  <option value="vov">ВОВ</option>
                </select>

                <label>Специальность (Тег для фильтра):</label>
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

            <!-- ПРАВАЯ КОЛОНКА: ТЕКСТОВЫЕ ДАННЫЕ -->
            <div class="admin-col">
              <div class="admin-panel">
                <h4>Личные данные</h4>
                <label>ФИО полностью:</label>
                <input type="text" id="admName" class="admin-input">
                
                <div class="admin-row">
                  <div>
                    <label>Дата рождения:</label>
                    <input type="text" id="admBirth" class="admin-input" placeholder="ДД.ММ.ГГГГ">
                  </div>
                  <div>
                    <label>Дата гибели:</label>
                    <input type="text" id="admDeath" class="admin-input" placeholder="ДД.ММ.ГГГГ">
                  </div>
                  <div>
                    <label>Годы (строка):</label>
                    <input type="text" id="admYears" class="admin-input" placeholder="1999 — 2022">
                  </div>
                </div>
              </div>

              <div class="admin-panel">
                <h4>Обучение в СРМК</h4>
                <label>Специальность (текст):</label>
                <input type="text" id="admEduSpec" class="admin-input">
                <div class="admin-row">
                  <div>
                    <label>Период обучения:</label>
                    <input type="text" id="admEduPeriod" class="admin-input">
                  </div>
                  <div>
                    <label>Отличия / Диплом:</label>
                    <input type="text" id="admEduHonors" class="admin-input">
                  </div>
                </div>
              </div>

              <div class="admin-panel">
                <h4>Воинская служба и Подвиг</h4>
                <div class="admin-row">
                  <div>
                    <label>Звание:</label>
                    <input type="text" id="admMilRank" class="admin-input">
                  </div>
                  <div>
                    <label>Должность/Роль:</label>
                    <input type="text" id="admMilRole" class="admin-input">
                  </div>
                </div>
                <label>Воинская часть / Подразделение:</label>
                <input type="text" id="admMilUnit" class="admin-input">

                <label>Описание подвига:</label>
                <textarea id="admDeed" class="admin-input" rows="4"></textarea>

                <label>Памятная цитата:</label>
                <input type="text" id="admQuote" class="admin-input">
              </div>

              <div class="admin-panel">
                <h4>Динамические списки</h4>
                
                <label>Награды:</label>
                <div class="admin-tags-container" id="admAwardsList"></div>
                <div class="admin-add-row">
                  <input type="text" id="newAwardInput" class="admin-input" placeholder="Например: Орден Мужества">
                  <button class="admin-btn-small" onclick="AdminCMS.addArrayItem('awards', 'newAwardInput')">Добавить</button>
                </div>

                <label style="margin-top:12px;">Архивные документы:</label>
                <div class="admin-tags-container" id="admDocsList"></div>
                <div class="admin-add-row">
                  <input type="text" id="newDocInput" class="admin-input" placeholder="Например: Студенческий билет">
                  <button class="admin-btn-small" onclick="AdminCMS.addArrayItem('docs', 'newDocInput')">Добавить</button>
                </div>
              </div>

              <div class="admin-panel">
                <h4>География (Для Яндекс Карты)</h4>
                <div class="admin-row">
                  <div>
                    <label>Широта (Lat):</label>
                    <input type="number" step="0.0001" id="admMapLat" class="admin-input">
                  </div>
                  <div>
                    <label>Долгота (Lng):</label>
                    <input type="number" step="0.0001" id="admMapLng" class="admin-input">
                  </div>
                </div>
                <label>Название локации:</label>
                <input type="text" id="admMapLoc" class="admin-input" placeholder="Например: Угледарское направление">
              </div>

              <button id="adminDeleteBtn" class="admin-btn-danger" style="width:100%; margin-top:20px;">🗑️ Удалить героя из базы</button>
            </div>
          </div>
        </div>
        
        <div id="adminEmptyState" class="admin-empty-state">
          <h3>Выберите героя из списка слева или создайте нового</h3>
        </div>
      </div>
    `;
    document.body.appendChild(adminDashboard);
  },

  /**
   * 2. Привязка событий
   */
  bindEvents() {
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a' || e.key === 'Ф' || e.key === 'ф')) {
        e.preventDefault();
        this.open();
      }
    });

    document.getElementById('adminCloseBtn').addEventListener('click', () => this.close());
    document.getElementById('adminAddNewBtn').addEventListener('click', () => this.createNewHero());
    document.getElementById('adminSaveBtn').addEventListener('click', () => this.saveCurrentHero());
    document.getElementById('adminExportBtn').addEventListener('click', () => this.exportDataJSFile());
    document.getElementById('adminResetBtn').addEventListener('click', () => this.resetAllChanges());
    document.getElementById('adminDeleteBtn').addEventListener('click', () => this.deleteCurrentHero());

    const photoInput = document.getElementById('admPhotoInput');
    if (photoInput) {
      photoInput.addEventListener('change', (e) => this.handlePhotoAutoCrop(e));
    }
  },

  open() {
    const entered = prompt("Введите пароль администратора (2026):", "");
    if (entered === this.adminPassword) {
      this.renderSidebarList();
      document.getElementById('adminDashboard').classList.add('active');
      document.body.style.overflow = 'hidden';
    } else if (entered !== null) {
      alert("Неверный пароль.");
    }
  },

  close() {
    document.getElementById('adminDashboard').classList.remove('active');
    document.body.style.overflow = 'auto';
  },

  /**
   * 3. Отрисовка бокового списка героев
   */
  renderSidebarList() {
    const list = document.getElementById('adminHeroList');
    list.innerHTML = '';
    heroesDatabase.forEach(hero => {
      const btn = document.createElement('button');
      btn.className = `admin-list-item ${this.currentHeroId === hero.id ? 'active' : ''}`;
      btn.innerHTML = `<strong>${hero.name}</strong><br><small>${hero.dates?.years || ''}</small>`;
      btn.addEventListener('click', () => this.loadHeroIntoForm(hero.id));
      list.appendChild(btn);
    });
  },

  /**
   * 4. Загрузка данных в форму
   */
  loadHeroIntoForm(heroId) {
    this.currentHeroId = heroId;
    this.renderSidebarList();
    
    const hero = heroesDatabase.find(h => h.id === heroId);
    if (!hero) return;

    this.tempHeroData = JSON.parse(JSON.stringify(hero)); // Глубокая копия

    document.getElementById('adminEmptyState').style.display = 'none';
    document.getElementById('adminFormArea').style.display = 'block';
    document.getElementById('adminEditorTitle').textContent = `Редактирование: ${hero.name}`;

    // Заполнение полей
    document.getElementById('admId').value = hero.id || '';
    document.getElementById('admId').disabled = true; // ID менять нельзя у существующих
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
    preview.src = hero.media?.photo || (typeof ArchiveService !== 'undefined' ? ArchiveService.generateFallbackAvatar(hero) : '');

    this.renderDynamicLists();
  },

  /**
   * 5. Управление динамическими массивами (Награды и Документы)
   */
  renderDynamicLists() {
    const awardsContainer = document.getElementById('admAwardsList');
    const docsContainer = document.getElementById('admDocsList');
    
    awardsContainer.innerHTML = (this.tempHeroData.awards || []).map((a, i) => 
      `<span class="admin-tag">${a} <span class="admin-tag-remove" onclick="AdminCMS.removeArrayItem('awards', ${i})">&times;</span></span>`
    ).join('');

    docsContainer.innerHTML = (this.tempHeroData.media?.documents || []).map((d, i) => 
      `<span class="admin-tag">${d} <span class="admin-tag-remove" onclick="AdminCMS.removeArrayItem('docs', ${i})">&times;</span></span>`
    ).join('');
  },

  addArrayItem(type, inputId) {
    const input = document.getElementById(inputId);
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
    if (type === 'awards') {
      this.tempHeroData.awards.splice(index, 1);
    } else if (type === 'docs') {
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
      name: "Новый Герой",
      dates: { birth: "", death: "", years: "" },
      education: { specialty: "", period: "", honors: "" },
      military: { rank: "", unit: "", role: "" },
      awards: [],
      deed: "",
      quote: "",
      media: { photo: "", audioGuide: "", documents: [] },
      mapCoords: { lat: 45.04, lng: 41.96, locationName: "Ставрополь" }
    };

    heroesDatabase.unshift(newHero); // Добавляем в начало
    this.saveToLocalStorage();
    this.loadHeroIntoForm(newId);
    document.getElementById('admId').disabled = false; // Разрешаем задать красивый ID
  },

  /**
   * 7. Удаление героя
   */
  deleteCurrentHero() {
    if (!this.currentHeroId) return;
    if (confirm(`Вы точно хотите удалить героя «${this.tempHeroData.name}»?`)) {
      const idx = heroesDatabase.findIndex(h => h.id === this.currentHeroId);
      if (idx !== -1) heroesDatabase.splice(idx, 1);
      
      this.saveToLocalStorage();
      this.currentHeroId = null;
      document.getElementById('adminFormArea').style.display = 'none';
      document.getElementById('adminEmptyState').style.display = 'flex';
      this.renderSidebarList();
      if (window.App) App.renderCardsGrid();
    }
  },

  /**
   * 8. Сохранение изменений
   */
  saveCurrentHero() {
    if (!this.tempHeroData) return;

    // Если ID был изменен (для новых героев)
    const newIdInput = document.getElementById('admId').value.trim();
    if (newIdInput && newIdInput !== this.tempHeroData.id) {
      this.tempHeroData.id = newIdInput;
      this.currentHeroId = newIdInput;
    }

    // Сбор данных из формы
    this.tempHeroData.name = document.getElementById('admName').value;
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

    // Обновление в массиве
    const idx = heroesDatabase.findIndex(h => h.id === this.tempHeroData.id);
    if (idx !== -1) {
      heroesDatabase[idx] = JSON.parse(JSON.stringify(this.tempHeroData));
    } else {
      // Если ID поменялся, ищем старый и заменяем
      const oldIdx = heroesDatabase.findIndex(h => h.name === this.tempHeroData.name);
      if (oldIdx !== -1) heroesDatabase[oldIdx] = JSON.parse(JSON.stringify(this.tempHeroData));
    }

    this.saveToLocalStorage();
    this.renderSidebarList();
    
    if (window.App) {
      App.renderCardsGrid();
      App.renderMemorialPlaques();
      App.initInteractiveMap(); // Перерисовка карты
    }

    alert("Изменения успешно применены на сайте!");
  },

  saveToLocalStorage() {
    localStorage.setItem('srmk_admin_db_state', JSON.stringify(heroesDatabase));
  },

  applyLocalStorageOverrides() {
    const savedState = localStorage.getItem('srmk_admin_db_state');
    if (savedState) {
      const parsed = JSON.parse(savedState);
      // Заменяем содержимое массива, сохраняя ссылку
      heroesDatabase.length = 0;
      parsed.forEach(h => heroesDatabase.push(h));
    }
  },

  resetAllChanges() {
    if (confirm("ВНИМАНИЕ! Это удалит всех добавленных героев и вернет базу к исходному состоянию из файла data.js. Продолжить?")) {
      localStorage.removeItem('srmk_admin_db_state');
      location.reload();
    }
  },

  /**
   * 9. Авто-кадрирование фото (Canvas)
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
        
        document.getElementById('admPhotoPreview').src = croppedDataUrl;
        if (!this.tempHeroData.media) this.tempHeroData.media = {};
        this.tempHeroData.media.photo = croppedDataUrl;
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  },

  /**
   * 10. Экспорт готового файла data.js
   */
  exportDataJSFile() {
    const fileContent = `/**
 * ============================================================================
 * ЦИФРОВОЙ РЕЕСТР: МЕМОРИАЛ СЛАВЫ ГБПОУ СРМК (ОБНОВЛЕННАЯ БАЗА)
 * Сгенерировано через встроенную панель управления AdminCMS v2.0
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
    coords: [h.mapCoords.lat, h.mapCoords.lng],
    location: h.mapCoords.locationName,
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

    alert("Файл data.js успешно скачан! Замените им старый файл в папке js/ вашего проекта на GitHub.");
  }
};

window.AdminCMS = AdminCMS;
document.addEventListener('DOMContentLoaded', () => AdminCMS.init());