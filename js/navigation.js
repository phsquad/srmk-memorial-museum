/**
 * НАВИГАЦИОННЫЙ МОДУЛЬ ДЛЯ ЕДИНОЙ ШАПКИ
 * Подключается на все страницы сайта
 */

(function() {
  'use strict';

  // === ИНИЦИАЛИЗАЦИЯ ПОСЛЕ ЗАГРУЗКИ DOM ===
  document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
  });

  /**
   * Основная функция инициализации навигации
   */
  function initNavigation() {
    // Инициализация выпадающего меню модулей
    initModulesDropdown();
    
    // Инициализация мобильного меню
    initMobileDrawer();
    
    // Инициализация кнопки паспорта проекта
    initPassportButton();
    
    // Подсветка активной страницы в навигации
    highlightActivePage();
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

})();
