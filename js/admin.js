/**
 * ============================================================================
 * ВСТРОЕННАЯ АДМИН-ПАНЕЛЬ (CMS): js/admin.js
 * Визуальное управление анкетами, авто-кадрирование фото и экспорт data.js
 * ============================================================================
 */

'use strict';

const AdminCMS = {
  adminPassword: "2026", // Пароль для входа в админку
  tempHeroData: null,

  init() {
    this.createAdminModalMarkup();
    this.bindEvents();
    this.applyLocalStorageOverrides();
    console.log("[AdminCMS] Модуль управления готов. Вход: Ctrl+Shift+A");
  },

  /**
   * 1. Встраивание модального окна админки в DOM
   */
  createAdminModalMarkup() {
    const adminModal = document.createElement('div');
    adminModal.id = 'adminModal';
    adminModal.className = 'modal admin-modal';
    adminModal.innerHTML = `
      <div class="modal-overlay" id="adminModalOverlay"></div>
      <div class="modal-dialog admin-dialog">
        <button class="modal-close" id="adminModalCloseBtn">&times;</button>
        
        <div class="admin-header">
          <h2>⚙️ Панель управления музеем СРМК</h2>
          <p>Редактирование анкет героев, авто-кадрирование фото и экспорт базы</p>
        </div>

        <div class="admin-body">
          <!-- Селектор героя -->
          <div class="admin-field-group">
            <label><strong>Выберите героя для редактирования:</strong></label>
            <select id="adminHeroSelect" class="admin-select"></select>
          </div>

          <div class="admin-grid-layout">
            <!-- Левая колонка: Фото и кадрирование -->
            <div class="admin-photo-col">
              <label><strong>Фотография героя:</strong></label>
              <div class="admin-photo-preview-wrap">
                <img id="adminPhotoPreview" src="" alt="Превью" class="admin-photo-preview">
              </div>
              <input type="file" id="adminPhotoInput" accept="image/*" class="admin-file-input">
              <small style="color:var(--text-muted); font-size:0.75rem; display:block; margin-top:6px;">
                💡 Выберите любой файл: скрипт автоматически обрежет его под пропорции 3:4
              </small>
            </div>

            <!-- Правая колонка: Текстовые поля -->
            <div class="admin-form-col">
              <div class="admin-field-group">
                <label>ФИО героя:</label>
                <input type="text" id="adminHeroName" class="admin-input">
              </div>

              <div class="admin-field-row">
                <div class="admin-field-group">
                  <label>Годы жизни:</label>
                  <input type="text" id="adminHeroYears" class="admin-input">
                </div>
                <div class="admin-field-group">
                  <label>Плита на мемориале:</label>
                  <select id="adminHeroPlaque" class="admin-select">
                    <option value="left">Левая плита</option>
                    <option value="right">Правая плита</option>
                  </select>
                </div>
              </div>

              <div class="admin-field-group">
                <label>Специальность в СРМК:</label>
                <input type="text" id="adminHeroSpecialty" class="admin-input">
              </div>

              <div class="admin-field-group">
                <label>Воинское звание и подразделение:</label>
                <input type="text" id="adminHeroRank" class="admin-input">
              </div>

              <div class="admin-field-group">
                <label>Награды (через запятую):</label>
                <input type="text" id="adminHeroAwards" class="admin-input">
              </div>

              <div class="admin-field-group">
                <label>Описание подвига и боевого пути:</label>
                <textarea id="adminHeroDeed" class="admin-textarea" rows="4"></textarea>
              </div>

              <div class="admin-field-group">
                <label>Памятная цитата:</label>
                <input type="text" id="adminHeroQuote" class="admin-input">
              </div>
            </div>
          </div>

          <!-- Нижняя панель действий -->
          <div class="admin-actions-footer">
            <button id="adminSaveLocalBtn" class="btn btn-primary">💾 Применить на сайте</button>
            <button id="adminExportBtn" class="btn btn-secondary" style="border-color:var(--gold-accent); color:var(--gold-accent);">
              📥 Скачать обновленный data.js для GitHub
            </button>
            <button id="adminResetBtn" class="btn btn-secondary" style="color:#ff6b6b;">Сбросить правки</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(adminModal);
  },

  /**
   * 2. Привязка событий
   */
  bindEvents() {
    // Хоткей Ctrl + Shift + A
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a' || e.key === 'Ф' || e.key === 'ф')) {
        e.preventDefault();
        this.open();
      }
    });

    const closeBtn = document.getElementById('adminModalCloseBtn');
    const overlay = document.getElementById('adminModalOverlay');
    if (closeBtn) closeBtn.addEventListener('click', () => this.close());
    if (overlay) overlay.addEventListener('click', () => this.close());

    // Переключение героя в списке
    const select = document.getElementById('adminHeroSelect');
    if (select) {
      select.addEventListener('change', (e) => {
        this.loadHeroIntoForm(e.target.value);
      });
    }

    // Авто-кадрирование фото при выборе файла
    const photoInput = document.getElementById('adminPhotoInput');
    if (photoInput) {
      photoInput.addEventListener('change', (e) => this.handlePhotoAutoCrop(e));
    }

    // Кнопка сохранения в LocalStorage
    const saveBtn = document.getElementById('adminSaveLocalBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveCurrentHero());
    }

    // Кнопка экспорта data.js
    const exportBtn = document.getElementById('adminExportBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportDataJSFile());
    }

    // Кнопка сброса
    const resetBtn = document.getElementById('adminResetBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetAllChanges());
    }
  },

  /**
   * 3. Вход в админку с проверкой пароля
   */
  open() {
    const entered = prompt("Введите пароль администратора музея СРМК:", "");
    if (entered === this.adminPassword) {
      this.populateHeroesSelect();
      const modal = document.getElementById('adminModal');
      if (modal) modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    } else if (entered !== null) {
      alert("Неверный пароль доступа.");
    }
  },

  close() {
    const modal = document.getElementById('adminModal');
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = 'auto';
  },

  /**
   * 4. Заполнение выпадающего списка 20 героев
   */
  populateHeroesSelect() {
    const select = document.getElementById('adminHeroSelect');
    if (!select) return;
    select.innerHTML = heroesDatabase.map(h => `<option value="${h.id}">${h.name} (${h.dates.years})</option>`).join('');
    this.loadHeroIntoForm(heroesDatabase[0].id);
  },

  /**
   * 5. Загрузка данных героя в форму
   */
  loadHeroIntoForm(heroId) {
    const hero = heroesDatabase.find(h => h.id === heroId);
    if (!hero) return;

    this.tempHeroData = JSON.parse(JSON.stringify(hero));

    document.getElementById('adminHeroName').value = hero.name || '';
    document.getElementById('adminHeroYears').value = hero.dates?.years || '';
    document.getElementById('adminHeroPlaque').value = hero.plaque || 'left';
    document.getElementById('adminHeroSpecialty').value = hero.education?.specialty || '';
    document.getElementById('adminHeroRank').value = hero.military ? `${hero.military.rank || ''} • ${hero.military.unit || ''}` : '';
    document.getElementById('adminHeroAwards').value = (hero.awards || []).join(', ');
    document.getElementById('adminHeroDeed').value = hero.deed || '';
    document.getElementById('adminHeroQuote').value = hero.quote || '';

    const preview = document.getElementById('adminPhotoPreview');
    if (preview) {
      preview.src = hero.media?.photo || ArchiveService.generateFallbackAvatar(hero);
    }
  },

  /**
   * 6. Встроенное авто-кадрирование фото в 3:4 через Canvas
   */
  handlePhotoAutoCrop(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Создаем холст с пропорциями 3:4 (600x800 px)
        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 800;
        const ctx = canvas.getContext('2d');

        // Вычисляем центральное кадрирование (Cover)
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

        // Оптимизация в WebP/JPEG с качеством 85%
        const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        document.getElementById('adminPhotoPreview').src = croppedDataUrl;

        // Сохраняем во временный объект
        if (!this.tempHeroData.media) this.tempHeroData.media = {};
        this.tempHeroData.media.photo = croppedDataUrl;
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  },

  /**
   * 7. Сохранение героя в LocalStorage и синхронизация сайта
   */
  saveCurrentHero() {
    if (!this.tempHeroData) return;

    const heroId = this.tempHeroData.id;
    const heroIndex = heroesDatabase.findIndex(h => h.id === heroId);
    if (heroIndex === -1) return;

    // Считываем значения из формы
    this.tempHeroData.name = document.getElementById('adminHeroName').value;
    this.tempHeroData.dates.years = document.getElementById('adminHeroYears').value;
    this.tempHeroData.plaque = document.getElementById('adminHeroPlaque').value;
    this.tempHeroData.education.specialty = document.getElementById('adminHeroSpecialty').value;
    this.tempHeroData.awards = document.getElementById('adminHeroAwards').value.split(',').map(a => a.trim()).filter(Boolean);
    this.tempHeroData.deed = document.getElementById('adminHeroDeed').value;
    this.tempHeroData.quote = document.getElementById('adminHeroQuote').value;

    // Обновляем в памяти
    heroesDatabase[heroIndex] = JSON.parse(JSON.stringify(this.tempHeroData));

    // Сохраняем в LocalStorage
    const allOverrides = JSON.parse(localStorage.getItem('srmk_admin_overrides') || '{}');
    allOverrides[heroId] = this.tempHeroData;
    localStorage.setItem('srmk_admin_overrides', JSON.stringify(allOverrides));

    // Перерисовываем интерфейс сайта
    if (window.App) {
      App.renderCardsGrid();
      App.renderMemorialPlaques();
    }

    alert(`Анкета героя «${this.tempHeroData.name}» успешно обновлена на сайте!`);
  },

  /**
   * 8. Генерация и скачивание готового файла data.js для отправки на GitHub
   */
  exportDataJSFile() {
    const fileContent = `/**
 * ============================================================================
 * ЦИФРОВОЙ РЕЕСТР: МЕМОРИАЛ СЛАВЫ ГБПОУ СРМК (ОБНОВЛЕННАЯ БАЗА)
 * Сгенерировано через встроенную панель управления AdminCMS
 * ============================================================================
 */

'use strict';

const MUSEUM_CONFIG = ${JSON.stringify(MUSEUM_CONFIG, null, 2)};

const SPECIALTIES_TAXONOMY = ${JSON.stringify(SPECIALTIES_TAXONOMY, null, 2)};

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

    alert("Файл data.js успешно сгенерирован и скачан! Просто замените им старый data.js в репозитории на GitHub.");
  },

  /**
   * 9. Восстановление переопределений из LocalStorage при загрузке
   */
  applyLocalStorageOverrides() {
    const allOverrides = JSON.parse(localStorage.getItem('srmk_admin_overrides') || '{}');
    Object.keys(allOverrides).forEach(id => {
      const idx = heroesDatabase.findIndex(h => h.id === id);
      if (idx !== -1) {
        heroesDatabase[idx] = allOverrides[id];
      }
    });
  },

  resetAllChanges() {
    if (confirm("Вы уверены, что хотите сбросить все локальные правки и вернуться к исходным данным?")) {
      localStorage.removeItem('srmk_admin_overrides');
      location.reload();
    }
  }
};

window.AdminCMS = AdminCMS;
document.addEventListener('DOMContentLoaded', () => AdminCMS.init());