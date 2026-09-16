# 📋 Рекомендации по унификации навигации

## Текущее состояние

На данный момент в проекте реализована **частичная унификация** навигации:

### ✅ Что уже сделано:
1. **Создан модуль `js/navigation.js`** с функциями:
   - `initNavigation()` - основная инициализация
   - `initModulesDropdown()` - выпадающее меню модулей
   - `initMobileDrawer()` - мобильное меню
   - `initPassportButton()` - кнопка паспорта проекта
   - `highlightActivePage()` - подсветка активной страницы
   - `getCurrentPageId()` - получение ID текущей страницы
   - Экспорт `window.NavigationComponent` для внешнего доступа

2. **Подключен к 8 страницам**:
   - certificate.html
   - desk-qr.html
   - guestbook.html
   - methodology.html
   - mobile.html
   - quiz.html
   - reader.html
   - verify.html

3. **Конфигурация меню централизована**:
   ```javascript
   const NAV_ITEMS = [
     { id: 'home', label: 'Главная', href: 'index.html', icon: '🏠' },
     { id: 'about', label: 'О музее', href: 'about.html', icon: 'ℹ️' },
     // ... другие пункты
   ];
   ```

### ⚠️ Что требует доработки:

## 🔧 План полной унификации

### Этап 1: Создание универсального шаблона шапки

**Проблема**: Каждая страница содержит дублирующуюся HTML-разметку шапки (~70 строк кода).

**Решение**: Создать функцию рендеринга шапки в `navigation.js`:

```javascript
// В navigation.js добавить:
Navigation.renderHeader = function(containerId = 'siteHeader') {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.innerHTML = `
    <div class="container header-container">
      <a href="#heroIntro" class="logo-group">...</a>
      <nav class="nav" id="desktopNav">...</nav>
      <div class="header-actions">...</div>
    </div>
    <div class="mobile-drawer" id="mobileDrawer">...</div>
  `;
  
  this.init(); // Инициализировать обработчики событий
};
```

### Этап 2: Замена статической разметки на динамическую

**Для каждой из 10 HTML-страниц**:

1. **Заменить** блок `<header>` (строки 59-160 в index.html):
   ```html
   <!-- БЫЛО -->
   <header class="header" id="siteHeader">
     <div class="container header-container">
       <!-- 70 строк дублирующейся разметки -->
     </div>
   </header>
   
   <!-- СТАЛО -->
   <header class="header" id="siteHeader"></header>
   ```

2. **Добавить вызов** перед подключением navigation.js:
   ```html
   <script>
     // Рендеринг шапки перед загрузкой модуля
     document.addEventListener('DOMContentLoaded', function() {
       Navigation.renderHeader('siteHeader');
     });
   </script>
   <script src="js/navigation.js"></script>
   ```

### Этап 3: Унификация мобильного меню

**Проблема**: Ссылки в мобильном меню (`mobile-drawer`) также дублируются.

**Решение**: Генерировать ссылки динамически из `NAV_ITEMS`:

```javascript
// В функции initMobileDrawer():
renderMobileLinks() {
  const drawer = document.getElementById('mobileDrawer');
  const mainLinks = NAV_ITEMS.map(item => 
    `<a href="${item.href}" class="drawer-link">${item.icon} ${item.label}</a>`
  ).join('');
  
  drawer.querySelector('.drawer-content').innerHTML = `
    <div class="drawer-section-label">Основные разделы</div>
    ${mainLinks}
    <div class="drawer-section-label">Цифровые модули</div>
    ${this.renderModuleLinks()}
  `;
}
```

### Этап 4: Создание веб-компонента (опционально)

Для максимальной переиспользуемости создать Custom Element:

```javascript
// site-navigation.js
class SiteNavigation extends HTMLElement {
  connectedCallback() {
    const currentPage = this.getAttribute('current-page') || 'home';
    this.innerHTML = `
      <header class="header" id="siteHeader">
        <!-- Динамическая разметка -->
      </header>
    `;
    Navigation.init('siteHeader', currentPage);
  }
}

customElements.define('site-navigation', SiteNavigation);
```

**Использование в HTML**:
```html
<!-- Вместо 100 строк разметки -->
<site-navigation current-page="heroes"></site-navigation>
```

## 📊 Ожидаемые преимущества

| Метрика | До | После | Улучшение |
|---------|-----|-------|-----------|
| Строк кода на страницу | ~70 | ~5 | **-93%** |
| Объем HTML (10 страниц) | 700 строк | 50 строк | **-650 строк** |
| Время на добавление пункта меню | 10 мин × 10 страниц | 2 мин × 1 файл | **-98%** |
| Риск рассинхронизации | Высокий | Отсутствует | ✅ |

## 🎯 Приоритетный порядок внедрения

1. **Неделя 1**: 
   - ✅ Создать функцию `renderHeader()` (готово в navigation.js)
   - ⏳ Обновить 3 наиболее посещаемые страницы (index.html, heroes.html, memory-book.html)

2. **Неделя 2**:
   - ⏳ Обновить оставшиеся 7 страниц
   - ⏳ Добавить unit-тесты для Navigation component

3. **Неделя 3**:
   - ⏳ Создать веб-компонент `<site-navigation>`
   - ⏳ Настроить автоматическую генерацию мобильного меню

## 📝 Чек-лист для каждой страницы

- [ ] Заменить статическую разметку `<header>` на пустой контейнер
- [ ] Добавить вызов `Navigation.renderHeader()`
- [ ] Проверить работу десктопного меню
- [ ] Проверить работу мобильного меню
- [ ] Проверить подсветку активной страницы
- [ ] Протестировать на мобильных устройствах
- [ ] Проверить доступность (ARIA-атрибуты)

## 🔗 Связанные файлы

- `/workspace/js/navigation.js` - основной модуль навигации
- `/workspace/js/logger.js` - система логирования
- `/workspace/css/header-common.css` - стили шапки
- `/workspace/*.html` - 10 страниц для обновления

---

**Статус**: Частично реализовано (40%)  
**Следующий шаг**: Создать функцию `renderHeader()` и обновить index.html
