/**
 * ============================================================================
 * ДВИЖОК ИСТОРИЧЕСКОГО КВИЗА: js/quiz.js (v3.0 Master)
 * 10 вопросов, таймер, бейджи, Зал Славы с Supabase, сертификаты
 * ============================================================================
 */

'use strict';

const QUIZ_QUESTIONS = [
  {
    theme: "Специальности и позывные",
    text: "Выпускник какого отделения СРМК с красным дипломом, Шамиль Назыров, доставлял питьевую воду на передовую на автомобиле, прозванном бойцами «Машиной жизни»?",
    options: [
      "Электрооборудование и энергетика (электромонтер)",
      "Техническое обслуживание автотранспорта",
      "Пожарная безопасность и защита в ЧС",
      "Информационные системы и программирование"
    ],
    correct: 0,
    explanation: "Шамиль Назыров окончил колледж с отличием (красный диплом) по профессии электромонтера, параллельно освоив сварочное дело. В Херсонской области его водовоз бойцы уважительно называли «Машиной жизни»."
  },
  {
    theme: "География ТВД / Связь",
    text: "В каком секторе боевых действий 20-летний связист Никита Назаренко (выпускник IT-кафедры 2024 года) под шквальным огнем восстановил связь узлов управления 13 августа 2024 года?",
    options: [
      "Авдеевский укрепленный район",
      "Курское приграничье",
      "Антоновский мост через Днепр",
      "Времевский выступ"
    ],
    correct: 1,
    explanation: "Никита Назаренко — самый юный герой Мемориала Славы СРМК. Окончил IT-отделение в июне 2024 года и героически погиб 13 августа 2024 года при защите Курского приграничья."
  },
  {
    theme: "Военная медицина и ВДВ",
    text: "Какой подвиг совершил выпускник отделения спасателей 2016 года, разведчик-санитар 247-го полка ВДВ Николай Вечёрка 26 февраля 2022 года?",
    options: [
      "Уничтожил танк противника на Запорожском рубеже",
      "До последнего патрона спасал раненых в ожесточенном бою у Антоновского моста",
      "Провел инженерную разведку минных полей под Ореховом",
      "Обеспечил работу полевого узла связи в Марьинке"
    ],
    correct: 1,
    explanation: "26 февраля 2022 года в бою за Антоновский мост через Днепр Николай Вечёрка под непрерывным перекрестным огнем эвакуировал раненых товарищей и прикрывал отход группы до последнего вздоха."
  },
  {
    theme: "Государственные награды",
    text: "Какой точный номер государственной награды зафиксирован в архивном Указе Президента РФ в досье выпускника Дмитрия Самохина, отразившего танковый прорыв в марте 2022 года?",
    options: [
      "Орден Мужества № 83029",
      "Орден Мужества № 10420",
      "Медаль «За отвагу» № 55431",
      "Орден Жукова № 1205"
    ],
    correct: 0,
    explanation: "Указом Президента РФ от 26.03.2022 рядовой Дмитрий Самохин награжден Орденом Мужества № 83029 (посмертно)."
  },
  {
    theme: "Командирское мужество",
    text: "Какое решение принял староста группы спасателей МЧС, младший сержант Станислав Мартынов, в ходе штурма под Угледаром 17 июня 2023 года?",
    options: [
      "Приказал подразделению перейти к отступлению",
      "Принял командование штурмовой группой после ранения офицера и овладел опорным пунктом",
      "Навел понтонную переправу через водную преграду",
      "Организовал радиоперехват каналов противника"
    ],
    correct: 1,
    explanation: "Младший сержант Станислав Мартынов проявил лидерскую волю: взял командование штурмовой группой на себя, поднял бойцов в атаку и выбил врага с высоты ценой своей жизни."
  },
  {
    theme: "Сварочное дело и штурм",
    text: "Мастер сварочного производства (выпуск 2004 г.), ушедший на фронт добровольцем и ставший командиром штурмовиков при освобождении Авдеевки, это:",
    options: [
      "Константин Луценко",
      "Максим Елагин",
      "Максим Ярышев",
      "Илья Чупин"
    ],
    correct: 2,
    explanation: "Сержант Максим Ярышев руководил штурмовым отделением при прорыве авдеевских укрепрайонов. Кавалер медали «За отвагу» и Ордена Мужества."
  },
  {
    theme: "Инженерно-саперное дело",
    text: "Какую сложнейшую задачу на Запорожском фронте выполнял выпускник СРМК, сапер Константин Луценко?",
    options: [
      "Разминирование проходов в противотанковых минных полях для продвижения бронетехники",
      "Подвоз питьевой воды в автоцистерне на передовую",
      "Снайперское прикрытие позиций десанта",
      "Ремонт оптико-электронных прицелов бронемашин"
    ],
    correct: 0,
    explanation: "Сапер Константин Луценко под прямым огнем лично обезвредил десятки противотанковых мин, обеспечив прорыв наших бронегрупп без потерь техники."
  },
  {
    theme: "Награды за отвагу",
    text: "Какой высокой государственной воинской наградой за личное мужество в боях на Времевском выступе Александр Григорьев был награжден еще при жизни?",
    options: [
      "Медалью Жукова",
      "Медалью Суворова",
      "Медалью Ушакова",
      "Медалью «За храбрость» I степени"
    ],
    correct: 1,
    explanation: "Старший стрелок Александр Григорьев за мужество в боях был при жизни удостоен медали Суворова, а посмертно — Ордена Мужества."
  },
  {
    theme: "Танковые войска",
    text: "В качестве кого совершил ратный подвиг при прорыве эшелонированной обороны в ДНР выпускник машиностроительного отделения Игорь Лукьяненко?",
    options: [
      "Командир батареи РСЗО «Град»",
      "Механик-водитель танка Т-72Б3",
      "Наводчик орудия самоходной артиллерии",
      "Оператор разведывательного беспилотника"
    ],
    correct: 1,
    explanation: "Игорь Лукьяненко проявил мастерство механика-водителя танка: несмотря на попадание снаряда, он потушил пожар изнутри и вывел машину на рубеж подавления огневых точек врага."
  },
  {
    theme: "Морская пехота",
    text: "На каком рубеже боевых действий морской пехотинец Иван Сербиенко выполнил боевую задачу, обеспечив высадку и прикрытие группы с воды?",
    options: [
      "Днепровский рубеж (плацдарм на Днепре)",
      "Бахмутское направление",
      "Курское приграничье",
      "Покровское направление"
    ],
    correct: 0,
    explanation: "Рядовой морской пехоты Иван Сербиенко участвовал в десантных операциях на островах и левом берегу Днепра, обеспечив прикрытие группы под ударами вражеских дронов."
  }
];

