/**
 * ============================================================================
 * ЦЕНТРАЛЬНАЯ КОНФИГУРАЦИЯ СЕРВИСОВ И БАЗЫ ДАННЫХ SUPABASE
 * Файл: js/config.js
 * Мемориально-образовательный комплекс ГБПОУ СРМК «Быть воином — жить вечно»
 * 
 * ПОДКЛЮЧЕНИЕ SUPABASE ДЛЯ GITHUB PAGES:
 * 1. Создайте бесплатный проект на https://supabase.com
 * 2. Выполните скрипт 'supabase_migration.sql' в SQL Editor вашего проекта
 * 3. Вставьте ваши Project URL и Anon Key ниже (или настройте прямо через интерфейс
 *    сайта, нажав на кнопку статуса Supabase в шапке или комбинацию Ctrl+Shift+S)
 * ============================================================================
 */

(function(global) {
  'use strict';

  // Значения по умолчанию
  const DEFAULT_CONFIG = {
    // Вставьте URL вашего проекта Supabase (https://<project-ref>.supabase.co)
    SUPABASE_URL: "https://qtafcczydgyrganrpkof.supabase.co",

    // Вставьте публичный Anon Key (Project Settings -> API -> anon public)
    SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0YWZjY3p5ZGd5cmdhbnJwa29mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwNTg5MDEsImV4cCI6MjEwNDYzNDkwMX0.i_hFegr6BHix6eFEasgyICDE6Lcy5wbwbU6dArG-wFg",

    // Настройки проекта
    SITE_NAME: "Виртуальный мемориальный комплекс ГБПОУ СРМК",
    PROJECT_TITLE: "«Быть воином — жить вечно»",
    GITHUB_PAGES_BASE: "./",

    // Таблицы БД
    TABLES: {
      HEROES: 'heroes_database',
      COUNTERS: 'memorial_counters',
      GUESTBOOK: 'guestbook_tributes',
      QUIZ: 'quiz_results',
      CERTIFICATES: 'certificates_registry',
      HERALDRY: 'heraldry_cache',
      ACTIONS_LOG: 'anti_abuse_actions_log',
      FLAMES_VOTES: 'tribute_flames_votes',
      ANALYTICS: 'hall_analytics_counters',
      ANALYTICS_EVENTS: 'hall_analytics_events',
      ACHIEVEMENTS: 'user_achievements',
      ACHIEVEMENT_EVENTS: 'achievement_unlock_events',
      METRICS_HUB: 'museum_realtime_metrics'
    }
  };

  // Проверяем наличие пользовательских настроек в LocalStorage
  function getActiveConfig() {
    let customUrl = null;
    let customKey = null;

    try {
      customUrl = localStorage.getItem('srmk_supabase_url');
      customKey = localStorage.getItem('srmk_supabase_anon_key');
    } catch (e) {
      console.warn("[Config] LocalStorage недоступен:", e);
    }

    return {
      ...DEFAULT_CONFIG,
      SUPABASE_URL: (customUrl && customUrl.trim()) ? customUrl.trim() : DEFAULT_CONFIG.SUPABASE_URL,
      SUPABASE_ANON_KEY: (customKey && customKey.trim()) ? customKey.trim() : DEFAULT_CONFIG.SUPABASE_ANON_KEY,
      isCustomized: Boolean(customUrl || customKey)
    };
  }

  const SRMK_CONFIG = getActiveConfig();

  SRMK_CONFIG.saveCustomConfig = function(url, key) {
    try {
      if (url) localStorage.setItem('srmk_supabase_url', url.trim());
      else localStorage.removeItem('srmk_supabase_url');

      if (key) localStorage.setItem('srmk_supabase_anon_key', key.trim());
      else localStorage.removeItem('srmk_supabase_anon_key');

      SRMK_CONFIG.SUPABASE_URL = url ? url.trim() : DEFAULT_CONFIG.SUPABASE_URL;
      SRMK_CONFIG.SUPABASE_ANON_KEY = key ? key.trim() : DEFAULT_CONFIG.SUPABASE_ANON_KEY;
      SRMK_CONFIG.isCustomized = Boolean(url || key);

      // Оповещаем другие модули
      window.dispatchEvent(new CustomEvent('srmk-config-updated', { detail: SRMK_CONFIG }));
      return true;
    } catch (e) {
      console.error("[Config] Ошибка сохранения настроек:", e);
      return false;
    }
  };

  SRMK_CONFIG.resetToDefault = function() {
    try {
      localStorage.removeItem('srmk_supabase_url');
      localStorage.removeItem('srmk_supabase_anon_key');
      SRMK_CONFIG.SUPABASE_URL = DEFAULT_CONFIG.SUPABASE_URL;
      SRMK_CONFIG.SUPABASE_ANON_KEY = DEFAULT_CONFIG.SUPABASE_ANON_KEY;
      SRMK_CONFIG.isCustomized = false;
      window.dispatchEvent(new CustomEvent('srmk-config-updated', { detail: SRMK_CONFIG }));
      return true;
    } catch (e) {
      return false;
    }
  };

  global.SRMK_CONFIG = SRMK_CONFIG;
  global.DEFAULT_CONFIG = DEFAULT_CONFIG;
})(typeof window !== 'undefined' ? window : globalThis);
