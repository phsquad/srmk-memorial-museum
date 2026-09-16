/**
 * Logger - Обертка для управления логированием
 * Позволяет включать/отключать логи в продакшене через настройку уровня
 */

const LogLevel = {
  NONE: 0,
  ERROR: 1,
  WARN: 2,
  INFO: 3,
  DEBUG: 4,
};

class Logger {
  /**
   * @param {number} level - Текущий уровень логирования (по умолчанию INFO)
   */
  constructor(level = LogLevel.INFO) {
    this.level = level;
    this.prefix = '[App]';
    
    // Проверяем, запущен ли код в продакшене
    if (this.isProduction()) {
      this.level = LogLevel.WARN; // В продакшене показываем только ошибки и предупреждения
    }
  }

  /**
   * Определяет, работает ли приложение в продакшене
   * @returns {boolean}
   */
  isProduction() {
    return (
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1' &&
      !window.location.hostname.includes('.local')
    );
  }

  /**
   * Устанавливает уровень логирования
   * @param {number} level - Уровень из LogLevel
   */
  setLevel(level) {
    this.level = level;
    this.debug(`Уровень логирования установлен: ${this.getLevelName(level)}`);
  }

  /**
   * Получает название уровня
   * @param {number} level 
   * @returns {string}
   */
  getLevelName(level) {
    return Object.keys(LogLevel).find(key => LogLevel[key] === level) || 'UNKNOWN';
  }

  /**
   * Внутренний метод для проверки уровня
   * @param {number} msgLevel 
   * @returns {boolean}
   */
  shouldLog(msgLevel) {
    return this.level >= msgLevel;
  }

  /**
   * Логирование отладочных сообщений
   * @param  {...any} args 
   */
  debug(...args) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(`${this.prefix} [DEBUG]`, ...args);
    }
  }

  /**
   * Логирование информационных сообщений
   * @param  {...any} args 
   */
  info(...args) {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(`${this.prefix} [INFO]`, ...args);
    }
  }

  /**
   * Логирование предупреждений
   * @param  {...any} args 
   */
  warn(...args) {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(`${this.prefix} [WARN]`, ...args);
    }
  }

  /**
   * Логирование ошибок
   * @param  {...any} args 
   */
  error(...args) {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(`${this.prefix} [ERROR]`, ...args);
    }
  }

  /**
   * Логирование с группировкой
   * @param {string} label 
   * @param {Function} callback 
   */
  group(label, callback) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.group(`${this.prefix} [${label}]`);
      try {
        callback();
      } finally {
        console.groupEnd();
      }
    } else {
      callback();
    }
  }

  /**
   * Логирование времени выполнения
   * @param {string} label 
   * @returns {Object} Методы start/end
   */
  time(label) {
    const self = this;
    return {
      start() {
        if (self.shouldLog(LogLevel.DEBUG)) {
          console.time(`${self.prefix} [TIME] ${label}`);
        }
      },
      end() {
        if (self.shouldLog(LogLevel.DEBUG)) {
          console.timeEnd(`${self.prefix} [TIME] ${label}`);
        }
      }
    };
  }
}

// Создаем глобальный экземпляр логгера
const logger = new Logger(LogLevel.INFO);

// Экспортируем для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Logger, LogLevel, logger };
}
