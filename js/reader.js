/**
 * ============================================================================
 * ДВИЖОК 3D-ЧИТАЛКИ И БИБЛИОТЕКИ: js/reader.js (v11.0 Master)
 * Синтез шелеста страниц, 20 иллюстрированных томов и 3D-развороты
 * ============================================================================
 */

'use strict';

const FOLIO_LIBRARY = [
  {
    id: "nazyrov-sh-r",
    volNum: "Том I",
    name: "Назыров Шамиль Рустамович",
    years: "2002 — 2023",
    specialty: "Электромонтер (Красный диплом)",
    military: "Гвардии рядовой, водитель «Машины жизни»",
    awards: "Орден Мужества, Медаль «За храбрость» II ст.",
    plaque: "left",
    photo: "assets/images/heroes/nazyrov.jpg",
    audioFile: "assets/audio/guides/nazyrov.mp3",
    pages: [
      {
        spreadNum: "Разворот I (Стр. 1–2)",
        chapterTitle: "Глава 1. Родник на выжженной земле",
        leftHtml: `
          <div class="page-header-meta"><span>ГБПОУ СРМК</span><span>АРХИВНОЕ ДЕЛО № 2021-Э</span></div>
          <div class="page-visual-frame"><img src="assets/images/heroes/nazyrov.jpg" alt="Шамиль Назыров"></div>
          <div class="page-quote-box">«Он был лучшим во всех делах — добрым, смелым и надежным.»<br><small>— Из письма командира взвода</small></div>
          <p style="font-size:0.85rem; color:#555;"><strong>Специальность:</strong> Ремонт электрооборудования.<br><strong>Отличие:</strong> Диплом с отличием, курсы сварщика.<br><strong>Подразделение:</strong> в/ч 12676 (Крым, Перевальное).</p>
          <div class="page-number-footer">Стр. 1</div>
        `,
        rightHtml: `
          <div class="page-header-meta"><span>ПОВЕСТЬ О МУЖЕСТВЕ</span><span>ТОМ I</span></div>
          <h3 class="page-chapter-title">Врата призвания</h3>
          <div class="page-story-text">
            <span class="drop-cap">В</span> ауле Куликовы Копани Туркменского района о Шамиле Назырове всегда говорили с особой теплотой. С юных лет его отличали пытливый ум и поразительное трудолюбие. Поступив в Ставропольский региональный многопрофильный колледж, он сразу задал высочайшую планку: безупречная учеба, победы на олимпиадах и красный диплом электромонтера.
            <p style="margin-top:12px;">Параллельно Шамиль освоил профессию сварщика, стремясь овладеть ремеслом до тонкостей. После выпуска поступил на бюджет в Аграрный университет, но в декабре 2021 года принял взрослое мужское решение — подписал контракт с Вооруженными Силами.</p>
          </div>
          <div class="page-number-footer">Стр. 2</div>
        `
      },
      {
        spreadNum: "Разворот II (Стр. 3–4)",
        chapterTitle: "Глава 2. Рейсы бессмертия",
        leftHtml: `
          <div class="page-header-meta"><span>СЕКТОР ТВД</span><span>ХЕРСОНСКИЙ РУБЕЖ</span></div>
          <div class="page-visual-frame"><img src="assets/images/memorial-bg.jpg" alt="Мемориал"></div>
          <div class="page-quote-box">«Его водовоз бойцы с надеждой ждали на самом переднем крае. Таких машин было всего две на полк.»</div>
          <p style="font-size:0.85rem; color:#555;"><strong>Боевой путь:</strong> Освобождение аэропорта, доставка воды в пекло боев, с. Гладковка.<br><strong>Награда:</strong> Медаль «За храбрость» II ст.</p>
          <div class="page-number-footer">Стр. 3</div>
        `,
        rightHtml: `
          <div class="page-header-meta"><span>ХРОНИКА ПОДВИГА</span><span>4 МАЯ 2023 ГОДА</span></div>
          <h3 class="page-chapter-title">«Машина жизни»</h3>
          <div class="page-story-text">
            <span class="drop-cap">С</span> первых часов спецоперации рядовой Назыров совершал рейсы сквозь артиллерийские заслоны. В степях Таврии под палящим солнцем цистерна с водой была вопросом жизни для сотен бойцов.
            <p style="margin-top:12px;"><strong>4 мая 2023 года</strong> в селе Гладковка под непрерывным артобстрелом Шамиль доставил спасительный груз на передовую. Осколочный залп реактивной артиллерии оборвал жизнь 20-летнего героя на боевом посту.</p>
            <p style="margin-top:12px; font-weight:bold; color:#8a1c22;">Указом Президента РФ посмертно награжден Орденом Мужества. В СРМК открыта «Парта Героя».</p>
          </div>
          <div class="page-number-footer">Стр. 4</div>
        `
      }
    ]
  },
  {
    id: "petukhov-v-v",
    volNum: "Том II",
    name: "Петухов Владислав Витальевич",
    years: "1996 — 2022",
    specialty: "Техническая эксплуатация оборудования",
    military: "Рядовой, мотострелковые войска",
    awards: "Орден Мужества (посмертно)",
    plaque: "left",
    photo: "assets/images/heroes/petukhov.jpg",
    audioFile: "assets/audio/guides/petukhov.mp3",
    pages: [
      {
        spreadNum: "Разворот I (Стр. 1–2)",
        chapterTitle: "Глава 1. Щит прикрытия",
        leftHtml: `
          <div class="page-header-meta"><span>ГБПОУ СРМК</span><span>ВЫПУСК 2016 ГОДА</span></div>
          <div class="page-visual-frame"><img src="assets/images/heroes/petukhov.jpg" alt="Владислав Петухов"></div>
          <div class="page-quote-box">«Владислав всегда брал на себя самые ответственные задачи — и за станком, и в боевом строю.»</div>
          <div class="page-number-footer">Стр. 1</div>
        `,
        rightHtml: `
          <div class="page-header-meta"><span>ДОНЕЦКИЙ РУБЕЖ</span><span>15 ДЕКАБРЯ 2022</span></div>
          <h3 class="page-chapter-title">Огонь на себя</h3>
          <div class="page-story-text">
            <span class="drop-cap">В</span>ладислав окончил колледж в 2016 году со специальностью техника-механика. 15 декабря 2022 года на Донецком направлении во время яростной контратаки бронетехники противника рядовой Петухов занял позицию на бруствере и прицельным огнем сковал наступающих, спасая группу эвакуации раненых сослуживцев.
            <p style="margin-top:14px; font-weight:bold; color:#8a1c22;">Награжден Орденом Мужества посмертно. Навечно в строю колледжа.</p>
          </div>
          <div class="page-number-footer">Стр. 2</div>
        `
      }
    ]
  },
  {
    id: "yaryshev-m-v",
    volNum: "Том III",
    name: "Ярышев Максим Викторович",
    years: "1985 — 2024",
    specialty: "Сварочное производство (выпуск 2004 г.)",
    military: "Сержант, командир штурмового отделения",
    awards: "Орден Мужества, Медаль «За отвагу»",
    plaque: "left",
    photo: "assets/images/heroes/yaryshev.jpg",
    audioFile: "assets/audio/guides/yaryshev.mp3",
    pages: [
      {
        spreadNum: "Разворот I (Стр. 1–2)",
        chapterTitle: "Глава 1. Авдеевский прорыв",
        leftHtml: `
          <div class="page-header-meta"><span>МАСТЕР СВАРКИ</span><span>ВЫПУСК 2004 Г.</span></div>
          <div class="page-visual-frame"><img src="assets/images/heroes/yaryshev.jpg" alt="Максим Ярышев"></div>
          <div class="page-quote-box">«Профессия научила держать удар, а долг позвал на защиту Родины.»</div>
          <div class="page-number-footer">Стр. 1</div>
        `,
        rightHtml: `
          <div class="page-header-meta"><span>ШТУРМ АВДЕЕВКИ</span><span>20 ЯНВАРЯ 2024</span></div>
          <h3 class="page-chapter-title">Впереди штурмовиков</h3>
          <div class="page-story-text">
            <span class="drop-cap">О</span>пытный мастер сварки, Максим в 2023 году ушел на фронт добровольцем. Возглавив штурмовое отделение, сержант Ярышев лично вел бойцов на захват бетонированных дотов Авдеевки. Погиб при отражении контратаки, удержав высоту.
            <p style="margin-top:14px; font-weight:bold; color:#8a1c22;">Кавалер медали «За отвагу» и Ордена Мужества посмертно.</p>
          </div>
          <div class="page-number-footer">Стр. 2</div>
        `
      }
    ]
  },
  {
    id: "nazarenko-n-s",
    volNum: "Том IV",
    name: "Назаренко Никита Сергеевич",
    years: "2004 — 2024",
    specialty: "Наладчик сетей (выпуск 2024 г.)",
    military: "Рядовой, войска связи",
    awards: "Орден Мужества (посмертно)",
    plaque: "left",
    photo: "assets/images/heroes/nazarenko.jpg",
    audioFile: "assets/audio/guides/nazarenko.mp3",
    pages: [
      {
        spreadNum: "Разворот I (Стр. 1–2)",
        chapterTitle: "Глава 1. Связь сквозь огонь",
        leftHtml: `
          <div class="page-header-meta"><span>IT-ОТДЕЛЕНИЕ</span><span>20 ЛЕТ</span></div>
          <div class="page-visual-frame"><img src="assets/images/heroes/nazarenko.jpg" alt="Никита Назаренко"></div>
          <div class="page-quote-box">«Самый юный герой мемориала. Диплом получил в июне, а в августе шагнул в бессмертие.»</div>
          <div class="page-number-footer">Стр. 1</div>
        `,
        rightHtml: `
          <div class="page-header-meta"><span>КУРСКОЕ ПРИГРАНИЧЬЕ</span><span>13 АВГУСТА 2024</span></div>
          <h3 class="page-chapter-title">Подвиг связиста</h3>
          <div class="page-story-text">
            <span class="drop-cap">В</span> августе 2024 года во время отражения вторжения в Курскую область 20-летний связист Никита Назаренко под разрывами снарядов вручную восстановил перебитую линию боевого управления штабов. Погиб смертью храбрых.
            <p style="margin-top:14px; font-weight:bold; color:#8a1c22;">Награжден Орденом Мужества посмертно.</p>
          </div>
          <div class="page-number-footer">Стр. 2</div>
        `
      }
    ]
  },
  {
    id: "martynov-s-k",
    volNum: "Том V",
    name: "Мартынов Станислав Константинович",
    years: "2000 — 2023",
    specialty: "Пожарная безопасность (выпуск 2020 г.)",
    military: "Младший сержант спецподразделения",
    awards: "Орден Мужества (посмертно)",
    plaque: "right",
    photo: "assets/images/heroes/martynov.jpg",
    audioFile: "assets/audio/guides/martynov.mp3",
    pages: [
      {
        spreadNum: "Разворот I (Стр. 1–2)",
        chapterTitle: "Глава 1. Командирский бросок",
        leftHtml: `
          <div class="page-header-meta"><span>СТАРОСТА МЧС</span><span>ВЫПУСК 2020 Г.</span></div>
          <div class="page-visual-frame"><img src="assets/images/heroes/martynov.jpg" alt="Станислав Мартынов"></div>
          <div class="page-quote-box">«Сила командира — в ответственности за каждого бойца.»</div>
          <div class="page-number-footer">Стр. 1</div>
        `,
        rightHtml: `
          <div class="page-header-meta"><span>УГЛЕДАРСКИЙ РУБЕЖ</span><span>17 ИЮНЯ 2023</span></div>
          <h3 class="page-chapter-title">Штурм высоты</h3>
          <div class="page-story-text">
            <span class="drop-cap">П</span>осле ранения офицера младший сержант Мартынов принял командование штурмовым отделением на себя, поднял бойцов в атаку и овладел вражеским опорным пунктом под Угледаром.
            <p style="margin-top:14px; font-weight:bold; color:#8a1c22;">Кавалер Ордена Мужества посмертно. В СРМК открыта Парта Героя.</p>
          </div>
          <div class="page-number-footer">Стр. 2</div>
        `
      }
    ]
  },
  {
    id: "vecherka-n-a",
    volNum: "Том VI",
    name: "Вечёрка Николай Анатольевич",
    years: "1996 — 2022",
    specialty: "Пожарная безопасность (выпуск 2016 г.)",
    military: "Разведчик-санитар 247-го гв. ДШП ВДВ",
    awards: "Орден Мужества (посмертно)",
    plaque: "right",
    photo: "assets/images/heroes/vecherka.jpg",
    audioFile: "assets/audio/guides/vecherka.mp3",
    pages: [
      {
        spreadNum: "Разворот I (Стр. 1–2)",
        chapterTitle: "Глава 1. Антоновский мост",
        leftHtml: `
          <div class="page-header-meta"><span>247-Й ГВ. ДШП</span><span>РАЗВЕДРОТА</span></div>
          <div class="page-visual-frame"><img src="assets/images/heroes/vecherka.jpg" alt="Николай Вечерка"></div>
          <div class="page-quote-box">«Первые в бою, первые в вечности.»</div>
          <div class="page-number-footer">Стр. 1</div>
        `,
        rightHtml: `
          <div class="page-header-meta"><span>ХЕРСОН</span><span>26 ФЕВРАЛЯ 2022</span></div>
          <h3 class="page-chapter-title">Бой в окружении</h3>
          <div class="page-story-text">
            <span class="drop-cap">В</span> первые дни СВО у Антоновского моста через Днепр разведчик-санитар Вечёрка под шквальным огнем перевязывал и эвакуировал раненых товарищей, прикрывая отход до последнего вздоха.
            <p style="margin-top:14px; font-weight:bold; color:#8a1c22;">Награжден Орденом Мужества посмертно.</p>
          </div>
          <div class="page-number-footer">Стр. 2</div>
        `
      }
    ]
  }
];

