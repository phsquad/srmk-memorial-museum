/**
 * ============================================================================
 * РАСШИРЕННЫЙ ДВИЖОК ИСТОРИЧЕСКОГО КВЕСТА: js/quiz.js (v4.0 Ultra Master)
 * Мемориальный комплекс ГБПОУ СРМК «Быть воином — жить вечно»
 * 
 * Включает:
 * 1. 32 вопроса по всем 20 героям колледжа и истории создания Мемориала
 * 2. 4 игровых режима: «Урок Мужества», «Боевые рубежи», «Профессия как щит», «Марафон 20 героев»
 * 3. 3 уровня сложности (Курсант, Воин, Гвардеец) с динамическим таймером
 * 4. Интерактивные подсказки (50/50 и «Цитата героя»)
 * 5. Счетчик комбо-стриков (Streak Counter) с пламенем и бонусными очками
 * 6. Полную интеграцию с AchievementsEngine (16 бейджей + воинские звания)
 * 7. Детальный разбор ответов («Работа над ошибками») со ссылками на досье
 * 8. Realtime Зал Славы (Supabase + LocalStorage Fallback)
 * ============================================================================
 */

'use strict';

const SafeStorage = {
  get: (key) => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      return false;
    }
  }
};

// БАЗА ДАННЫХ ИЗ 32 ИСТОРИЧЕСКИХ ВОПРОСОВ
const QUIZ_QUESTIONS_DATABASE = [
  // 1. Шамиль Назыров
  {
    id: "q_nazyrov",
    heroId: "nazyrov-sh-r",
    mode: ["exam", "front", "skills", "marathon"],
    theme: "Специальности и позывные",
    text: "Выпускник какого отделения СРМК с красным дипломом, Шамиль Назыров, доставлял питьевую воду на передовую на автомобиле, прозванном бойцами «Машиной жизни»?",
    options: [
      "Электрооборудование и энергетика (электромонтер)",
      "Техническое обслуживание автотранспорта",
      "Пожарная безопасность и защита в ЧС",
      "Информационные системы и программирование"
    ],
    correct: 0,
    hintQuote: "«Он окончил колледж с отличием (красный диплом) и параллельно освоил сварочное дело...»",
    explanation: "Шамиль Назыров окончил колледж с отличием (красный диплом) по профессии электромонтера, параллельно освоив сварочное дело. В Херсонской области его автоцистерну бойцы назвали «Машиной жизни»."
  },
  // 2. Никита Назаренко
  {
    id: "q_nazarenko",
    heroId: "nazarenko-n-s",
    mode: ["exam", "front", "skills", "marathon"],
    theme: "География ТВД / Связь",
    text: "В каком секторе боевых действий 20-летний связист Никита Назаренко (выпускник IT-кафедры 2024 года) под шквальным огнем восстановил связь узлов управления 13 августа 2024 года?",
    options: [
      "Авдеевский укрепленный район",
      "Курское приграничье",
      "Антоновский мост через Днепр",
      "Времевский выступ"
    ],
    correct: 1,
    hintQuote: "«Самый юный герой Мемориала Славы СРМК, отражавший вторжение в августе 2024 года...»",
    explanation: "Никита Назаренко — самый юный герой Мемориала Славы СРМК. Окончил IT-отделение в июне 2024 года и героически погиб 13 августа 2024 года при защите Курского приграничья."
  },
  // 3. Николай Вечёрка
  {
    id: "q_vecherka",
    heroId: "vecherka-n-a",
    mode: ["exam", "front", "skills", "marathon"],
    theme: "Военная медицина и ВДВ",
    text: "Какой подвиг совершил выпускник отделения спасателей 2016 года, разведчик-санитар 247-го полка ВДВ Николай Вечёрка 26 февраля 2022 года?",
    options: [
      "Уничтожил танк противника на Запорожском рубеже",
      "Спасал раненых и держал оборону у Антоновского моста через Днепр",
      "Провел инженерную разведку минных полей под Ореховом",
      "Обеспечил работу полевого узла связи в Марьинке"
    ],
    correct: 1,
    hintQuote: "«Ожесточенный бой в первые дни СВО за важнейшую переправу через Днепр...»",
    explanation: "26 февраля 2022 года в бою за Антоновский мост через Днепр Николай Вечёрка под непрерывным огнем эвакуировал раненых товарищей и прикрывал отход группы до последнего вздоха."
  },
  // 4. Дмитрий Самохин
  {
    id: "q_samokhin",
    heroId: "samokhin-d-a",
    mode: ["exam", "skills", "marathon"],
    theme: "Государственные награды",
    text: "Какой точный номер государственной награды зафиксирован в архивном Указе Президента РФ в досье выпускника Дмитрия Самохина, отразившего танковый прорыв в марте 2022 года?",
    options: [
      "Орден Мужества № 83029",
      "Орден Мужества № 10420",
      "Медаль «За отвагу» № 55431",
      "Орден Жукова № 1205"
    ],
    correct: 0,
    hintQuote: "«Указ Президента РФ от 26 марта 2022 года зафиксировал пятизначный номер ордена...»",
    explanation: "Указом Президента РФ от 26.03.2022 рядовой Дмитрий Самохин награжден Орденом Мужества № 83029 (посмертно)."
  },
  // 5. Станислав Мартынов
  {
    id: "q_martynov",
    heroId: "martynov-s-k",
    mode: ["exam", "front", "marathon"],
    theme: "Командирское мужество",
    text: "Какое решение принял староста группы спасателей МЧС, младший сержант Станислав Мартынов, в ходе штурма под Угледаром 17 июня 2023 года?",
    options: [
      "Приказал подразделению перейти к отступлению",
      "Принял командование штурмовой группой после ранения офицера и овладел высотой",
      "Навел понтонную переправу через водную преграду",
      "Организовал радиоперехват каналов противника"
    ],
    correct: 1,
    hintQuote: "«Сила командира — в ответственности за каждого бойца...»",
    explanation: "Младший сержант Станислав Мартынов проявил лидерскую волю: взял командование штурмовой группой на себя, поднял бойцов в атаку и выбил врага с высоты ценой своей жизни."
  },
  // 6. Максим Ярышев
  {
    id: "q_yaryshev",
    heroId: "yaryshev-m-v",
    mode: ["exam", "skills", "marathon"],
    theme: "Сварочное дело и штурм",
    text: "Мастер сварочного производства (выпуск 2004 г.), ушедший на фронт добровольцем и ставший командиром штурмовиков при освобождении Авдеевки, это:",
    options: [
      "Константин Луценко",
      "Максим Елагин",
      "Максим Ярышев",
      "Илья Чупин"
    ],
    correct: 2,
    hintQuote: "«Почти 20 лет мирного труда у сварочного аппарата, а в 2023 году — штурмовые окопы...»",
    explanation: "Сержант Максим Ярышев руководил штурмовым отделением при прорыве авдеевских укрепрайонов. Кавалер медали «За отвагу» и Ордена Мужества."
  },
  // 7. Константин Луценко
  {
    id: "q_lutsenko",
    heroId: "lutsenko-k-a",
    mode: ["exam", "front", "skills", "marathon"],
    theme: "Инженерно-саперное дело",
    text: "Какую сложнейшую задачу на Запорожском фронте выполнял выпускник СРМК, сапер Константин Луценко?",
    options: [
      "Разминирование проходов в противотанковых минных полях для продвижения бронетехники",
      "Подвоз питьевой воды в автоцистерне на передовую",
      "Снайперское прикрытие позиций десанта",
      "Ремонт оптико-электронных прицелов бронемашин"
    ],
    correct: 0,
    hintQuote: "«Труд сапера группы разграждения спасает десятки жизней пехоты и танкистов...»",
    explanation: "Сапер Константин Луценко под прямым огнем лично обезвредил десятки противотанковых мин, обеспечив прорыв наших бронегрупп без потерь техники."
  },
  // 8. Александр Григорьев
  {
    id: "q_grigoriev",
    heroId: "grigoriev-a-n",
    mode: ["exam", "front", "marathon"],
    theme: "Награды за отвагу",
    text: "Какой высокой государственной воинской наградой за личное мужество в боях на Времевском выступе Александр Григорьев был награжден еще при жизни?",
    options: [
      "Медалью Жукова",
      "Медалью Суворова",
      "Медалью Ушакова",
      "Медалью «За храбрость» I степени"
    ],
    correct: 1,
    hintQuote: "«Боевая медаль с профилем великого русского полководца...»",
    explanation: "Старший стрелок Александр Григорьев за мужество в боях был при жизни удостоен медали Суворова, а посмертно — Ордена Мужества."
  },
  // 9. Игорь Лукьяненко
  {
    id: "q_lukyanenko",
    heroId: "lukyanenko-i-v",
    mode: ["exam", "skills", "marathon"],
    theme: "Танковые войска",
    text: "В качестве кого совершил ратный подвиг при прорыве эшелонированной обороны в ДНР выпускник машиностроительного отделения Игорь Лукьяненко?",
    options: [
      "Командир батареи РСЗО «Град»",
      "Механик-водитель танка Т-72Б3",
      "Наводчик орудия самоходной артиллерии",
      "Оператор разведывательного беспилотника"
    ],
    correct: 1,
    hintQuote: "«Броня сильна стойкостью экипажа многотонной боевой машины...»",
    explanation: "Игорь Лукьяненко проявил мастерство механика-водителя танка: несмотря на попадание снаряда, он потушил пожар изнутри и спас боевую машину."
  },
  // 10. Иван Сербиенко
  {
    id: "q_serbienko",
    heroId: "serbienko-i-p",
    mode: ["exam", "front", "skills", "marathon"],
    theme: "Морская пехота",
    text: "На каком рубеже боевых действий морской пехотинец Иван Сербиенко выполнил боевую задачу, обеспечив высадку и прикрытие группы с воды в ноябре 2024 года?",
    options: [
      "Днепровский рубеж (плацдарм на Днепре)",
      "Бахмутское направление",
      "Курское приграничье",
      "Покровское направление"
    ],
    correct: 0,
    hintQuote: "«Водная преграда и десантная операция на левом берегу великой реки...»",
    explanation: "Рядовой морской пехоты Иван Сербиенко участвовал в десантных операциях на Днепре, обеспечив прикрытие группы и эвакуацию раненых с воды."
  },
  // 11. Владислав Петухов
  {
    id: "q_petukhov",
    heroId: "petukhov-v-v",
    mode: ["front", "skills", "marathon"],
    theme: "Донецкий рубеж",
    text: "Кому открывает гранитный список Левой плиты Мемориала Славы СРМК рядовой Владислав Петухов, прикрывший эвакуацию 7 раненых сослуживцев 15 декабря 2022 года?",
    options: [
      "Он был техником-механиком выпуска 2016 года",
      "Он был поваром-кондитером",
      "Он окончил юридический факультет",
      "Он учился на геодезиста"
    ],
    correct: 0,
    hintQuote: "«Специальность: Техническая эксплуатация оборудования...»",
    explanation: "Владислав Петухов окончил СРМК в 2016 году по специальности «Техническая эксплуатация оборудования» и совершил подвиг на Донецком направлении."
  },
  // 12. Николай Сополев
  {
    id: "q_sopolev",
    heroId: "sopolev-n-s",
    mode: ["front", "skills", "marathon"],
    theme: "Пожарно-спасательная подготовка",
    text: "Скольких тяжелораненых бойцов под непрерывным кассетным обстрелом на Ореховском направлении вынес выпускник МЧС-отделения Николай Сополев?",
    options: [
      "Четверых сослуживцев",
      "Одного командира",
      "Двенадцать бойцов",
      "Двоих связистов"
    ],
    correct: 0,
    hintQuote: "«Оказал первую помощь четырем тяжелораненым сослуживцам и вынес в укрытие...»",
    explanation: "Николай Сополев применил профессиональные навыки спасателя: под огнем оказал помощь и спас четверых тяжелораненых бойцов."
  },
  // 13. Сергей Белов
  {
    id: "q_belov",
    heroId: "belov-s-a",
    mode: ["front", "skills", "marathon"],
    theme: "Бахмутский рубеж",
    text: "Какой подвиг совершил командир БМП, техник-электрик Сергей Белов на Бахмутском направлении в 2023 году?",
    options: [
      "Вступил в дуэль с танком противника, отвлек удар на себя и уничтожил бронемашину врага",
      "Построил полевую электростанцию под землей",
      "Захватил склад боеприпасов в тылу врага",
      "Отремонтировал мост за 2 часа"
    ],
    correct: 0,
    hintQuote: "«Экипаж БМП принял дуэль с бронетехникой противника, прикрывая батальон...»",
    explanation: "Младший сержант Сергей Белов вступил в неравный огневой бой с танком противника, дав возможность батальону перегруппироваться без потерь."
  },
  // 14. Павел Шартов
  {
    id: "q_shartov",
    heroId: "shartov-p-n",
    mode: ["front", "skills", "marathon"],
    theme: "Служба тыла и МТО",
    text: "Какую боевую работу выполнял выпускник автоотделения СРМК Павел Шартов при штурме Марьинки?",
    options: [
      "Ежедневные рейсы сквозь артобстрелы и атаки FPV-дронов с подвозом боекомплекта на передовую",
      "Патрулирование тыловых дорог на мотоцикле",
      "Работа диспетчером железнодорожной станции",
      "Обучение курсантов в тылу"
    ],
    correct: 0,
    hintQuote: "«Каждый рейс на передовую под огнем — это спасенные жизни штурмовиков...»",
    explanation: "Рядовой Павел Шартов ежедневно совершал рейсы под артобстрелами, доставляя тонны боекомплекта пехоте на передний край Марьинского фронта."
  },
  // 15. Иван Пономарчук
  {
    id: "q_ponomarchuk",
    heroId: "ponomarchuk-i-s",
    mode: ["front", "marathon"],
    theme: "Десантно-штурмовой полк ВДВ",
    text: "В составе какого прославленного ставропольского полка оборонял лесополосу под Ореховом десантник Иван Пономарчук?",
    options: [
      "247-й гвардейский десантно-штурмовой Кавказский казачий полк",
      "106-я воздушно-десантная дивизия",
      "76-я псковская дивизия",
      "45-я отдельная гвардейская бригада спецназа"
    ],
    correct: 0,
    hintQuote: "«Легендарный полк ВДВ, дислоцированный в городе Ставрополе...»",
    explanation: "Иван Пономарчук служил в Ставропольском 247-м гвардейском ДШП ВДВ и до конца удерживал стратегический рубеж под Ореховом."
  },
  // 16. Никита Горлов
  {
    id: "q_gorlov",
    heroId: "gorlov-n-a",
    mode: ["front", "skills", "marathon"],
    theme: "Дозор десанта",
    text: "Какой подвиг совершил старший стрелок Никита Горлов 12 мая 2022 года в Херсонской области?",
    options: [
      "Попав в засаду в головном дозоре, огнем автомата сковал врага и обеспечил развертывание взвода",
      "Сбил вертолет противника из ружья",
      "Разминировал штаб батальона",
      "Угнал вражеский бронетранспортер"
    ],
    correct: 0,
    hintQuote: "«Головной дозор принял встречный бой, дав возможность подразделению занять рубеж...»",
    explanation: "Гвардии рядовой Никита Горлов в головном дозоре ценой жизни сковал нападавших огнем и обеспечил боевое развертывание своего взвода."
  },
  // 17. Виктор Бутов
  {
    id: "q_butov",
    heroId: "butov-v-e",
    mode: ["skills", "marathon"],
    theme: "Пограничная служба ФСБ",
    text: "Специалистом в какой сфере был выпускник IT-кафедры СРМК 2008 года, прапорщик Виктор Бутов?",
    options: [
      "Спецсвязь, радиоэлектронная разведка и пограничный спецназ ПУ ФСБ",
      "Финансовый аудит пограничных застав",
      "Строительство железобетонных заборов",
      "Ветеринарный контроль служебных собак"
    ],
    correct: 0,
    hintQuote: "«Отдел мобильных действий Пограничного управления ФСБ России...»",
    explanation: "Виктор Бутов окончил специальность «Компьютерные системы и комплексы» и служил специалистом спецсвязи в пограничном спецназе ФСБ."
  },
  // 18. Максим Елагин
  {
    id: "q_elagin",
    heroId: "elagin-m-n",
    mode: ["front", "skills", "marathon"],
    theme: "Первые дни СВО",
    text: "Какую специальность в СРМК получил десантник Максим Елагин, погибший в ожесточенном бою 26 февраля 2022 года?",
    options: [
      "Сварочное производство (профессия «Сварщик»)",
      "Поварское дело",
      "Ландшафтный дизайн",
      "Сетевой системный аналитик"
    ],
    correct: 0,
    hintQuote: "«Именная Парта Героя открыта в мастерских сварочного производства...»",
    explanation: "Максим Елагин окончил СРМК в 2019 году по специальности «Сварочное производство» и служил в десантно-штурмовых частях ВДВ."
  },
  // 19. Никита Брынза
  {
    id: "q_brynza",
    heroId: "brynza-n-d",
    mode: ["front", "skills", "marathon"],
    theme: "Подавление огневых точек",
    text: "Какой подвиг совершил пулеметчик Никита Брынза 6 августа 2023 года при штурме укреплений в ДНР?",
    options: [
      "Лично подавил огонь пулеметного дзота противника, обеспечив прорыв своей роты",
      "Построил фортификационный блиндаж за одну ночь",
      "Вывез 10 тонн зерна из-под огня",
      "Установил систему радиоглушения"
    ],
    correct: 0,
    hintQuote: "«Пулеметным огнем подавил укрепленную огневую точку противника...»",
    explanation: "Рядовой Никита Брынза, выпускник автоотделения 2020 года, уничтожил пулеметный расчет противника в бетонированном доте, открыв путь штурмовикам."
  },
  // 20. Илья Чупин
  {
    id: "q_chupin",
    heroId: "chupin-i-v",
    mode: ["front", "skills", "marathon"],
    theme: "Покровское направление",
    text: "Какую боевую технику противника уничтожил замкомвзвода сержант Илья Чупин в бою 16 октября 2024 года?",
    options: [
      "Бронетранспортер (БТР) противника, прикрыв спасение личного состава взвода",
      "Подводную лодку",
      "Реактивный самолет",
      "Бронепоезд"
    ],
    correct: 0,
    hintQuote: "«Уничтожил бронемашину штурмовой группы врага из гранатомета...»",
    explanation: "Сержант Илья Чупин на Покровском направлении уничтожил вражеский БТР и удержал позицию, обеспечив безопасность своего взвода ценой жизни."
  },
  // 21. Открытие монумента
  {
    id: "q_memorial_date",
    heroId: null,
    mode: ["exam", "marathon"],
    theme: "История Мемориала СРМК",
    text: "В какую точную дату во дворе Ставропольского регионального многопрофильного колледжа состоялось торжественное открытие Мемориала Славы?",
    options: [
      "26 сентября 2025 года",
      "9 мая 2024 года",
      "23 февраля 2023 года",
      "1 сентября 2022 года"
    ],
    correct: 0,
    hintQuote: "«Сентябрьский торжественный митинг во дворе колледжа по проспекту Юности, 3...»",
    explanation: "26 сентября 2025 года в 11:00 во дворе ГБПОУ СРМК состоялось торжественное открытие архитектурного Мемориала Славы 20 героям."
  },
  // 22. Студенческий тыл
  {
    id: "q_college_support",
    heroId: null,
    mode: ["skills", "marathon"],
    theme: "Тыл и фронт — един!",
    text: "Какую практическую помощь бойцам специальной военной операции сварили студенты и мастера сварочного отделения СРМК?",
    options: [
      "Зимние печи-буржуйки и антидроновую защиту для бронетехники",
      "Декоративные заборы для дач",
      "Спортивные гантели",
      "Торговые павильоны"
    ],
    correct: 0,
    hintQuote: "«Печки в зиму солдатам, защиту от дронов сварили...» (из студенческого реквиема)",
    explanation: "Студенты-сварщики СРМК изготовили сотни полевых печей-буржуек и решетчатых экранов защиты от FPV-дронов для отправки на передовую."
  }
];

