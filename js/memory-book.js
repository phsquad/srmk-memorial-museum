/**
 * ============================================================================
 * ДВИЖОК КНИГИ ПАМЯТИ: js/memory-book.js (v3.0 Professional)
 * Интеграция с data.js • Карточки героев • Markdown рендеринг • Фильтры
 * ============================================================================
 */

'use strict';

/**
 * АЛЬТЕРНАТИВНЫЙ MARKDOWN КОНТЕНТ ДЛЯ СТРАНИЦЫ "О ПРОЕКТЕ"
 */
const ABOUT_MARKDOWN = `
# 🏛 О проекте «Быть воином — жить вечно»

> *«Высока, высока над землёй синева — это мирное небо над Родиной.*
> *Но простые и строгие слышим слова: „Боевым награждается орденом"...»*

---

## 📜 История создания Мемориала

**26 сентября 2025 года в 11:00** во дворе Ставропольского регионального многопрофильного колледжа состоялось торжественное открытие архитектурного монумента выпускникам СРМК, погибшим при исполнении воинского долга в ходе специальной военной операции.

### Почётные гости церемонии:
- **Смагина Мария Викторовна** — Министр образования Ставропольского края
- **Бледных Евгений Викторович** — директор ГБПОУ СРМК, кандидат исторических наук
- **Ямпольский Дмитрий Анатольевич** — ветеран, участник СВО
- **Семьи павших воинов**

---

## 🎯 Цели проекта

1. **Сохранение памяти** о выпускниках колледжа, погибших при защите Отечества
2. **Патриотическое воспитание** студентов на примерах героизма
3. **Документирование биографий** героев для будущих поколений
4. **Создание интерактивного архива** с возможностью изучения материалов

---

## 📊 Структура Мемориала Славы

| Плита | Количество героев | Специальности |
|-------|------------------|---------------|
| Левая | 10 героев | Пожарная безопасность, Сварка, Механика |
| Правая | 10 героев | IT, Электрооборудование, Автосервис |

---

## 🔗 Контакты и социальные сети

- **ВКонтакте**: [ГБПОУ СРМК](https://vk.com/srmk_official)
- **Telegram**: [Новости колледжа](https://t.me/srmk_news)
- **YouTube**: [Канал СРМК](https://youtube.com/@srmk)

> **Адрес**: г. Ставрополь, пр. Юности, д. 3  
> **Координаты**: 45.0448, 41.9691
`;

/**
 * ГЛАВНЫЙ МОДУЛЬ УПРАВЛЕНИЯ КНИГОЙ ПАМЯТИ
 */
