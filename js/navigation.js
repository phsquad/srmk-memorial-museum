/**
 * ============================================================================
 * НАВИГАЦИОННЫЙ ДВИЖОК СКВОЗНОЙ ШАПКИ: js/navigation.js (v5.0 Master)
 * ============================================================================
 */

(function() {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
  });

  function initNavigation() {
    initModulesDropdown();
    initMobileDrawer();
    initPassportModal();
    highlightActivePage();
  }

  /**
   * 1. Выпадающее меню модулей
   */
  function initModulesDropdown() {
    const dropdown = document.getElementById('modulesDropdown');
    const toggleBtn = document.getElementById('btnDropdownToggle');
    if (!dropdown || !toggleBtn) return;

    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isActive = dropdown.classList.contains('active');
      setDropdownState(!isActive);
    });

    dropdown.querySelectorAll('.dropdown-item').forEach(item => {
      item.addEventListener('click', () => setDropdownState(false));
    });

    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target)) setDropdownState(false);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setDropdownState(false);
    });

    function setDropdownState(open) {
      dropdown.classList.toggle('active', open);
      toggleBtn.setAttribute('aria-expanded', String(open));
    }
  }

  /**
   * 2. Выдвижное мобильное меню (Drawer)
   */
  function initMobileDrawer() {
    const burgerBtn = document.getElementById('mobileBurgerBtn');
    const drawer = document.getElementById('mobileDrawer');
    if (!burgerBtn || !drawer) return;

    burgerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = drawer.classList.contains('active') || drawer.getAttribute('aria-hidden') === 'false';
      setDrawerState(!isOpen);
    });

    drawer.querySelectorAll('.drawer-link').forEach(link => {
      link.addEventListener('click', () => setDrawerState(false));
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setDrawerState(false);
    });

    function setDrawerState(open) {
      drawer.classList.toggle('active', open);
      drawer.setAttribute('aria-hidden', String(!open));
      burgerBtn.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : 'auto';
    }
  }

  /**
   * 3. Паспорт проекта
   */
  function initPassportModal() {
    const passportButtons = [
      document.getElementById('btnOpenPassport'),
      document.getElementById('drawerPassportBtn')
    ].filter(Boolean);

    passportButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openPassportModal();
      });
    });
  }

  function openPassportModal() {
    let modal = document.getElementById('passportModal');
    
    // Если на странице нет разметки паспорта — создаем каноническое модальное окно
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'passportModal';
      modal.className = 'modal active';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.innerHTML = `
        <div class="modal-overlay" onclick="document.getElementById('passportModal').remove(); document.body.style.overflow='auto';"></div>
        <div class="modal-dialog" style="max-width: 760px; position:relative; z-index:2; background:#12151c; border:1px solid rgba(197, 160, 89, 0.35); padding:32px; border-radius:4px; box-shadow:0 16px 45px rgba(0,0,0,0.9);">
          <button class="modal-close" onclick="document.getElementById('passportModal').remove(); document.body.style.overflow='auto';" type="button" style="position:absolute; top:16px; right:20px; background:none; border:none; color:#9da6b3; font-size:2rem; cursor:pointer;" aria-label="Закрыть">&times;</button>
          <h2 style="font-family:'Cinzel', serif; color:#c5a059; margin-bottom:16px;">Паспорт виртуального музея</h2>
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
  }

  /**
   * 4. Подсветка активной страницы
   */
  function highlightActivePage() {
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
})();