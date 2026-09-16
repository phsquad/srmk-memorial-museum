/**
 * ============================================================================
 * ИНЖЕНЕРНЫЕ МОДУЛИ И ЭФФЕКТЫ: js/tech-modules.js (v9.0 Master)
 * Мемориально-образовательный комплекс ГБПОУ СРМК «Быть воином — жить вечно»
 * 
 * Включает:
 * 1. Генератор графических постеров для стендов и соцсетей (Canvas 1080x1080)
 * 2. 3D-параллакс и гироскоп мемориального монумента (RequestAnimationFrame)
 * 3. Процедурный синтезатор Колокола Памяти (Web Audio API)
 * 4. PWA Service Worker для офлайн-работы интерактивных стендов колледжа
 * ============================================================================
 */

'use strict';

const TechModules = {
  _audioCtx: null,

  init() {
    this.init3DTilt();
    this.initPWA();
    console.log("[TechModules v9.0] Инженерные сервисы, 3D-параллакс и Canvas-генераторы активны.");
  },

  /* ==========================================================================
     1. ГЕНЕРАТОР ГРАФИЧЕСКИХ ПОСТЕРОВ ПАМЯТИ (CANVAS 1080x1080)
     ========================================================================== */
  generateSocialPoster(heroId) {
    const hero = typeof heroesDatabase !== 'undefined' 
      ? heroesDatabase.find(h => h.id === heroId) 
      : null;
    if (!hero) {
      alert("Ошибка: профиль героя не найден в базе данных.");
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');

    // Гранитно-обсидиановый градиент фона
    const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1080);
    bgGrad.addColorStop(0, '#14171d');
    bgGrad.addColorStop(1, '#080a0d');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1080, 1080);

    // Двойная золотая рамка
    ctx.strokeStyle = '#c5a059';
    ctx.lineWidth = 4;
    ctx.strokeRect(40, 40, 1000, 1000);
    ctx.strokeStyle = 'rgba(197, 160, 89, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(52, 52, 976, 976);

    // Верхние колонтитулы
    ctx.fillStyle = '#c5a059';
    ctx.font = 'bold 26px "Montserrat", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ГБПОУ «СТАВРОПОЛЬСКИЙ РЕГИОНАЛЬНЫЙ МНОГОПРОФИЛЬНЫЙ КОЛЛЕДЖ»', 540, 105);

    ctx.fillStyle = '#8a1c22';
    ctx.font = 'bold 20px "Cinzel", Georgia, serif';
    ctx.fillText('ЦИФРОВОЙ МЕМОРИАЛ «БЫТЬ ВОИНОМ — ЖИТЬ ВЕЧНО»', 540, 140);

    // Загрузка фото героя
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = hero.media?.photo || (typeof ArchiveService !== 'undefined' ? ArchiveService.generateFallbackAvatar(hero) : '');

    img.onload = () => {
      // Портрет в круглом медальоне
      ctx.save();
      ctx.beginPath();
      ctx.arc(540, 380, 175, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, 365, 205, 350, 350);
      ctx.restore();

      ctx.strokeStyle = '#c5a059';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(540, 380, 175, 0, Math.PI * 2);
      ctx.stroke();

      // ФИО
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 42px "Cinzel", Georgia, serif';
      ctx.fillText(hero.name, 540, 630);

      // Годы и специальность
      ctx.fillStyle = '#c5a059';
      ctx.font = 'bold 28px "Montserrat", sans-serif';
      ctx.fillText(hero.dates?.years || '', 540, 680);

      ctx.fillStyle = '#9da6b3';
      ctx.font = '24px "Montserrat", sans-serif';
      ctx.fillText(hero.education?.specialty || 'Выпускник колледжа', 540, 725);

      // Награда
      ctx.fillStyle = '#ff9999';
      ctx.font = 'bold 24px "Montserrat", sans-serif';
      ctx.fillText(hero.awards?.[0] || 'Кавалер Ордена Мужества', 540, 775);

      // Цитата или подвиг
      ctx.fillStyle = '#d8deea';
      ctx.font = 'italic 20px "Montserrat", sans-serif';
      const quoteText = hero.quote ? `«${hero.quote}»` : (hero.deed ? hero.deed.substring(0, 95) + '...' : '');
      ctx.fillText(quoteText, 540, 840);

      // Подвал карточки
      ctx.fillStyle = '#606875';
      ctx.font = '18px "Montserrat", sans-serif';
      ctx.fillText('Памяти выпускников СРМК • Всероссийская акция «Карта Доблести»', 540, 980);

      // Автоматическое скачивание
      const link = document.createElement('a');
      link.download = `Постер_Памяти_${hero.name.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    img.onerror = () => {
      alert("Не удалось загрузить изображение для формирования постера.");
    };
  },

  /* ==========================================================================
     2. ПРОЦЕДУРНЫЙ КОЛОКОЛ ПАМЯТИ (WEB AUDIO API)
     ========================================================================== */
  playMemorialBell() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!this._audioCtx) this._audioCtx = new AudioCtx();
      
      const ctx = this._audioCtx;
      if (ctx.state === 'suspended') ctx.resume();

      // Обертоны колокола: Фундаментальный (220Hz), Квинта (330Hz), Октава (440Hz), Терция (554Hz)
      const overtones = [220, 330, 440, 554];
      const now = ctx.currentTime;

      overtones.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        const decay = 3.0 + idx * 0.4;
        const volume = 0.25 / (idx + 1);

        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + decay);
      });
    } catch (e) {
      console.warn("[Web Audio] Синтезатор колокола недоступен:", e);
    }
  },

  /* ==========================================================================
     3. 3D-ПАРАЛЛАКС И ГИРОСКОП МОНУМЕНТА С ЗАЩИТОЙ ОТ ПЕРЕГРУЗКИ
     ========================================================================== */
  init3DTilt() {
    const stand = document.getElementById('memorialStand');
    if (!stand) return;

    let rafId = null;

    // Плавное слежение за курсором на десктопе
    stand.addEventListener('mousemove', (e) => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const rect = stand.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;

        stand.style.transform = `perspective(1000px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
      });
    }, { passive: true });

    stand.addEventListener('mouseleave', () => {
      stand.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg)';
      stand.style.transition = 'transform 0.4s ease';
    });

    stand.addEventListener('mouseenter', () => {
      stand.style.transition = 'none';
    });

    // Гироскоп на мобильных устройствах
    if (window.DeviceOrientationEvent && 'ontouchstart' in window) {
      window.addEventListener('deviceorientation', (e) => {
        if (!e.gamma || !e.beta) return;
        const tiltX = Math.min(Math.max(e.gamma, -15), 15) / 2.5;
        const tiltY = Math.min(Math.max(e.beta - 45, -15), 15) / 2.5;
        stand.style.transform = `perspective(1000px) rotateY(${tiltX}deg) rotateX(${-tiltY}deg)`;
      }, { passive: true });
    }
  },

  /* ==========================================================================
     4. АВТОНОМНЫЙ РЕЖИМ PWA (SERVICE WORKER)
     ========================================================================== */
  initPWA() {
    if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
      const swCode = `
        const CACHE_NAME = 'srmk-museum-v9';
        const ASSETS = [
          './',
          'index.html',
          'mobile.html',
          'memory-book.html',
          'reader.html',
          'quiz.html',
          'guestbook.html',
          'certificate.html',
          'verify.html',
          'desk-qr.html',
          'methodology.html',
          'css/site-common.css',
          'css/header-common.css',
          'css/desktop.css',
          'css/mobile.css',
          'js/data.js',
          'js/sources.js',
          'js/app.js',
          'js/cloud-sync.js',
          'js/anti-cheat-tribute.js',
          'js/navigation.js'
        ];
        self.addEventListener('install', (e) => {
          e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
        });
        self.addEventListener('fetch', (e) => {
          e.respondWith(caches.match(e.request).then((res) => res || fetch(e.request)));
        });
      `;
      const blob = new Blob([swCode], { type: 'application/javascript' });
      navigator.serviceWorker.register(URL.createObjectURL(blob)).catch(() => {});
    }
  }
};

window.TechModules = TechModules;
document.addEventListener('DOMContentLoaded', () => TechModules.init());