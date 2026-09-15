# 🏛 Единая система навигации сайта ГБПОУ СРМК

## 📋 Обзор структуры

Этот документ описывает единую систему навигации и связей между всеми компонентами сайта виртуального музея «Быть воином — жить вечно».

---

## 🗂 Структура файлов сайта

### HTML страницы (10 файлов)
```
├── index.html              — Главная страница (3D-музей)
├── mobile.html             — Мобильная версия
├── memory-book.html        — Электронная Книга Памяти
├── reader.html             — 3D Фолиант-читалка
├── quiz.html               — Квест-викторина
├── desk-qr.html            — Конструктор «Парта Героя»
├── guestbook.html          — Стена Памяти
├── certificate.html        — Генератор сертификатов
├── methodology.html        — Методический кабинет
└── verify.html             — Реестр верификации
```

### CSS стили (15 файлов)
```
css/
├── site-common.css         — Базовые общие стили
├── header-common.css       — ЕДИНАЯ ШАПКА (новый файл)
├── desktop.css             — Стили для десктопной версии
├── mobile.css              — Стили для мобильной версии
├── memory-book.css         — Стили Книги Памяти
├── mobile-memory-book.css  — Мобильные стили Книги Памяти
├── reader.css              — Стили 3D Фолианта
├── mobile-reader.css       — Мобильные стили Фолианта
├── quiz.css                — Стили викторины
├── mobile-quiz.css         — Мобильные стили викторины
├── desk-qr.css             — Стили конструктора парт
├── mobile-desk-qr.css      — Мобильные стили конструктора
├── guestbook.css           — Стили Стены Памяти
├── mobile-guestbook.css    — Мобильные стили Стены Памяти
├── methodology.css         — Стили методкабинета
├── mobile-methodology.css  — Мобильные стили методкабинета
├── certificate.css         — Стили сертификатов
├── mobile-certificate.css  — Мобильные стили сертификатов
└── verify.css              — Стили реестра верификации
```

### JavaScript модули (16 файлов)
```
js/
├── navigation.js           — ЕДИНЫЙ НАВИАЦИОННЫЙ МЕНЕДЖЕР (новый файл)
├── data.js                 — База данных героев
├── sources.js              — Источники и архивы
├── app.js                  — Основное приложение
├── tech-modules.js         — Технические модули
├── cloud-sync.js           — Синхронизация с облаком
├── tts-narrator.js         — Текстово-речевой синтез
├── anti-cheat-tribute.js   — Защита от копирования
├── heraldry-resolver.js    — Геральдический модуль
├── memory-book.js          — Логика Книги Памяти
├── reader.js               — Логика 3D Фолианта
├── quiz.js                 — Логика викторины
├── desk-qr.js              — Логика конструктора парт
├── guestbook.js            — Логика Стены Памяти
├── certificate-verifier.js — Верификация сертификатов
├── methodology.js          — Логика методкабинета
├── admin.js                — Административная панель
└── grand-memory-book-part-{1,2,3}.js — Части большой Книги Памяти
```

### Включенные компоненты
```
includes/
└── header.html             — ЕДИНАЯ ШАПКА (HTML-шаблон)
```

---

## 🔗 Карта навигации между страницами

### Главная страница (index.html)
**Ссылается на:**
- `memory-book.html` — Книга Памяти
- `reader.html` — 3D Фолиант
- `quiz.html` — Викторина
- `methodology.html` — Методкабинет
- `verify.html` — Реестр верификации
- `desk-qr.html` — Парта Героя
- `guestbook.html` — Стена Памяти
- `certificate.html` — Сертификаты
- `mobile.html` — Мобильная версия (автопереход для мобильных устройств)

**Подключает:**
- CSS: `site-common.css`, `desktop.css`
- JS: `data.js`, `sources.js`, `cloud-sync.js`, `tts-narrator.js`, `anti-cheat-tribute.js`, `heraldry-resolver.js`, `tech-modules.js`, `app.js`, `admin.js`

