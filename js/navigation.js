/**
 * ============================================================================
 * УНИВЕРСАЛЬНЫЙ НАВИГАЦИОННЫЙ ДВИЖОК: js/navigation.js (v6.0 Universal Master)
 * Мемориально-образовательный комплекс ГБПОУ СРМК «Быть воином — жить вечно»
 * 
 * Обслуживает:
 * 1. Сквозную десктопную шапку сайта (.site-header, дропдаун модулей, бургер)
 * 2. Мобильное приложение (mobile.html: мобильная панель, Bottom Tab Bar, скролл-трекинг)
 * 3. Модальное окно паспорта проекта (десктоп + мобильный)
 * 4. Автоматическую подсветку активного раздела в меню
 * ============================================================================
 */

(function() {
  'use strict';

  const NavigationEngine = {
    init() {
      // 1. Инициализация стандартной шапки сайта
      this.initStandardHeaderDropdown();
      this.initStandardMobileDrawer();

      // 2. Инициализация мобильного приложения (mobile.html)
      this.initMobileAppPanel();
      this.initBottomTabBar();
      this.initPlaqueToggles();

      // 3. Общие сервисы
      this.initPassportModal();
      this.highlightActivePage();

      console.log("[NavigationEngine v6.0] Навигационный диспетчер активен.");
    },

    /**
     * 1. ВЫПАДАЮЩИЙ СПИСОК ЦИФРОВЫХ МОДУЛЕЙ (ДЕСКТОП)
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
     * 2. ВЫДВИЖНОЕ МОБИЛЬНОЕ МЕНЮ ДЛЯ ОБЫЧНЫХ СТРАНИЦ (DRAWER)
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
     * 3. ВЕРХНЯЯ ШТОРКА МОДУЛЕЙ НА MOBILE.HTML
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
     * 4. НИЖНЯЯ ПАНЕЛЬ НАВИГАЦИИ (BOTTOM APP TAB BAR НА MOBILE.HTML)
     */
    initBottomTabBar() {
      const tabs = document.querySelectorAll('.bottom-app-bar .app-tab');
      if (tabs.length === 0) return;

      tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
          const href = tab.getAttribute('href');
          // Если это внутренняя якорная ссылка текущей страницы (#memorial и т.д.)
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

      // Автоматическое обновление активной вкладки при скролле страницы
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
     * 5. ПЕРЕКЛЮЧЕНИЕ ПЛИТ МЕМОРИАЛА (ЛЕВАЯ / ПРАВАЯ / ВСЕ)
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
     * 6. МОДАЛЬНОЕ ОКНО «ПАСПОРТ ПРОЕКТА»
     */
    initPassportModal() {
      const passportButtons = [
        document.getElementById('btnOpenPassport'),
        document.getElementById('drawerPassportBtn')
      ].filter(Boolean);

      passportButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          this.openPassportModal();
        });
      });

      // Поддержка закрытия существующего модального окна в DOM
      document.getElementById('passportModalCloseBtn')?.addEventListener('click', () => this.closePassportModal());
      document.getElementById('passportModalOverlay')?.addEventListener('click', () => this.closePassportModal());
    },

    openPassportModal() {
      let modal = document.getElementById('passportModal');
      
      // Если окна нет в разметке страницы — создаем канонический диалог
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'passportModal';
        modal.className = 'modal active';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.innerHTML = `
          <div class="modal-overlay" onclick="NavigationEngine.closePassportModal()"></div>
          <div class="modal-dialog" style="max-width: 760px; position:relative; z-index:2; background:#12151c; border:1px solid rgba(197, 160, 89, 0.35); padding:32px; border-radius:4px; box-shadow:0 16px 45px rgba(0,0,0,0.9);">
            <button class="modal-close" onclick="NavigationEngine.closePassportModal()" type="button" style="position:absolute; top:16px; right:20px; background:none; border:none; color:#9da6b3; font-size:2rem; cursor:pointer;" aria-label="Закрыть">&times;</button>
            <h2 style="font-family:'Cinzel', Georgia, serif; color:#c5a059; margin-bottom:16px;">Паспорт виртуального музея</h2>
            <table style="width:100%; border-collapse:collapse; font-size:0.88rem; color:#d8deea;">
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.08);"><td style="padding:10px 8px; font-weight:bold; color:#c5a059; width:35%;">Проект:</td><td style="padding:10px 8px;">«Быть воином — жить вечно»</td></tr>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.08);"><td style="padding:10px 8px; font-weight:bold; color:#c5a059;">Организация:</td><td style="padding:10px 8px;">ГБПОУ «Ставропольский региональный многопрофильный колледж»</td></tr>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.08);"><td style="padding:10px 8px; font-weight:bold; color:#c5a059;">Номинация:</td><td style="padding:10px 8px;">«За партой героя» (Всероссийская акция «Карта доблести»)</td></tr>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.08);"><td style="padding:10px 8px; font-weight:bold; color:#c5a059;">Руководитель:</td><td style="padding:10px 8px;">Е. В. Бледных, директор ГБПОУ СРМК, канд. ист. наук</td></tr>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.08);"><td style="padding:10px 8px; font-weight:bold; color:#c5a059;">Куратор:</td><td style="padding:10px 8px;">А. В. Генте, преподаватель истории высшей кат.</td></tr>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.08);"><td style="padding:10px 8px; font-weight:bold; color:#c5a059;">Разработчик:</td><td style="padding:10px 8px;">А. И. Андреев, студент 2 курса «ИСиП»</td></tr>
              <tr><td style="padding:10px 8px; font-weight:bold; color:#c5a059;">Фонд памяти:</td><td style="padding:10px 8px;">20 выпускников колледжа, увековеченных на Мемориале Славы</td></tr>
            </table>
          </div>
        `;
        document.body.appendChild(modal);
      } else {
        modal.classList.add('active');
      }
      document.body.style.overflow = 'hidden';
    },

    closePassportModal() {
      const modal = document.getElementById('passportModal');
      if (modal) {
        modal.classList.remove('active');
        // Если окно было создано динамически
        if (!document.getElementById('passportModalCloseBtn')) {
          modal.remove();
        }
      }
      document.body.style.overflow = 'auto';
    },

    /**
     * 7. ПОДСВЕТКА ТЕКУЩЕЙ СТРАНИЦЫ
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