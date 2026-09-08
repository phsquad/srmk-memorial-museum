/**
 * ============================================================================
 * РАСШИРЕННЫЕ ТЕХНИЧЕСКИЕ МОДУЛИ: js/tech-modules.js
 * 
 * 1. 3D Tilt & Gyroscope Physics (Физика наклона карточек и 2.5D-стенда)
 * 2. Canvas Poster Generator (Генератор графических карточек для соцсетей)
 * 3. Procedural Audio Synthesizer (Синтез Метронома Памяти и Колокола)
 * 4. Digital Tribute & Flower Laying (Виртуальное возложение цветов)
 * 5. PWA / Offline Service Worker Installer (Автономная работа без сети)
 * ============================================================================
 */

'use strict';

const TechModules = {
  init() {
    this.init3DTilt();
    this.initPWA();
    console.log("[TechModules] Инженерные модули активированы.");
  },

  /* ==========================================================================
     1. 3D-ПАРАЛЛАКС И ГИРОСКОП (DEVICE ORIENTATION & MOUSE TILT)
     ========================================================================== */
  init3DTilt() {
    const stand = document.getElementById('memorialStand');
    if (!stand) return;

    // Наклон на ПК при движении мыши
    stand.addEventListener('mousemove', (e) => {
      const rect = stand.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      stand.style.transform = `perspective(1000px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
    });

    stand.addEventListener('mouseleave', () => {
      stand.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg)';
      stand.style.transition = 'transform 0.5s ease';
    });

    stand.addEventListener('mouseenter', () => {
      stand.style.transition = 'none';
    });

    // Наклон на смартфонах по датчику гироскопа
    if (window.DeviceOrientationEvent && 'ontouchstart' in window) {
      window.addEventListener('deviceorientation', (e) => {
        if (!e.gamma || !e.beta) return;
        const tiltX = Math.min(Math.max(e.gamma, -20), 20) / 2.5;
        const tiltY = Math.min(Math.max(e.beta - 45, -20), 20) / 2.5;
        stand.style.transform = `perspective(1000px) rotateY(${tiltX}deg) rotateX(${-tiltY}deg)`;
      });
    }
  },

  /* ==========================================================================
     2. ГЕНЕРАТОР ГРАФИЧЕСКИХ ПОСТЕРОВ ДЛЯ СОЦСЕТЕЙ (HTML5 CANVAS)
     Создает готовую памятную карточку 1080x1080 px прямо в браузере
     ========================================================================== */
  generateSocialPoster(heroId) {
    const hero = heroesDatabase.find(h => h.id === heroId);
    if (!hero) return;

    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');

    // Фоновый градиент
    const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1080);
    bgGrad.addColorStop(0, '#121620');
    bgGrad.addColorStop(1, '#060709');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1080, 1080);

    // Золотая рамка
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 6;
    ctx.strokeRect(40, 40, 1000, 1000);
    ctx.lineWidth = 1;
    ctx.strokeRect(52, 52, 976, 976);

    // Шапка
    ctx.fillStyle = '#d4af37';
    ctx.font = 'bold 32px "Montserrat", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ГБПОУ «СТАВРОПОЛЬСКИЙ РЕГИОНАЛЬНЫЙ МНОГОПРОФИЛЬНЫЙ КОЛЛЕДЖ»', 540, 110);

    ctx.fillStyle = '#9e1b20';
    ctx.font = 'bold 24px "Cinzel", serif';
    ctx.fillText('ЦИФРОВОЙ МЕМОРИАЛ «БЫТЬ ВОИНОМ — ЖИТЬ ВЕЧНО»', 540, 150);

    // Отрисовка портрета
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = hero.media?.photo || ArchiveService.generateFallbackAvatar(hero);

    img.onload = () => {
      // Портрет в круглой рамке
      ctx.save();
      ctx.beginPath();
      ctx.arc(540, 390, 180, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, 360, 210, 360, 360);
      ctx.restore();

      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(540, 390, 180, 0, Math.PI * 2);
      ctx.stroke();

      // ФИО Героя
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 44px "Cinzel", Georgia, serif';
      ctx.fillText(hero.name, 540, 640);

      // Годы жизни и специальность
      ctx.fillStyle = '#d4af37';
      ctx.font = 'bold 30px "Montserrat", sans-serif';
      ctx.fillText(hero.dates.years, 540, 690);

      ctx.fillStyle = '#8e98a8';
      ctx.font = '24px "Montserrat", sans-serif';
      ctx.fillText(hero.education.specialty, 540, 735);

      // Награда
      ctx.fillStyle = '#ff8e8e';
      ctx.font = 'bold 26px "Montserrat", sans-serif';
      ctx.fillText(hero.awards[0] || 'Орден Мужества', 540, 785);

      // Цитата / Подвиг
      ctx.fillStyle = '#d8deea';
      ctx.font = 'italic 22px "Montserrat", sans-serif';
      const quote = hero.quote ? `«${hero.quote}»` : hero.deed.substring(0, 100) + '...';
      ctx.fillText(quote, 540, 850);

      // Подвал карточки
      ctx.fillStyle = '#5c6675';
      ctx.font = '20px "Montserrat", sans-serif';
      ctx.fillText('Памяти выпускников колледжа • Карта Доблести России', 540, 980);

      // Скачивание файла
      const link = document.createElement('a');
      link.download = `Память_СРМК_${hero.name.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
  },

  /* ==========================================================================
     3. ПРОЦЕДУРНЫЙ ЗВУКОВОЙ ПРОЦЕССОР (МЕТРОНОМ И КОЛОКОЛ ПАМЯТИ)
     Синтезирует звук без внешних тяжелых MP3-файлов
     ========================================================================== */
  playMemorialBell() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      // Синтез глубокого колокола памяти (частоты 220Hz, 440Hz, 880Hz)
      [220, 440, 880].forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        const decay = 2.5 + index * 0.5;
        gain.gain.setValueAtTime(0.3 / (index + 1), ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + decay);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + decay);
      });
    } catch (e) {}
  },

  /* ==========================================================================
     4. ВИРТУАЛЬНОЕ ВОЗЛОЖЕНИЕ ГВОЗДИК У МЕМОРИАЛА
     ========================================================================== */
  layCarnationFlower() {
    let count = parseInt(localStorage.getItem('srmk_flowers_count') || '0', 10) + 2;
    localStorage.setItem('srmk_flowers_count', count.toString());

    this.playMemorialBell();

    // Визуальный эффект появления цветов на экране
    const flower = document.createElement('div');
    flower.className = 'floating-flower-anim';
    flower.textContent = '💐';
    flower.style.left = `${Math.random() * 80 + 10}%`;
    flower.style.top = '70%';
    document.body.appendChild(flower);

    setTimeout(() => flower.remove(), 2500);

    const display = document.getElementById('flowersCountDisplay');
    if (display) display.textContent = count;

    alert(`Вы возложили живые цветы к Мемориалу Славы колледжа. Всего возложено: ${count} цветов.`);
  },

  /* ==========================================================================
     5. PWA И ОФЛАЙН-РЕЖИМ (ДЛЯ СЕНСОРНЫХ КИОСКОВ В ХОЛЛЕ)
     ========================================================================== */
  initPWA() {
    if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
      const swCode = `
        const CACHE_NAME = 'srmk-museum-v1';
        self.addEventListener('install', (e) => {
          e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(['./', 'index.html', 'css/style.css', 'js/data.js', 'js/sources.js', 'js/app.js'])));
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