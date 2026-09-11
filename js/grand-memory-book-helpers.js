/*
 * GRAND MEMORY BOOK - SHARED HELPERS
 * Общие вспомогательные функции для компиляции томов фолианта.
 */

'use strict';

/**
 * Компилирует HTML-шаблон разворота книги для заданной страницы.
 * @param {Object} book - Объект книги (том) с полями volNum, chapterNum, name, photo и др.
 * @param {Array} page - Массив данных страницы: [заголовок, текст, метка]
 * @param {number} index - Индекс страницы (0-3)
 * @returns {Object} Объект с полями spreadNum, chapterTitle, leftHtml, rightHtml, readingTime
 */
function compileSpreadHTML(book, page, index) {
  const pageNumLeft = index * 2 + 1;
  const pageNumRight = index * 2 + 2;
  const romanNumerals = ['I', 'II', 'III', 'IV'];
  
  // Расчет времени чтения на основе количества слов в очерке
  const wordsInText = page[1].split(/\s+/).length;
  const wordsPerMinute = 200; // Средняя скорость чтения вслух/внимательно
  const readingTimeMinutes = Math.ceil(wordsInText / wordsPerMinute);
  const readingTimeLabel = `⏱ ${readingTimeMinutes} мин чтения`;
  
  return {
    spreadNum: `Разворот ${romanNumerals[index]} (Стр. ${pageNumLeft}–${pageNumRight})`,
    chapterTitle: page[0],
    readingTime: readingTimeLabel,
    leftHtml: `<div class="page-header-meta"><span>${book.volNum}</span><span>${page[2]}</span></div><div class="page-visual-frame"><img src="${book.photo}" alt="${book.name}"></div><div class="page-quote-box">«Память о человеке продолжается в его делах.»</div><div class="page-number-footer">Стр. ${pageNumLeft}</div>`,
    rightHtml: `<div class="page-header-meta"><span>${book.chapterNum}</span><span>${page[2]}</span></div><h3 class="page-chapter-title">${page[0]}</h3><div class="page-story-text"><span class="drop-cap">${page[1][0]}</span>${page[1].slice(1)}</div><div class="reading-time-badge">${readingTimeLabel}</div><div class="page-number-footer">Стр. ${pageNumRight}</div>`
  };
}

// Экспорт для Node.js и браузера
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { compileSpreadHTML };
}
if (typeof window !== 'undefined') {
  window.compileSpreadHTML = compileSpreadHTML;
}