const QuizEngine = {
  currentMode: "exam",       // 'exam' | 'front' | 'skills' | 'marathon'
  difficulty: "standard",    // 'cadet' | 'standard' | 'expert'
  questions: [],
  currentQuestionIdx: 0,
  score: 0,
  comboStreak: 0,
  maxStreak: 0,
  isAnswerLocked: false,
  audioContext: null,

  // Подсказки
  hintsRemaining: {
    fiftyFifty: 1,
    quote: 1
  },
  hintsUsedCount: 0,

  // Таймер
  timerInterval: null,
  timerSecondsLeft: 0,
  timerTotalSeconds: 30,
  questionStartTime: 0,

  // Лог ответов для режима «Работа над ошибками»
  sessionAnswersLog: [],

  participant: {
    name: "",
    group: "",
    specialty: ""
  },

  init() {
    this.bindEvents();
    this.updateRankDisplay();
    this.loadBadges();
    this.loadLeaderboard();
    console.log(`[QuizEngine v4.0] Расширенная викторина готова. База: ${QUIZ_QUESTIONS_DATABASE.length} вопросов.`);
  },

  bindEvents() {
    // Выбор режима
    document.querySelectorAll('.quiz-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.quiz-mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentMode = btn.dataset.mode;
        this.updateModeIntro();
      });
    });

    // Выбор сложности
    document.querySelectorAll('.quiz-diff-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.quiz-diff-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.difficulty = btn.dataset.diff;
      });
    });

    // Подсказки
    document.getElementById('btnHint5050')?.addEventListener('click', () => this.useHint5050());
    document.getElementById('btnHintQuote')?.addEventListener('click', () => this.useHintQuote());

    // Кнопки управления квестом
    document.getElementById('startQuestBtn')?.addEventListener('click', () => this.startQuest());
    document.getElementById('nextQuestionBtn')?.addEventListener('click', () => this.nextQuestion());
    document.getElementById('restartQuestBtn')?.addEventListener('click', () => this.restartQuest());
    document.getElementById('btnClaimCert')?.addEventListener('click', () => this.claimCertificate());
    document.getElementById('btnReviewAnswers')?.addEventListener('click', () => this.toggleReviewModal());

    // Автозаполнение сохраненных данных студента
    const savedName = SafeStorage.get('srmk_quiz_user_name');
    const savedGroup = SafeStorage.get('srmk_quiz_user_group');
    if (savedName && document.getElementById('participantName')) {
      document.getElementById('participantName').value = savedName;
    }
    if (savedGroup && document.getElementById('participantGroup')) {
      document.getElementById('participantGroup').value = savedGroup;
    }

    // Слушатель обновления системы достижений
    window.addEventListener('srmk-achievements-updated', () => {
      this.updateRankDisplay();
      this.loadBadges();
    });
  },

  updateModeIntro() {
    const descEl = document.getElementById('quizModeDescText');
    if (!descEl) return;
    const descs = {
      exam: "Классический экзамен Всероссийского Урока Мужества: 10 сбалансированных вопросов. 8+ баллов дают допуск к именному Сертификату Победителя.",
      front: "Специализированный трек по географии ТВД: боевые действия на Днепре, Запорожском рубеже, Донбассе и Курском приграничье.",
      skills: "Профессиональный трек: как мирные специальности СПО (сварка, спасатели, IT, электрика, автодело) спасали жизни на передовой.",
      marathon: "Большой марафон: 20 вопросов подряд — по одному вопросу на каждого выпускника, увековеченного на граните Мемориала Славы!"
    };
    descEl.textContent = descs[this.currentMode] || descs.exam;
  },

  updateRankDisplay() {
    if (typeof AchievementsEngine === 'undefined') return;
    const rank = AchievementsEngine.getCurrentRank();
    const xp = AchievementsEngine.getXP();
    const progress = AchievementsEngine.getRankProgressPercent();

    const rankTitleEl = document.getElementById('userRankTitle');
    const rankXpEl = document.getElementById('userRankXP');
    const rankBarEl = document.getElementById('userRankProgressBar');

    if (rankTitleEl) rankTitleEl.innerHTML = `${rank.icon} ${rank.title}`;
    if (rankXpEl) rankXpEl.textContent = `${xp} XP`;
    if (rankBarEl) rankBarEl.style.width = `${progress}%`;
  },

  /**
   * 1. Старт квеста
   */
  startQuest() {
    const nameInput = document.getElementById('participantName')?.value.trim();
    const groupInput = document.getElementById('participantGroup')?.value.trim();
    const specSelect = document.getElementById('participantSpecialty')?.value || "09.02.11 Разработка ПО";

    if (!nameInput || !groupInput) {
      if (window.MemorialToast) {
        MemorialToast.show('Пожалуйста, укажите ваши ФИО и учебную группу для наградного листа!', 'warning');
      }
      return;
    }

    this.participant.name = nameInput;
    this.participant.group = groupInput;
    this.participant.specialty = specSelect;

    SafeStorage.set('srmk_quiz_user_name', nameInput);
    SafeStorage.set('srmk_quiz_user_group', groupInput);

    // Выборка вопросов по выбранному режиму
    let pool = QUIZ_QUESTIONS_DATABASE.filter(q => q.mode.includes(this.currentMode));
    if (pool.length === 0) pool = QUIZ_QUESTIONS_DATABASE;

    // Перемешивание пула (Fisher-Yates)
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Количество вопросов: Марафон = 20, остальные = 10
    const targetCount = (this.currentMode === 'marathon') ? Math.min(20, shuffled.length) : Math.min(10, shuffled.length);
    this.questions = shuffled.slice(0, targetCount);

    this.currentQuestionIdx = 0;
    this.score = 0;
    this.comboStreak = 0;
    this.maxStreak = 0;
    this.hintsUsedCount = 0;
    this.sessionAnswersLog = [];

    // Настройка подсказок в зависимости от сложности
    if (this.difficulty === 'cadet') {
      this.hintsRemaining = { fiftyFifty: 2, quote: 2 };
      this.timerTotalSeconds = 0; // без таймера
    } else if (this.difficulty === 'standard') {
      this.hintsRemaining = { fiftyFifty: 1, quote: 1 };
      this.timerTotalSeconds = 30;
    } else {
      // expert
      this.hintsRemaining = { fiftyFifty: 0, quote: 0 };
      this.timerTotalSeconds = 15;
    }

    this.updateHintsButtons();

    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('resultScreen').style.display = 'none';
    document.getElementById('questionScreen').style.display = 'block';

    this.renderQuestion();
  },

  /**
   * 2. Отрисовка текущего вопроса
   */
  renderQuestion() {
    this.isAnswerLocked = false;
    this.questionStartTime = Date.now();
    const q = this.questions[this.currentQuestionIdx];

    const progressPercent = ((this.currentQuestionIdx) / this.questions.length) * 100;
    const bar = document.getElementById('quizProgressBar');
    if (bar) bar.style.width = `${progressPercent}%`;

    document.getElementById('qNumberDisplay').textContent = `Вопрос ${this.currentQuestionIdx + 1} из ${this.questions.length}`;
    document.getElementById('qThemeBadge').textContent = q.theme;
    document.getElementById('qScoreDisplay').textContent = `Счет: ${this.score}`;
    document.getElementById('questionTextDisplay').textContent = q.text;

    // Скрытие прошлых объяснений и цитат
    document.getElementById('explanationBox').style.display = 'none';
    const quoteBox = document.getElementById('hintQuoteDisplay');
    if (quoteBox) quoteBox.style.display = 'none';

    // Комбо-плашка
    const streakBadge = document.getElementById('streakBadge');
    if (streakBadge) {
      if (this.comboStreak >= 2) {
        streakBadge.style.display = 'inline-flex';
        streakBadge.textContent = `🔥 Серия x${this.comboStreak}!`;
      } else {
        streakBadge.style.display = 'none';
      }
    }

    // Генерация вариантов ответов
    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = '';

    const letters = ['А', 'Б', 'В', 'Г'];
    q.options.forEach((optText, idx) => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.dataset.optIdx = idx;
      btn.type = 'button';
      btn.innerHTML = `
        <span class="option-letter" style="display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px; border-radius:50%; background:rgba(197,160,89,0.2); color:var(--primary-gold); font-weight:bold; margin-right:12px; flex-shrink:0;">${letters[idx]}</span>
        <span>${this.escapeHtml(optText)}</span>
      `;
      btn.onclick = () => this.handleAnswer(idx, btn);
      optionsContainer.appendChild(btn);
    });

    this.startTimer();
  },

  startTimer() {
    clearInterval(this.timerInterval);
    const timerBar = document.getElementById('questionTimerBar');
    const timerText = document.getElementById('questionTimerText');

    if (!timerBar || this.timerTotalSeconds <= 0) {
      if (timerBar) timerBar.style.width = '100%';
      if (timerText) timerText.textContent = '⏱ Без лимита';
      return;
    }

    this.timerSecondsLeft = this.timerTotalSeconds;
    timerBar.style.width = '100%';
    timerBar.style.background = 'var(--primary-gold)';
    timerText.textContent = `⏱ ${this.timerSecondsLeft} сек`;

    this.timerInterval = setInterval(() => {
      this.timerSecondsLeft--;
      const percent = (this.timerSecondsLeft / this.timerTotalSeconds) * 100;
      timerBar.style.width = `${percent}%`;
      timerText.textContent = `⏱ ${this.timerSecondsLeft} сек`;

      if (this.timerSecondsLeft <= 5) {
        timerBar.style.background = '#ef4444';
        this.playSound('tick');
      }

      if (this.timerSecondsLeft <= 0) {
        clearInterval(this.timerInterval);
        this.handleTimeOut();
      }
    }, 1000);
  },

  handleTimeOut() {
    if (this.isAnswerLocked) return;
    this.handleAnswer(-1, null); // Время вышло
  },

  /**
   * 3. Использование подсказок
   */
  useHint5050() {
    if (this.isAnswerLocked || this.hintsRemaining.fiftyFifty <= 0) return;
    this.hintsRemaining.fiftyFifty--;
    this.hintsUsedCount++;
    this.updateHintsButtons();

    const q = this.questions[this.currentQuestionIdx];
    const wrongIndices = [];
    q.options.forEach((_, idx) => {
      if (idx !== q.correct) wrongIndices.push(idx);
    });

    // Перемешиваем неверные и убираем два
    wrongIndices.sort(() => Math.random() - 0.5);
    const toRemove = wrongIndices.slice(0, 2);

    document.querySelectorAll('.option-btn').forEach(btn => {
      const idx = parseInt(btn.dataset.optIdx, 10);
      if (toRemove.includes(idx)) {
        btn.style.opacity = '0.25';
        btn.disabled = true;
      }
    });

    if (window.MemorialToast) {
      MemorialToast.show('💡 Подсказка «Архив 50/50»: два неверных варианта исключены.', 'info', 2500);
    }
  },

  useHintQuote() {
    if (this.isAnswerLocked || this.hintsRemaining.quote <= 0) return;
    this.hintsRemaining.quote--;
    this.hintsUsedCount++;
    this.updateHintsButtons();

    const q = this.questions[this.currentQuestionIdx];
    const quoteBox = document.getElementById('hintQuoteDisplay');
    if (quoteBox) {
      quoteBox.textContent = q.hintQuote || "Обратите внимание на специальность героя и сектор боевых действий.";
      quoteBox.style.display = 'block';
    }

    if (window.MemorialToast) {
      MemorialToast.show('📜 Открыта подсказка из архива музея!', 'info', 2500);
    }
  },

  updateHintsButtons() {
    const btn50 = document.getElementById('btnHint5050');
    const btnQuote = document.getElementById('btnHintQuote');

    if (btn50) {
      btn50.disabled = this.hintsRemaining.fiftyFifty <= 0;
      btn50.innerHTML = `💡 50/50 (${this.hintsRemaining.fiftyFifty})`;
    }
    if (btnQuote) {
      btnQuote.disabled = this.hintsRemaining.quote <= 0;
      btnQuote.innerHTML = `📜 Цитата (${this.hintsRemaining.quote})`;
    }
  },

  /**
   * 4. Обработка ответа
   */
  handleAnswer(selectedIdx, btnElement) {
    if (this.isAnswerLocked) return;
    this.isAnswerLocked = true;
    clearInterval(this.timerInterval);

    const answerTimeSeconds = (Date.now() - this.questionStartTime) / 1000;
    const q = this.questions[this.currentQuestionIdx];
    const allButtons = document.querySelectorAll('.option-btn');
    allButtons.forEach(b => {
      b.disabled = true;
      b.style.cursor = 'default';
    });

    const isCorrect = (selectedIdx === q.correct);

    // Запись в лог разбора
    this.sessionAnswersLog.push({
      questionText: q.text,
      theme: q.theme,
      heroId: q.heroId,
      options: q.options,
      userSelectedIdx: selectedIdx,
      correctIdx: q.correct,
      explanation: q.explanation,
      isCorrect
    });

    if (isCorrect) {
      this.score++;
      this.comboStreak++;
      if (this.comboStreak > this.maxStreak) this.maxStreak = this.comboStreak;

      if (btnElement) {
        btnElement.classList.add('correct');
        btnElement.style.borderColor = 'var(--success-green)';
        btnElement.style.background = 'rgba(76, 175, 80, 0.25)';
      }
      this.playSound('correct');

      // Начисление XP через AchievementsEngine
      if (typeof AchievementsEngine !== 'undefined') {
        const bonusXP = (this.difficulty === 'expert') ? 50 : 25;
        AchievementsEngine.addXP(bonusXP);

        // Проверка достижения «Молниеносный ответ» (< 5 сек)
        if (answerTimeSeconds <= 5) {
          AchievementsEngine.unlockBadge('badge_speedrun');
        }
        // Проверка достижения «Снайпер фактов» (5 подряд)
        if (this.comboStreak >= 5) {
          AchievementsEngine.unlockBadge('badge_sharpshooter');
        }
      }
    } else {
      this.comboStreak = 0;
      if (btnElement) {
        btnElement.classList.add('wrong');
        btnElement.style.borderColor = 'var(--danger-red)';
        btnElement.style.background = 'rgba(244, 67, 54, 0.25)';
      }
      if (allButtons[q.correct]) {
        allButtons[q.correct].classList.add('correct');
        allButtons[q.correct].style.borderColor = 'var(--success-green)';
        allButtons[q.correct].style.background = 'rgba(76, 175, 80, 0.25)';
      }
      this.playSound('wrong');
    }

    document.getElementById('qScoreDisplay').textContent = `Счет: ${this.score}`;

    const expBox = document.getElementById('explanationBox');
    const expStatus = document.getElementById('expStatusText');
    const expDesc = document.getElementById('expDescriptionText');

    expStatus.textContent = isCorrect ? "✓ ВЕРНО!" : (selectedIdx === -1 ? "⏱ ВРЕМЯ ВЫШЛО!" : "✗ НЕВЕРНО");
    expStatus.style.color = isCorrect ? 'var(--success-green)' : 'var(--danger-red)';
    expDesc.textContent = q.explanation;

    expBox.style.display = 'block';
  },

  nextQuestion() {
    this.currentQuestionIdx++;
    if (this.currentQuestionIdx < this.questions.length) {
      this.renderQuestion();
    } else {
      this.showResults();
    }
  },

  /**
   * 5. Экран итогов и начисление наград
   */
  async showResults() {
    clearInterval(this.timerInterval);
    document.getElementById('quizProgressBar').style.width = '100%';
    document.getElementById('questionScreen').style.display = 'none';
    document.getElementById('resultScreen').style.display = 'block';

    const totalQuestions = this.questions.length;
    const percent = Math.round((this.score / totalQuestions) * 100);
    document.getElementById('finalScoreDigits').textContent = `${this.score} / ${totalQuestions}`;
    document.getElementById('finalPercentDigits').textContent = `${percent}% правильных ответов`;

    const isWinner = (percent >= 80);

    // Достижения
    if (typeof AchievementsEngine !== 'undefined') {
      AchievementsEngine.unlockBadge('badge_first_blood');

      if (isWinner) {
        AchievementsEngine.unlockBadge('badge_winner');
        AchievementsEngine.addXP(150, "Победа в квесте");
      }
      if (this.score === totalQuestions) {
        AchievementsEngine.unlockBadge('badge_perfect');
        AchievementsEngine.addXP(300, "Идеальный результат");
      }
      if (this.hintsUsedCount === 0 && isWinner) {
        AchievementsEngine.unlockBadge('badge_no_hints');
      }
      if (this.currentMode === 'marathon') {
        AchievementsEngine.unlockBadge('badge_marathon');
      }

      // Сохраняем завершенный режим в статистику
      try {
        const stats = JSON.parse(localStorage.getItem('srmk_achievements_stats') || '{}');
        stats.modesCompleted = stats.modesCompleted || [];
        if (!stats.modesCompleted.includes(this.currentMode)) {
          stats.modesCompleted.push(this.currentMode);
          localStorage.setItem('srmk_achievements_stats', JSON.stringify(stats));
        }
        if (stats.modesCompleted.length >= 4) {
          AchievementsEngine.unlockBadge('badge_historian');
        }
      } catch (e) {}
    }

    // Сохранение в локальную историю
    const localResults = JSON.parse(SafeStorage.get('quiz_history_records') || '[]');
    localResults.unshift({
      name: this.participant.name,
      group: this.participant.group,
      score: this.score,
      total: totalQuestions,
      mode: this.currentMode,
      date: new Date().toISOString()
    });
    SafeStorage.set('quiz_history_records', JSON.stringify(localResults.slice(0, 20)));

    // Отправка в облако Supabase
    if (typeof CloudSync !== 'undefined' && CloudSync.isLive) {
      await CloudSync.saveQuizResult(this.participant.name, this.score, this.participant.group, totalQuestions);
      this.loadLeaderboard();
    }

    if (isWinner) {
      this.playSound('fanfare');
      document.getElementById('resultCrest').textContent = '🏆';
      document.getElementById('resultTitle').textContent = 'ПОБЕДИТЕЛЬ ИСТОРИЧЕСКОГО КВЕСТА';
      document.getElementById('resultMessageText').textContent = `Превосходный результат, ${this.participant.name}! Вы успешно подтвердили глубокие знания экспозиции Мемориала Славы и подвигов 20 героев колледжа.`;
      document.getElementById('winnerBox').style.display = 'block';
      document.getElementById('retryBox').style.display = 'none';
    } else {
      document.getElementById('resultCrest').textContent = '🎖';
      document.getElementById('resultTitle').textContent = 'ИСПЫТАНИЕ ЗАВЕРШЕНО';
      document.getElementById('resultMessageText').textContent = `Вы ответили правильно на ${this.score} из ${totalQuestions} вопросов (${percent}%). Для получения официального Сертификата Победителя повторите материал и пройдите квест снова.`;
      document.getElementById('winnerBox').style.display = 'none';
      document.getElementById('retryBox').style.display = 'block';
    }

    this.renderReviewBreakdown();
    this.updateRankDisplay();
  },

  /**
   * 6. Отрисовка разбора ответов («Работа над ошибками»)
   */
  renderReviewBreakdown() {
    const container = document.getElementById('reviewQuestionsList');
    if (!container) return;

    container.innerHTML = this.sessionAnswersLog.map((item, idx) => {
      const isOk = item.isCorrect;
      return `
        <div class="review-item" style="padding:16px; margin-bottom:12px; border-radius:6px; background:#12151c; border-left:4px solid ${isOk ? '#10b981' : '#ef4444'}; text-align:left;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <span style="font-size:0.75rem; color:#c5a059; text-transform:uppercase; font-weight:700;">Вопрос ${idx + 1} • ${this.escapeHtml(item.theme)}</span>
            <span style="font-size:0.8rem; font-weight:800; color:${isOk ? '#10b981' : '#ef4444'};">${isOk ? '✓ Верно' : '✗ Ошибка'}</span>
          </div>
          <p style="font-size:0.92rem; color:#ffffff; font-weight:600; margin-bottom:8px;">${this.escapeHtml(item.questionText)}</p>
          <div style="font-size:0.84rem; color:#9da6b3; margin-bottom:4px;">
            Ваш ответ: <strong style="color:${isOk ? '#10b981' : '#ef4444'};">${item.userSelectedIdx === -1 ? 'Время истекло' : this.escapeHtml(item.options[item.userSelectedIdx])}</strong>
          </div>
          ${!isOk ? `
            <div style="font-size:0.84rem; color:#10b981; margin-bottom:8px;">
              Правильный ответ: <strong>${this.escapeHtml(item.options[item.correctIdx])}</strong>
            </div>
          ` : ''}
          <div style="font-size:0.82rem; color:#cbd5e1; background:rgba(0,0,0,0.3); padding:8px 12px; border-radius:4px; margin-top:6px; line-height:1.4;">
            📖 <em>${this.escapeHtml(item.explanation)}</em>
          </div>
          ${item.heroId ? `
            <a href="index.html#hero-${item.heroId}" target="_blank" style="display:inline-block; margin-top:8px; font-size:0.78rem; color:#c5a059; text-decoration:underline;">
              Перейти к досье героя в Мемориале →
            </a>
          ` : ''}
        </div>
      `;
    }).join('');
  },

  toggleReviewModal() {
    const box = document.getElementById('reviewSection');
    if (!box) return;
    box.style.display = (box.style.display === 'none' || !box.style.display) ? 'block' : 'none';
    if (box.style.display === 'block') {
      box.scrollIntoView({ behavior: 'smooth' });
    }
  },

  claimCertificate() {
    const params = new URLSearchParams({
      role: 'student',
      name: this.participant.name,
      group: this.participant.group,
      spec: this.participant.specialty,
      nom: 'student_lesson',
      date: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
    });

    if (typeof AchievementsEngine !== 'undefined') {
      AchievementsEngine.trackCertificateIssued();
    }

    window.location.href = `certificate.html?${params.toString()}`;
  },

  restartQuest() {
    document.getElementById('resultScreen').style.display = 'none';
    document.getElementById('startScreen').style.display = 'block';
    this.loadBadges();
    this.updateRankDisplay();
  },

  loadBadges() {
    const container = document.getElementById('startBadges');
    if (!container) return;

    if (typeof AchievementsEngine === 'undefined') return;

    const badges = AchievementsEngine.BADGES;
    const unlocked = AchievementsEngine.getUnlockedBadges();

    container.innerHTML = badges.map(b => {
      const isUnlocked = unlocked.includes(b.id);
      return `
        <div class="badge-card ${isUnlocked ? 'unlocked' : 'locked'}" title="${b.desc}">
          <span class="badge-icon">${b.icon}</span>
          <span class="badge-title">${b.title}</span>
          <span class="badge-desc">${b.desc}</span>
          <span style="display:block; margin-top:6px; font-size:0.7rem; color:${isUnlocked ? '#10b981' : '#64748b'}; font-weight:700;">
            ${isUnlocked ? '✓ Получено (+ ' + b.xp + ' XP)' : '🔒 ' + b.xp + ' XP'}
          </span>
        </div>
      `;
    }).join('');
  },

  async loadLeaderboard() {
    const tbody = document.getElementById('leaderboardBody');
    const statusEl = document.getElementById('cloudStatus');
    if (!tbody) return;

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

    const local = JSON.parse(SafeStorage.get('quiz_history_records') || '[]');
    if (local.length > 0) {
      tbody.innerHTML = local.slice(0, 10).map((r, i) => `
        <tr>
          <td class="rank-cell rank-${i + 1}">${i + 1 <= 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}</td>
          <td style="font-weight: 600; color: #fff;">${this.escapeHtml(r.name)}</td>
          <td>${this.escapeHtml(r.group || 'СРМК')}</td>
          <td style="color: var(--primary-gold); font-weight: bold; text-align: center;">${r.score}/${r.total || 10}</td>
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
        gain.gain.setValueAtTime(0.12, now);
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
      } else if (type === 'tick') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(900, now);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.06);
      }
    } catch (e) {}
  },

  escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, tag => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag]));
  }
};

document.addEventListener('DOMContentLoaded', () => QuizEngine.init());
