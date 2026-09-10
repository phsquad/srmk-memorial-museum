/**
 * ============================================================================
 * ЛОГИКА МЕТОДИЧЕСКОГО КАБИНЕТА: js/methodology.js
 * Управление вкладками, экспорт в Word (.doc), копирование и печать
 * ============================================================================
 */

'use strict';

const Methodology = {
  init() {
    this.bindTabs();
    console.log("[Methodology] Цифровой методический кабинет инициализирован.");
  },

  /**
   * 1. Переключение навигационных вкладок
   */
  bindTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = `tab-${btn.dataset.tab}`;

        tabButtons.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        const targetContent = document.getElementById(targetId);
        if (targetContent) {
          targetContent.classList.add('active');
        }
      });
    });
  },

  /**
   * 2. Быстрое копирование текста в буфер обмена
   */
  async copyText(elementId, successMessage = "Скопировано в буфер обмена!") {
    const el = document.getElementById(elementId);
    if (!el) return;

    const textToCopy = el.innerText || el.textContent;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        // Fallback для устаревших контекстов
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      this.showToast(successMessage);
    } catch (err) {
      this.showToast("Не удалось скопировать текст.", "error");
    }
  },

  /**
   * 3. Копирование содержимого отдельной карточки микрогруппы
   */
  copyCardText(cardId) {
    const card = document.getElementById(cardId);
    if (!card) return;

    const groupTitle = card.querySelector('.group-tag')?.innerText || '';
    const tvdTitle = card.querySelector('.tvd-tag')?.innerText || '';
    const bodyText = card.querySelector('.task-card-body')?.innerText || '';

    const fullCardText = `КАРТОЧКА ПОИСКОВОГО ЗАДАНИЯ\n${groupTitle}: «${tvdTitle}»\n\n${bodyText}\n\nМемориальный комплекс СРМК: https://phsquad.github.io/srmkmuseum/`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullCardText).then(() => {
        this.showToast(`Карточка ${groupTitle} скопирована!`);
      });
    }
  },

  /**
   * 4. Целевая печать отдельной карточки на А4
   */
  printSingleCard(cardId) {
    const card = document.getElementById(cardId);
    if (!card) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ru">
      <head>
        <meta charset="UTF-8">
        <title>Печать карточки задания | ГБПОУ СРМК</title>
        <style>
          body { font-family: 'Times New Roman', serif; padding: 25px; line-height: 1.5; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 16px; }
          .header h2 { margin: 0; text-transform: uppercase; font-size: 16pt; }
          .header p { margin: 4px 0 0; font-size: 11pt; }
          .task-block { margin-bottom: 16px; font-size: 12pt; }
          .task-label { font-weight: bold; text-transform: uppercase; font-size: 10pt; display: block; margin-bottom: 4px; }
          ol { padding-left: 20px; }
          li { margin-bottom: 6px; }
          .footer { margin-top: 30px; border-top: 1px solid #ccc; padding-top: 8px; font-size: 9pt; text-align: center; color: #555; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>ГБПОУ «Ставропольский региональный многопрофильный колледж»</h2>
          <p>Всероссийская акция «Карта доблести» • Урок Мужества «Быть воином — жить вечно»</p>
        </div>
        ${card.querySelector('.task-card-body').innerHTML}
        <div class="footer">
          Цифровой музей СРМК: https://phsquad.github.io/srmkmuseum/ • Разработчик: А. В. Генте
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  },

  /**
   * 5. Экспорт технологической карты в файл MS Word (.doc)
   */
  exportToWord(containerId, filename = 'Технологическая_карта_СРМК') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${filename}</title>
        <style>
          body { font-family: 'Calibri', 'Times New Roman', sans-serif; font-size: 11pt; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background-color: #f2f2f2; border: 1px solid #999; padding: 8px; font-weight: bold; text-align: left; }
          td { border: 1px solid #999; padding: 8px; vertical-align: top; }
          h2, h3 { color: #8a1c22; }
          .meta { margin-bottom: 15px; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
        </style>
      </head>
      <body>
        <div style="text-align: center;">
          <p><strong>МИНИСТЕРСТВО ОБРАЗОВАНИЯ СТАВРОПОЛЬСКОГО КРАЯ</strong><br>ГБПОУ «Ставропольский региональный многопрофильный колледж»</p>
          <h2>ТЕХНОЛОГИЧЕСКАЯ КАРТА УРОКА МУЖЕСТВА</h2>
          <p><em>«Они учились здесь. Они шагнули в вечность»</em></p>
        </div>
        ${container.innerHTML}
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + htmlContent], {
      type: 'application/msword;charset=utf-8'
    });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.doc`;
    link.click();
    URL.revokeObjectURL(link.href);

    this.showToast("Файл Word (.doc) успешно скачан!");
  },

  /**
   * 6. Всплывающее Toast-уведомление
   */
  showToast(message) {
    const toast = document.getElementById('methodToast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('active');

    setTimeout(() => {
      toast.classList.remove('active');
    }, 2800);
  }
};

document.addEventListener('DOMContentLoaded', () => Methodology.init());