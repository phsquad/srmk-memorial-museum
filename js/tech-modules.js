/**
 * ============================================================================
 * РАСШИРЕННЫЕ ТЕХНИЧЕСКИЕ МОДУЛИ И ЗАЩИТА: js/tech-modules.js (v8.0 Master)
 * 
 * Включает:
 * 1. AntiBot Tribute Core (Криптозащита и тайм-лок возложения цветов)
 * 2. Canvas Social Poster Engine (Генератор графических карточек 1080x1080)
 * 3. Canvas Certificate Generator (Сертификат участника Урока Мужества)
 * 4. Procedural Memorial Bell Synthesizer (Синтезатор звука без MP3)
 * 5. 3D Tilt & Gyroscope Physics (Физика наклона с защитой от флуда)
 * 6. PWA / Offline Service Worker (Автономная работа на стендах без сети)
 * ============================================================================
 */

'use strict';

const TechModules = {
  // Константы безопасности
  SECURITY_SALT: "SRMK_TECH_MODULES_SECURE_HASH_2026",
  FLOWER_COOLDOWN_MS: 24 * 60 * 60 * 1000, // 24 часа
  MIN_ACTION_INTERVAL: 800,                // Защита от автокликеров (мс)
  _lastActionTime: 0,
  _audioCtx: null,

  init() {
    this.init3DTilt();
    this.initPWA();
    this.syncFlowerCounters();
    console.log("[TechModules] Инженерные модули и защитный шлюз активированы.");
  },

  /* ==========================================================================
     1. АНТИБОТ-ЯДРО ВОЗЛОЖЕНИЯ ЦВЕТОВ (TRIBUTE SHIELD)
     ========================================================================== */

  /**
   * Криптографическая хеш-подпись данных (SHA-256)
   */
  async _computeHash(dataStr) {
    const text = dataStr + this.SECURITY_SALT;
    const msgBuffer = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  /**
   * Проверка возможности возложения цветов (суточный кулдаун)
   */
  canLayFlower() {
    try {
      const lastTime = parseInt(localStorage.getItem('srmk_last_flower_ts') || '0', 10);
      if (!lastTime) return { allowed: true };

      const timePassed = Date.now() - lastTime;
      if (timePassed < this.FLOWER_COOLDOWN_MS) {
        const hoursLeft = Math.ceil((this.FLOWER_COOLDOWN_MS - timePassed) / (1000 * 60 * 60));
        return { allowed: false, hoursLeft };
      }
      return { allowed: true };
    } catch (e) {
      return { allowed: true };
    }
  },

  /**
   * Защищенное сохранение счетчика цветов с контрольной суммой
   */
  async _saveSecureFlowerCount(newCount) {
    const ts = Date.now();
    localStorage.setItem('srmk_last_flower_ts', ts.toString());

    const payload = `${newCount}_${ts}`;
    const signature = await this._computeHash(payload);

    const vault = {
      count: newCount,
      timestamp: ts,
      signature: signature
    };

    localStorage.setItem('srmk_secure_flower_vault', JSON.stringify(vault));
  },

  /**
   * Чтение проверенного счетчика (самовосстановление при попытке взлома в DevTools)
   */
  async getVerifiedFlowerCount() {
    try {
      const raw = localStorage.getItem('srmk_secure_flower_vault');
      if (!raw) return 0;

      const vault = JSON.parse(raw);
      const payload = `${vault.count}_${vault.timestamp}`;
      const expectedSig = await this._computeHash(payload);

      if (vault.signature === expectedSig && typeof vault.count === 'number') {
        return vault.count;
      } else {
        console.warn("[AntiBot] Обнаружена попытка накрутки счетчика цветов. Данные сброшены.");
        localStorage.removeItem('srmk_secure_flower_vault');
        return 0;
      }
    } catch (e) {
      return 0;
    }
  },

  async syncFlowerCounters() {
    const verifiedCount = await this.getVerifiedFlowerCount();
    const display = document.getElementById('flowersCountDisplay');
    if (display) display.textContent = verifiedCount;
  },

  /**
   * Главный метод возложения цветов с защитой от кликеров и скриптов
   */
  async layCarnationFlower(event) {
    // 1. Проверка на подлинность браузерного события (защита от bot.click())
    if (event && !event.isTrusted) {
      alert("Программная эмуляция клика запрещена защитным шлюзом.");
      return;
    }

    // 2. Защита от спам-кликов (анти-дребезг)
    const now = Date.now();
    if (now - this._lastActionTime < this.MIN_ACTION_INTERVAL) {
      return;
    }
    this._lastActionTime = now;

    // 3. Проверка суточного тайм-лока
    const status = this.canLayFlower();
    if (!status.allowed) {
      alert(`Вы уже возложили цветы к Мемориалу Славы сегодня. Повторное возложение будет доступно через ${status.hoursLeft} ч.`);
      return;
    }

    // 4. Инкремент и запись
    const currentCount = await this.getVerifiedFlowerCount();
    const newCount = currentCount + 2; // Пара живых гвоздик
    await this._saveSecureFlowerCount(newCount);

    // 5. Звуковой и визуальный отклик
    this.playMemorialBell();

    const flower = document.createElement('div');
    flower.className = 'floating-flower-anim';
    flower.textContent = '💐';
    flower.style.left = `${Math.random() * 50 + 25}%`;
    flower.style.top = '70%';
    document.body.appendChild(flower);

    setTimeout(() => flower.remove(), 2500);

    await this.syncFlowerCounters();
    alert(`Вы возложили живые гвоздики к Мемориалу Славы колледжа. В базе зафиксировано: ${newCount} цветов.`);
  },

  /* ==========================================================================
     2. ГЕНЕРАТОР ГРАФИЧЕСКИХ ПОСТЕРОВ ДЛЯ СОЦСЕТЕЙ (HTML5 CANVAS)
     ========================================================================== */
  generateSocialPoster(heroId) {
    const hero = typeof heroesDatabase !== 'undefined' 
      ? heroesDatabase.find(h => h.id === heroId) 
      : null;
    if (!hero) return;

    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');

    // Фоновая заливка (гранитно-обсидиановая)
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

    // Верхний колонтитул
    ctx.fillStyle = '#c5a059';
    ctx.font = 'bold 28px "Montserrat", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ГБПОУ «СТАВРОПОЛЬСКИЙ РЕГИОНАЛЬНЫЙ МНОГОПРОФИЛЬНЫЙ КОЛЛЕДЖ»', 540, 105);

    ctx.fillStyle = '#8a1c22';
    ctx.font = 'bold 20px "Cinzel", serif';
    ctx.fillText('ЦИФРОВОЙ МЕМОРИАЛ «БЫТЬ ВОИНОМ — ЖИТЬ ВЕЧНО»', 540, 140);

    // Загрузка фото
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

      // Подвиг / Цитата
      ctx.fillStyle = '#d8deea';
      ctx.font = 'italic 20px "Montserrat", sans-serif';
      const quoteText = hero.quote ? `«${hero.quote}»` : (hero.deed ? hero.deed.substring(0, 95) + '...' : '');
      ctx.fillText(quoteText, 540, 840);

      // Подвал карточки
      ctx.fillStyle = '#606875';
      ctx.font = '18px "Montserrat", sans-serif';
      ctx.fillText('Памяти выпускников СРМК • Всероссийская акция «Карта Доблести»', 540, 980);

      // Скачивание
      const link = document.createElement('a');
      link.download = `Постер_Памяти_${hero.name.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    img.onerror = () => {
      alert("Не удалось загрузить изображение для постера.");
    };
  },

  /* ==========================================================================
     3. ГЕНЕРАТОР ИМЕННОГО СЕРТИФИКАТА «УРОК МУЖЕСТВА»
     ========================================================================== */
  generateStudentCertificate(studentName = "") {
    const name = studentName.trim() || prompt("Введите ФИО обучающегося для оформления сертификата:", "");
    if (!name) return;

    const canvas = document.createElement('canvas');
    canvas.width = 1600;
    canvas.height = 1130; // Пропорция листа A4 альбомная
    const ctx = canvas.getContext('2d');

    // Фоновая заливка под пергамент
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, 1600, 1130);

    // Орнаментальная рамка
    ctx.strokeStyle = '#8a1c22';
    ctx.lineWidth = 8;
    ctx.strokeRect(50, 50, 1500, 1030);

    ctx.strokeStyle = '#c5a059';
    ctx.lineWidth = 2;
    ctx.strokeRect(65, 65, 1470, 1000);

    // Заголовки
    ctx.fillStyle = '#8a1c22';
    ctx.font = 'bold 36px "Cinzel", serif';
    ctx.textAlign = 'center';
    ctx.fillText('МИНИСТЕРСТВО ОБРАЗОВАНИЯ СТАВРОПОЛЬСКОГО КРАЯ', 800, 140);

    ctx.fillStyle = '#111';
    ctx.font = 'bold 26px "Montserrat", sans-serif';
    ctx.fillText('ГБПОУ «СТАВРОПОЛЬСКИЙ РЕГИОНАЛЬНЫЙ МНОГОПРОФИЛЬНЫЙ КОЛЛЕДЖ»', 800, 190);

    ctx.fillStyle = '#c5a059';
    ctx.font = 'bold 70px "Cinzel", Georgia, serif';
    ctx.fillText('СЕРТИФИКАТ', 800, 340);

    ctx.fillStyle = '#444';
    ctx.font = '24px "Montserrat", sans-serif';
    ctx.fillText('настоящим подтверждается, что', 800, 420);

    // ФИО Ученика
    ctx.fillStyle = '#8a1c22';
    ctx.font = 'bold 46px "Montserrat", sans-serif';
    ctx.fillText(name, 800, 500);

    ctx.strokeStyle = '#c5a059';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(400, 520);
    ctx.lineTo(1200, 520);
    ctx.stroke();

    ctx.fillStyle = '#222';
    ctx.font = '24px "Montserrat", sans-serif';
    ctx.fillText('принял(а) участие в интерактивном Уроке Мужества и исследовательской программе', 800, 600);
    
    ctx.fillStyle = '#111';
    ctx.font = 'bold 28px "Cinzel", serif';
    ctx.fillText('«БЫТЬ ВОИНОМ — ЖИТЬ ВЕЧНО»', 800, 650);

    ctx.fillStyle = '#555';
    ctx.font = '22px "Montserrat", sans-serif';
    ctx.fillText('в рамках Всероссийской акции «Имя в истории образовательной организации»', 800, 700);

    // Подписи
    const dateStr = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    ctx.textAlign = 'left';
    ctx.fillStyle = '#222';
    ctx.font = '20px "Montserrat", sans-serif';
    ctx.fillText(`Дата: ${dateStr}`, 120, 950);
    ctx.fillText('г. Ставрополь', 120, 980);

    ctx.textAlign = 'right';
    ctx.fillText('Директор ГБПОУ СРМК, к.и.н. / Е. В. Бледных /', 1480, 950);
    ctx.fillText('Куратор музея / А. В. Генте /', 1480, 980);

    // Скачивание сертификата
    const link = document.createElement('a');
    link.download = `Сертификат_Урок_Мужества_${name.replace(/\s+/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  },

  /* ==========================================================================
     4. ПРОЦЕДУРНЫЙ КОЛОКОЛ ПАМЯТИ (WEB AUDIO SYNTHESIZER)
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
    } catch (e) {}
  },

  /* ==========================================================================
     5. 3D-ПАРАЛЛАКС И ГИРОСКОП С ЗАЩИТОЙ ОТ ПЕРЕГРЕВА
     ========================================================================== */
  init3DTilt() {
    const stand = document.getElementById('memorialStand');
    if (!stand) return;

    let rafId = null;

    // Мышь на ПК (с плавным RequestAnimationFrame)
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

    // Гироскоп на смартфонах
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
     6. АВТОНОМНЫЙ ОФЛАЙН-РЕЖИМ PWA (SERVICE WORKER)
     ========================================================================== */
  initPWA() {
    if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
      const swCode = `
        const CACHE_NAME = 'srmk-museum-v8';
        const ASSETS = [
          './',
          'index.html',
          'mobile.html',
          'css/style.css',
          'css/desktop.css',
          'css/mobile.css',
          'js/data.js',
          'js/sources.js',
          'js/app.js',
          'js/admin.js',
          'js/tech-modules.js'
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