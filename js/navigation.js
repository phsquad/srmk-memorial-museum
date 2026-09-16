/**
 * НАВИГАЦИОННЫЙ КОМПОНЕНТ
 * Единый модуль для рендеринга и управления навигацией на всех страницах.
 * Устраняет дублирование кода между страницами.
 */

(function() {
  'use strict';

  // Конфигурация меню навигации
  const NAV_ITEMS = [
    { id: 'home', label: 'Главная', href: 'index.html', icon: '🏠' },
    { id: 'about', label: 'О музее', href: 'about.html', icon: 'ℹ️' },
    { id: 'heroes', label: 'Герои', href: 'heroes.html', icon: '🎖️' },
    { id: 'memory-book', label: 'Книга памяти', href: 'memory-book.html', icon: '📖' },
    { id: 'guest-book', label: 'Гостевая книга', href: 'guest-book.html', icon: '✍️' },
    { id: 'quiz', label: 'Викторина', href: 'quiz.html', icon: '❓' },
    { id: 'sources', label: 'Источники', href: 'sources.html', icon: '📚' },
    { id: 'contacts', label: 'Контакты', href: 'contacts.html', icon: '📞' }
  ];

  // === ИНИЦИАЛИЗАЦИЯ ПОСЛЕ ЗАГРУЗКИ DOM ===
  document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
  });

  /**
   * Основная функция инициализации навигации
   */
  function initNavigation() {
    // Подсветка активной страницы
    highlightActivePage();
    
    // Инициализация выпадающего меню модулей
    initModulesDropdown();
    
    // Инициализация мобильного меню
    initMobileDrawer();
    
    // Инициализация кнопки паспорта проекта
    initPassportButton();
    
    Logger.info('Navigation component initialized');
  }

  /**
   * Выпадающее меню цифровых модулей
   */
  function initModulesDropdown() {
    const dropdownToggle = document.getElementById('btnDropdownToggle');
    const dropdownMenu = document.getElementById('dropdownMenu');
    
    if (!dropdownToggle || !dropdownMenu) return;

    // Клик по кнопке переключает меню
    dropdownToggle.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      const isExpanded = dropdownToggle.getAttribute('aria-expanded') === 'true';
      dropdownToggle.setAttribute('aria-expanded', !isExpanded);
      dropdownMenu.style.display = isExpanded ? 'none' : 'block';
    });

    // Закрытие при клике вне меню
    document.addEventListener('click', function(e) {
      if (!dropdownToggle.contains(e.target) && !dropdownMenu.contains(e.target)) {
        dropdownToggle.setAttribute('aria-expanded', 'false');
        dropdownMenu.style.display = 'none';
      }
    });

    // Закрытие по Escape
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        dropdownToggle.setAttribute('aria-expanded', 'false');
        dropdownMenu.style.display = 'none';
      }
    });
  }

  /**
   * Выдвижная мобильная панель меню
   */
  function initMobileDrawer() {
    const burgerBtn = document.getElementById('mobileBurgerBtn');
    const mobileDrawer = document.getElementById('mobileDrawer');
    const drawerPassportBtn = document.getElementById('drawerPassportBtn');
    
    if (!burgerBtn || !mobileDrawer) return;

    // Открытие/закрытие мобильного меню
    burgerBtn.addEventListener('click', function() {
      const isExpanded = burgerBtn.getAttribute('aria-expanded') === 'true';
      burgerBtn.setAttribute('aria-expanded', !isExpanded);
      mobileDrawer.setAttribute('aria-hidden', isExpanded);
      
      // Блокировка прокрутки body при открытом меню
      if (!isExpanded) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    });

    // Закрытие по клику на ссылку
    mobileDrawer.querySelectorAll('.drawer-link').forEach(link => {
      link.addEventListener('click', function() {
        burgerBtn.setAttribute('aria-expanded', 'false');
        mobileDrawer.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      });
    });

    // Кнопка паспорта в мобильном меню
    if (drawerPassportBtn) {
      drawerPassportBtn.addEventListener('click', openPassportModal);
    }

    // Закрытие по Escape
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && mobileDrawer.getAttribute('aria-hidden') === 'false') {
        burgerBtn.setAttribute('aria-expanded', 'false');
        mobileDrawer.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      }
    });
  }

  /**
   * Кнопка паспорта проекта в шапке
   */
  function initPassportButton() {
    const passportBtn = document.getElementById('btnOpenPassport');
    if (passportBtn) {
      passportBtn.addEventListener('click', openPassportModal);
    }
  }

  /**
   * Открытие модального окна паспорта проекта
   */
  function openPassportModal() {
    // Создаем модальное окно если его нет
    let modal = document.getElementById('passportModal');
    
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'passportModal';
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-content">
          <button class="modal-close" id="closePassportModal" type="button">&times;</button>
          <h2>Паспорт проекта</h2>
          <div class="modal-body">
            <h3>«Быть воином — жить вечно»</h3>
            <p><strong>Тип:</strong> Цифровой мемориально-образовательный комплекс</p>
            <p><strong>Организация:</strong> ГБПОУ «Ставропольский региональный многопрофильный колледж»</p>
            <p><strong>Год запуска:</strong> 2024</p>
            <p><strong>Цель:</strong> Патриотическое воспитание молодежи через интерактивные технологии</p>
            <h4>Основные модули:</h4>
            <ul>
              <li>Мемориал Славы «Звезда Памяти»</li>
              <li>Электронная Книга Памяти</li>
              <li>3D Фолиант с перелистыванием</li>
              <li>Квест-викторина «Дорогами мужества»</li>
              <li>Конструктор «Парта Героя»</li>
              <li>Стена Памяти и отзывов</li>
              <li>Методический кабинет педагога</li>
            </ul>
            <p><strong>Контакты:</strong> info@srmk-stv.ru</p>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      
      // Добавляем стили для модального окна если их нет
      if (!document.getElementById('passportModalStyles')) {
        const styles = document.createElement('style');
        styles.id = 'passportModalStyles';
        styles.textContent = `
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
          }
          .modal-content {
            background: linear-gradient(135deg, #1a1f2e 0%, #0f1218 100%);
            border: 2px solid rgba(197, 160, 89, 0.3);
            border-radius: 12px;
            padding: 2rem;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            color: #e0e0e0;
            position: relative;
          }
          .modal-close {
            position: absolute;
            top: 1rem;
            right: 1rem;
            background: transparent;
            border: none;
            color: #c5a059;
            font-size: 2rem;
            cursor: pointer;
            line-height: 1;
          }
          .modal-content h2 {
            color: #c5a059;
            font-family: 'Cinzel', serif;
            margin-bottom: 1rem;
          }
          .modal-content h3 {
            color: #f1f3f7;
            margin: 1rem 0 0.5rem;
          }
          .modal-content h4 {
            color: #c5a059;
            margin: 1.5rem 0 0.5rem;
          }
          .modal-content p {
            margin: 0.5rem 0;
          }
          .modal-content ul {
            margin: 0.5rem 0;
            padding-left: 1.5rem;
          }
          .modal-content li {
            margin: 0.25rem 0;
          }
          .modal-body {
            margin-top: 1rem;
          }
        `;
        document.head.appendChild(styles);
      }
      
      // Закрытие по крестику
      const closeBtn = modal.querySelector('#closePassportModal');
      if (closeBtn) {
        closeBtn.addEventListener('click', function() {
          modal.remove();
        });
      }
      
      // Закрытие по клику вне контента
      modal.addEventListener('click', function(e) {
        if (e.target === modal) {
          modal.remove();
        }
      });
    }
    
    // Показываем модальное окно
    modal.style.display = 'flex';
  }

  /**
   * Рендеринг шапки сайта
   * @param {string} containerId - ID контейнера для вставки шапки
   */
  function renderHeader(containerId = 'siteHeader') {
    const container = document.getElementById(containerId);
    if (!container) {
      Logger.warn(`Контейнер шапки #${containerId} не найден`);
      return;
    }

    const currentPageId = getCurrentPageId();
    
    // Генерация ссылок основного меню
    const desktopNavLinks = NAV_ITEMS.slice(0, 4).map(item => {
      const isActive = item.id === currentPageId ? 'active' : '';
      return `<a href="${item.href}" class="nav-link ${isActive}" data-page="${item.id}">${item.label}</a>`;
    }).join('');

    // Генерация ссылок выпадающего меню модулей
    const moduleItems = [
      { href: 'memory-book.html', icon: '📖', title: 'Книга Памяти', subtitle: 'Летопись 20 героев' },
      { href: 'reader.html', icon: '📚', title: '3D Фолиант', subtitle: 'Читалка с перелистыванием' },
      { href: 'quiz.html', icon: '⚔️', title: 'Квест-викторина', subtitle: '10 интерактивных вопросов' },
      { href: 'methodology.html', icon: '📑', title: 'Методкабинет', subtitle: 'Банк уроков для педагогов' },
      { href: 'verify.html', icon: '🛡', title: 'Реестр верификации', subtitle: 'Проверка сертификатов' },
      { href: 'desk-qr.html', icon: '🪑', title: 'Парта Героя', subtitle: 'Конструктор табличек А4' },
      { href: 'guestbook.html', icon: '🕯', title: 'Стена Памяти', subtitle: 'Послания и лампады' }
    ];

    const dropdownItems = moduleItems.map(item => `
      <a href="${item.href}" class="dropdown-item">
        <span class="item-icon">${item.icon}</span>
        <div><strong>${item.title}</strong><small>${item.subtitle}</small></div>
      </a>
    `).join('');

    // Генерация ссылок мобильного меню
    const mobileMainLinks = NAV_ITEMS.map(item => 
      `<a href="${item.href}" class="drawer-link" data-page="${item.id}">${item.icon} ${item.label}</a>`
    ).join('');

    const mobileModuleLinks = moduleItems.map(item => 
      `<a href="${item.href}" class="drawer-link">${item.icon} ${item.title}</a>`
    ).join('');

    container.innerHTML = `
      <div class="container header-container">
        
        <!-- ЛОГОТИП И НАЗВАНИЕ -->
        <a href="#heroIntro" class="logo-group" aria-label="На главную страницу музея">
          <div class="logo-badge">СРМК</div>
          <div class="logo-text">
            <span class="org-name">ГБПОУ СРМК • Ставрополь</span>
            <span class="site-title">«Быть воином — жить вечно»</span>
          </div>
        </a>

        <!-- ОСНОВНАЯ НАВИГАЦИЯ -->
        <nav class="nav" id="desktopNav" aria-label="Навигация по залам">
          ${desktopNavLinks}
        </nav>

        <!-- ПАНЕЛЬ ДЕЙСТВИЙ И ЦИФРОВЫХ МОДУЛЕЙ -->
        <div class="header-actions">
          <!-- ВЫПАДАЮЩЕЕ МЕНЮ ЦИФРОВЫХ МОДУЛЕЙ -->
          <div class="modules-dropdown" id="modulesDropdown">
            <button class="btn-dropdown-toggle" id="btnDropdownToggle" type="button" aria-expanded="false" aria-controls="dropdownMenu">
              <span>🏛 Модули</span>
              <span class="arrow-icon" aria-hidden="true">▾</span>
            </button>
            <div class="dropdown-menu" id="dropdownMenu">
              ${dropdownItems}
            </div>
          </div>

          <!-- КНОПКА СЕРТИФИКАТА -->
          <a href="certificate.html" class="btn-header-cert" title="Оформить наградной лист">
            <span>📜</span> Сертификат
          </a>

          <!-- ПАСПОРТ И КАРТА ДОБЛЕСТИ -->
          <button class="passport-btn" id="btnOpenPassport" type="button">Паспорт проекта</button>
          <a href="https://карта-доблести.рф" target="_blank" rel="noopener noreferrer" class="contest-badge">Карта Доблести РФ</a>

          <!-- КНОПКА МОБИЛЬНОГО МЕНЮ (БУРГЕР) -->
          <button class="mobile-burger-btn" id="mobileBurgerBtn" aria-label="Открыть мобильное меню" aria-expanded="false" aria-controls="mobileDrawer" type="button">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>

      <!-- ВЫДВИЖНАЯ МОБИЛЬНАЯ ПАНЕЛЬ МЕНЮ -->
      <div class="mobile-drawer" id="mobileDrawer" aria-hidden="true">
        <div class="drawer-content">
          <div class="drawer-section-label">Основные разделы</div>
          ${mobileMainLinks}

          <div class="drawer-section-label">Цифровые модули и сервисы</div>
          ${mobileModuleLinks}
          <a href="certificate.html" class="drawer-link highlight">📜 Оформить Сертификат участника</a>

          <div class="drawer-buttons-row">
            <button class="drawer-btn" id="drawerPassportBtn" type="button">Паспорт проекта</button>
            <a href="https://карта-доблести.рф" target="_blank" rel="noopener noreferrer" class="drawer-btn gold">Карта Доблести РФ</a>
          </div>
        </div>
      </div>
    `;

    Logger.info('Header rendered', { container: containerId, page: currentPageId });
  }

  /**
   * Подсветка активной страницы в навигации
   */
  function highlightActivePage() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Подсветка в выпадающем меню
    document.querySelectorAll('.dropdown-item').forEach(item => {
      const href = item.getAttribute('href');
      if (href && href === currentPage) {
        item.style.background = 'rgba(197, 160, 89, 0.2)';
      }
    });
    
    // Подсветка в мобильном меню
    document.querySelectorAll('.drawer-link').forEach(link => {
      const href = link.getAttribute('href');
      if (href && (href === currentPage || href.startsWith(currentPage + '#'))) {
        link.classList.add('highlight');
      }
    });
  }

  /**
   * Утилита для получения текущей страницы
   * @returns {string} ID текущей страницы
   */
  function getCurrentPageId() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const pageName = currentPage.replace('.html', '');
    
    // Маппинг имен файлов на ID страниц
    const pageMap = {
      'index': 'home',
      'about': 'about',
      'heroes': 'heroes',
      'memory-book': 'memory-book',
      'guest-book': 'guest-book',
      'quiz': 'quiz',
      'sources': 'sources',
      'contacts': 'contacts'
    };
    
    return pageMap[pageName] || 'home';
  }

  /**
   * Экспорт публичных методов компонента
   */
  window.NavigationComponent = {
    getCurrentPageId: getCurrentPageId,
    navItems: NAV_ITEMS,
    renderHeader: renderHeader,
    init: initNavigation
  };

})();