const MemoryBookApp = {
  currentHeroes: [],
  currentPage: 1,
  itemsPerPage: 9,
  currentView: 'grid',
  currentFilter: { specialty: 'all', year: 'all' },
  
  /**
   * Инициализация приложения
   */
  init() {
    console.log('📖 Книга Памяти v3.0 инициализирована');
    
    // Ждем загрузки данных
    if (typeof heroesDatabase === 'undefined') {
      console.error('❌ Data.js не загружен!');
      return;
    }
    
    this.cacheDOM();
    this.bindEvents();
    this.populateFilters();
    this.renderHeroes(heroesDatabase);
    this.updateStats();
    this.initThemeToggle();
    this.initAboutModal();
    
    // Показываем контент после загрузки
    document.body.classList.add('loaded');
  },
  
  /**
   * Кэширование DOM элементов
   */
  cacheDOM() {
    this.dom = {
      searchInput: document.getElementById('hero-search'),
      specialtyFilter: document.getElementById('specialty-filter'),
      yearFilter: document.getElementById('year-filter'),
      heroesGrid: document.getElementById('heroes-grid'),
      totalHeroes: document.getElementById('total-heroes'),
      totalAwards: document.getElementById('total-awards'),
      viewBtns: document.querySelectorAll('.view-btn'),
      themeToggle: document.getElementById('theme-toggle'),
      heroModal: document.getElementById('hero-modal'),
      aboutModal: document.getElementById('about-modal'),
      aboutTrigger: document.getElementById('about-trigger'),
      closeModalBtns: document.querySelectorAll('.close-modal'),
      tabBtns: document.querySelectorAll('.tab-btn')
    };
  },
  
  /**
   * Привязка событий
   */
  bindEvents() {
    // Поиск
    if (this.dom.searchInput) {
      this.dom.searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
    }
    
    // Фильтры
    if (this.dom.specialtyFilter) {
      this.dom.specialtyFilter.addEventListener('change', (e) => {
        this.currentFilter.specialty = e.target.value;
        this.applyFilters();
      });
    }
    
    if (this.dom.yearFilter) {
      this.dom.yearFilter.addEventListener('change', (e) => {
        this.currentFilter.year = e.target.value;
        this.applyFilters();
      });
    }
    
    // Переключение вида
    this.dom.viewBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.dom.viewBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentView = btn.dataset.view;
        this.dom.heroesGrid.className = `heroes-grid view-${this.currentView}`;
      });
    });
    
    // Закрытие модальных окон
    this.dom.closeModalBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.dom.heroModal.close();
        this.dom.aboutModal.close();
      });
    });
    
    // Закрытие по клику вне контента
    this.dom.heroModal.addEventListener('click', (e) => {
      if (e.target === this.dom.heroModal) this.dom.heroModal.close();
    });
    
    this.dom.aboutModal.addEventListener('click', (e) => {
      if (e.target === this.dom.aboutModal) this.dom.aboutModal.close();
    });
    
    // Закрытие по ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.dom.heroModal.close();
        this.dom.aboutModal.close();
      }
    });
    
    // Вкладки в модальном окне
    this.dom.tabBtns.forEach(btn => {
      btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
    });
    
    // Кнопка "О проекте"
    if (this.dom.aboutTrigger) {
      this.dom.aboutTrigger.addEventListener('click', (e) => {
        e.preventDefault();
        this.dom.aboutModal.showModal();
      });
    }
    
    // Мобильное меню
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mainNav = document.querySelector('.main-nav');
    if (mobileMenuBtn && mainNav) {
      mobileMenuBtn.addEventListener('click', () => {
        const expanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
        mobileMenuBtn.setAttribute('aria-expanded', (!expanded).toString());
        mainNav.classList.toggle('active');
      });
    }
  },
  
  /**
   * Заполнение фильтров данными
   */
  populateFilters() {
    // Специальности
    const specSelect = this.dom.specialtyFilter;
    if (specSelect) {
      Object.values(SPECIALTIES_TAXONOMY).forEach(spec => {
        const option = document.createElement('option');
        option.value = spec.id;
        option.textContent = `${spec.icon} ${spec.name}`;
        specSelect.appendChild(option);
      });
    }
    
    // Годы призыва (извлекаем из данных)
    const yearSelect = this.dom.yearFilter;
    if (yearSelect) {
      const years = [...new Set(heroesDatabase.map(h => {
        const eduPeriod = h.education?.period || '';
        const match = eduPeriod.match(/(\d{4})/);
        return match ? match[1] : null;
      }).filter(Boolean))].sort();
      
      years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
      });
    }
  },
  
  /**
   * Применение фильтров
   */
  applyFilters() {
    let filtered = [...heroesDatabase];
    
    // Фильтр по специальности
    if (this.currentFilter.specialty !== 'all') {
      filtered = filtered.filter(h => h.specTag === this.currentFilter.specialty);
    }
    
    // Фильтр по году
    if (this.currentFilter.year !== 'all') {
      filtered = filtered.filter(h => {
        const eduPeriod = h.education?.period || '';
        return eduPeriod.includes(this.currentFilter.year);
      });
    }
    
    // Поиск
    const searchTerm = this.dom.searchInput?.value.toLowerCase() || '';
    if (searchTerm) {
      filtered = filtered.filter(h => 
        h.name.toLowerCase().includes(searchTerm) ||
        h.military?.rank?.toLowerCase().includes(searchTerm) ||
        h.education?.specialty?.toLowerCase().includes(searchTerm)
      );
    }
    
    this.renderHeroes(filtered);
    this.updateStats();
  },
  
  /**
   * Обработка поиска
   */
  handleSearch(term) {
    this.applyFilters();
  },
  
  /**
   * Рендеринг карточек героев
   */
  renderHeroes(heroes) {
    this.currentHeroes = heroes;
    const grid = this.dom.heroesGrid;
    
    if (!grid) return;
    
    if (heroes.length === 0) {
      grid.innerHTML = '<div class="no-results"><p>Герои не найдены</p></div>';
      return;
    }
    
    grid.innerHTML = heroes.map(hero => this.createHeroCard(hero)).join('');
    
    // Добавляем обработчики кликов на карточки
    grid.querySelectorAll('.hero-card').forEach(card => {
      card.addEventListener('click', () => {
        const heroId = card.dataset.heroId;
        this.openHeroModal(heroId);
      });
      
      // Доступность с клавиатуры
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const heroId = card.dataset.heroId;
          this.openHeroModal(heroId);
        }
      });
    });
  },
  
  /**
   * Создание HTML карточки героя
   */
  createHeroCard(hero) {
    const specialty = SPECIALTIES_TAXONOMY[hero.specTag?.toUpperCase()] || { icon: '🎓', color: '#6b7280' };
    const awardsCount = hero.awards?.length || 0;
    
    return `
      <article class="hero-card" 
               data-hero-id="${hero.id}" 
               tabindex="0" 
               role="button"
               aria-label="Открыть информацию о герое: ${hero.name}"
               itemscope itemtype="https://schema.org/Person">
        
        <div class="card-image-wrapper">
          <img src="${hero.media?.photo || 'assets/images/placeholder.jpg'}" 
               alt="Фото: ${hero.name}" 
               itemprop="image"
               loading="lazy"
               onerror="this.src='assets/images/placeholder.jpg'">
          <div class="card-overlay">
            <span class="specialty-badge" style="background: ${specialty.color}">
              ${specialty.icon}
            </span>
          </div>
        </div>
        
        <div class="card-content">
          <h3 class="card-name" itemprop="name">${hero.name}</h3>
          
          <p class="card-dates" itemprop="birthDate">${hero.dates?.years || ''}</p>
          
          <p class="card-rank">${hero.military?.rank || ''}</p>
          
          <div class="card-badges">
            ${hero.awards?.slice(0, 2).map(award => `
              <span class="award-badge" title="${award}">🎖️</span>
            `).join('') || ''}
            ${awardsCount > 2 ? `<span class="award-more">+${awardsCount - 2}</span>` : ''}
          </div>
          
          <div class="card-footer">
            <span class="candle-count">
              <span class="candle-icon">🕯️</span>
              <span>1</span>
            </span>
          </div>
        </div>
      </article>
    `;
  },
  
  /**
   * Открытие модального окна героя
   */
  openHeroModal(heroId) {
    const hero = MuseumAPI.getHeroById(heroId);
    if (!hero) return;
    
    const modal = this.dom.heroModal;
    const specialty = SPECIALTIES_TAXONOMY[hero.specTag?.toUpperCase()] || { name: 'Не указано', gradient: '' };
    
    // Заполнение данных
    document.getElementById('modal-img').src = hero.media?.photo || 'assets/images/placeholder.jpg';
    document.getElementById('modal-img').alt = hero.name;
    document.getElementById('modal-title').textContent = hero.name;
    document.getElementById('modal-dates').textContent = hero.dates?.years || '';
    document.getElementById('modal-rank').textContent = `${hero.military?.rank || ''} • ${hero.military?.unit || ''}`;
    
    // Бейджи наград
    const badgesContainer = document.getElementById('modal-badges');
    badgesContainer.innerHTML = hero.awards?.map(award => `
      <span class="award-badge-full">🎖️ ${award}</span>
    `).join('') || '';
    
    // Рендеринг Markdown контента
    document.getElementById('modal-bio').innerHTML = DataHelpers.parseMarkdown(
      `**${hero.education?.specialty || ''}**\n\n${hero.education?.period ? `Период обучения: ${hero.education.period}` : ''}\n\n${hero.memorialStatus || ''}`
    );
    
    document.getElementById('modal-deed').innerHTML = DataHelpers.parseMarkdown(hero.deed || 'Нет данных');
    
    const quoteEl = document.getElementById('modal-quote');
    if (hero.quote) {
      quoteEl.textContent = hero.quote;
      quoteEl.style.display = 'block';
    } else {
      quoteEl.style.display = 'none';
    }
    
    // Показываем кнопку цитаты только если есть цитата
    const quoteTab = modal.querySelector('[data-tab="quote"]');
    if (quoteTab) {
      quoteTab.style.display = hero.quote ? 'block' : 'none';
    }
    
    // Переключаемся на первую вкладку
    this.switchTab('bio');
    
    // Открываем модальное окно
    modal.showModal();
    document.body.style.overflow = 'hidden';
  },
  
  /**
   * Переключение вкладок
   */
  switchTab(tabName) {
    const tabs = ['bio', 'deed', 'quote'];
    
    this.dom.tabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    tabs.forEach(tab => {
      const pane = document.getElementById(`tab-${tab}`);
      if (pane) {
        pane.classList.toggle('active', tab === tabName);
      }
    });
  },
  
  /**
   * Обновление статистики
   */
  updateStats() {
    if (this.dom.totalHeroes) {
      this.dom.totalHeroes.textContent = this.currentHeroes.length;
    }
    
    if (this.dom.totalAwards) {
      const totalAwards = this.currentHeroes.reduce((sum, h) => sum + (h.awards?.length || 0), 0);
      this.dom.totalAwards.textContent = totalAwards;
    }
  },
  
  /**
   * Инициализация переключателя темы
   */
  initThemeToggle() {
    const toggle = this.dom.themeToggle;
    const sunIcon = toggle?.querySelector('.icon-sun');
    const moonIcon = toggle?.querySelector('.icon-moon');
    
    if (!toggle) return;
    
    // Проверяем сохраненную тему
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.classList.toggle('theme-dark', savedTheme === 'dark');
    this.updateThemeIcons(savedTheme === 'dark', sunIcon, moonIcon);
    
    toggle.addEventListener('click', () => {
      const isDark = document.body.classList.toggle('theme-dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      this.updateThemeIcons(isDark, sunIcon, moonIcon);
    });
  },
  
  updateThemeIcons(isDark, sunIcon, moonIcon) {
    if (sunIcon && moonIcon) {
      sunIcon.style.display = isDark ? 'none' : 'block';
      moonIcon.style.display = isDark ? 'block' : 'none';
    }
  },
  
  /**
   * Инициализация модального окна "О проекте"
   */
  initAboutModal() {
    const contentEl = document.getElementById('about-content');
    if (contentEl && typeof ABOUT_MARKDOWN !== 'undefined') {
      contentEl.innerHTML = DataHelpers.parseMarkdown(ABOUT_MARKDOWN);
    }
  }
};

