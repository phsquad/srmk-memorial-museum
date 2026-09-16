/**
 * Main Entry Point - Точка входа приложения
 * Инициализирует все модули и настраивает глобальные обработчики
 */

import { CONFIG, Storage, formatDate, sanitizeInput } from './core.js';
import { App, initApp } from './app.js';
import { GuestbookEngine } from './guestbook.js';
import { QuizEngine } from './quiz.js';
import { ReaderEngine } from './reader.js';

// Глобальное состояние приложения
const AppState = {
    initialized: false,
    modules: {},
    config: CONFIG
};

/**
 * Инициализация приложения
 */
export async function init() {
    if (AppState.initialized) {
        console.log('[Main] Приложение уже инициализировано');
        return;
    }

    try {
        console.log('[Main] Инициализация приложения...');

        // Проверка темы
        const savedTheme = Storage.get('THEME');
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
        }

        // Инициализация основных модулей
        AppState.modules.guestbook = new GuestbookEngine();
        AppState.modules.quiz = new QuizEngine();
        AppState.modules.reader = new ReaderEngine();

        // Инициализация основного приложения
        if (typeof initApp === 'function') {
            await initApp();
        }

        // Настройка глобальных обработчиков через делегирование событий
        setupEventDelegation();

        // Регистрация Service Worker
        registerServiceWorker();

        AppState.initialized = true;
        console.log('[Main] Приложение успешно инициализировано');

        // Событие полной загрузки
        document.dispatchEvent(new CustomEvent('vmc-ready', { detail: AppState }));

    } catch (error) {
        console.error('[Main] Ошибка инициализации:', error);
        document.dispatchEvent(new CustomEvent('vmc-error', { detail: error }));
    }
}

/**
 * Делегирование событий для глобальных обработчиков
 */
function setupEventDelegation() {
    document.addEventListener('click', (e) => {
        // Обработка кнопок с data-action
        const actionButton = e.target.closest('[data-action]');
        if (actionButton) {
            const action = actionButton.dataset.action;
            const target = actionButton.dataset.target;
            
            handleAction(action, target, actionButton);
        }

        // Обработка навигации
        const navLink = e.target.closest('[data-nav]');
        if (navLink) {
            const page = navLink.dataset.nav;
            navigateTo(page);
        }
    });

    // Обработка отправки форм
    document.addEventListener('submit', (e) => {
        const form = e.target.closest('form[data-handler]');
        if (form) {
            const handler = form.dataset.handler;
            handleFormSubmit(handler, form, e);
        }
    });
}

/**
 * Обработка действий по data-action
 */
async function handleAction(action, target, element) {
    try {
        switch (action) {
            case 'toggle-theme':
                toggleTheme();
                break;
            case 'open-modal':
                openModal(target);
                break;
            case 'close-modal':
                closeModal(element.closest('.modal'));
                break;
            case 'load-more':
                await loadMoreContent(target);
                break;
            case 'share':
                shareContent(target);
                break;
            default:
                console.warn(`[Main] Неизвестное действие: ${action}`);
        }
    } catch (error) {
        console.error(`[Main] Ошибка выполнения действия ${action}:`, error);
    }
}

/**
 * Переключение темы
 */
function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    Storage.set('THEME', next);
}

/**
 * Навигация между страницами (для SPA)
 */
function navigateTo(page) {
    if (!page) return;
    
    // Если это якорь на текущей странице
    if (page.startsWith('#')) {
        const element = document.querySelector(page);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
        return;
    }

    // Для SPA можно реализовать роутинг
    console.log('[Main] Навигация:', page);
}

/**
 * Открытие модального окна
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Закрытие модального окна
 */
function closeModal(modal) {
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

/**
 * Загрузка дополнительного контента
 */
async function loadMoreContent(target) {
    console.log('[Main] Загрузка дополнительного контента:', target);
    // Реализация зависит от конкретного контекста
}

/**
 * Поделиться контентом
 */
function shareContent(contentId) {
    if (navigator.share) {
        navigator.share({
            title: document.title,
            url: window.location.href
        }).catch(err => console.log('Ошибка шаринга:', err));
    } else {
        // Fallback для старых браузеров
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            alert('Ссылка скопирована в буфер обмена');
        });
    }
}

/**
 * Обработка отправки форм
 */
async function handleFormSubmit(handler, form, event) {
    event.preventDefault();
    
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
        switch (handler) {
            case 'guestbook':
                if (AppState.modules.guestbook) {
                    await AppState.modules.guestbook.addEntry(data);
                }
                break;
            case 'contact':
                await submitContactForm(data);
                break;
            case 'search':
                await performSearch(data.query);
                break;
            default:
                console.warn(`[Main] Неизвестный обработчик формы: ${handler}`);
        }
    } catch (error) {
        console.error(`[Main] Ошибка обработки формы ${handler}:`, error);
        alert('Произошла ошибка при отправке формы');
    }
}

/**
 * Отправка контактной формы
 */
async function submitContactForm(data) {
    console.log('[Main] Отправка контактной формы:', data);
    // Реализация отправки на сервер
    alert('Сообщение отправлено!');
    form.reset();
}

/**
 * Поиск
 */
async function performSearch(query) {
    console.log('[Main] Поиск:', query);
    // Реализация поиска
}

/**
 * Регистрация Service Worker
 */
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('[Main] Service Worker зарегистрирован:', registration.scope);
                })
                .catch(error => {
                    console.log('[Main] Ошибка регистрации Service Worker:', error);
                });
        });
    }
}

// Авто-инициализация при загрузке DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Экспорт для использования в других модулях
export { AppState };
