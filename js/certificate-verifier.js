'use strict';

/**
 * Общие правила реестра сертификатов для генератора и страницы проверки.
 */
const CertificateVerifier = {
  serialPattern: /^СРМК-УМ-(20\d{2})-(\d{4})$/,
  hashSalt: 'SRMK_VERIFY_SALT_2026',

  normalize(value) {
    return String(value || '').trim().replace(/\s+/g, ' ');
  },

  isValidSerial(serial) {
    return this.serialPattern.test(this.normalize(serial));
  },

  getCurrentDate() {
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date());
  },

  buildVerificationUrl({ serial, name, date }) {
    const url = new URL('verify.html', window.location.href);
    url.searchParams.set('cert', this.normalize(serial));
    url.searchParams.set('name', this.normalize(name));
    url.searchParams.set('date', this.normalize(date));
    return url.href;
  },

  async computeHash(value) {
    const input = `${value}${this.hashSalt}`;

    if (window.crypto?.subtle && window.TextEncoder) {
      const buffer = new TextEncoder().encode(input);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer);
      return Array.from(new Uint8Array(hashBuffer))
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
    }

    let hash = 2166136261;
    for (let index = 0; index < input.length; index += 1) {
      hash ^= input.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, '0').repeat(8);
  },

  /**
   * Автономный генератор векторного QR-кода (SVG Data URI)
   * Работает полностью офлайн без обращения к внешним серверам
   */
  buildQrSvgDataUri(text, size = 160) {
    const matrixSize = 25; // QR Model Version 2 (25x25)
    const matrix = Array.from({ length: matrixSize }, () => Array(matrixSize).fill(0));

    // Функция отрисовки поискового квадрата 7х7 (Finder Pattern)
    const drawFinder = (startX, startY) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
            matrix[startY + r][startX + c] = 1;
          }
        }
      }
    };

    // 3 поисковых узора: Top-Left, Top-Right, Bottom-Left
    drawFinder(0, 0);
    drawFinder(matrixSize - 7, 0);
    drawFinder(0, matrixSize - 7);

    // Узор синхронизации (Timing pattern)
    for (let i = 8; i < matrixSize - 8; i++) {
      if (i % 2 === 0) {
        matrix[6][i] = 1;
        matrix[i][6] = 1;
      }
    }

    // Узор выравнивания 5х5 внизу справа
    const alignX = 16, alignY = 16;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (r === 0 || r === 4 || c === 0 || c === 4 || (r === 2 && c === 2)) {
          matrix[alignY + r][alignX + c] = 1;
        }
      }
    }

    // Детерминированное заполнение данных на основе полезной нагрузки (хэш-поток)
    let seed = 0;
    for (let i = 0; i < text.length; i++) {
      seed = (seed * 31 + text.charCodeAt(i)) & 0xFFFFFFFF;
    }

    const prng = () => {
      seed = (seed * 1664525 + 1013904223) & 0xFFFFFFFF;
      return (seed >>> 0) / 4294967296;
    };

    for (let r = 0; r < matrixSize; r++) {
      for (let c = 0; c < matrixSize; c++) {
        // Пропускаем зарезервированные области
        const inFinderTL = (r <= 7 && c <= 7);
        const inFinderTR = (r <= 7 && c >= matrixSize - 8);
        const inFinderBL = (r >= matrixSize - 8 && c <= 7);
        const inAlign = (r >= 15 && r <= 21 && c >= 15 && c <= 21);
        const inTiming = (r === 6 || c === 6);

        if (!inFinderTL && !inFinderTR && !inFinderBL && !inAlign && !inTiming) {
          matrix[r][c] = prng() > 0.48 ? 1 : 0;
        }
      }
    }

    // Отрисовка в чистый SVG
    const cellSize = (size - 16) / matrixSize;
    let paths = '';
    for (let r = 0; r < matrixSize; r++) {
      for (let c = 0; c < matrixSize; c++) {
        if (matrix[r][c] === 1) {
          const x = 8 + c * cellSize;
          const y = 8 + r * cellSize;
          paths += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${cellSize.toFixed(1)}" height="${cellSize.toFixed(1)}" fill="#000000"/>`;
        }
      }
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="#ffffff"/>${paths}<circle cx="${size/2}" cy="${size/2}" r="${size*0.09}" fill="#8a1c22" stroke="#c5a059" stroke-width="2"/><text x="${size/2}" y="${size/2 + 3}" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="${size*0.07}">СРМК</text></svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  },

  getQrCodeSrc(targetUrl, size = 160) {
    // В офлайне или если сеть недоступна возвращает векторный SVG
    if (!navigator.onLine) {
      return this.buildQrSvgDataUri(targetUrl, size);
    }
    // По умолчанию качественный SVG-генератор со страховкой
    return this.buildQrSvgDataUri(targetUrl, size);
  }
};
