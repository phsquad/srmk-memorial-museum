/**
 * Core Module - Общие утилиты и функции для всего приложения
 * Устраняет дублирование кода между страницами
 */

// === Константы ===
export const CONFIG = {
    API_BASE_URL: 'https://your-project.supabase.co/rest/v1',
    API_KEY: 'your-anon-key', // Заменить на переменную окружения в продакшене
    STORAGE_KEYS: {
        USER: 'memorial_user',
        THEME: 'memorial_theme',
        CACHE_PREFIX: 'memorial_cache_'
    },
    MAX_UPLOAD_SIZE: 5 * 1024 * 1024, // 5MB
    DATE_FORMAT: {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }
};

// === Утилиты дат ===
export function formatDate(dateString, options = {}) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        const finalOptions = { ...CONFIG.DATE_FORMAT, ...options };
        return new Intl.DateTimeFormat('ru-RU', finalOptions).format(date);
    } catch (e) {
        console.error('Ошибка форматирования даты:', e);
        return dateString;
    }
}

export function getRelativeTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'только что';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} мин. назад`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ч. назад`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} дн. назад`;
    
    return formatDate(dateString);
}

// === Верификация и безопасность ===
export function verifyCertificate(certificateData, signature) {
    if (!certificateData || !signature) {
        return { valid: false, error: 'Отсутствуют данные сертификата или подпись' };
    }

    try {
        // Эмуляция проверки подписи (в реальном проекте использовать crypto.subtle)
        // Здесь проверяется структура данных
        const requiredFields = ['id', 'issuedTo', 'issuedAt', 'memoryId'];
        const hasAllFields = requiredFields.every(field => field in certificateData);
        
        if (!hasAllFields) {
            return { valid: false, error: 'Неверная структура сертификата' };
        }

        // Простая проверка целостности (хэш)
        const dataString = JSON.stringify(certificateData);
        // В реальности здесь должна быть криптографическая проверка подписи
        const isValidSignature = signature.length > 10; 
        
        if (!isValidSignature) {
            return { valid: false, error: 'Неверная подпись' };
        }

        return { valid: true, data: certificateData };
    } catch (error) {
        console.error('Ошибка верификации:', error);
        return { valid: false, error: 'Внутренняя ошибка верификации' };
    }
}

export function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}

// === Работа с хранилищем ===
export const Storage = {
    get(key) {
        try {
            const item = localStorage.getItem(CONFIG.STORAGE_KEYS[key] || key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.error('Ошибка чтения из хранилища:', e);
            return null;
        }
    },
    
    set(key, value) {
        try {
            const fullKey = CONFIG.STORAGE_KEYS[key] || key;
            localStorage.setItem(fullKey, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Ошибка записи в хранилище:', e);
            return false;
        }
    },
    
    remove(key) {
        try {
            const fullKey = CONFIG.STORAGE_KEYS[key] || key;
            localStorage.removeItem(fullKey);
            return true;
        } catch (e) {
            console.error('Ошибка удаления из хранилища:', e);
            return false;
        }
    }
};

// === Ленивая загрузка модулей ===
export async function loadModule(moduleName) {
    try {
        switch(moduleName) {
            case 'quiz':
                return await import('./quiz.js');
            case 'reader':
                return await import('./reader.js');
            case 'guestbook':
                return await import('./guestbook.js');
            case 'admin':
                return await import('./admin.js');
            default:
                throw new Error(`Модуль ${moduleName} не найден`);
        }
    } catch (error) {
        console.error(`Ошибка загрузки модуля ${moduleName}:`, error);
        throw error;
    }
}

// === Глобальная регистрация (для обратной совместимости) ===
if (typeof window !== 'undefined') {
    window.CoreUtils = {
        formatDate,
        getRelativeTime,
        verifyCertificate,
        sanitizeInput,
        Storage,
        CONFIG
    };
}
