/**
 * ============================================================================
 * УНИВЕРСАЛЬНЫЙ НАВИГАЦИОННЫЙ ДВИЖОК: js/navigation.js (v7.0 Universal Master)
 * Мемориально-образовательный комплекс ГБПОУ СРМК «Быть воином — жить вечно»
 * 
 * Включает:
 * 1. Единый синглтон-модуль модального окна «Паспорт проекта»
 * 2. Диспетчер выпадающего меню цифровых модулей (Десктоп)
 * 3. Мобильное выдвижное меню (Drawer) для всех страниц экспозиции
 * 4. Управление шторкой и Bottom Tab Bar для PWA-версии (mobile.html)
 * 5. Автоматическую подсветку активных страниц и разделов
 * ============================================================================
 */

(function() {
  'use strict';

  const NavigationEngine = {
    passportModalEl: null,

    init() {
      // 1. Инициализация стандартной шапки сайта
      this.initStandardHeaderDropdown();
      this.initStandardMobileDrawer();

      // 2. Инициализация мобильного приложения (mobile.html)
      this.initMobileAppPanel();
      this.initBottomTabBar();
      this.initPlaqueToggles();

      // 3. Единый модуль паспорта проекта
      this.initPassportTriggers();

      // 4. Подсветка активной страницы
      this.highlightActivePage();

      console.log("[NavigationEngine v7.0 Master] Навигация и единый паспорт музея активны.");
    },

    /**
     * ========================================================================
     * 1. ЕДИНЫЙ ПАСПОРТ ПРОЕКТА (СИНГЛТОН-МОДУЛЬ)
     * ========================================================================
     */
    initPassportTriggers() {
      // Слушаем все возможные кнопки вызова паспорта на любой странице
      document.addEventListener('click', (e) => {
        const target = e.target.closest('#btnOpenPassport, #drawerPassportBtn, [data-open-passport]');
        if (target) {
          e.preventDefault();
          this.openPassportModal();
        }
      });
    },

    /**
     * Создание или получение экземпляра модального окна паспорта
     */
    getOrCreatePassportModal() {
      let modal = document.getElementById('passportModal');
      if (modal) return modal;

      modal = document.createElement('div');
      modal.id = 'passportModal';
      modal.className = 'modal passport-modal-wrapper';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-labelledby', 'passportModalTitle');
      modal.setAttribute('aria-hidden', 'true');

      modal.innerHTML = `
        <div class="modal-overlay" id="passportOverlay"></div>
        <div class="modal-dialog passport-dialog" style="max-width: 780px; position:relative; z-index:2; background:#12151c; border:1px solid rgba(197, 160, 89, 0.35); padding:34px 28px; border-radius:4px; box-shadow:0 20px 50px rgba(0,0,0,0.95);">
          <button class="modal-close" id="passportCloseBtn" type="button" aria-label="Закрыть паспорт">&times;</button>
          
          <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
            <span style="font-size:0.7rem; color:#c5a059; text-transform:uppercase; font-weight:800; letter-spacing:1.5px; border:1px solid rgba(197,160,89,0.3); padding:2px 8px; border-radius:2px;">Официальный документ</span>
            <span style="font-size:0.72rem; color:#9da6b3;">Всероссийская акция «Карта доблести»</span>
          </div>

          <h2 id="passportModalTitle" style="font-family:'Cinzel', Georgia, serif; font-size:1.45rem; color:#ffffff; margin-bottom:18px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:10px;">
            Паспорт виртуального мемориального комплекса
          </h2>

          <div style="overflow-x:auto;">
            <table class="passport-table" style="width:100%; border-collapse:collapse; font-size:0.86rem; color:#d8deea;">
              <tr style="border-bottom:1px solid rgba(255,255,255,0.08);">
                <td style="padding:10px 8px; font-weight:700; color:#c5a059; width:34%;">Наименование проекта:</td>
                <td style="padding:10px 8px; font-weight:600; color:#ffffff;">«Быть воином — жить вечно»</td>
              </tr>
              <tr style="border-bottom:1px solid rgba(255,255,255,0.08);">
                <td style="padding:10px 8px; font-weight:700; color:#c5a059;">Образовательная организация:</td>
                <td style="padding:10px 8px;">ГБПОУ «Ставропольский региональный многопрофильный колледж»</td>
              </tr>
              <tr style="border-bottom:1px solid rgba(255,255,255,0.08);">
                <td style="padding:10px 8px; font-weight:700; color:#c5a059;">Конкурсная номинация:</td>
                <td style="padding:10px 8px;">«За партой героя» (Всероссийская акция «Имя в истории»)</td>
              </tr>
              <tr style="border-bottom:1px solid rgba(255,255,255,0.08);">
                <td style="padding:10px 8px; font-weight:700; color:#c5a059;">Руководитель проекта:</td>
                <td style="padding:10px 8px;"><strong>Е. В. Бледных</strong>, директор ГБПОУ СРМК, кандидат исторических наук</td>
              </tr>
              <tr style="border-bottom:1px solid rgba(255,255,255,0.08);">
                <td style="padding:10px 8px; font-weight:700; color:#c5a059;">Научный куратор:</td>
                <td style="padding:10px 8px;"><strong>А. В. Генте</strong>, преподаватель истории высшей квалификационной категории</td>
              </tr>
              <tr style="border-bottom:1px solid rgba(255,255,255,0.08);">
                <td style="padding:10px 8px; font-weight:700; color:#c5a059;">Инженер-разработчик:</td>
                <td style="padding:10px 8px;"><strong>А. И. Андреев</strong>, студент отделения информационных технологий «ИСиП»</td>
              </tr>
              <tr style="border-bottom:1px solid rgba(255,255,255,0.08);">
                <td style="padding:10px 8px; font-weight:700; color:#c5a059;">Мемориальный фонд:</td>
                <td style="padding:10px 8px;">20 выпускников колледжа — кавалеров Орденов Мужества и государственных наград</td>
              </tr>
              <tr>
                <td style="padding:10px 8px; font-weight:700; color:#c5a059;">Цифровые сервисы:</td>
                <td style="padding:10px 8px; font-size:0.8rem; color:#9da6b3;">
                  2.5D Мемориал Славы • 3D Фолиант-читалка • Электронная Книга Памяти • Квест-викторина • Конструктор «Парта Героя» А4 • Генератор и Реестр верификации сертификатов (SHA-256) • Стена Памяти (Realtime)
                </td>
              </tr>
            </table>
          </div>

          <div style="margin-top:22px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <a href="https://карта-доблести.рф" target="_blank" rel="noopener noreferrer" style="color:#c5a059; font-size:0.8rem; font-weight:700; text-decoration:underline;">
              Портал акции «Карта Доблести РФ» →
            </a>
            <button onclick="NavigationEngine.closePassportModal()" type="button" class="btn-verify btn-verify-secondary" style="padding:8px 20px; font-size:0.82rem;">
              Закрыть окно
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      // Привязка обработчиков закрытия к новому окну
      modal.querySelector('#passportOverlay')?.addEventListener('click', () => this.closePassportModal());
      modal.querySelector('#passportCloseBtn')?.addEventListener('click', () => this.closePassportModal());

      return modal;
    },

    openPassportModal() {
      const modal = this.getOrCreatePassportModal();
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';

      // Слушатель закрытия по Escape
      const escHandler = (e) => {
        if (e.key === 'Escape') {
          this.closePassportModal();
          document.removeEventListener('keydown', escHandler);
        }
      };
      document.addEventListener('keydown', escHandler);
    },

    closePassportModal() {
      const modal = document.getElementById('passportModal');
      if (modal) {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
      }
      document.body.style.overflow = 'auto';
    },

    /**
     * ========================================================================
     * 2. ВЫПАДАЮЩИЙ СПИСОК ЦИФРОВЫХ МОДУЛЕЙ (ДЕСКТОП)
     * ========================================================================
     */
    initStandardHeaderDropdown() {
      const dropdown = document.getElementById('modulesDropdown');
      const toggleBtn = document.getElementById('btnDropdownToggle');
      if (!dropdown || !toggleBtn) return;

      toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const isActive = dropdown.classList.contains('active');
        this.setDropdownState(!isActive);
      });

      dropdown.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', () => this.setDropdownState(false));
      });

      document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target)) {
          this.setDropdownState(false);
        }
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') this.setDropdownState(false);
      });
    },

    setDropdownState(open) {
      const dropdown = document.getElementById('modulesDropdown');
      const toggleBtn = document.getElementById('btnDropdownToggle');
      if (!dropdown || !toggleBtn) return;

      dropdown.classList.toggle('active', open);
      toggleBtn.setAttribute('aria-expanded', String(open));
    },

    /**
     * ========================================================================
     * 3. ВЫДВИЖНОЕ МОБИЛЬНОЕ МЕНЮ (DRAWER)
     * ========================================================================
     */
    initStandardMobileDrawer() {
      const burgerBtn = document.getElementById('mobileBurgerBtn');
      const drawer = document.getElementById('mobileDrawer');
      if (!burgerBtn || !drawer) return;

      burgerBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const isOpen = drawer.classList.contains('active') || drawer.getAttribute('aria-hidden') === 'false';
        this.setDrawerState(!isOpen);
      });

      drawer.querySelectorAll('.drawer-link').forEach(link => {
        link.addEventListener('click', () => this.setDrawerState(false));
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') this.setDrawerState(false);
      });
    },

    setDrawerState(open) {
      const burgerBtn = document.getElementById('mobileBurgerBtn');
      const drawer = document.getElementById('mobileDrawer');
      if (!burgerBtn || !drawer) return;

      drawer.classList.toggle('active', open);
      drawer.setAttribute('aria-hidden', String(!open));
      burgerBtn.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : 'auto';
    },

    /**
     * ========================================================================
     * 4. ВЕРХНЯЯ ШТОРКА МОДУЛЕЙ НА MOBILE.HTML
     * ========================================================================
     */
    initMobileAppPanel() {
      const toggle = document.getElementById('mobileModulesToggle');
      const panel = document.getElementById('mobileModulesPanel');
      if (!toggle || !panel) return;

      toggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const isOpen = panel.classList.contains('active');
        this.setMobilePanelState(!isOpen);
      });

      panel.querySelectorAll('.mobile-module-link').forEach(link => {
        link.addEventListener('click', () => this.setMobilePanelState(false));
      });

      document.addEventListener('click', (e) => {
        if (!panel.contains(e.target) && !toggle.contains(e.target)) {
          this.setMobilePanelState(false);
        }
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') this.setMobilePanelState(false);
      });
    },

    setMobilePanelState(open) {
      const toggle = document.getElementById('mobileModulesToggle');
      const panel = document.getElementById('mobileModulesPanel');
      if (!toggle || !panel) return;

      panel.classList.toggle('active', open);
      panel.setAttribute('aria-hidden', String(!open));
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Закрыть меню модулей' : 'Открыть меню модулей');
      document.body.style.overflow = open ? 'hidden' : 'auto';
    },

    /**
     * ========================================================================
     * 5. НИЖНЯЯ ПАНЕЛЬ НАВИГАЦИИ (BOTTOM APP TAB BAR НА MOBILE.HTML)
     * ========================================================================
     */
    initBottomTabBar() {
      const tabs = document.querySelectorAll('.bottom-app-bar .app-tab');
      if (tabs.length === 0) return;

      tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
          const href = tab.getAttribute('href');
          if (href && href.startsWith('#')) {
            e.preventDefault();
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const targetElement = document.querySelector(href);
            if (targetElement) {
              targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
              history.replaceState(null, '', href);
            }
          }
        });
      });

      if ('IntersectionObserver' in window) {
        const sections = document.querySelectorAll('section[id]');
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const currentId = `#${entry.target.id}`;
              tabs.forEach(tab => {
                if (tab.getAttribute('href') === currentId) {
                  tabs.forEach(t => t.classList.remove('active'));
                  tab.classList.add('active');
                }
              });
            }
          });
        }, { threshold: 0.35 });

        sections.forEach(s => observer.observe(s));
      }
    },

    /**
     * ========================================================================
     * 6. ПЕРЕКЛЮЧЕНИЕ ПЛИТ МЕМОРИАЛА
     * ========================================================================
     */
    initPlaqueToggles() {
      document.querySelectorAll('.plaque-toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.plaque-toggle-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');

          const view = btn.dataset.plaqueView;
          const leftZone = document.getElementById('leftPlaqueZone');
          const rightZone = document.getElementById('rightPlaqueZone');

          if (!leftZone || !rightZone) return;

          if (view === 'left') {
            leftZone.style.display = 'block';
            rightZone.style.display = 'none';
          } else if (view === 'right') {
            leftZone.style.display = 'none';
            rightZone.style.display = 'block';
          } else {
            leftZone.style.display = 'block';
            rightZone.style.display = 'block';
          }
        });
      });
    },

    /**
     * ========================================================================
     * 7. ПОДСВЕТКА ТЕКУЩЕЙ СТРАНИЦЫ В МЕНЮ
     * ========================================================================
     */
    highlightActivePage() {
      const currentPath = window.location.pathname.split('/').pop() || 'index.html';

      document.querySelectorAll('.site-header .dropdown-item').forEach(item => {
        const href = item.getAttribute('href');
        if (href && href.includes(currentPath)) {
          item.classList.add('active');
        }
      });

      document.querySelectorAll('.drawer-link').forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.includes(currentPath)) {
          link.classList.add('highlight');
        }
      });
    }
  };

  window.NavigationEngine = NavigationEngine;
  document.addEventListener('DOMContentLoaded', () => NavigationEngine.init());
})();