/**
 * ============================================
 * НАВИГАЦИОННЫЙ МЕНЕДЖЕР САЙТА
 * Единый модуль для управления навигацией
 * ============================================
 */

const SiteNavigation = (function() {
  'use strict';

  // Конфигурация всех страниц сайта
  const SITE_PAGES = {
    main: {
      file: 'index.html',
      title: 'Главная — Виртуальный музей ГБПОУ СРМК',
      icon: '🏛'
    },
    memoryBook: {
      file: 'memory-book.html',
      title: 'Книга Памяти',
      icon: '📖'
    },
    reader: {
      file: 'reader.html',
      title: '3D Фолиант',
      icon: '📚'
    },
    quiz: {
      file: 'quiz.html',
      title: 'Квест-викторина',
      icon: '⚔️'
    },
    deskQr: {
      file: 'desk-qr.html',
      title: 'Парта Героя',
      icon: '🪑'
    },
    guestbook: {
      file: 'guestbook.html',
      title: 'Стена Памяти',
      icon: '🕯'
    },
    certificate: {
      file: 'certificate.html',
      title: 'Сертификаты',
      icon: '📜'
    },
    methodology: {
      file: 'methodology.html',
      title: 'Методкабинет',
      icon: '📑'
    },
    verify: {
      file: 'verify.html',
      title: 'Реестр верификации',
      icon: '🛡'
    },
    mobile: {
      file: 'mobile.html',
      title: 'Мобильная версия',
      icon: '📱'
    }
  };

  // Проверка существования файла
  function pageExists(pageName) {
    return SITE_PAGES[pageName] !== undefined;
  }

  // Получение пути к странице
  function getPagePath(pageName) {
    if (!pageExists(pageName)) {
      console.warn(`[SiteNavigation] Страница "${pageName}" не найдена в конфигурации`);
      return null;
    }
    return SITE_PAGES[pageName].file;
  }

  // Переход на страницу
  function navigateTo(pageName, newTab = false) {
    const path = getPagePath(pageName);
    if (!path) return false;

    if (newTab) {
      window.open(path, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = path;
    }
    return true;
  }

  // Инициализация навигации на странице
  function init() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Подсветка активной ссылки в меню
    document.querySelectorAll('.nav-link, .drawer-link, .main-nav a').forEach(link => {
      const href = link.getAttribute('href');
      if (href && href === currentPage) {
        link.classList.add('active');
      }
    });

    // Инициализация мобильного меню
    initMobileMenu();

    console.log('[SiteNavigation] Инициализировано. Текущая страница:', currentPage);
  }

  // Инициализация мобильного меню
  function initMobileMenu() {
    const burgerBtn = document.getElementById('mobileBurgerBtn');
    const mobileDrawer = document.getElementById('mobileDrawer');
    
    if (!burgerBtn || !mobileDrawer) return;

    burgerBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      const isExpanded = this.getAttribute('aria-expanded') === 'true';
      toggleMobileMenu(!isExpanded);
    });
    
    // Закрытие при клике вне меню
    document.addEventListener('click', function(e) {
      if (!mobileDrawer.contains(e.target) && !burgerBtn.contains(e.target)) {
        toggleMobileMenu(false);
      }
    });

    // Закрытие по ESC
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        toggleMobileMenu(false);
      }
    });
  }

  // Переключение мобильного меню
  function toggleMobileMenu(show) {
    const burgerBtn = document.getElementById('mobileBurgerBtn');
    const mobileDrawer = document.getElementById('mobileDrawer');
    
    if (!burgerBtn || !mobileDrawer) return;

    if (show) {
      burgerBtn.setAttribute('aria-expanded', 'true');
      mobileDrawer.setAttribute('aria-hidden', 'false');
      mobileDrawer.classList.add('active');
      burgerBtn.classList.add('active');
      document.body.style.overflow = 'hidden';
    } else {
      burgerBtn.setAttribute('aria-expanded', 'false');
      mobileDrawer.setAttribute('aria-hidden', 'true');
      mobileDrawer.classList.remove('active');
      burgerBtn.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  // Публичный API
  return {
    init: init,
    navigateTo: navigateTo,
    getPagePath: getPagePath,
    pageExists: pageExists,
    toggleMobileMenu: toggleMobileMenu,
    pages: SITE_PAGES
  };

})();

// Автоинициализация после загрузки DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', SiteNavigation.init);
} else {
  SiteNavigation.init();
}