---

### Книга Памяти (memory-book.html)
**Ссылается на:**
- `index.html` ← На главную
- `reader.html` — 3D Фолиант
- `quiz.html` — Викторина
- `desk-qr.html` — Парта Героя
- `guestbook.html` — Стена Памяти
- `certificate.html` — Сертификаты
- `methodology.html` — Методкабинет

**Подключает:**
- CSS: `site-common.css`, `memory-book.css`, `mobile-memory-book.css`
- JS: `data.js`, `grand-memory-book-part-{1,2,3}.js`, `cloud-sync.js`, `memory-book.js`

---

### 3D Фолиант (reader.html)
**Ссылается на:**
- `index.html` ← На главную
- `memory-book.html` — Книга Памяти
- `quiz.html` — Викторина
- `desk-qr.html` — Парта Героя
- `guestbook.html` — Стена Памяти
- `certificate.html` — Сертификаты
- `methodology.html` — Методкабинет

**Подключает:**
- CSS: `site-common.css`, `reader.css`, `mobile-reader.css`
- JS: `data.js`, `grand-memory-book-part-{1,2,3}.js`, `sources.js`, `tts-narrator.js`, `anti-cheat-tribute.js`, `heraldry-resolver.js`, `tech-modules.js`, `cloud-sync.js`, `reader.js`

---

### Квест-викторина (quiz.html)
**Ссылается на:**
- `index.html` ← На главную
- `memory-book.html` — Книга Памяти

**Подключает:**
- CSS: `site-common.css`
- JS: (встроенный в файл)

---

### Методический кабинет (methodology.html)
**Ссылается на:**
- `index.html` ← На главную
- `memory-book.html` — Книга Памяти
- `reader.html` — 3D Фолиант
- `quiz.html` — Викторина
- `desk-qr.html` — Парта Героя
- `guestbook.html` — Стена Памяти
- `certificate.html` — Сертификаты
- `verify.html` — Реестр верификации

**Подключает:**
- CSS: `methodology.css`, `mobile-methodology.css`
- JS: `anti-copy-master.js`, `methodology.js`

---

### Реестр верификации (verify.html)
**Ссылается на:**
- `index.html` ← На главную
- `memory-book.html` — Книга Памяти
- `reader.html` — 3D Фолиант
- `quiz.html` — Викторина
- `desk-qr.html` — Парта Героя
- `guestbook.html` — Стена Памяти
- `certificate.html` — Генератор сертификатов

**Подключает:**
- CSS: `site-common.css`, `mobile-verify.css`
- JS: `data.js`, `cloud-sync.js`, `certificate-verifier.js`

---

### Конструктор «Парта Героя» (desk-qr.html)
**Ссылается на:**
- `index.html` ← На главную
- `memory-book.html` — Книга Памяти
- `reader.html` — 3D Фолиант
- `quiz.html` — Викторина
- `certificate.html` — Сертификаты
- `methodology.html` — Методкабинет
- `verify.html` — Реестр верификации
- `guestbook.html` — Стена Памяти

**Подключает:**
- CSS: `site-common.css`, `desk-qr.css`, `mobile-desk-qr.css`
- JS: `data.js`, `sources.js`, `tts-narrator.js`, `cloud-sync.js`, `desk-qr.js`

---

### Стена Памяти (guestbook.html)
**Ссылается на:**
- `index.html` ← На главную
- `memory-book.html` — Книга Памяти
- `reader.html` — 3D Фолиант
- `quiz.html` — Викторина
- `desk-qr.html` — Парта Героя
- `certificate.html` — Сертификаты
- `verify.html` — Реестр верификации
- `methodology.html` — Методкабинет

**Подключает:**
- CSS: `site-common.css`, `guestbook.css`, `mobile-guestbook.css`
- JS: `data.js`, `cloud-sync.js`, `guestbook.js`