// Автозапуск после загрузки DOM
document.addEventListener('DOMContentLoaded', () => MemoryBookApp.init());
    years: "20.12.2000 — 2023",
    specialty: "Пожарная безопасность (выпуск 2020 г.)",
    military: "Гвардии рядовой, номер расчета 247-го гв. ДШП ВДВ",
    awards: "Орден Мужества (посмертно)",
    location: "Запорожский рубеж / Орехов",
    audioFile: "assets/audio/guides/sopolev.mp3",
    photo: "assets/images/heroes/sopolev.jpg",
    shortSnippet: "Спасение жизней сослуживцев под непрерывным кассетным обстрелом на Ореховском направлении.",
    markdown: `
# Николай Сергеевич Сополев (2000 — 2023)
> *«Спасение жизней — священное призвание на службе и в бою.»*

---

### 🎓 I. Студенческий спасательный отряд
Николай окончил отделение **«Пожарная безопасность»** в 2020 году со специальностью техника-спасателя. В колледже он был одним из лидеров добровольного пожарно-спасательного отряда, неоднократно побеждал на краевых соревнованиях по пожарно-прикладному спорту.

### ⚔️ II. Служба в ВДВ
Поступив на военную службу по контракту в легендарный **247-й гвардейский десантно-штурмовой Кавказский казачий полк**, Николай применил все свои профессиональные спасательные навыки в боевых условиях Запорожского фронта.

### ⭐️ III. Подвиг спасателя на линии огня
Летом 2023 года в ходе тяжелейших боев на Ореховском участке Запорожского направления позиции десантников подверглись массированному артиллерийскому удару кассетными боеприпасами. 

Несмотря на непрекращающийся обстрел, гвардии рядовой Сополев бросился на помощь раненым товарищам. Лично оказав первую медицинскую помощь четырем бойцам, он вынес их на себе в безопасное укрытие. Возвращаясь за следующим раненым, Николай попал под повторный артиллерийский удар и погиб смертью героя.

> **УКАЗ ПРЕЗИДЕНТА РФ:**  
> За самоотверженность и отвагу при спасении товарищей гвардии рядовой **Сополев Николай Сергеевич** награжден **Орденом Мужества** (посмертно).
`
  },
  {
    id: "belov-s-a",
    plaque: "left",
    chapterNum: "Глава IV",
    name: "Белов Сергей Александрович",
    years: "05.01.1995 — 2023",
    specialty: "Электрооборудование и энергетика (выпуск 2015 г.)",
    military: "Младший сержант, командир боевой машины",
    awards: "Орден Мужества (посмертно)",
    location: "Бахмутский рубеж",
    audioFile: "assets/audio/guides/belov.mp3",
    photo: "assets/images/heroes/belov.jpg",
    shortSnippet: "Отражение танкового флангового удара противника на Бахмутском рубеже. Обеспечил перегруппировку батальона.",
    markdown: `
# Сергей Александрович Белов (1995 — 2023)
> *«Честно выполнил свой долг перед Родиной и товарищами.»*

---

### 🎓 I. Энергетик по призванию
Сергей окончил отделение электрооборудования и энергетики СРМК в 2015 году. Преподаватели помнят его как рассудительного и технически грамотного специалиста, отлично разбирающегося в сложных распределительных системах.

### ⭐️ II. Боевой подвиг под Бахмутом
В должности командира боевой машины мотострелковых войск младший сержант Белов проявил высокое командирское мастерство. 

В 2023 году на Бахмутском рубеже колонна подразделения подверглась внезапной фланговой атаке танкового взвода противника. Сергей отдал приказ экипажу занять огневую позицию и вступить в дуэль с бронетехникой врага. Приняв главный удар на себя, экипаж Белова уничтожил бронемашину противника и дал возможность основным силам выйти из-под огня без потерь. Сергей погиб на боевом посту.

> Награжден **Орденом Мужества** (посмертно).
`
  },
  {
    id: "shartov-p-n",
    plaque: "left",
    chapterNum: "Глава V",
    name: "Шартов Павел Николаевич",
    years: "1998 — 2023",
    specialty: "Техническое обслуживание автотранспорта (выпуск 2018 г.)",
    military: "Рядовой, водитель роты подвоза боеприпасов батальона МТО",
    awards: "Орден Мужества (посмертно)",
    location: "Марьинское направление",
    audioFile: "assets/audio/guides/shartov.mp3",
    photo: "assets/images/heroes/shartov.jpg",
    shortSnippet: "Рейсы сквозь огонь: доставка боеприпасов на передний край Марьинки под прицельными ударами дронов.",
    markdown: `
# Павел Николаевич Шартов (1998 — 2023)
> *«Каждый рейс на передовую — это спасенные жизни пехоты.»*

---

### 🎓 I. Автоотделение СРМК
Павел окончил автотранспортное отделение в 2018 году. Досконально знал устройство армейских грузовиков и дизельных двигателей, неоднократно помогал в ремонте учебного автопарка.

### ⭐️ II. Рейсы сквозь огонь в Марьинке
Осенью 2023 года под Марьинкой шли тяжелейшие штурмовые бои. Рядовой Шартов под непрерывным артиллерийским огнем и прицельными сбросами с беспилотников совершал регулярные рейсы на передовую, доставляя тонны боекомплекта. 

Во время очередной разгрузки на «нулевой» линии минометная мина разорвалась рядом с автомобилем. Павел погиб, обеспечив подразделение боеприпасами до последнего патрона.

> Награжден **Орденом Мужества** (посмертно).
`
  },
  {
    id: "nazyrov-sh-r",
    plaque: "left",
    chapterNum: "Глава VI",
    name: "Назыров Шамиль Рустамович",
    years: "26.09.2002 — 04.05.2023",
    specialty: "Электромонтер (Красный диплом 2021 г.)",
    military: "Гвардии рядовой, в/ч 12676, водитель «Машины жизни»",
    awards: "Орден Мужества (посмертно), Медаль «За храбрость» II степени",
    location: "Херсонская область, с. Гладковка",
    audioFile: "assets/audio/guides/nazyrov.mp3",
    photo: "assets/images/heroes/nazyrov.jpg",
    shortSnippet: "Легендарный водитель «Машины жизни». Обеспечивал передовую питьевой водой под обстрелами. Погиб в с. Гладковка.",
    markdown: `
# Шамиль Рустамович Назыров (2002 — 2023)
> *«Он был лучшим во всех делах — добрым, смелым и надежным.» (Из письма командира взвода)*

---

### 🎓 I. Гордость колледжа и красный диплом
Шамиль вырос в ауле Куликовы Копани Туркменского района. В СРМК учился с феноменальным усердием: окончил колледж **с отличием (красный диплом)** по профессии электромонтера, параллельно освоил сварочное дело и поступил на бюджет в Аграрный университет. В декабре 2021 года добровольно заключил контракт с ВС РФ в Крыму (в/ч 12676, с. Перевальное).

### ⚔️ II. Легендарная «Машина жизни»
С первых часов СВО Шамиль находился на передовой в Херсонской области. В условиях острой нехватки воды под палящим солнцем и артиллерийским огнем его автоцистерну бойцы с надеждой назвали **«Машиной жизни»**.

### ⭐️ III. Подвиг в селе Гладковка
Шамиль принимал участие в штурме стратегического аэропорта, за что был награжден государственной медалью **«За храбрость» II степени**. 

**4 мая 2023 года** в районе села Гладковка под шквальным артиллерийским налетом Шамиль доставил воду расчетам на передовой, но попал под прицельный залп вражеской реактивной артиллерии. 20-летний воин погиб смертью храбрых.

> **УКАЗ ПРЕЗИДЕНТА РФ:**  
> Гвардии рядовой **Назыров Шамиль Рустамович** посмертно награжден **Орденом Мужества**. В электромастерской СРМК открыта именная «Парта Героя».
`
  },
  {
    id: "lukyanenko-i-v",
    plaque: "left",
    chapterNum: "Глава VII",
    name: "Лукьяненко Игорь Владимирович",
    years: "1997 — 2023",
    specialty: "Машиностроение и металлообработка (выпуск 2017 г.)",
    military: "Рядовой, механик-водитель танка Т-72Б3",
    awards: "Орден Мужества (посмертно)",
    location: "Донецкое направление",
    audioFile: "assets/audio/guides/lukyanenko.mp3",
    photo: "assets/images/heroes/lukyanenko.jpg",
    shortSnippet: "Прорыв эшелонированной обороны в ДНР. Сохранил маневренность танка под прямым артобстрелом.",
    markdown: `
# Игорь Владимирович Лукьяненко (1997 — 2023)
> *«Броня сильна стойкостью экипажа.»*

---

### 🎓 I. Машиностроительное отделение
Игорь окончил колледж в 2017 году по специальности техника-механика. Отличался железной выдержкой и глубоким пониманием физики металлов и силовых агрегатов.

### ⭐️ II. Танковый прорыв в ДНР
В качестве механика-водителя танка Т-72Б3 Игорь участвовал в прорыве долговременных укреплений противника. Когда машина получила повреждение от кумулятивного снаряда, рядовой Лукьяненко сумел завести двигатель, потушить очаг возгорания и вывести боевую машину из сектора обстрела, сохранив жизни экипажа. Погиб в последующих наступательных боях.

> Награжден **Орденом Мужества** (посмертно).
`
  },
  {
    id: "nazarenko-n-s",
    plaque: "left",
    chapterNum: "Глава VIII",
    name: "Назаренко Никита Сергеевич",
    years: "2004 — 13.08.2024",
    specialty: "Наладчик компьютерных сетей (выпуск 2024 г.)",
    military: "Рядовой войск связи ВС РФ",
    awards: "Орден Мужества (посмертно)",
    location: "Курское приграничье",
    audioFile: "assets/audio/guides/nazarenko.mp3",
    photo: "assets/images/heroes/nazarenko.jpg",
    shortSnippet: "Самый юный герой мемориала (20 лет). Обеспечил боевую связь штабов в Курском приграничье 13 августа 2024 года.",
    markdown: `
# Никита Сергеевич Назаренко (2004 — 2024)
> *«Самый юный герой в строю выпускников нашего колледжа.»*

---

### 🎓 I. Выпускник IT-кафедры 2024 года
Никита — самый молодой воин в летописи колледжа. В июне 2024 года он защитил диплом по специальности наладчика компьютерных сетей. Сразу после выпуска подписал контракт и стал военным связистом.

### ⭐️ II. Бой в Курском приграничье
**13 августа 2024 года.** Во время ожесточенных боев по отражению вторжения в Курскую область командный пункт связи попал под массированный ракетный налет. 

Никита под разрывами кассетных боеприпасов лично восстановил оптоволоконную линию боевого управления артиллерией. Получив смертельное ранение, 20-летний связист выполнил боевой приказ до конца.

> Награжден **Орденом Мужества** (посмертно).
`
  },
  {
    id: "lutsenko-k-a",
    plaque: "left",
    chapterNum: "Глава IX",
    name: "Луценко Константин Андреевич",
    years: "2001 — 2023",
    specialty: "Сварочное производство (выпуск 2021 г.)",
    military: "Рядовой, сапер инженерно-саперного батальона",
    awards: "Орден Мужества (посмертно)",
    location: "Запорожская область",
    audioFile: "assets/audio/guides/lutsenko.mp3",
    photo: "assets/images/heroes/lutsenko.jpg",
    shortSnippet: "Инженерная разведка и разминирование минных полей под прямым огнем на Запорожском фронте.",
    markdown: `
# Константин Андреевич Луценко (2001 — 2023)
> *«Труд сапера спасает сотни жизней.»*

---

### 🎓 I. Сварочные технологии
Константин окончил СРМК в 2021 году. В мастерской отличался хладнокровием и высокой точностью работы.

### ⭐️ II. Разминирование под огнем
В инженерно-саперных войсках Константин проделывал проходы в минных заграждениях для продвижения штурмовых групп на Запорожском направлении. Лично обезвредил десятки противотанковых мин. Погиб при разминировании критически важного рубежа.

> Награжден **Орденом Мужества** (посмертно).
`
  },
  {
    id: "ponomarchuk-i-s",
    plaque: "left",
    chapterNum: "Глава X",
    name: "Пономарчук Иван Сергеевич",
    years: "20.10.2002 — 02.07.2024",
    specialty: "Пожарная безопасность (выпуск 2022 г.)",
    military: "Гвардии рядовой 247-го гв. ДШП ВДВ",
    awards: "Орден Мужества (посмертно)",
    location: "Ореховское направление",
    audioFile: "assets/audio/guides/ponomarchuk.mp3",
    photo: "assets/images/heroes/ponomarchuk.jpg",
    shortSnippet: "Удержание стратегического рубежа в составе 247-го ДШП ВДВ под Ореховом в июле 2024 года.",
    markdown: `
# Иван Сергеевич Пономарчук (2002 — 2024)
> *«Никто кроме нас.»*

---

### 🎓 I. Спасатель и спортсмен
Иван окончил отделение пожарной безопасности в 2022 году. Был активистом колледжа и кандидатом в мастера спорта.

### ⭐️ II. Оборона Ореховского рубежа
**2 июля 2024 года.** Гвардии рядовой 247-го ДШП Пономарчук оборонял опорный пункт на Ореховском направлении. Отражая атаку превосходящих сил врага, Иван вел непрерывный пулеметный огонь и погиб, удержав рубеж.

> Награжден **Орденом Мужества** (посмертно).
`
  },

  /* ==========================================================================
     ПРАВАЯ ПЛИТА МЕМОРИАЛА (10 ГЕРОЕВ)
     ========================================================================== */
  {
    id: "martynov-s-k",
    plaque: "right",
    chapterNum: "Глава XI",
    name: "Мартынов Станислав Константинович",
    years: "02.11.2000 — 17.06.2023",
    specialty: "Пожарная безопасность (выпуск 2020 г.)",
    military: "Младший сержант, командир отделения спецподразделения",
    awards: "Орден Мужества (посмертно)",
    location: "Угледарское направление",
    audioFile: "assets/audio/guides/martynov.mp3",
    photo: "assets/images/heroes/martynov.jpg",
    shortSnippet: "Принял командование штурмовой группой после ранения офицера и взял опорный пункт под Угледаром.",
    markdown: `
# Станислав Константинович Мартынов (2000 — 2023)
> *«Сила командира — в ответственности за каждого бойца.»*

---

### 🎓 I. Староста и лидер курса
Станислав был старостой группы спасателей, отличником строевой подготовки и победителем региональных олимпиад.

### ⭐️ II. Командирский подвиг под Угледаром
**17 июня 2023 года.** При штурме вражеского опорного пункта под Угледаром командир взвода получил тяжелое ранение. Младший сержант Мартынов принял командование подразделением на себя, перестроил боевой порядок и решительным броском выбил врага с высоты. В бою Станислав погиб смертью храбрых.

> Награжден **Орденом Мужества** (посмертно).
`
  },
  {
    id: "gorlov-n-a",
    plaque: "right",
    chapterNum: "Глава XII",
    name: "Горлов Никита Андреевич",
    years: "20.08.1999 — 12.05.2022",
    specialty: "ТО автотранспорта (выпуск 2019 г.)",
    military: "Гвардии рядовой контрактной службы 247-го гв. ДШП ВДВ",
    awards: "Орден Мужества (посмертно, Указ № 406сс)",
    location: "Херсонское направление",
    audioFile: "assets/audio/guides/gorlov.mp3",
    photo: "assets/images/heroes/gorlov.jpg",
    shortSnippet: "Старший стрелок 247-го ДШП ВДВ. Освобождение населенных пунктов южного направления в мае 2022 года.",
    markdown: `
# Никита Андреевич Горлов (1999 — 2022)
> *«Гвардейцы не отступают.»*

---

### 🎓 I. Автомеханик СРМК
Никита окончил автотранспортное отделение в 2019 году. Служил старшим стрелком в Ставропольском 247-м десантно-штурмовом полку.

### ⭐️ II. Встречные бои на юге
12 мая 2022 года в Херсонской области передовой дозор десантников попал в засаду. Никита Горлов огнем из автомата сковал фланг противника и обеспечил развертывание взвода, пав в бою смертью героя.

> Указом Президента РФ № 406сс награжден **Орденом Мужества** (посмертно).
`
  },
  {
    id: "vecherka-n-a",
    plaque: "right",
    chapterNum: "Глава XIII",
    name: "Вечёрка Николай Анатольевич",
    years: "25.06.1996 — 26.02.2022",
    specialty: "Пожарная безопасность (выпуск 2016 г.)",
    military: "Гвардии рядовой, разведчик-санитар 247-го гв. ДШП ВДВ",
    awards: "Орден Мужества (посмертно)",
    location: "Антоновский мост, г. Херсон",
    audioFile: "assets/audio/guides/vecherka.mp3",
    photo: "assets/images/heroes/vecherka.jpg",
    shortSnippet: "Легендарный бой 26 февраля 2022 года у Антоновского моста. Спасал раненых десантников в полном окружении.",
    markdown: `
# Николай Анатольевич Вечёрка (1996 — 2022)
> *«Первые в бою, первые в вечности.»*

---

### 🎓 I. Спасатель МЧС
Николай окончил колледж в 2016 году. Служил разведчиком-санитаром разведроты 247-го полка ВДВ.

### ⭐️ II. Бой за Антоновский мост
**26 февраля 2022 года.** В первые дни СВО десантники вели бой за стратегический Антоновский мост через Днепр. Николай под шквальным огнем эвакуировал раненых и прикрывал товарищей до последнего патрона.

> Награжден **Орденом Мужества** (посмертно).
`
  },
  {
    id: "samokhin-d-a",
    plaque: "right",
    chapterNum: "Глава XIV",
    name: "Самохин Дмитрий Александрович",
    years: "06.08.2000 — 04.03.2022",
    specialty: "Техническая эксплуатация электрооборудования (выпуск 2020 г.)",
    military: "Рядовой, электромеханик",
    awards: "Орден Мужества № 83029 (посмертно, Указ от 26.03.2022)",
    location: "Запорожский рубеж",
    audioFile: "assets/audio/guides/samokhin.mp3",
    photo: "assets/images/heroes/samokhin.jpg",
    shortSnippet: "Отражение танкового прорыва в первые недели СВО. Награжден Орденом Мужества № 83029.",
    markdown: `
# Дмитрий Александрович Самохин (2000 — 2022)
> *«Его подвиг навсегда вписан в золотые страницы нашего колледжа.»*

---

### 🎓 I. Электроотделение
Дмитрий окончил колледж в 2020 году со специальностью электромеханика.

### ⭐️ II. Подвиг 4 марта 2022 года
При отражении внезапной танковой атаки на Запорожском направлении рядовой Самохин огнем из стрелкового оружия и гранатометов сковал маневр врага и спас экипаж боевой машины.

> Указом Президента РФ награжден **Орденом Мужества № 83029** (посмертно).
`
  },
  {
    id: "butov-v-e",
    plaque: "right",
    chapterNum: "Глава XV",
    name: "Бутов Виктор Евгеньевич",
    years: "17.06.1989 — 08.10.2022",
    specialty: "Компьютерные системы и комплексы (выпуск 2008 г.)",
    military: "Прапорщик Пограничного управления ФСБ России по КЧР",
    awards: "Орден Мужества (посмертно), Ветеран боевых действий",
    location: "Приграничная полоса",
    audioFile: "assets/audio/guides/butov.mp3",
    photo: "assets/images/heroes/butov.jpg",
    shortSnippet: "Офицер спецподразделения Пограничной службы ФСБ. Отражение нападения диверсионной группы.",
    markdown: `
# Виктор Евгеньевич Бутов (1989 — 2022)
> *«Пример чести, доблести и отваги.»*

---

### 🎓 I. IT-отделение
Виктор окончил кафедру вычислительных комплексов в 2008 году.

### ⭐️ II. Защита государственной границы
Служил в Отделе мобильных действий ПУ ФСБ. 8 октября 2022 года в бою с диверсионно-разведывательной группой лично ликвидировал двух диверсантов и предотвратил прорыв границы, получив смертельное ранение.

> Награжден **Орденом Мужества** (посмертно).
`
  },
  {
    id: "elagin-m-n",
    plaque: "right",
    chapterNum: "Глава XVI",
    name: "Елагин Максим Николаевич",
    years: "05.07.2000 — 26.02.2022",
    specialty: "Сварочное производство (выпуск 2019 г.)",
    military: "Гвардии рядовой ВДВ",
    awards: "Орден Мужества (посмертно)",
    location: "Херсонский плацдарм",
    audioFile: "assets/audio/guides/elagin.mp3",
    photo: "assets/images/heroes/elagin.jpg",
    shortSnippet: "Встречный бой десанта 26 февраля 2022 года на южном рубеже. Держал оборону до конца.",
    markdown: `
# Максим Николаевич Елагин (2000 — 2022)
> *«Мастерство в профессии, несокрушимый дух в бою.»*

---

### 🎓 I. Сварщик СРМК
Максим окончил сварочное отделение в 2019 году.

### ⭐️ II. Бой первых дней СВО
26 февраля 2022 года на южном рубеже в составе штурмовой группы десантников удерживал занятые рубежи под шквальным минометным огнем.

> Награжден **Орденом Мужества** (посмертно).
`
  },
  {
    id: "grigoriev-a-n",
    plaque: "right",
    chapterNum: "Глава XVII",
    name: "Григорьев Александр Николаевич",
    years: "16.11.1999 — 12.08.2023",
    specialty: "Электротехническое отделение (выпуск 2019 г.)",
    military: "Гвардии рядовой, старший стрелок",
    awards: "Орден Мужества (посмертно), Медаль Суворова",
    location: "Времевский выступ",
    audioFile: "assets/audio/guides/grigoriev.mp3",
    photo: "assets/images/heroes/grigoriev.jpg",
    shortSnippet: "Отражение штурма на Времевском выступе. Награжден медалью Суворова при жизни.",
    markdown: `
# Александр Николаевич Григорьев (1999 — 2023)
> *«Честь дороже жизни.»*

---

### 🎓 I. Электротехник
Александр окончил электротехническое отделение в 2019 году.

### ⭐️ II. Сражение на Времевском выступе
За отвагу в боях был награжден медалью Суворова. 12 августа 2023 года при отражении штурма бронеколонны противника огнем сорвал высадку пехоты и удержал рубеж.

> Награжден **Орденом Мужества** (посмертно).
`
  },
  {
    id: "brynza-n-d",
    plaque: "right",
    chapterNum: "Глава XVIII",
    name: "Брынза Никита Дмитриевич",
    years: "05.02.2000 — 06.08.2023",
    specialty: "ТО автотранспорта (выпуск 2020 г.)",
    military: "Рядовой, пулеметчик штурмового батальона",
    awards: "Орден Мужества (посмертно)",
    location: "Донецкое направление",
    audioFile: "assets/audio/guides/brynza.mp3",
    photo: "assets/images/heroes/brynza.jpg",
    shortSnippet: "Подавление вражеского пулеметного дзота в решающий момент штурма на Донецком рубеже.",
    markdown: `
# Никита Дмитриевич Брынза (2000 — 2023)
> *«Прикрыл товарищей огнем в решающий момент боя.»*

---

### 🎓 I. Автоотделение
Никита окончил автотранспортное отделение в 2020 году.

### ⭐️ II. Подавление огневой точки
6 августа 2023 года в ходе штурма укреплений в ДНР скрытно выдвинулся во фланг дзота и точным огнем уничтожил пулеметный расчет противника, обеспечив прорыв роты.

> Награжден **Орденом Мужества** (посмертно).
`
  },
  {
    id: "serbienko-i-p",
    plaque: "right",
    chapterNum: "Глава XIX",
    name: "Сербиенко Иван Павлович",
    years: "02.11.2002 — 11.2024",
    specialty: "Пожарная безопасность (выпуск 2022 г.)",
    military: "Рядовой, морская пехота",
    awards: "Орден Мужества (посмертно)",
    location: "Днепровский рубеж",
    audioFile: "assets/audio/guides/serbienko.mp3",
    photo: "assets/images/heroes/serbienko.jpg",
    shortSnippet: "Десантные операции морской пехоты на Днепре. Обеспечил эвакуацию группы под ударами дронов.",
    markdown: `
# Иван Павлович Сербиенко (2002 — 2024)
> *«Где мы — там победа.»*

---

### 🎓 I. Спасатель СРМК
Иван окончил отделение пожарной безопасности в 2022 году.

### ⭐️ II. Десант на Днепре
В ноябре 2024 года в ходе высадки десанта на Днепровском плацдарме Иван первым занял оборону на берегу и прикрыл эвакуацию раненых с воды.

> Награжден **Орденом Мужества** (посмертно).
`
  },
  {
    id: "chupin-i-v",
    plaque: "right",
    chapterNum: "Глава XX",
    name: "Чупин Илья Валерьевич",
    years: "28.03.1999 — 16.10.2024",
    specialty: "Монтаж оборудования (выпуск 2019 г.)",
    military: "Сержант, замкомвзвода мотострелков",
    awards: "Орден Мужества (посмертно), Медаль «За отвагу»",
    location: "Покровское направление",
    audioFile: "assets/audio/guides/chupin.mp3",
    photo: "assets/images/heroes/chupin.jpg",
    shortSnippet: "Оборона взводного опорного пункта на Покровском направлении. Сохранил жизни бойцов ценой своей.",
    markdown: `
# Илья Валерьевич Чупин (1999 — 2024)
> *«Верность присяге до последнего дыхания.»*

---

### 🎓 I. Механик СРМК
Илья окончил колледж в 2019 году со специальностью техника-механика.

### ⭐️ II. Оборона под Покровском
16 октября 2024 года на Покровском направлении взвод сержанта Чупина отражал штурм превосходящих сил врага. Илья лично уничтожил бронетранспортер и спас личный состав, оставшись на позиции до конца.

> Награжден медалью **«За отвагу»** и **Орденом Мужества** (посмертно).
`
  }
];

