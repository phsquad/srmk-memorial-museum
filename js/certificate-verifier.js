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
  }
};
