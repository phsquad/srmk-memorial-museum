/**
 * ============================================================================
 * ДВИЖОК ИСТОРИЧЕСКОГО КВЕСТА: js/quiz.js (v2.0 Ultra Enterprise)
 * Мемориальный комплекс ГБПОУ СРМК «Быть воином — жить вечно»
 * 
 * Включает:
 * 1. 10 канонических вопросов о подвигах 20 героев колледжа
 * 2. Web Audio процедурный синтез триумфальных и сигнальных звуков
 * 3. Realtime-сохранение в Зал Славы (Supabase) + LocalStorage Fallback
 * 4. Наградную систему бейджей и автоматический шлюз в certificate.html
 * ============================================================================
 */

'use strict';

const SafeStorage = {
  get: (key) => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn('LocalStorage недоступен:', e);
      return null;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.warn('Не удалось сохранить в LocalStorage:', e);
      return false;
    }
  }
};

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
    explanation: "Шамиль Назыров окончил колледж с отличием (красный диплом) по профессии электромонтера, параллельно освоив сварочное дело. В Херсонской области его автоцистерну бойцы с надеждой назвали «Машиной жизни»."
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

const QuizEngine = {
  currentQuestionIdx: 0,
  score: 0,
  isAnswerLocked: false,
  audioContext: null,

  participant: {
    name: "",
    group: "",
    specialty: ""
  },

  init() {
    this.bindEvents();
    this.loadBadges();
    this.loadLeaderboard();
    console.log("[QuizEngine v2.0] Модуль исторического квеста готов.");
  },

  bindEvents() {
    document.getElementById('startQuestBtn')?.addEventListener('click', () => this.startQuest());
    document.getElementById('nextQuestionBtn')?.addEventListener('click', () => this.nextQuestion());
    document.getElementById('restartQuestBtn')?.addEventListener('click', () => this.restartQuest());
    document.getElementById('btnClaimCert')?.addEventListener('click', () => this.claimCertificate());

    // Автозаполнение имени, если оно сохранено ранее
    const savedName = SafeStorage.get('srmk_quiz_user_name');
    const savedGroup = SafeStorage.get('srmk_quiz_user_group');
    if (savedName && document.getElementById('participantName')) {
      document.getElementById('participantName').value = savedName;
    }
    if (savedGroup && document.getElementById('participantGroup')) {
      document.getElementById('participantGroup').value = savedGroup;
    }
  },

  /**
   * 1. Процедурный синтез звуков (Web Audio API)
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
        // Триумфальный мажорный перезвон (E5 -> G#5 -> B5)
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
        // Низкий тон ошибки
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(110, now + 0.25);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'fanfare') {
        // Победные фанфары (C5 -> E5 -> G5 -> C6)
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
    } catch (e) {
      console.warn('[Web Audio] Синтезатор звука недоступен:', e);
    }
  },

  /**
   * 2. Старт квеста
   */
  startQuest() {
    const nameInput = document.getElementById('participantName')?.value.trim();
    const groupInput = document.getElementById('participantGroup')?.value.trim();
    const specSelect = document.getElementById('participantSpecialty')?.value || "09.02.11 Разработка ПО";

    if (!nameInput || !groupInput) {
      this.showToast('Пожалуйста, укажите ваши ФИО и группу для оформления наградного сертификата!');
      return;
    }

    this.participant.name = nameInput;
    this.participant.group = groupInput;
    this.participant.specialty = specSelect;

    SafeStorage.set('srmk_quiz_user_name', nameInput);
    SafeStorage.set('srmk_quiz_user_group', groupInput);

    this.currentQuestionIdx = 0;
    this.score = 0;

    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('resultScreen').style.display = 'none';
    document.getElementById('questionScreen').style.display = 'block';

    this.renderQuestion();
  },

  /**
   * 3. Отрисовка текущего вопроса
   */
  renderQuestion() {
    this.isAnswerLocked = false;
    const q = QUIZ_QUESTIONS[this.currentQuestionIdx];

    const progressPercent = ((this.currentQuestionIdx) / QUIZ_QUESTIONS.length) * 100;
    const bar = document.getElementById('quizProgressBar');
    if (bar) bar.style.width = `${progressPercent}%`;

    document.getElementById('qNumberDisplay').textContent = `Вопрос ${this.currentQuestionIdx + 1} из ${QUIZ_QUESTIONS.length}`;
    document.getElementById('qThemeBadge').textContent = q.theme;
    document.getElementById('qScoreDisplay').textContent = `Баллы: ${this.score}`;
    document.getElementById('questionTextDisplay').textContent = q.text;

    document.getElementById('explanationBox').style.display = 'none';

    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = '';

    const letters = ['А', 'Б', 'В', 'Г'];
    q.options.forEach((optText, idx) => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.type = 'button';
      btn.innerHTML = `
        <span class="option-letter" style="display:inline-flex; align-items:center; justify-content:center; width:26px; height:26px; border-radius:50%; background:rgba(197,160,89,0.2); color:var(--primary-gold); font-weight:bold; margin-right:10px;">${letters[idx]}</span>
        <span>${this.escapeHtml(optText)}</span>
      `;
      btn.onclick = () => this.handleAnswer(idx, btn);
      optionsContainer.appendChild(btn);
    });
  },

  /**
   * 4. Обработка ответа
   */
  handleAnswer(selectedIdx, btnElement) {
    if (this.isAnswerLocked) return;
    this.isAnswerLocked = true;

    const q = QUIZ_QUESTIONS[this.currentQuestionIdx];
    const allButtons = document.querySelectorAll('.option-btn');
    allButtons.forEach(b => {
      b.disabled = true;
      b.style.cursor = 'default';
    });

    const isCorrect = (selectedIdx === q.correct);

    if (isCorrect) {
      this.score++;
      btnElement.classList.add('correct');
      btnElement.style.borderColor = 'var(--success-green)';
      btnElement.style.background = 'rgba(76, 175, 80, 0.2)';
      this.playSound('correct');
    } else {
      btnElement.classList.add('wrong');
      btnElement.style.borderColor = 'var(--danger-red)';
      btnElement.style.background = 'rgba(244, 67, 54, 0.2)';
      
      allButtons[q.correct].classList.add('correct');
      allButtons[q.correct].style.borderColor = 'var(--success-green)';
      allButtons[q.correct].style.background = 'rgba(76, 175, 80, 0.2)';
      this.playSound('wrong');
    }

    document.getElementById('qScoreDisplay').textContent = `Баллы: ${this.score}`;

    const expBox = document.getElementById('explanationBox');
    const expStatus = document.getElementById('expStatusText');
    const expDesc = document.getElementById('expDescriptionText');

    expStatus.textContent = isCorrect ? "✓ ВЕРНО!" : "✗ НЕВЕРНО";
    expStatus.style.color = isCorrect ? 'var(--success-green)' : 'var(--danger-red)';
    expDesc.textContent = q.explanation;

    expBox.style.display = 'block';
  },

  /**
   * 5. Переход к следующему вопросу
   */
  nextQuestion() {
    this.currentQuestionIdx++;
    if (this.currentQuestionIdx < QUIZ_QUESTIONS.length) {
      this.renderQuestion();
    } else {
      this.showResults();
    }
  },

  /**
   * 6. Экран итогов
   */
  async showResults() {
    document.getElementById('quizProgressBar').style.width = '100%';
    document.getElementById('questionScreen').style.display = 'none';
    document.getElementById('resultScreen').style.display = 'block';

    const percent = Math.round((this.score / QUIZ_QUESTIONS.length) * 100);
    document.getElementById('finalScoreDigits').textContent = `${this.score}/${QUIZ_QUESTIONS.length}`;
    document.getElementById('finalPercentDigits').textContent = `${percent}% правильных ответов`;

    const isWinner = (this.score >= 8); // Норматив >= 80%

    // Сохранение в локальную историю
    const localResults = JSON.parse(SafeStorage.get('quiz_history_records') || '[]');
    localResults.unshift({
      name: this.participant.name,
      group: this.participant.group,
      score: this.score,
      date: new Date().toISOString()
    });
    SafeStorage.set('quiz_history_records', JSON.stringify(localResults.slice(0, 20)));

    // Разблокировка бейджей
    this.unlockBadges(this.score);

    // Отправка в облако Supabase
    if (typeof CloudSync !== 'undefined' && CloudSync.isLive) {
      await CloudSync.saveQuizResult(this.participant.name, this.score, this.participant.group, QUIZ_QUESTIONS.length);
      this.loadLeaderboard();
    }

    if (isWinner) {
      this.playSound('fanfare');
      document.getElementById('resultCrest').textContent = '🏆';
      document.getElementById('resultTitle').textContent = 'ПОБЕДИТЕЛЬ ИСТОРИЧЕСКОГО КВЕСТА';
      document.getElementById('resultMessageText').textContent = `Превосходный результат, ${this.participant.name}! Вы безошибочно ориентируетесь в экспозиции Мемориала Славы и подвигах 20 героев колледжа.`;
      document.getElementById('winnerBox').style.display = 'block';
      document.getElementById('retryBox').style.display = 'none';
    } else {
      document.getElementById('resultCrest').textContent = '🎖';
      document.getElementById('resultTitle').textContent = 'ИСПЫТАНИЕ ЗАВЕРШЕНО';
      document.getElementById('resultMessageText').textContent = `Вы ответили правильно на ${this.score} из 10 вопросов (${percent}%). Для получения Сертификата Победителя повторите материал в Книге Памяти и пройдите квест снова.`;
      document.getElementById('winnerBox').style.display = 'none';
      document.getElementById('retryBox').style.display = 'block';
    }
  },

  /**
   * 7. Перенаправление на certificate.html с автозаполнением
   */
  claimCertificate() {
    const params = new URLSearchParams({
      role: 'student',
      name: this.participant.name,
      group: this.participant.group,
      spec: this.participant.specialty,
      nom: 'student_lesson',
      date: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
    });

    window.location.href = `certificate.html?${params.toString()}`;
  },

  restartQuest() {
    document.getElementById('resultScreen').style.display = 'none';
    document.getElementById('startScreen').style.display = 'block';
    this.loadBadges();
  },

  unlockBadges(score) {
    const current = JSON.parse(SafeStorage.get('srmk_user_badges') || '[]');
    const newBadges = [];

    if (score >= 5 && !current.includes('badge_init')) newBadges.push('badge_init');
    if (score >= 8 && !current.includes('badge_winner')) newBadges.push('badge_winner');
    if (score === 10 && !current.includes('badge_perfect')) newBadges.push('badge_perfect');

    if (newBadges.length > 0) {
      const updated = [...current, ...newBadges];
      SafeStorage.set('srmk_user_badges', JSON.stringify(updated));
    }
  },

  loadBadges() {
    const container = document.getElementById('startBadges');
    if (!container) return;

    const badges = JSON.parse(SafeStorage.get('srmk_user_badges') || '[]');
    const list = [
      { id: 'badge_init', icon: '🎯', title: 'Знаток истории', desc: 'Набрано от 5 баллов' },
      { id: 'badge_winner', icon: '🏆', title: 'Победитель квиза', desc: 'Успешная сдача (8+ баллов)' },
      { id: 'badge_perfect', icon: '👑', title: 'Абсолютный триумф', desc: 'Идеальные 10/10 баллов' },
      { id: 'badge_watch', icon: '🕯', title: 'Хранитель Памяти', desc: 'Пройдены залы музея' }
    ];

    container.innerHTML = list.map(b => {
      const isUnlocked = badges.includes(b.id) || (b.id === 'badge_watch');
      return `
        <div class="badge-card ${isUnlocked ? 'unlocked' : ''}">
          <span class="badge-icon">${b.icon}</span>
          <span class="badge-title">${b.title}</span>
          <span class="badge-desc">${b.desc}</span>
        </div>
      `;
    }).join('');
  },

  async loadLeaderboard() {
    const tbody = document.getElementById('leaderboardBody');
    const statusEl = document.getElementById('cloudStatus');
    if (!tbody) return;

    // 1. Попытка загрузить из Supabase
    if (typeof CloudSync !== 'undefined' && CloudSync.isLive) {
      const cloudResults = await CloudSync.getQuizResults(10);
      if (cloudResults && cloudResults.length > 0) {
        tbody.innerHTML = cloudResults.map((r, i) => `
          <tr>
            <td class="rank-cell rank-${i + 1}">${i + 1 <= 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}</td>
            <td style="font-weight: 600; color: #fff;">${this.escapeHtml(r.student_name)}</td>
            <td>${this.escapeHtml(r.group_name || 'СРМК')}</td>
            <td style="color: var(--primary-gold); font-weight: bold; text-align: center;">${r.score}/10</td>
            <td style="color: var(--text-muted); text-align: right;">${new Date(r.completed_at).toLocaleDateString('ru-RU')}</td>
          </tr>
        `).join('');
        if (statusEl) statusEl.textContent = '✓ Онлайн-синхронизация с глобальным Залом Славы (Supabase)';
        return;
      }
    }

    // 2. Локальный Fallback
    const local = JSON.parse(SafeStorage.get('quiz_history_records') || '[]');
    if (local.length > 0) {
      tbody.innerHTML = local.slice(0, 10).map((r, i) => `
        <tr>
          <td class="rank-cell rank-${i + 1}">${i + 1 <= 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}</td>
          <td style="font-weight: 600; color: #fff;">${this.escapeHtml(r.name)}</td>
          <td>${this.escapeHtml(r.group || 'СРМК')}</td>
          <td style="color: var(--primary-gold); font-weight: bold; text-align: center;">${r.score}/10</td>
          <td style="color: var(--text-muted); text-align: right;">${new Date(r.date).toLocaleDateString('ru-RU')}</td>
        </tr>
      `).join('');
      if (statusEl) statusEl.textContent = 'Локальный Зал Славы устройства';
    } else {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 20px;">
            В Зале Славы пока нет записей. Пройдите квест первым!
          </td>
        </tr>
      `;
      if (statusEl) statusEl.textContent = 'Готов к фиксации рекордов';
    }
  },

  showToast(msg) {
    const toast = document.getElementById('quizToast');
    if (!toast) return;
    toast.textContent = msg;
    toast.className = 'memorial-toast active toast-info';
    setTimeout(() => toast.classList.remove('active'), 3000);
  },

  escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, tag => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag]));
  }
};

document.addEventListener('DOMContentLoaded', () => QuizEngine.init());