// УПРАВЛЯЮЩИЙ ОБЪЕКТ КНИГИ
const MemoryBookApp = {
  currentFilter: 'all',
  currentPlayingId: null,
  audioEl: null,
  currentHeroIndex: -1,
  lastFocusedElement: null,

  getArchive() {
    return window.GRAND_MEMORY_BOOK_ARCHIVE || MEMORY_BOOK_ARCHIVE;
  },

  init() {
    this.audioEl = document.getElementById('bookAudioPlayer');
    this.renderChronicles();
    this.renderTOC();
    this.bindEvents();
    this.initAudioEvents();
    this.initScrollProgress();
    const linkedHero = window.location.hash.replace('#', '');
    if (this.getArchive().some(hero => hero.id === linkedHero)) {
      this.openReader(linkedHero, false);
    }
    console.log("[MemoryBook] Архивно-маркдаун движок готов.");
  },

  renderChronicles() {
    const feed = document.getElementById('storiesFeed');
    if (!feed) return;

    const archive = this.getArchive();

    const query = (document.getElementById('bookSearchInput')?.value || '').toLowerCase().trim();

    const filtered = archive.filter(hero => {
      let matchesFilter = true;
      if (this.currentFilter === 'left') matchesFilter = hero.plaque === 'left';
      if (this.currentFilter === 'right') matchesFilter = hero.plaque === 'right';

      let matchesSearch = true;
      if (query) {
        matchesSearch = hero.name.toLowerCase().includes(query) ||
          hero.specialty.toLowerCase().includes(query) ||
          hero.location.toLowerCase().includes(query) ||
          hero.awards.toLowerCase().includes(query) ||
          hero.shortSnippet.toLowerCase().includes(query);
      }

      return matchesFilter && matchesSearch;
    });

    if (filtered.length === 0) {
      feed.innerHTML = `
        <div style="text-align:center; padding: 60px 20px; color: var(--text-tertiary); background: var(--bg-surface); border: 1px solid var(--border-hairline);">
          <p style="font-size: 1.2rem; color: #fff; margin-bottom: 6px;">Записи в летописи не найдены</p>
          <small>Попробуйте изменить поисковый запрос</small>
        </div>
      `;
      return;
    }

    feed.innerHTML = filtered.map(hero => `
      <article class="hero-chapter-card" id="card-${hero.id}">
        <div class="chapter-badge-row">
          <span class="chapter-number">${hero.chapterNum}</span>
          <span class="chapter-plaque-tag">${hero.plaque === 'left' ? 'Левая плита Мемориала' : 'Правая плита Мемориала'}</span>
        </div>

        <div class="chapter-hero-header">
          <div class="chapter-photo-wrap">
            <img src="${hero.photo}" alt="${hero.name}" class="chapter-photo" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'140\\' height=\\'185\\'%3E%3Crect width=\\'140\\' height=\\'185\\' fill=\\'%2312151d\\'/ %3E%3Ctext x=\\'50%25\\' y=\\'50%25\\' dominant-baseline=\\'middle\\' text-anchor=\\'middle\\' fill=\\'%23c5a059\\' font-size=\\'12\\'%3EСРМК%3C/text%3E%3C/svg%3E'">
          </div>

          <div class="chapter-hero-titles">
            <h3>${hero.name}</h3>
            <div class="chapter-hero-years">${hero.years}</div>
            <div class="chapter-meta-grid">
              <span><strong>Профессия</strong>${hero.specialty}</span>
              <span><strong>Рубеж</strong>${hero.location}</span>
              <span><strong>Награды</strong>${hero.awards}</span>
            </div>
            <p class="chapter-short-desc">${hero.shortSnippet}</p>

            <div class="chapter-actions-bar">
              <button class="btn-chapter btn-read" onclick="MemoryBookApp.openReader('${hero.id}')" type="button">
                📖 Читать полную главу (Markdown)
              </button>
              <button class="btn-chapter" onclick="MemoryBookApp.playHeroAudio('${hero.id}')" type="button">
                🎧 Слушать аудиогид (MP3)
              </button>
              <a href="reader.html#${hero.id}" class="btn-chapter">
                📚 Открыть 3D-фолиант
              </a>
              <a href="index.html#hero-${hero.id}" class="btn-chapter">
                🏛 В 3D-музей
              </a>
            </div>
          </div>
        </div>
      </article>
    `).join('');
  },

  renderTOC() {
    const list = document.getElementById('tocList');
    if (!list) return;

    list.innerHTML = this.getArchive().map(hero => `
      <a href="javascript:void(0)" onclick="MemoryBookApp.openReader('${hero.id}')" class="toc-item">
        <span>${hero.name}</span>
        <small style="color:var(--accent-brass);">${hero.plaque === 'left' ? 'Л' : 'П'}</small>
      </a>
    `).join('');
  },

  bindEvents() {
    const searchInput = document.getElementById('bookSearchInput');
    const clearBtn = document.getElementById('clearSearchBtn');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        clearBtn.style.display = e.target.value ? 'block' : 'none';
        this.renderChronicles();
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearBtn.style.display = 'none';
        this.renderChronicles();
      });
    }

    document.getElementById('prevChapterBtn')?.addEventListener('click', () => this.openAdjacentChapter(-1));
    document.getElementById('nextChapterBtn')?.addEventListener('click', () => this.openAdjacentChapter(1));

    document.querySelectorAll('.filter-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFilter = btn.dataset.filter;
        this.renderChronicles();
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeReader();
    });

    window.addEventListener('hashchange', () => {
      const heroId = window.location.hash.replace('#', '');
      if (this.getArchive().some(hero => hero.id === heroId)) this.openReader(heroId, false);
    });
  },

  // МАРКДАУН-ПАРСЕР
  parseMarkdown(md) {
    const inline = text => text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>');
    const lines = md.trim().split(/\r?\n/);
    const blocks = [];
    let paragraph = [];
    let list = [];

    const flushParagraph = () => {
      if (paragraph.length) {
        blocks.push(`<p>${inline(paragraph.join(' ').trim())}</p>`);
        paragraph = [];
      }
    };
    const flushList = () => {
      if (list.length) {
        blocks.push(`<ul>${list.map(item => `<li>${inline(item)}</li>`).join('')}</ul>`);
        list = [];
      }
    };

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) {
        flushParagraph();
        flushList();
      } else if (/^###\s/.test(trimmed)) {
        flushParagraph(); flushList();
        blocks.push(`<h3>${inline(trimmed.slice(4))}</h3>`);
      } else if (/^##\s/.test(trimmed)) {
        flushParagraph(); flushList();
        blocks.push(`<h2>${inline(trimmed.slice(3))}</h2>`);
      } else if (/^#\s/.test(trimmed)) {
        flushParagraph(); flushList();
        blocks.push(`<h1>${inline(trimmed.slice(2))}</h1>`);
      } else if (/^>\s?/.test(trimmed)) {
        flushParagraph(); flushList();
        blocks.push(`<blockquote>${inline(trimmed.replace(/^>\s?/, ''))}</blockquote>`);
      } else if (/^---+$/.test(trimmed)) {
        flushParagraph(); flushList();
        blocks.push('<hr>');
      } else if (/^[-*]\s+/.test(trimmed)) {
        flushParagraph();
        list.push(trimmed.replace(/^[-*]\s+/, ''));
      } else {
        flushList();
        paragraph.push(trimmed);
      }
    });

    flushParagraph();
    flushList();
    return blocks.join('');
  },

  openReader(heroId, updateHash = true) {
    const archive = this.getArchive();
    const hero = archive.find(h => h.id === heroId);
    if (!hero) return;

    this.currentHeroIndex = archive.findIndex(h => h.id === heroId);
    this.lastFocusedElement = document.activeElement;

    document.getElementById('readerHeroTag').textContent = `${hero.chapterNum} • ${hero.name}`;
    const chapterContent = hero.markdown
      ? this.parseMarkdown(hero.markdown)
      : hero.pages.map(page => `<h2>${page.chapterTitle}</h2>${page.rightHtml}`).join('');
    document.getElementById('markdownRenderContainer').innerHTML = chapterContent;

    const audioBtn = document.getElementById('readerAudioBtn');
    audioBtn.onclick = () => this.playHeroAudio(hero.id);

    const modal = document.getElementById('readerModal');
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.getElementById('readerPosition').textContent = `${hero.chapterNum} из ${archive.length}`;
    document.getElementById('prevChapterBtn').disabled = this.currentHeroIndex === 0;
    document.getElementById('nextChapterBtn').disabled = this.currentHeroIndex === archive.length - 1;
    document.body.style.overflow = 'hidden';
    document.getElementById('readerModal').querySelector('.reader-close')?.focus();
    if (updateHash) history.replaceState(null, '', `#${hero.id}`);
  },

  closeReader() {
    const modal = document.getElementById('readerModal');
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = 'auto';
    if (this.lastFocusedElement && typeof this.lastFocusedElement.focus === 'function') this.lastFocusedElement.focus();
    if (this.getArchive().some(hero => hero.id === window.location.hash.replace('#', ''))) history.replaceState(null, '', window.location.pathname + window.location.search);
  },

  openAdjacentChapter(direction) {
    const nextIndex = this.currentHeroIndex + direction;
    const nextHero = this.getArchive()[nextIndex];
    if (nextHero) this.openReader(nextHero.id);
  },

  // УПРАВЛЕНИЕ АУДИОГИДОМ (MP3)
  playHeroAudio(heroId) {
    const hero = this.getArchive().find(h => h.id === heroId);
    if (!hero || !this.audioEl) return;

    this.currentPlayingId = heroId;
    this.audioEl.src = hero.audioFile;

    document.getElementById('bookAudioTitle').textContent = `Аудиогид: ${hero.name}`;
    document.getElementById('bookAudioHero').textContent = hero.military;
    document.getElementById('bookAudioBar').classList.add('active');

    this.audioEl.play().then(() => {
      document.getElementById('bookAudioPlayBtn').textContent = '❚❚';
    }).catch(() => {
      document.getElementById('bookAudioPlayBtn').textContent = '▶';
    });
  },

  initAudioEvents() {
    const playBtn = document.getElementById('bookAudioPlayBtn');
    const fill = document.getElementById('bookAudioProgressFill');
    const wrap = document.getElementById('bookAudioProgressWrap');
    const timer = document.getElementById('bookAudioTimer');

    if (!this.audioEl) return;

    playBtn.addEventListener('click', () => {
      if (this.audioEl.paused) {
        this.audioEl.play();
        playBtn.textContent = '❚❚';
      } else {
        this.audioEl.pause();
        playBtn.textContent = '▶';
      }
    });

    this.audioEl.addEventListener('timeupdate', () => {
      const cur = this.audioEl.currentTime;
      const dur = this.audioEl.duration || 1;
      fill.style.width = `${(cur / dur) * 100}%`;

      const format = t => Math.floor(t / 60) + ':' + ('0' + Math.floor(t % 60)).slice(-2);
      timer.textContent = `${format(cur)} / ${format(dur)}`;
    });

    wrap.addEventListener('click', (e) => {
      const rect = wrap.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      this.audioEl.currentTime = pos * (this.audioEl.duration || 0);
    });

    this.audioEl.addEventListener('ended', () => {
      playBtn.textContent = '▶';
      fill.style.width = '0%';
    });
  },

  stopAudio() {
    if (this.audioEl) {
      this.audioEl.pause();
      document.getElementById('bookAudioBar').classList.remove('active');
    }
  },

  initScrollProgress() {
    const bar = document.getElementById('readingProgressBar');
    window.addEventListener('scroll', () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / total) * 100;
      if (bar) bar.style.width = `${progress}%`;
    }, { passive: true });
  },

  // ОТКРЫТИЕ ДЕТАЛЬНОЙ СТРАНИЦЫ ГЕРОЯ (МОДАЛЬНОЕ ОКНО С ВКЛАДКАМИ)
  openHeroDetail(heroId) {
    const hero = this.getArchive().find(h => h.id === heroId);
    if (!hero) return;

    const modal = document.getElementById('heroDetailModal');
    const mdParser = typeof DataHelpers !== 'undefined' ? DataHelpers.parseMarkdown : null;

    // Заполняем данные героя
    document.getElementById('detailHeroName').textContent = hero.name;
    document.getElementById('detailHeroImage').src = hero.photoFile || 'assets/images/cover-master.jpg';
    document.getElementById('detailHeroImage').alt = hero.name;
    document.getElementById('detailHeroStatus').textContent = hero.status || 'Погиб в бою';
    document.getElementById('detailBirthDate').textContent = hero.birthDate || '';
    document.getElementById('detailDeathDate').textContent = hero.deathDate || '';
    document.getElementById('detailRank').textContent = hero.rank || '';
    document.getElementById('detailSpecialty').textContent = hero.specialty || '';

    // Рендерим Markdown контент
    const bioContent = document.getElementById('detailBiographyContent');
    const deedContent = document.getElementById('detailDeedContent');
    const quoteContent = document.getElementById('detailQuoteContent');
    const quoteSource = document.getElementById('detailQuoteSource');

    if (mdParser && hero.biography) {
      bioContent.innerHTML = mdParser(hero.biography);
    } else {
      bioContent.innerHTML = hero.biography || '<p>Биография загружается...</p>';
    }

    if (mdParser && hero.deed) {
      deedContent.innerHTML = mdParser(hero.deed);
    } else {
      deedContent.innerHTML = hero.deed || '<p>Описание подвига загружается...</p>';
    }

    if (hero.quote) {
      quoteContent.textContent = hero.quote.replace(/[">]/g, '');
      quoteSource.textContent = hero.quoteSource || '';
    }

    // Награды (мини)
    const awardsContainer = document.getElementById('detailAwardsMini');
    awardsContainer.innerHTML = '';
    if (hero.awards && hero.awards.length > 0) {
      hero.awards.forEach(award => {
        const badge = document.createElement('div');
        badge.className = 'award-badge';
        badge.title = award;
        badge.textContent = this.getAwardIcon(award);
        awardsContainer.appendChild(badge);
      });
    }

    // Галерея
    this.renderDetailGallery(hero);

    // Кнопка "Читать полную историю"
    const btnReadFull = document.getElementById('btnReadFullStory');
    btnReadFull.href = `hero-detail.html?id=${hero.id}`;

    // Открываем модальное окно
    this.lastFocusedElement = document.activeElement;
    modal.showModal();
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    modal.querySelector('.modal-close-btn')?.focus();
  },

  closeHeroDetail() {
    const modal = document.getElementById('heroDetailModal');
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    modal.close();
    document.body.style.overflow = 'auto';
    if (this.lastFocusedElement && typeof this.lastFocusedElement.focus === 'function') {
      this.lastFocusedElement.focus();
    }
  },

  renderDetailGallery(hero) {
    const galleryGrid = document.getElementById('detailGalleryGrid');
    galleryGrid.innerHTML = '';

    const images = hero.gallery || [hero.photoFile];
    if (!images || images.length === 0) {
      galleryGrid.innerHTML = '<p>Галерея пуста</p>';
      return;
    }

    images.forEach((img, idx) => {
      const item = document.createElement('div');
      item.className = 'gallery-item';
      item.innerHTML = `<img src="${img}" alt="Фото ${idx + 1}" loading="lazy">`;
      item.addEventListener('click', () => this.openLightbox(img, `Фото: ${hero.name}`));
      galleryGrid.appendChild(item);
    });
  },

  // ЛАЙТБОКС ДЛЯ ПРОСМОТРА ИЗОБРАЖЕНИЙ
  openLightbox(imageSrc, caption) {
    const modal = document.getElementById('lightboxModal');
    document.getElementById('lightboxImage').src = imageSrc;
    document.getElementById('lightboxCaption').textContent = caption;
    modal.showModal();
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    modal.querySelector('.lightbox-close-btn')?.focus();
  },

  closeLightbox() {
    const modal = document.getElementById('lightboxModal');
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    modal.close();
  },

  // ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
  getAwardIcon(award) {
    const icons = {
      'Герой России': '🌟',
      'Орден Мужества': '⭐️',
      'Медаль За отвагу': '🎖',
      'Орден Отечественной войны': '🏅',
      'Медаль За победу над Германией': '🏆'
    };
    for (const key in icons) {
      if (award.includes(key)) return icons[key];
    }
    return '🎖';
  },

  showToast(message, type = 'info') {
    const toast = document.getElementById('bookToast');
    toast.textContent = message;
    toast.className = `book-toast show toast-${type}`;
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }
};

document.addEventListener('DOMContentLoaded', () => MemoryBookApp.init());