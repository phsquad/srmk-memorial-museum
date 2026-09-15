/**
 * ============================================================================
 * ДВИЖОК ВИКТОРИНЫ "ГЕРОИ СРМК" (v2.0)
 * На основе вопросов из Книги Памяти (js/quiz-questions.js)
 * Интеграция с Залом Славы, бейджами и сертификатами
 * ============================================================================
 */

'use strict';

const QuizApp = {
  // Состояние приложения
  currentQuestionIdx: 0,
  score: 0,
  totalQuestions: 20, // Количество вопросов в одной игре (все вопросы из QUIZ_QUESTIONS)
  timer: null,
  timeLeft: 30,
  isAnswerLocked: false,
  playerName: '',
  startTime: 0,
  
  // Результаты текущей игры
  answers: [],
  
  // Бейджи игрока
  badges: [],
  
  /**
   * Инициализация при загрузке страницы
   */
  init() {
    console.log('[QuizApp] Викторина инициализирована');
    this.loadBadges();
    this.bindEvents();
    this.renderBadgesPreview();
  },
  
  /**
   * Привязка обработчиков событий
   */
  bindEvents() {
    // Кнопка старта
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
      startBtn.addEventListener('click', () => this.startQuiz());
    }
    
    // Кнопка рестарта
    const restartBtn = document.getElementById('restartBtn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => this.restartQuiz());
    }
    
    // Кнопка поделиться
    const shareBtn = document.getElementById('shareBtn');
    if (shareBtn) {
      shareBtn.addEventListener('click', () => this.shareResult());
    }
  },
  
  /**
   * Загрузка бейджей из localStorage
   */
  loadBadges() {
    const saved = localStorage.getItem('srmk_quiz_badges');
    if (saved) {
      this.badges = JSON.parse(saved);
    } else {
      this.badges = [];
    }
  },
  
  /**
   * Сохранение бейджей
   */
  saveBadges() {
    localStorage.setItem('srmk_quiz_badges', JSON.stringify(this.badges));
  },
  
  /**
   * Проверка и разблокировка бейджей
   */
  checkBadges(finalScore, totalTime) {
    const newBadges = [];
    const date = new Date().toISOString().split('T')[0];
    
    // Бейдж "Первый шаг" - за прохождение викторины
    if (!this.hasBadge('first_step')) {
      newBadges.push({ id: 'first_step', name: 'Первый шаг', icon: '🎖️', date });
    }
    
    // Бейдж "Эксперт" - за 100% результат
    if (finalScore === 100 && !this.hasBadge('expert')) {
      newBadges.push({ id: 'expert', name: 'Эксперт', icon: '🏆', date });
    }
    
    // Бейдж "Знаток" - за 80-99%
    if (finalScore >= 80 && finalScore < 100 && !this.hasBadge('expert')) {
      if (!this.hasBadge('knower')) {
        newBadges.push({ id: 'knower', name: 'Знаток', icon: '📚', date });
      }
    }
    
    // Бейдж "Скорострел" - за быстрое прохождение
    if (totalTime < 150 && !this.hasBadge('speedster')) {
      newBadges.push({ id: 'speedster', name: 'Скорострел', icon: '⚡', date });
    }
    
    // Бейдж "Патриот" - за 5 прохождений
    const gamesCount = parseInt(localStorage.getItem('srmk_quiz_games') || '0');
    if (gamesCount >= 5 && !this.hasBadge('patriot')) {
      newBadges.push({ id: 'patriot', name: 'Патриот', icon: '🇷🇺', date });
    }
    
    // Бейдж "Историк" - за 10 прохождений
    if (gamesCount >= 10 && !this.hasBadge('historian')) {
      newBadges.push({ id: 'historian', name: 'Историк', icon: '📜', date });
    }
    
    // Бейдж "Боец" - за идеальный ответ на вопрос о ВДВ
    if (this.answers.some(a => a.theme.includes('ВДВ') && a.isCorrect) && !this.hasBadge('fighter')) {
      newBadges.push({ id: 'fighter', name: 'Боец', icon: '🪂', date });
    }
    
    // Бейдж "Герой" - за все предыдущие бейджи
    const allBadgeIds = ['first_step', 'expert', 'knower', 'speedster', 'patriot', 'historian', 'fighter'];
    const hasAllBadges = allBadgeIds.every(id => this.hasBadge(id));
    if (hasAllBadges && !this.hasBadge('hero')) {
      newBadges.push({ id: 'hero', name: 'Герой', icon: '⭐', date });
    }
    
    if (newBadges.length > 0) {
      this.badges.push(...newBadges);
      this.saveBadges();
    }
    
    return newBadges;
  },
  
  /**
   * Проверка наличия бейджа
   */
  hasBadge(badgeId) {
    return this.badges.some(b => b.id === badgeId);
  },
  
  /**
   * Предпросмотр бейджей на экране результатов
   */
  renderBadgesPreview() {
    // Будет вызвано после завершения викторины
  },
  
  /**
   * Старт викторины
   */
  startQuiz() {
    const nameInput = document.getElementById('playerName');
    const nameError = document.getElementById('nameError');
    
    if (!nameInput || !nameInput.value.trim()) {
      if (nameError) nameError.style.display = 'block';
      return;
    }
    
    this.playerName = nameInput.value.trim();
    
    // Увеличиваем счетчик игр
    const gamesCount = parseInt(localStorage.getItem('srmk_quiz_games') || '0');
    localStorage.setItem('srmk_quiz_games', String(gamesCount + 1));
    
    // Сброс состояния
    this.currentQuestionIdx = 0;
    this.score = 0;
    this.answers = [];
    this.isAnswerLocked = false;
    
    // Переключение экранов
    document.getElementById('welcomeScreen').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'block';
    document.getElementById('resultScreen').style.display = 'none';
    
    // Загрузка первого вопроса
    this.loadQuestion();
  },
  
  /**
   * Загрузка вопроса
   */
  loadQuestion() {
    if (this.currentQuestionIdx >= this.totalQuestions) {
      this.finishQuiz();
      return;
    }
    
    this.isAnswerLocked = false;
    this.timeLeft = 30;
    this.startTime = Date.now();
    
    // Перемешиваем вопросы при каждом запуске викторины
    if (this.currentQuestionIdx === 0 && !this.shuffledQuestions) {
      this.shuffledQuestions = [...QUIZ_QUESTIONS].sort(() => Math.random() - 0.5);
    }
    
    // Получаем вопрос из перемешанного массива
    const question = this.shuffledQuestions[this.currentQuestionIdx];
    
    // Обновляем UI
    document.getElementById('questionText').textContent = question.text;
    document.getElementById('currentScore').textContent = this.score;
    document.getElementById('timer').textContent = this.timeLeft;
    
    // Прогресс-бар
    const progress = ((this.currentQuestionIdx) / this.totalQuestions) * 100;
    document.getElementById('progressBar').style.width = `${progress}%`;
    
    // Генерация кнопок ответов
    const container = document.getElementById('optionsContainer');
    container.innerHTML = '';
    
    question.options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.textContent = opt;
      btn.onclick = () => this.selectAnswer(idx, btn);
      container.appendChild(btn);
    });
    
    // Запуск таймера
    this.startTimer();
  },
  
  /**
   * Таймер обратного отсчета
   */
  startTimer() {
    if (this.timer) clearInterval(this.timer);
    
    this.timer = setInterval(() => {
      this.timeLeft--;
      document.getElementById('timer').textContent = this.timeLeft;
      
      if (this.timeLeft <= 0) {
        this.autoSkip();
      }
    }, 1000);
  },
  
  /**
   * Автоматический переход при истечении времени
   */
  autoSkip() {
    clearInterval(this.timer);
    this.isAnswerLocked = true;
    
    const question = this.shuffledQuestions[this.currentQuestionIdx];
    this.answers.push({
      questionId: question.id,
      theme: question.theme,
      isCorrect: false,
      timeSpent: 30
    });
    
    // Показываем правильный ответ
    const buttons = document.querySelectorAll('.option-btn');
    if (buttons[question.correct]) {
      buttons[question.correct].classList.add('correct');
    }
    
    setTimeout(() => {
      this.nextQuestion();
    }, 2000);
  },
  
  /**
   * Выбор ответа
   */
  selectAnswer(selectedIdx, btnElement) {
    if (this.isAnswerLocked) return;
    
    clearInterval(this.timer);
    this.isAnswerLocked = true;
    
    const timeSpent = Math.floor((Date.now() - this.startTime) / 1000);
    const question = this.shuffledQuestions[this.currentQuestionIdx];
    const isCorrect = (selectedIdx === question.correct);
    
    // Подсчет очков с бонусом за скорость
    if (isCorrect) {
      const basePoints = 10;
      const speedBonus = Math.max(0, Math.floor((30 - timeSpent) / 3));
      this.score += basePoints + speedBonus;
      btnElement.classList.add('correct');
    } else {
      btnElement.classList.add('wrong');
      // Показываем правильный ответ
      const buttons = document.querySelectorAll('.option-btn');
      if (buttons[question.correct]) {
        buttons[question.correct].classList.add('correct');
      }
    }
    
    // Сохраняем результат
    this.answers.push({
      questionId: question.id,
      theme: question.theme,
      isCorrect,
      timeSpent
    });
    
    document.getElementById('currentScore').textContent = this.score;
    
    // Переход к следующему вопросу
    setTimeout(() => {
      this.nextQuestion();
    }, 1500);
  },
  
  /**
   * Следующий вопрос
   */
  nextQuestion() {
    this.currentQuestionIdx++;
    this.loadQuestion();
  },
  
  /**
   * Завершение викторины
   */
  finishQuiz() {
    clearInterval(this.timer);
    
    const totalTime = this.answers.reduce((sum, a) => sum + a.timeSpent, 0);
    const maxScore = this.totalQuestions * 10;
    const percentage = Math.round((this.score / maxScore) * 100);
    
    // Проверка бейджей
    const newBadges = this.checkBadges(percentage, totalTime);
    
    // Обновление UI
    document.getElementById('gameScreen').style.display = 'none';
    document.getElementById('resultScreen').style.display = 'block';
    
    document.getElementById('finalScoreValue').textContent = this.score;
    
    // Сообщение о результате
    let message = '';
    if (percentage >= 90) {
      message = '🏆 Великолепно! Вы настоящий знаток истории героев СРМК!';
    } else if (percentage >= 70) {
      message = '🎖 Отличный результат! Вы хорошо знаете историю героев.';
    } else if (percentage >= 50) {
      message = '📚 Хорошая попытка! Изучите Книгу Памяти и попробуйте снова.';
    } else {
      message = '💪 Не сдавайтесь! Прочитайте истории героев и вернитесь снова.';
    }
    document.getElementById('resultMessage').textContent = message;
    
    // Отображение новых бейджей
    this.renderEarnedBadges(newBadges);
    
    // Сохранение результата в лидерборд
    this.saveToLeaderboard();
  },
  
  /**
   * Рендер заработанных бейджей
   */
  renderEarnedBadges(newBadges) {
    const container = document.getElementById('badgesContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (newBadges.length === 0) {
      container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666;">В этот раз новых бейджей не получено. Продолжайте учиться!</p>';
      return;
    }
    
    newBadges.forEach(badge => {
      const card = document.createElement('div');
      card.className = 'badge-card unlocked';
      card.innerHTML = `
        <span class="badge-icon">${badge.icon}</span>
        <div class="badge-title">${badge.name}</div>
        <div class="badge-desc">Получен ${new Date(badge.date).toLocaleDateString('ru-RU')}</div>
      `;
      container.appendChild(card);
    });
  },
  
  /**
   * Сохранение в лидерборд
   */
  async saveToLeaderboard() {
    const result = {
      name: this.playerName,
      score: this.score,
      date: new Date().toISOString(),
      questions: this.answers
    };
    
    // Сохранение локально
    const localResults = JSON.parse(localStorage.getItem('srmk_quiz_results') || '[]');
    localResults.push(result);
    localStorage.setItem('srmk_quiz_results', JSON.stringify(localResults));
    
    // Сохранение в облако (если доступен CloudSync)
    if (typeof CloudSync !== 'undefined' && CloudSync.isLive) {
      try {
        await CloudSync.saveQuizResult(this.playerName, this.score);
      } catch (e) {
        console.error('[QuizApp] Ошибка сохранения в облако:', e);
      }
    }
    
    // Обновление лидерборда на странице
    this.loadAndRenderLeaderboard('all');
  },
  
  /**
   * Загрузка и отображение лидерборда
   */
  async loadAndRenderLeaderboard(period) {
    const tbody = document.getElementById('leaderboardEntries');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center">Загрузка...</td></tr>';
    
    let results = [];
    
    // Получаем данные из CloudSync или локально
    if (typeof CloudSync !== 'undefined' && CloudSync.isLive) {
      try {
        results = await CloudSync.getLeaderboard(period);
      } catch (e) {
        console.error('[QuizApp] Ошибка загрузки лидерборда:', e);
        results = this.getLocalLeaderboard(period);
      }
    } else {
      results = this.getLocalLeaderboard(period);
    }
    
    if (results.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center">Пока нет результатов. Будьте первыми!</td></tr>';
      return;
    }
    
    tbody.innerHTML = '';
    results.slice(0, 10).forEach((entry, idx) => {
      const tr = document.createElement('tr');
      const rankClass = idx === 0 ? 'rank-1' : idx === 1 ? 'rank-2' : idx === 2 ? 'rank-3' : '';
      const date = new Date(entry.date).toLocaleDateString('ru-RU');
      
      tr.innerHTML = `
        <td class="${rankClass}">${idx + 1}</td>
        <td>${this.escapeHtml(entry.name)}</td>
        <td><strong>${entry.score}</strong></td>
        <td>${date}</td>
      `;
      tbody.appendChild(tr);
    });
  },
  
  /**
   * Локальный лидерборд
   */
  getLocalLeaderboard(period) {
    const all = JSON.parse(localStorage.getItem('srmk_quiz_results') || '[]');
    
    if (period === 'week') {
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      return all.filter(r => new Date(r.date).getTime() > weekAgo)
                .sort((a, b) => b.score - a.score);
    }
    
    if (period === 'month') {
      const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      return all.filter(r => new Date(r.date).getTime() > monthAgo)
                .sort((a, b) => b.score - a.score);
    }
    
    return all.sort((a, b) => b.score - a.score);
  },
  
  /**
   * Рестарт викторины
   */
  restartQuiz() {
    // Сброс перемешанных вопросов для новой игры
    this.shuffledQuestions = null;
    this.currentQuestionIdx = 0;
    
    document.getElementById('resultScreen').style.display = 'none';
    document.getElementById('welcomeScreen').style.display = 'block';
    document.getElementById('playerName').value = '';
  },
  
  /**
   * Поделиться результатом
   */
  shareResult() {
    const text = `Я набрал ${this.score} баллов в викторине "Герои СРМК"! Проверь свои знания о выпускниках нашего колледжа, погибших в годы Великой Отечественной войны и СВО.`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Викторина "Герои СРМК"',
        text: text,
        url: window.location.href
      }).catch(console.error);
    } else {
      // Копирование в буфер
      navigator.clipboard.writeText(text + ' ' + window.location.href)
        .then(() => alert('Результат скопирован в буфер обмена!'))
        .catch(console.error);
    }
  },
  
  /**
   * Экранирование HTML
   */
  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
  QuizApp.init();
});