// Конфигурация бейджей
const BADGES_CONFIG = [
  { id: 'first_blood', title: 'Первая кровь', icon: '⚔️', desc: 'Ответить на первый вопрос правильно', condition: (stats) => stats.correctFirst },
  { id: 'perfect_score', title: 'Безупречный', icon: '🏆', desc: '100% правильных ответов', condition: (stats) => stats.score === 100 },
  { id: 'speed_demon', title: 'Скорострел', icon: '⚡', desc: 'Среднее время ответа < 10 сек', condition: (stats) => stats.avgTime < 10 },
  { id: 'thinker', title: 'Мыслитель', icon: '🧠', desc: 'Все ответы после 20-й секунды', condition: (stats) => stats.allSlow },
  { id: 'survivor', title: 'Выживший', icon: '🛡️', desc: 'Ни одной ошибки', condition: (stats) => stats.wrong === 0 },
  { id: 'patriot', title: 'Патриот', icon: '🇷🇺', desc: 'Пройти квиз 5 раз', condition: (stats) => stats.plays >= 5 },
  { id: 'expert', title: 'Эксперт', icon: '🎖️', desc: 'Счет 80+ баллов', condition: (stats) => stats.score >= 80 },
  { id: 'legend', title: 'Легенда', icon: '👑', desc: 'Счет 100 баллов за 150 секунд', condition: (stats) => stats.score === 100 && stats.totalTime < 150 }
];

