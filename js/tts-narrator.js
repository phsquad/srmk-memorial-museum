/**
 * ============================================================================
 * ОНЛАЙН-ДИКТОР МУЗЕЯ: js/tts-narrator.js
 * Нейроподобная озвучка через Web Speech API с визуальным слежением за текстом
 * ============================================================================
 */

'use strict';

const TTSNarrator = {
  synth: window.speechSynthesis,
  currentUtterance: null,
  isSpeaking: false,
  isPaused: false,
  selectedVoice: null,
  rate: 0.95, // Оптимальный академический темп речи
  pitch: 0.92, // Благородный низкий тон голоса

  init() {
    if (!('speechSynthesis' in window)) {
      console.warn("[TTS] Web Speech API не поддерживается данным браузером.");
      return;
    }
    this.loadVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => this.loadVoices();
    }
  },

  loadVoices() {
    const voices = this.synth.getVoices();
    // Поиск лучшего русского голоса (Yandex, Microsoft Irina/Pavel, Google Russian, Apple Milena)
    this.selectedVoice = voices.find(v => v.lang.includes('ru') && (v.name.includes('Neural') || v.name.includes('Natural') || v.name.includes('Premium'))) ||
                         voices.find(v => v.lang.includes('ru')) ||
                         null;
  },

  /**
   * Озвучивание блока текста с синхронной подсветкой предложений
   * @param {string} text - Текст для озвучки
   * @param {HTMLElement} targetElement - DOM-элемент, в котором подсвечиваются слова
   * @param {Function} onEndCallback - Callback по завершении
   */
  speakText(text, targetElement = null, onEndCallback = null) {
    this.stop();

    if (!text || !this.synth) return;

    // Подготовка текста (разбивка на предложения для предотвращения зависания движка)
    const cleanText = text.replace(/[\r\n]+/g, ' ').trim();
    this.currentUtterance = new SpeechSynthesisUtterance(cleanText);
    
    if (this.selectedVoice) {
      this.currentUtterance.voice = this.selectedVoice;
    }
    this.currentUtterance.lang = 'ru-RU';
    this.currentUtterance.rate = this.rate;
    this.currentUtterance.pitch = this.pitch;

    // Подготовка визуальной караоке-разметки
    let sentences = [];
    if (targetElement) {
      sentences = cleanText.match(/[^.!?]+[.!?]+/g) || [cleanText];
      targetElement.innerHTML = sentences.map((s, idx) => 
        `<span class="tts-sentence" id="tts-s-${idx}">${s}</span>`
      ).join(' ');
    }

    // Отслеживание границы фраз/слов
    let currentSentenceIdx = 0;
    this.currentUtterance.onboundary = (e) => {
      if (e.name === 'sentence' || e.name === 'word') {
        const charIdx = e.charIndex;
        // Находим текущее предложение по позиции символа
        let accumulatedLen = 0;
        for (let i = 0; i < sentences.length; i++) {
          accumulatedLen += sentences[i].length;
          if (charIdx < accumulatedLen) {
            if (currentSentenceIdx !== i) {
              currentSentenceIdx = i;
              this._highlightSentence(targetElement, currentSentenceIdx);
            }
            break;
          }
        }
      }
    };

    this.currentUtterance.onstart = () => {
      this.isSpeaking = true;
      this.isPaused = false;
      this._updateUIState(true);
      if (targetElement && sentences.length > 0) {
        this._highlightSentence(targetElement, 0);
      }
    };

    this.currentUtterance.onend = () => {
      this.isSpeaking = false;
      this.isPaused = false;
      this._updateUIState(false);
      this._clearHighlight(targetElement);
      if (onEndCallback) onEndCallback();
    };

    this.currentUtterance.onerror = () => {
      this.isSpeaking = false;
      this._updateUIState(false);
      this._clearHighlight(targetElement);
    };

    this.synth.speak(this.currentUtterance);
  },

  pause() {
    if (this.synth.speaking && !this.synth.paused) {
      this.synth.pause();
      this.isPaused = true;
      this._updateUIState(false);
    }
  },

  resume() {
    if (this.synth.paused) {
      this.synth.resume();
      this.isPaused = false;
      this._updateUIState(true);
    }
  },

  stop() {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
      this.isPaused = false;
      this._updateUIState(false);
    }
  },

  _highlightSentence(container, idx) {
    if (!container) return;
    container.querySelectorAll('.tts-sentence').forEach(el => el.classList.remove('active-reading'));
    const activeEl = container.querySelector(`#tts-s-${idx}`);
    if (activeEl) {
      activeEl.classList.add('active-reading');
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  },

  _clearHighlight(container) {
    if (!container) return;
    container.querySelectorAll('.tts-sentence').forEach(el => el.classList.remove('active-reading'));
  },

  _updateUIState(isPlaying) {
    const playBtn = document.getElementById('dossierTTSPlayBtn');
    if (playBtn) {
      playBtn.innerHTML = isPlaying 
        ? '<span class="tts-icon">⏸</span> Приостановить чтение' 
        : '<span class="tts-icon">🔊</span> Слушать диктора';
      playBtn.classList.toggle('tts-playing', isPlaying);
    }
  }
};

window.TTSNarrator = TTSNarrator;
document.addEventListener('DOMContentLoaded', () => TTSNarrator.init());