---

### Генератор сертификатов (certificate.html)
**Ссылается на:**
- `index.html` ← На главную
- `reader.html` — 3D Фолиант
- `quiz.html` — Викторина
- `desk-qr.html` — Парта Героя
- `guestbook.html` — Стена Памяти
- `memory-book.html` — Книга Памяти

**Подключает:**
- CSS: `site-common.css`, `mobile-certificate.css`
- JS: `cloud-sync.js`, `certificate-verifier.js`

---

### Мобильная версия (mobile.html)
**Ссылается на:**
- `memory-book.html` — Книга Памяти
- `reader.html` — 3D Фолиант
- `quiz.html` — Викторина
- `methodology.html` — Методкабинет
- `certificate.html` — Сертификаты
- `verify.html` — Реестр верификации
- `desk-qr.html` — Парта Героя
- `guestbook.html` — Стена Памяти

**Подключает:**
- CSS: `site-common.css`, `mobile.css`
- JS: `data.js`, `sources.js`, `tts-narrator.js`, `anti-cheat-tribute.js`, `heraldry-resolver.js`, `cloud-sync.js`, `app.js`, `tech-modules.js`

---

## 🎯 Как использовать единую шапку

### Вариант 1: Подключение через PHP (рекомендуется для сервера с PHP)

```php
<?php include 'includes/header.html'; ?>
```

### Вариант 2: Подключение через JavaScript (для статического сайта)

```html
<div id="common-header-container"></div>
<script>
fetch('includes/header.html')
  .then(response => response.text())
  .then(data => {
    document.getElementById('common-header-container').innerHTML = data;
  });
</script>
```

### Вариант 3: Ручное копирование (простой вариант)

Скопируйте содержимое `includes/header.html` в каждую страницу между `<body>` и основным контентом.

---

## 📦 Подключение единых стилей

Во всех HTML-файлах добавьте в `<head>` после других CSS:

```html
<!-- Единая шапка сайта -->
<link rel="stylesheet" href="css/header-common.css">
```

---

## 🔧 Подключение навигационного менеджера

Во всех HTML-файлах добавьте перед закрывающим тегом `</body>`:

```html
<!-- Единый навигационный менеджер -->
<script src="js/navigation.js"></script>
```

---

## ✅ Чеклист проверки ссылок

Все ссылки в навигации ведут на существующие файлы:

- [x] `index.html` ✓
- [x] `mobile.html` ✓
- [x] `memory-book.html` ✓
- [x] `reader.html` ✓
- [x] `quiz.html` ✓
- [x] `desk-qr.html` ✓
- [x] `guestbook.html` ✓
- [x] `certificate.html` ✓
- [x] `methodology.html` ✓
- [x] `verify.html` ✓

---

## 🎨 Цветовая схема навигации

```css
--accent-brass: #c5a059;     /* Золотой акцент */
--accent-granite: #8a1c22;   /* Гранитовый красный */
--text-primary: #f1f3f7;     /* Основной текст */
--text-secondary: #9da6b3;   /* Вторичный текст */
--bg-main: #0a0c0f;          /* Основной фон */
```

---

## 📱 Адаптивность

Навигация автоматически адаптируется под устройства:

- **Desktop (>1024px)**: Полное меню с ссылками
- **Tablet (768-1024px)**: Скрытое меню + кнопка бургера
- **Mobile (<768px)**: Только логотип + кнопка бургера

---

## 🚀 Быстрый старт

1. Скопируйте `includes/header.html` на свой сервер
2. Добавьте `css/header-common.css` в папку css/
3. Добавьте `js/navigation.js` в папку js/
4. Подключите файлы в ваши HTML-страницы
5. Наслаждайтесь единой навигацией!

---

**Версия документации:** 1.0  
**Дата обновления:** 2026  
**Статус:** Готово к использованию