// УПРАВЛЯЮЩИЙ ДВИЖОК ЧИТАЛКИ
const ReaderEngine = {
  currentBook: null,
  currentSpreadIdx: 0,
  audioContext: null,
  audioEl: null,
  isPlayingAudio: false,

  init() {
    this.audioEl = document.getElementById('readerAudioElement');
    this.renderShelf();
    this.bindEvents();
    const linkedHero = window.location.hash.replace('#', '');
    if (linkedHero) this.openBook(linkedHero, false);
    console.log("[ReaderEngine] Интерактивный фолиант и 3D-читалка готовы к работе.");
  },

  /**
   * 1. Процедурный синтез звука шуршания бумаги (Web Audio API)
   */
  playPageTurnSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.audioContext) this.audioContext = new AudioCtx();
      if (this.audioContext.state === 'suspended') this.audioContext.resume();

      const ctx = this.audioContext;
      const bufferSize = ctx.sampleRate * 0.15; // 150 мс
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.15);
      filter.Q.value = 3;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
    } catch (e) {}
  },

  /**
   * 2. Отрисовка книжной полки
   */
  renderShelf() {
    const grid = document.getElementById('bookshelfGrid');
    if (!grid) return;

    const query = (document.getElementById('shelfSearchInput')?.value || '').toLowerCase().trim();
    const filter = document.querySelector('.shelf-filter-btn.active')?.dataset.filter || 'all';

    const list = window.GRAND_MEMORY_BOOK_ARCHIVE || FOLIO_LIBRARY;

    const filtered = list.filter(hero => {
      let matchFilter = true;
      if (filter === 'left') matchFilter = hero.plaque === 'left';
      if (filter === 'right') matchFilter = hero.plaque === 'right';

      let matchSearch = true;
      if (query) {
        matchSearch = hero.name.toLowerCase().includes(query) ||
          (hero.education?.specialty && hero.education.specialty.toLowerCase().includes(query)) ||
          (hero.specialty && hero.specialty.toLowerCase().includes(query));
      }
      return matchFilter && matchSearch;
    });

    grid.innerHTML = filtered.map((hero, idx) => {
      const volNum = hero.volNum || `Том ${idx + 1}`;
      const photoSrc = hero.media?.photo || hero.photo || 'assets/images/memorial-bg.jpg';
      const specText = hero.education?.specialty || hero.specialty || 'Выпускник колледжа';

      return `
        <article class="book-spine-card" tabindex="0" role="button" aria-label="Открыть фолиант: ${hero.name}" onclick="ReaderEngine.openBook('${hero.id}')" onkeydown="if(event.key === 'Enter' || event.key === ' ') { event.preventDefault(); ReaderEngine.openBook('${hero.id}'); }">
          <div class="book-spine-vol">${volNum} • ${hero.plaque === 'left' ? 'Левая' : 'Правая'} плита</div>
          <div class="book-spine-portrait">
            <img src="${photoSrc}" alt="${hero.name}" onerror="this.src='assets/images/memorial-bg.jpg'">
          </div>
          <h4 class="book-spine-title">${hero.name}</h4>
          <p class="book-spine-spec">${specText}</p>
          <button class="book-spine-btn" type="button">Раскрыть фолиант</button>
        </article>
      `;
    }).join('');
  },

  /**
   * 3. Открытие книги
   */
  openBook(heroId, updateHash = true) {
    // Ищем в фолиантах или генерируем разворот на лету из heroesDatabase
    const extendedBooks = window.GRAND_MEMORY_BOOK_ARCHIVE || [
      ...(typeof GRAND_MEMORY_BOOK_PART_1 !== 'undefined' ? GRAND_MEMORY_BOOK_PART_1 : []),
      ...(typeof GRAND_MEMORY_BOOK_PART_2 !== 'undefined' ? GRAND_MEMORY_BOOK_PART_2 : []),
      ...(typeof GRAND_MEMORY_BOOK_PART_3 !== 'undefined' ? GRAND_MEMORY_BOOK_PART_3 : [])
    ];
    let book = extendedBooks.find(b => b.id === heroId) || FOLIO_LIBRARY.find(b => b.id === heroId);
    if (!book && typeof heroesDatabase !== 'undefined') {
      const h = heroesDatabase.find(x => x.id === heroId);
      if (h) {
        book = {
          id: h.id,
          volNum: `Том Мемориала`,
          name: h.name,
          audioFile: h.media?.audioGuide || `assets/audio/guides/${h.id}.mp3`,
          pages: [
            {
              spreadNum: "Разворот I (Стр. 1–2)",
              leftHtml: `
                <div class="page-header-meta"><span>ГБПОУ СРМК</span><span>АРХИВ ВЫПУСКНИКА</span></div>
                <div class="page-visual-frame"><img src="${h.media?.photo || 'assets/images/memorial-bg.jpg'}" alt="${h.name}"></div>
                <div class="page-quote-box">«${h.quote || 'Верность воинскому долгу.'}»</div>
                <p style="font-size:0.85rem; color:#555;"><strong>Специальность:</strong> ${h.education?.specialty || 'СРМК'}<br><strong>Звание:</strong> ${h.military?.rank || 'Воин ВС РФ'}</p>
                <div class="page-number-footer">Стр. 1</div>
              `,
              rightHtml: `
                <div class="page-header-meta"><span>ЛЕТОПИСЬ МУЖЕСТВА</span><span>${h.name}</span></div>
                <h3 class="page-chapter-title">Ратный подвиг</h3>
                <div class="page-story-text">
                  <span class="drop-cap">${h.name[0]}</span>${h.deed || 'Описание подвига уточняется в архивах колледжа.'}
                  <p style="margin-top:14px; font-weight:bold; color:#8a1c22;">Награжден Орденом Мужества посмертно. Увековечен на Мемориале Славы СРМК.</p>
                </div>
                <div class="page-number-footer">Стр. 2</div>
              `
            }
          ]
        };
      }
    }

    if (!book) return;

    this.currentBook = book;
    this.currentSpreadIdx = 0;

    document.getElementById('readerVolBadge').textContent = book.volNum;
    document.getElementById('readerHeroTitle').textContent = book.name;

    document.getElementById('shelfView').style.display = 'none';
    document.getElementById('bookReaderView').style.display = 'flex';
    document.getElementById('btnReturnToShelf').style.display = 'inline-block';
    document.body.classList.add('reader-is-open');
    if (updateHash) history.replaceState(null, '', `#${book.id}`);

    this.playPageTurnSound();
    this.renderSpread();
  },

  closeBook() {
    this.stopAudio();
    document.getElementById('bookReaderView').style.display = 'none';
    document.getElementById('shelfView').style.display = 'block';
    document.getElementById('btnReturnToShelf').style.display = 'none';
    document.body.classList.remove('reader-is-open');
    this.currentBook = null;
    if (window.location.hash) history.replaceState(null, '', window.location.pathname + window.location.search);
  },

  renderSpread() {
    if (!this.currentBook) return;

    const spread = this.currentBook.pages[this.currentSpreadIdx] || this.currentBook.pages[0];
    const leftEl = document.getElementById('pageLeftContent');
    const rightEl = document.getElementById('pageRightContent');

    leftEl.innerHTML = spread.leftHtml;
    rightEl.innerHTML = spread.rightHtml;

    const total = this.currentBook.pages.length;
    document.getElementById('paginationDisplay').textContent = `${spread.spreadNum} из ${total}`;

    // Обновление точек
    const dotsTrack = document.getElementById('pageDotsTrack');
    dotsTrack.innerHTML = this.currentBook.pages.map((_, i) =>
      `<button class="page-dot ${i === this.currentSpreadIdx ? 'active' : ''}" aria-label="Открыть ${i + 1}-й разворот" aria-pressed="${i === this.currentSpreadIdx}" onclick="ReaderEngine.goToSpread(${i})" type="button"></button>`
    ).join('');

    document.getElementById('prevPageBtn').style.visibility = this.currentSpreadIdx > 0 ? 'visible' : 'hidden';
    document.getElementById('nextPageBtn').style.visibility = this.currentSpreadIdx < total - 1 ? 'visible' : 'hidden';
  },

  nextPage() {
    if (!this.currentBook) return;
    if (this.currentSpreadIdx < this.currentBook.pages.length - 1) {
      this.currentSpreadIdx++;
      this.playPageTurnSound();
      this.renderSpread();
    }
  },

  prevPage() {
    if (!this.currentBook) return;
    if (this.currentSpreadIdx > 0) {
      this.currentSpreadIdx--;
      this.playPageTurnSound();
      this.renderSpread();
    }
  },

  goToSpread(idx) {
    if (!this.currentBook) return;
    this.currentSpreadIdx = idx;
    this.playPageTurnSound();
    this.renderSpread();
  },

  toggleHeroAudio() {
    if (!this.currentBook || !this.audioEl) return;

    const btn = document.getElementById('readerAudioToggleBtn');

    if (this.isPlayingAudio) {
      this.stopAudio();
    } else {
      this.audioEl.src = this.currentBook.audioFile;
      this.audioEl.play().then(() => {
        this.isPlayingAudio = true;
        btn.classList.add('playing');
        btn.textContent = '❚❚ Пауза аудиогида';
      }).catch(() => {
        this.showToast('Аудиофайл готовится к публикации');
      });
    }
  },

  stopAudio() {
    if (this.audioEl) {
      this.audioEl.pause();
      this.audioEl.currentTime = 0;
      this.isPlayingAudio = false;
      const btn = document.getElementById('readerAudioToggleBtn');
      if (btn) {
        btn.classList.remove('playing');
        btn.textContent = '🎧 Слушать аудиогид (MP3)';
      }
    }
  },

  bindEvents() {
    // Поиск по полке
    document.getElementById('shelfSearchInput')?.addEventListener('input', () => this.renderShelf());

    // Фильтры
    document.querySelectorAll('.shelf-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.shelf-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.renderShelf();
      });
    });

    // Темы оформления разворота
    document.querySelectorAll('.theme-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        document.querySelectorAll('.theme-dot').forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
        const theme = dot.dataset.theme;
        const book = document.getElementById('folioBookElement');
        book.className = `folio-book-3d ${theme}`;
      });
    });

    // Клавиатура
    document.addEventListener('keydown', (e) => {
      if (!this.currentBook) return;
      if (e.key === 'ArrowRight') this.nextPage();
      if (e.key === 'ArrowLeft') this.prevPage();
      if (e.key === 'Escape') this.closeBook();
      if (e.key === ' ') {
        e.preventDefault();
        this.toggleHeroAudio();
      }
    });

    window.addEventListener('hashchange', () => {
      const heroId = window.location.hash.replace('#', '');
      if (heroId && heroId !== this.currentBook?.id) this.openBook(heroId, false);
    });

    // Сенсорные свайпы на смартфоне
    let touchStartX = 0;
    const bookEl = document.getElementById('folioBookElement');
    if (bookEl) {
      bookEl.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });

      bookEl.addEventListener('touchend', e => {
        const deltaX = e.changedTouches[0].screenX - touchStartX;
        if (deltaX < -50) this.nextPage();
        if (deltaX > 50) this.prevPage();
      }, { passive: true });
    }
  },

  showToast(msg) {
    const toast = document.getElementById('readerToast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('active');
    setTimeout(() => toast.classList.remove('active'), 2500);
  }
};

document.addEventListener('DOMContentLoaded', () => ReaderEngine.init());