const QuizApp = {
  // Состояние игры
  currentQuestionIdx: 0,
  score: 0,
  correctCount: 0,
  wrongCount: 0,
  isAnswerLocked: false,
  playerName: '',
  
  // Таймер
  timer: 30,
  timerInterval: null,
  questionStartTime: 0,
  answerTimes: [],
  totalTime: 0,
  
  // Аудио
  audioContext: null,
  
  // Статистика игрока (для бейджей)
  playerStats: {
    plays: 0,
    bestScore: 0,
    unlockedBadges: []
  },

  /**
   * Инициализация приложения
   */
  init() {
    console.log("[QuizApp] Викторина инициализирована");
    this.loadPlayerStats();
    this.bindEvents();
    this.renderBadges([]);
  },

  /**
   * Загрузка статистики игрока из localStorage
   */
  loadPlayerStats() {
    const saved = localStorage.getItem('srmk_quiz_stats');
    if (saved) {
      this.playerStats = JSON.parse(saved);
    }
  },

  /**
   * Сохранение статистики игрока
   */
  savePlayerStats() {
    localStorage.setItem('srmk_quiz_stats', JSON.stringify(this.playerStats));
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

    // Поле имени
    const nameInput = document.getElementById('playerName');
    if (nameInput) {
      nameInput.addEventListener('input', (e) => {
        const error = document.getElementById('nameError');
        if (e.target.value.trim().length < 2) {
          error.style.display = 'block';
          startBtn.disabled = true;
        } else {
          error.style.display = 'none';
          startBtn.disabled = false;
        }
      });
    }
  },

  /**
   * Старт викторины
   */
  startQuiz() {
    const nameInput = document.getElementById('playerName');
    const name = nameInput.value.trim();
    
    if (name.length < 2) {
      alert('Пожалуйста, введите корректное имя (минимум 2 символа)');
      return;
    }

    this.playerName = name;
    this.currentQuestionIdx = 0;
    this.score = 0;
    this.correctCount = 0;
    this.wrongCount = 0;
    this.answerTimes = [];
    this.totalTime = 0;
    
    // Переключение экранов
    document.getElementById('welcomeScreen').style.display = 'none';
    document.getElementById('resultScreen').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'block';

    // Обновление UI
    document.getElementById('currentScore').textContent = '0';
    
    // Загрузка первого вопроса
    this.loadQuestion();
  },

  /**
   * Загрузка вопроса
   */
  loadQuestion() {
    this.isAnswerLocked = false;
    this.timer = 30;
    this.questionStartTime = Date.now();
    
    const q = QUIZ_QUESTIONS[this.currentQuestionIdx];
    
    // Прогресс бар
    const progressPercent = ((this.currentQuestionIdx) / QUIZ_QUESTIONS.length) * 100;
    document.getElementById('progressBar').style.width = `${progressPercent}%`;
    
    // Таймер
    document.getElementById('timer').textContent = this.timer;
    document.getElementById('timer').parentElement.classList.remove('warning');
    
    // Текст вопроса
    document.getElementById('questionText').textContent = q.text;
    
    // Варианты ответов
    const container = document.getElementById('optionsContainer');
    container.innerHTML = '';
    
    q.options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.innerHTML = `<span>${opt}</span>`;
      btn.addEventListener('click', () => this.handleAnswer(idx, btn));
      container.appendChild(btn);
    });
    
    // Запуск таймера
    this.startTimer();
  },

  /**
   * Запуск таймера вопроса
   */
  startTimer() {
    clearInterval(this.timerInterval);
    
    this.timerInterval = setInterval(() => {
      this.timer--;
      document.getElementById('timer').textContent = this.timer;
      
      if (this.timer <= 10) {
        document.getElementById('timer').parentElement.classList.add('warning');
      }
      
      if (this.timer <= 0) {
        this.handleTimeout();
      }
    }, 1000);
  },

  /**
   * Обработка истечения времени
   */
  handleTimeout() {
    clearInterval(this.timerInterval);
    this.isAnswerLocked = true;
    this.wrongCount++;
    this.answerTimes.push(30);
    
    const q = QUIZ_QUESTIONS[this.currentQuestionIdx];
    const buttons = document.querySelectorAll('.option-btn');
    buttons[q.correct].classList.add('correct');
    
    this.playSound('wrong');
    this.showExplanation(false, q.explanation);
    
    setTimeout(() => this.nextQuestion(), 3000);
  },

  /**
   * Обработка ответа
   */
  handleAnswer(selectedIdx, btnElement) {
    if (this.isAnswerLocked) return;
    
    this.isAnswerLocked = true;
    clearInterval(this.timerInterval);
    
    const timeTaken = (Date.now() - this.questionStartTime) / 1000;
    this.answerTimes.push(timeTaken);
    this.totalTime += timeTaken;
    
    const q = QUIZ_QUESTIONS[this.currentQuestionIdx];
    const isCorrect = selectedIdx === q.correct;
    
    // Блокировка всех кнопок
    document.querySelectorAll('.option-btn').forEach(b => {
      b.style.pointerEvents = 'none';
      if (b === btnElement) {
        b.classList.add(isCorrect ? 'correct' : 'wrong');
      }
      if (isCorrect && b !== btnElement) {
        // Показать правильный ответ если ошиблись
      }
    });
    
    if (isCorrect) {
      this.correctCount++;
      // Расчет очков: база 10 + бонус за скорость (макс 5)
      const speedBonus = Math.max(0, Math.floor((30 - timeTaken) / 6));
      const points = 10 + speedBonus;
      this.score += points;
      document.getElementById('currentScore').textContent = this.score;
      this.playSound('correct');
    } else {
      this.wrongCount++;
      document.querySelectorAll('.option-btn')[q.correct].classList.add('correct');
      this.playSound('wrong');
    }
    
    this.showExplanation(isCorrect, q.explanation);
    
    setTimeout(() => this.nextQuestion(), 3000);
  },

  /**
   * Показ объяснения
   */
  showExplanation(isCorrect, explanation) {
    // Создаем или обновляем элемент объяснения
    let expBox = document.getElementById('explanationBox');
    if (!expBox) {
      expBox = document.createElement('div');
      expBox.id = 'explanationBox';
      expBox.className = 'explanation-box';
      expBox.style.cssText = 'background:#f8f9fa;padding:1rem;border-radius:8px;margin-top:1rem;border-left:4px solid #d4af37;';
      document.querySelector('.question-card').appendChild(expBox);
    }
    
    expBox.innerHTML = `
      <div style="font-weight:bold;color:${isCorrect ? '#388e3c' : '#d32f2f'};margin-bottom:0.5rem">
        ${isCorrect ? '✓ ВЕРНО!' : '✗ ОШИБКА'}
      </div>
      <div style="color:#666;font-size:0.95rem">${explanation}</div>
    `;
    expBox.style.display = 'block';
  },

  /**
   * Переход к следующему вопросу
   */
  nextQuestion() {
    this.currentQuestionIdx++;
    
    if (this.currentQuestionIdx < QUIZ_QUESTIONS.length) {
      // Удаляем объяснение
      const expBox = document.getElementById('explanationBox');
      if (expBox) expBox.remove();
      this.loadQuestion();
    } else {
      this.finishQuiz();
    }
  },

  /**
   * Завершение викторины
   */
  finishQuiz() {
    clearInterval(this.timerInterval);
    document.getElementById('gameScreen').style.display = 'none';
    document.getElementById('resultScreen').style.display = 'block';
    
    // Максимальный счет = 150 (10 вопросов * 15 макс очков)
    const maxScore = 150;
    const finalScore = Math.min(100, Math.round((this.score / maxScore) * 100));
    
    document.getElementById('finalScoreValue').textContent = finalScore;
    
    // Сообщение по результату
    let message = '';
    if (finalScore >= 90) message = 'Великолепно! Вы настоящий эксперт!';
    else if (finalScore >= 70) message = 'Отличный результат! Так держать!';
    else if (finalScore >= 50) message = 'Хорошо, но есть куда расти.';
    else message = 'Попробуйте еще раз, знания придут!';
    
    document.getElementById('resultMessage').textContent = message;
    
    // Проверка и отображение бейджей
    this.checkAndShowBadges(finalScore);
    
    // Сохранение результата
    this.saveResult(finalScore);
    
    // Воспроизведение звука
    if (finalScore >= 70) {
      this.playSound('fanfare');
    }
  },

  /**
   * Проверка и отображение бейджей
   */
  checkAndShowBadges(finalScore) {
    const avgTime = this.answerTimes.length > 0 
      ? this.answerTimes.reduce((a, b) => a + b, 0) / this.answerTimes.length 
      : 0;
    
    const stats = {
      correctFirst: this.answerTimes[0] !== undefined && this.answerTimes[0] < 30,
      score: finalScore,
      avgTime: avgTime,
      allSlow: this.answerTimes.every(t => t > 20),
      wrong: this.wrongCount,
      plays: this.playerStats.plays + 1,
      totalTime: this.totalTime
    };
    
    const newlyUnlocked = [];
    
    BADGES_CONFIG.forEach(badge => {
      if (!this.playerStats.unlockedBadges.includes(badge.id) && badge.condition(stats)) {
        this.playerStats.unlockedBadges.push(badge.id);
        newlyUnlocked.push(badge);
      }
    });
    
    // Обновление статистики
    this.playerStats.plays++;
    this.playerStats.bestScore = Math.max(this.playerStats.bestScore, finalScore);
    this.savePlayerStats();
    
    // Отображение всех открытых бейджей
    this.renderBadges(this.playerStats.unlockedBadges, newlyUnlocked);
  },

  /**
   * Отрисовка бейджей
   */
  renderBadges(unlockedIds, newlyUnlocked = []) {
    const container = document.getElementById('badgesContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    BADGES_CONFIG.forEach(badge => {
      const isUnlocked = unlockedIds.includes(badge.id);
      const isNew = newlyUnlocked.some(b => b.id === badge.id);
      
      const card = document.createElement('div');
      card.className = `badge-card${isUnlocked ? ' unlocked' : ''}`;
      if (isNew) {
        card.style.animation = 'pulse 0.5s ease-in-out 2';
      }
      
      card.innerHTML = `
        <span class="badge-icon">${badge.icon}</span>
        <span class="badge-title">${badge.title}</span>
        <span class="badge-desc">${badge.desc}</span>
        ${isNew ? '<span style="display:block;font-size:0.7rem;color:#d4af37;margin-top:0.25rem">★ НОВЫЙ ★</span>' : ''}
      `;
      
      container.appendChild(card);
    });
  },

  /**
   * Сохранение результата в Supabase
   */
  async saveResult(finalScore) {
    // Сохранение в облако
    if (typeof CloudSync !== 'undefined' && CloudSync.isLive) {
      try {
        await CloudSync.saveQuizResult(this.playerName, finalScore);
        console.log('[QuizApp] Результат сохранен в облаке');
      } catch (e) {
        console.warn('[QuizApp] Не удалось сохранить в облако:', e);
      }
    }
    
    // Локальное сохранение для лидерборда
    this.saveToLocalLeaderboard(finalScore);
    
    // Загрузка обновленного лидерборда
    this.loadAndRenderLeaderboard('all');
  },

  /**
   * Сохранение в локальный лидерборд
   */
  saveToLocalLeaderboard(score) {
    const leaderboard = JSON.parse(localStorage.getItem('srmk_quiz_leaderboard') || '[]');
    leaderboard.push({
      name: this.playerName,
      score: score,
      date: new Date().toISOString()
    });
    // Сортировка и ограничение
    leaderboard.sort((a, b) => b.score - a.score);
    localStorage.setItem('srmk_quiz_leaderboard', JSON.stringify(leaderboard.slice(0, 50)));
  },

  /**
   * Загрузка и отображение лидерборда
   */
  async loadAndRenderLeaderboard(period = 'all') {
    const tbody = document.getElementById('leaderboardEntries');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center">Загрузка...</td></tr>';
    
    let entries = [];
    
    // Попытка загрузить из Supabase
    if (typeof CloudSync !== 'undefined' && CloudSync.isLive) {
      try {
        const { data, error } = await CloudSync.client
          .from('quiz_leaderboard')
          .select('*')
          .order('score', { ascending: false })
          .limit(20);
        
        if (!error && data) {
          entries = data.map(row => ({
            name: row.student_name,
            score: row.score,
            date: row.created_at || new Date().toISOString()
          }));
        }
      } catch (e) {
        console.warn('[QuizApp] Ошибка загрузки из облака:', e);
      }
    }
    
    // Если нет данных из облака, используем локальные
    if (entries.length === 0) {
      entries = JSON.parse(localStorage.getItem('srmk_quiz_leaderboard') || '[]');
    }
    
    // Фильтрация по периоду
    const now = new Date();
    const cutoffs = {
      week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      month: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    };
    
    if (period !== 'all') {
      entries = entries.filter(e => new Date(e.date) >= cutoffs[period]);
    }
    
    // Отрисовка
    if (entries.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center">Пока нет результатов</td></tr>';
      return;
    }
    
    tbody.innerHTML = entries.slice(0, 10).map((entry, idx) => {
      const rankClass = idx < 3 ? `rank-${idx + 1}` : '';
      const rankDisplay = idx < 3 ? ['🥇', '🥈', '🥉'][idx] : `#${idx + 1}`;
      const date = new Date(entry.date).toLocaleDateString('ru-RU');
      
      return `
        <tr>
          <td class="rank-cell ${rankClass}">${rankDisplay}</td>
          <td>${this.escapeHtml(entry.name)}</td>
          <td><strong>${entry.score}</strong></td>
          <td style="font-size:0.85rem;color:#666">${date}</td>
        </tr>
      `;
    }).join('');
  },

  /**
   * Экранирование HTML
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  /**
   * Рестарт викторины
   */
  restartQuiz() {
    document.getElementById('resultScreen').style.display = 'none';
    document.getElementById('welcomeScreen').style.display = 'block';
  },

  /**
   * Поделиться результатом
   */
  shareResult() {
    const score = document.getElementById('finalScoreValue').textContent;
    const text = `Я набрал ${score} баллов в викторине "Герои СРМК"! Проверь свои знания: ${window.location.href}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Викторина "Герои СРМК"',
        text: text,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(text);
      alert('Результат скопирован в буфер обмена!');
    }
  },

  /**
   * Воспроизведение звуков
   */
  playSound(type) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.audioContext) this.audioContext = new AudioCtx();
      if (this.audioContext.state === 'suspended') this.audioContext.resume();

      const ctx = this.audioContext;
      const now = ctx.currentTime;

      if (type === 'correct') {
        [659.25, 830.61, 987.77].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.08);
          gain.gain.setValueAtTime(0.12, now + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.08);
          osc.stop(now + i * 0.08 + 0.35);
        });
      } else if (type === 'wrong') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(110, now + 0.25);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'fanfare') {
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + i * 0.12);
          gain.gain.setValueAtTime(0.2, now + i * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.6);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.12);
          osc.stop(now + i * 0.12 + 0.6);
        });
      }
    } catch (e) {}
  }
};

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  QuizApp.init();
});