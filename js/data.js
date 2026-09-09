/**
 * ============================================================================
 * ЦИФРОВОЙ РЕЕСТР: МЕМОРИАЛ СЛАВЫ ГБПОУ СРМК
 * База данных 20 выпускников колледжа — защитников Отечества
 * ============================================================================
 */

'use strict';

const MUSEUM_CONFIG = {
  collegeName: "ГБПОУ «Ставропольский региональный многопрофильный колледж»",
  shortName: "ГБПОУ СРМК",
  city: "г. Ставрополь",
  region: "Ставропольский край",
  address: "пр. Юности, д. 3",
  coords: [45.0448, 41.9691],
  projectTitle: "Быть воином — жить вечно",
  nomination: "За партой героя",
  totalHeroesCount: 20
};

// Таксономия отделений колледжа
const SPECIALTIES_TAXONOMY = {
  FIRE:    { id: "fire",    name: "Пожарная безопасность и защита в ЧС", icon: "🚒", color: "#e11d48" },
  WELD:    { id: "weld",    name: "Сварочное производство",             icon: "⚡", color: "#f59e0b" },
  ELECTRO: { id: "electro", name: "Электрооборудование и энергетика",   icon: "💡", color: "#eab308" },
  AUTO:    { id: "auto",    name: "Техническое обслуживание автотранспорта", icon: "🚗", color: "#06b6d4" },
  IT:      { id: "it",      name: "Информационные системы и сети",      icon: "💻", color: "#3b82f6" },
  MECH:    { id: "mech",    name: "Машиностроение и металлообработка",  icon: "⚙️", color: "#8b5cf6" }
};

const heroesDatabase = [
  /* ==========================================================================
     ЛЕВАЯ ПЛИТА МЕМОРИАЛА (10 ВЫПУСКНИКОВ)
     ========================================================================== */
  {
    id: "petukhov-v-v",
    plaque: "left",
    category: "svo_memorial",
    specTag: "mech",
    name: "Петухов Владислав Витальевич",
    dates: { birth: "18.11.1996", death: "15.12.2022", years: "1996 — 2022" },
    education: {
      specialty: "Техническая эксплуатация оборудования",
      period: "2012 — 2016 гг.",
      honors: "Техник-механик"
    },
    military: {
      rank: "Рядовой ВС РФ",
      unit: "Мотострелковые войска",
      role: "Стрелок"
    },
    awards: ["Орден Мужества (посмертно)"],
    deed: "Выполнял боевые задачи на Донецком направлении. Проявил мужество и самоотверженность при отражении контратаки противника, прикрыв эвакуацию группы.",
    quote: "Верность воинскому долгу и памяти студенческого братства.",
    media: {
      photo: "assets/images/heroes/petukhov.jpg",
      audioGuide: "assets/audio/guides/petukhov.mp3",
      documents: ["Архивное дело студента выпуска 2016 г.", "Приказ о зачислении в СРМК"]
    },
    memorialStatus: "Увековечен на левой плите Мемориала Славы СРМК",
    mapCoords: { lat: 48.0159, lng: 37.8028, locationName: "Донецкое направление (ДНР)" }
  },
  {
    id: "yaryshev-m-v",
    plaque: "left",
    category: "svo_memorial",
    specTag: "weld",
    name: "Ярышев Максим Викторович",
    dates: { birth: "21.02.1985", death: "20.01.2024", years: "1985 — 2024" },
    education: {
      specialty: "Сварочное производство",
      period: "2000 — 2004 гг.",
      honors: "Мастер сварочного дела"
    },
    military: {
      rank: "Сержант",
      unit: "Штурмовой батальон ВС РФ",
      role: "Командир отделения"
    },
    awards: ["Орден Мужества (посмертно)", "Медаль «За отвагу»"],
    deed: "Опытный специалист, добровольцем ушедший на передовую. Руководил штурмовой группой при освобождении укрепленных районов на Авдеевском рубеже.",
    quote: "Профессия научила держать удар, а долг позвал на защиту Отечества.",
    media: {
      photo: "assets/images/heroes/yaryshev.jpg",
      audioGuide: "assets/audio/guides/yaryshev.mp3",
      documents: ["Архивная ведомость практики", "Наградной лист"]
    },
    memorialStatus: "Увековечен на левой плите Мемориала Славы СРМК",
    mapCoords: { lat: 48.1399, lng: 37.7497, locationName: "Авдеевский рубеж" }
  },
  {
    id: "sopolev-n-s",
    plaque: "left",
    category: "svo_memorial",
    specTag: "fire",
    name: "Сополев Николай Сергеевич",
    dates: { birth: "20.12.2000", death: "2023", years: "2000 — 2023" },
    education: {
      specialty: "Пожарная безопасность",
      period: "2016 — 2020 гг.",
      honors: "Техник-спасатель"
    },
    military: {
      rank: "Гвардии рядовой",
      unit: "Воздушно-десантные войска",
      role: "Номер расчета"
    },
    awards: ["Орден Мужества (посмертно)"],
    deed: "Спасал жизни раненых товарищей, эвакуируя бойцов из-под артиллерийского обстрела на Запорожском направлении.",
    quote: "Спасение жизней — призвание на службе и в бою.",
    media: {
      photo: "assets/images/heroes/sopolev.jpg",
      audioGuide: "assets/audio/guides/sopolev.mp3",
      documents: ["Диплом отделения Пожарной безопасности СРМК"]
    },
    memorialStatus: "Увековечен на левой плите Мемориала Славы СРМК",
    mapCoords: { lat: 47.4489, lng: 35.3908, locationName: "Запорожское направление" }
  },
  {
    id: "belov-s-a",
    plaque: "left",
    category: "svo_memorial",
    specTag: "electro",
    name: "Белов Сергей Александрович",
    dates: { birth: "05.01.1995", death: "2025", years: "1995 — 2025" },
    education: {
      specialty: "Электрооборудование и электроэнергетика",
      period: "2011 — 2015 гг.",
      honors: "Техник-электрик"
    },
    military: {
      rank: "Младший сержант",
      unit: "Мотострелковые войска",
      role: "Командир боевой машины"
    },
    awards: ["Орден Мужества (посмертно)"],
    deed: "Обеспечил прикрытие перегруппировки подразделения на Бахмутском рубеже, отразив фланговый удар бронетехники противника.",
    quote: "Честно выполнил свой воинский долг.",
    media: {
      photo: "assets/images/heroes/belov.jpg",
      audioGuide: "assets/audio/guides/belov.mp3",
      documents: ["Студенческая учетная карточка СРМК"]
    },
    memorialStatus: "Увековечен на левой плите Мемориала Славы СРМК",
    mapCoords: { lat: 48.5987, lng: 37.9982, locationName: "Бахмутское направление" }
  },
  {
    id: "shartov-p-n",
    plaque: "left",
    category: "svo_memorial",
    specTag: "auto",
    name: "Шартов Павел Николаевич",
    dates: { birth: "1998", death: "2023", years: "1998 — 2023" },
    education: {
      specialty: "Техническое обслуживание автотранспорта",
      period: "2014 — 2018 гг.",
      honors: "Техник автодела"
    },
    military: {
      rank: "Рядовой ВС РФ",
      unit: "Батальон материально-технического обеспечения",
      role: "Водитель подвоза боекомплекта"
    },
    awards: ["Орден Мужества (посмертно)"],
    deed: "Под шквальным огнем противника осуществлял доставку боеприпасов на передовые позиции в районе Марьинки.",
    quote: "Каждый рейс на передовую — это спасенные жизни товарищей.",
    media: {
      photo: "assets/images/heroes/shartov.jpg",
      audioGuide: "assets/audio/guides/shartov.mp3",
      documents: ["Сводная ведомость производственной практики"]
    },
    memorialStatus: "Увековечен на левой плите Мемориала Славы СРМК",
    mapCoords: { lat: 47.9995, lng: 37.5012, locationName: "Марьинское направление" }
  },
  {
    id: "nazyrov-sh-r",
    plaque: "left",
    category: "svo_memorial",
    specTag: "electro",
    name: "Назыров Шамиль Рустамович",
    dates: { birth: "26.09.2002", death: "04.05.2023", years: "2002 — 2023" },
    education: {
      specialty: "Электромонтер по ремонту электрооборудования",
      period: "2018 — 2021 гг.",
      honors: "Диплом с отличием (Красный диплом), курсы сварщика"
    },
    military: {
      rank: "Гвардии рядовой",
      unit: "в/ч 12676 (с. Перевальное), батальон МТО",
      role: "Водитель роты подвоза воды («Машина жизни»)"
    },
    awards: ["Орден Мужества (посмертно)", "Медаль «За храбрость» II степени", "Ветеран боевых действий"],
    deed: "С первых дней СВО доставлял воду на передовую. Его водовоз бойцы назвали «Машиной жизни». Участвовал во взятии аэропорта в Херсонской обл. Погиб в с. Гладковка.",
    quote: "Добрым, отзывчивым, смелым, надежным... Он был лучшим во всех делах (из письма командира взвода).",
    media: {
      photo: "assets/images/heroes/nazyrov.jpg",
      audioGuide: "assets/audio/guides/nazyrov.mp3",
      documents: ["Красный диплом СРМК", "Удостоверение Ветерана боевых действий"]
    },
    memorialStatus: "Именная «Парта Героя» в электромастерской СРМК",
    mapCoords: { lat: 46.4172, lng: 32.6144, locationName: "с. Гладковка, Херсонская обл." }
  },
  {
    id: "lukyanenko-i-v",
    plaque: "left",
    category: "svo_memorial",
    specTag: "mech",
    name: "Лукьяненко Игорь Владимирович",
    dates: { birth: "1997", death: "2023", years: "1997 — 2023" },
    education: {
      specialty: "Машиностроение и металлообработка",
      period: "2013 — 2017 гг.",
      honors: "Техник-механик"
    },
    military: {
      rank: "Рядовой",
      unit: "Танковые подразделения",
      role: "Механик-водитель"
    },
    awards: ["Орден Мужества (посмертно)"],
    deed: "Проявил мужество и хладнокровие при прорыве оборонительной линии, сохранив боеспособность машины под артиллерийским обстрелом.",
    quote: "Броня сильна стойкостью экипажа.",
    media: {
      photo: "assets/images/heroes/lukyanenko.jpg",
      audioGuide: "assets/audio/guides/lukyanenko.mp3",
      documents: ["Архивная карточка выпускника СРМК"]
    },
    memorialStatus: "Увековечен на левой плите Мемориала Славы СРМК",
    mapCoords: { lat: 48.3001, lng: 37.6002, locationName: "Донецкое направление (ДНР)" }
  },
  {
    id: "nazarenko-n-s",
    plaque: "left",
    category: "svo_memorial",
    specTag: "it",
    name: "Назаренко Никита Сергеевич",
    dates: { birth: "2004", death: "13.08.2024", years: "2004 — 2024" },
    education: {
      specialty: "Наладчик компьютерных сетей",
      period: "2020 — 2024 гг.",
      honors: "Выпускник кафедры IT-технологий"
    },
    military: {
      rank: "Рядовой ВС РФ",
      unit: "Войска связи и оперативного управления",
      role: "Связист"
    },
    awards: ["Орден Мужества (посмертно)"],
    deed: "Окончив колледж в 2024 году, подписал контракт. Обеспечивал бесперебойную связь передовых узлов управления в приграничье. Героически погиб 13 августа 2024 г.",
    quote: "Самый юный герой в строю выпускников нашего колледжа.",
    media: {
      photo: "assets/images/heroes/nazarenko.jpg",
      audioGuide: "assets/audio/guides/nazarenko.mp3",
      documents: ["Диплом СРМК выпуска 2024 года"]
    },
    memorialStatus: "Мемориальный стенд кафедры IT СРМК",
    mapCoords: { lat: 51.3000, lng: 35.2000, locationName: "Курское приграничье" }
  },
  {
    id: "lutsenko-k-a",
    plaque: "left",
    category: "svo_memorial",
    specTag: "weld",
    name: "Луценко Константин Андреевич",
    dates: { birth: "2001", death: "2023", years: "2001 — 2023" },
    education: {
      specialty: "Сварочное производство",
      period: "2017 — 2021 гг.",
      honors: "Специалист сварочных технологий"
    },
    military: {
      rank: "Рядовой",
      unit: "Инженерно-саперные подразделения",
      role: "Сапер"
    },
    awards: ["Орден Мужества (посмертно)"],
    deed: "Осуществлял инженерную разведку и разминирование коридоров для продвижения бронетехники под огнем противника.",
    quote: "Труд сапера спасает сотни жизней.",
    media: {
      photo: "assets/images/heroes/lutsenko.jpg",
      audioGuide: "assets/audio/guides/lutsenko.mp3",
      documents: ["Журнал производственного обучения"]
    },
    memorialStatus: "Увековечен на левой плите Мемориала Славы СРМК",
    mapCoords: { lat: 47.1000, lng: 36.8000, locationName: "Запорожская область" }
  },
  {
    id: "ponomarchuk-i-s",
    plaque: "left",
    category: "svo_memorial",
    specTag: "fire",
    name: "Пономарчук Иван Сергеевич",
    dates: { birth: "20.10.2002", death: "02.07.2024", years: "2002 — 2024" },
    education: {
      specialty: "Пожарная безопасность",
      period: "2018 — 2022 гг.",
      honors: "Техник защиты в чрезвычайных ситуациях"
    },
    military: {
      rank: "Гвардии рядовой",
      unit: "247-й гв. ДШП ВДВ",
      role: "Стрелок десантно-штурмового взвода"
    },
    awards: ["Орден Мужества (посмертно)"],
    deed: "Проявил героизм и самоотверженность при удержании стратегического рубежа на Ореховском направлении.",
    quote: "Никто кроме нас.",
    media: {
      photo: "assets/images/heroes/ponomarchuk.jpg",
      audioGuide: "assets/audio/guides/ponomarchuk.mp3",
      documents: ["Диплом спасателя СРМК"]
    },
    memorialStatus: "Увековечен на левой плите Мемориала Славы СРМК",
    mapCoords: { lat: 47.5500, lng: 35.8000, locationName: "Ореховское направление" }
  },

  /* ==========================================================================
     ПРАВАЯ ПЛИТА МЕМОРИАЛА (10 ВЫПУСКНИКОВ)
     ========================================================================== */
  {
    id: "martynov-s-k",
    plaque: "right",
    category: "svo_memorial",
    specTag: "fire",
    name: "Мартынов Станислав Константинович",
    dates: { birth: "02.11.2000", death: "17.06.2023", years: "2000 — 2023" },
    education: {
      specialty: "Пожарная безопасность",
      period: "2016 — 2020 гг.",
      honors: "Староста группы, отличник строевой подготовки"
    },
    military: {
      rank: "Младший сержант",
      unit: "Специальные подразделения ВС РФ",
      role: "Командир отделения"
    },
    awards: ["Орден Мужества (посмертно)"],
    deed: "Принял командование штурмовым отделением после ранения офицера, обеспечив взятие опорного пункта на Угледарском направлении.",
    quote: "Сила командира — в ответственности за каждого бойца.",
    media: {
      photo: "assets/images/heroes/martynov.jpg",
      audioGuide: "assets/audio/guides/martynov.mp3",
      documents: ["Грамоты за отличную учебу СРМК", "Наградной лист"]
    },
    memorialStatus: "Именная «Парта Героя» в корпусе МЧС СРМК",
    mapCoords: { lat: 47.8500, lng: 37.2000, locationName: "Угледарское направление" }
  },
  {
    id: "gorlov-n-a",
    plaque: "right",
    category: "svo_memorial",
    specTag: "auto",
    name: "Горлов Никита Андреевич",
    dates: { birth: "20.08.1999", death: "12.05.2022", years: "1999 — 2022" },
    education: {
      specialty: "Техническое обслуживание автотранспорта",
      period: "2015 — 2019 гг.",
      honors: "Техник-механик"
    },
    military: {
      rank: "Гвардии рядовой контрактной службы",
      unit: "247-й гв. ДШП ВДВ (в/ч 54801, г. Ставрополь)",
      role: "Старший стрелок"
    },
    awards: ["Орден Мужества (посмертно, Указ Президента РФ № 406сс от 27.06.2022)"],
    deed: "В составе передового отряда десантников освобождал населенные пункты южного направления. Проявил мужество и хладнокровие в бою.",
    quote: "Гвардейцы не отступают.",
    media: {
      photo: "assets/images/heroes/gorlov.jpg",
      audioGuide: "assets/audio/guides/gorlov.mp3",
      documents: ["Информационное письмо в/ч 54801", "Орденская книжка"]
    },
    memorialStatus: "Стенд «Бессмертный полк СВО» и парта памяти в СРМК",
    mapCoords: { lat: 46.8500, lng: 33.2000, locationName: "Херсонское направление" }
  },
  {
    id: "vecherka-n-a",
    plaque: "right",
    category: "svo_memorial",
    specTag: "fire",
    name: "Вечерка Николай Анатольевич",
    dates: { birth: "25.06.1996", death: "26.02.2022", years: "1996 — 2022" },
    education: {
      specialty: "Пожарная безопасность",
      period: "2012 — 2016 гг.",
      honors: "Техник защиты в ЧС"
    },
    military: {
      rank: "Гвардии рядовой",
      unit: "247-й гв. ДШП ВДВ (в/ч 54801, г. Ставрополь), разведрота",
      role: "Разведчик-санитар"
    },
    awards: ["Орден Мужества (посмертно)"],
    deed: "Принял ожесточенный бой 26 февраля 2022 года. До последнего вздоха прикрывал боевых товарищей и оказывал медицинскую помощь под огнем.",
    quote: "Первые в бою, первые в вечности.",
    media: {
      photo: "assets/images/heroes/vecherka.jpg",
      audioGuide: "assets/audio/guides/vecherka.mp3",
      documents: ["Архивное дело студента МЧС", "Наградной лист"]
    },
    memorialStatus: "Именная мемориальная доска и Парта Героя в СРМК",
    mapCoords: { lat: 46.7500, lng: 32.8000, locationName: "Антоновский мост, Херсон" }
  },
  {
    id: "samokhin-d-a",
    plaque: "right",
    category: "svo_memorial",
    specTag: "electro",
    name: "Самохин Дмитрий Александрович",
    dates: { birth: "06.08.2000", death: "04.03.2022", years: "2000 — 2022" },
    education: {
      specialty: "Техническая эксплуатация электрооборудования",
      period: "2016 — 2020 гг.",
      honors: "Электромеханик"
    },
    military: {
      rank: "Рядовой ВС РФ",
      unit: "Мотострелковые войска",
      role: "Механик взвода обеспечения"
    },
    awards: ["Орден Мужества № 83029 (посмертно, Указ Президента РФ от 26.03.2022)"],
    deed: "Совершил подвиг в первые недели СВО при отражении фланговой атаки бронетехники противника.",
    quote: "Его подвиг навсегда вписан в золотые страницы нашего колледжа.",
    media: {
      photo: "assets/images/heroes/samokhin.jpg",
      audioGuide: "assets/audio/guides/samokhin.mp3",
      documents: ["Скан Указа Президента РФ № 83029", "Студенческий билет СРМК"]
    },
    memorialStatus: "Увековечен на правой плите Мемориала Славы СРМК",
    mapCoords: { lat: 47.1500, lng: 34.5000, locationName: "Запорожский рубеж" }
  },
  {
    id: "butov-v-e",
    plaque: "right",
    category: "svo_memorial",
    specTag: "it",
    name: "Бутов Виктор Евгеньевич",
    dates: { birth: "17.06.1989", death: "08.10.2022", years: "1989 — 2022" },
    education: {
      specialty: "Компьютерные системы и комплексы",
      period: "2004 — 2008 гг.",
      honors: "Техник вычислительных систем"
    },
    military: {
      rank: "Прапорщик",
      unit: "Отдел мобильных действий Пограничного управления ФСБ России по КЧР",
      role: "Специалист спецсвязи и разведки"
    },
    awards: ["Орден Мужества (посмертно)", "Ветеран боевых действий"],
    deed: "Служил в элитном подразделении мобильных действий. Выполнял специальные задачи по защите государственной границы.",
    quote: "Пример чести, доблести и отваги.",
    media: {
      photo: "assets/images/heroes/butov.jpg",
      audioGuide: "assets/audio/guides/butov.mp3",
      documents: ["Удостоверение сотрудника ПУ ФСБ", "Студенческая зачетка"]
    },
    memorialStatus: "Памятный стенд на кафедре IT-технологий СРМК",
    mapCoords: { lat: 46.5000, lng: 34.9000, locationName: "Приграничная полоса" }
  },
  {
    id: "elagin-m-n",
    plaque: "right",
    category: "svo_memorial",
    specTag: "weld",
    name: "Елагин Максим Николаевич",
    dates: { birth: "05.07.2000", death: "26.02.2022", years: "2000 — 2022" },
    education: {
      specialty: "Сварочное производство (профессия «Сварщик»)",
      period: "2016 — 2019 гг.",
      honors: "Мастер сварочных технологий"
    },
    military: {
      rank: "Гвардии рядовой",
      unit: "Воздушно-десантные войска",
      role: "Стрелок-десантник"
    },
    awards: ["Орден Мужества (посмертно)"],
    deed: "Погиб в первые дни СВО, проявив исключительную стойкость и героизм во встречном бою.",
    quote: "Мастерство в профессии, несокрушимый дух в бою.",
    media: {
      photo: "assets/images/heroes/elagin.jpg",
      audioGuide: "assets/audio/guides/elagin.mp3",
      documents: ["Журнал учебной группы сварщиков 2016–2019 гг."]
    },
    memorialStatus: "Именная «Парта Героя» в сварочной мастерской СРМК",
    mapCoords: { lat: 46.7200, lng: 33.1000, locationName: "Херсонский рубеж" }
  },
  {
    id: "grigoriev-a-n",
    plaque: "right",
    category: "svo_memorial",
    specTag: "electro",
    name: "Григорьев Александр Николаевич",
    dates: { birth: "16.11.1999", death: "12.08.2023", years: "1999 — 2023" },
    education: {
      specialty: "Электротехническое отделение СРМК",
      period: "2015 — 2019 гг.",
      honors: "Техник-электрик"
    },
    military: {
      rank: "Гвардии рядовой",
      unit: "Мотострелковые части ВВО",
      role: "Старший стрелок"
    },
    awards: ["Орден Мужества (посмертно)", "Медаль Суворова"],
    deed: "За мужество в боях награжден медалью Суворова при жизни. Погиб при отражении штурма позиций на Времевском выступе.",
    quote: "Честь дороже жизни.",
    media: {
      photo: "assets/images/heroes/grigoriev.jpg",
      audioGuide: "assets/audio/guides/grigoriev.mp3",
      documents: ["Мемориальная доска со школы и колледжа"]
    },
    memorialStatus: "Мемориальная доска на фасаде учебного корпуса",
    mapCoords: { lat: 47.7800, lng: 36.9000, locationName: "Времевский выступ" }
  },
  {
    id: "brynza-n-d",
    plaque: "right",
    category: "svo_memorial",
    specTag: "auto",
    name: "Брынза Никита Дмитриевич",
    dates: { birth: "05.02.2000", death: "06.08.2023", years: "2000 — 2023" },
    education: {
      specialty: "Техническое обслуживание автотранспорта",
      period: "2016 — 2020 гг.",
      honors: "Техник автоотделения"
    },
    military: {
      rank: "Рядовой",
      unit: "Штурмовой батальон",
      role: "Пулеметчик"
    },
    awards: ["Орден Мужества (посмертно)"],
    deed: "Подавил пулеметную точку противника, обеспечив продвижение штурмовой группы на Донецком направлении.",
    quote: "Прикрыл товарищей огнем в решающий момент боя.",
    media: {
      photo: "assets/images/heroes/brynza.jpg",
      audioGuide: "assets/audio/guides/brynza.mp3",
      documents: ["Личное дело студента автоотделения"]
    },
    memorialStatus: "Увековечен на правой плите Мемориала Славы СРМК",
    mapCoords: { lat: 47.9200, lng: 37.4500, locationName: "Донецкое направление" }
  },
  {
    id: "serbienko-i-p",
    plaque: "right",
    category: "svo_memorial",
    specTag: "fire",
    name: "Сербиенко Иван Павлович",
    dates: { birth: "02.11.2002", death: "11.2024", years: "2002 — 2024" },
    education: {
      specialty: "Пожарная безопасность",
      period: "2018 — 2022 гг.",
      honors: "Спасатель"
    },
    military: {
      rank: "Рядовой",
      unit: "Гвардейская бригада морской пехоты",
      role: "Стрелок"
    },
    awards: ["Орден Мужества (посмертно)"],
    deed: "Выполнял задачи особой сложности в ходе десантных операций на Днепровском рубеже.",
    quote: "Где мы — там победа.",
    media: {
      photo: "assets/images/heroes/serbienko.jpg",
      audioGuide: "assets/audio/guides/serbienko.mp3",
      documents: ["Диплом спасателя СРМК"]
    },
    memorialStatus: "Увековечен на правой плите Мемориала Славы СРМК",
    mapCoords: { lat: 46.6000, lng: 32.5000, locationName: "Днепровский рубеж" }
  },
  {
    id: "chupin-i-v",
    plaque: "right",
    category: "svo_memorial",
    specTag: "mech",
    name: "Чупин Илья Валерьевич",
    dates: { birth: "28.03.1999", death: "16.10.2024", years: "1999 — 2024" },
    education: {
      specialty: "Монтаж и эксплуатация оборудования",
      period: "2015 — 2019 гг.",
      honors: "Техник-механик"
    },
    military: {
      rank: "Сержант",
      unit: "Мотострелковый полк",
      role: "Заместитель командира взвода"
    },
    awards: ["Орден Мужества (посмертно)", "Медаль «За отвагу»"],
    deed: "Умело руководил обороной опорного пункта на Покровском направлении, сохранив жизни личного состава отделения.",
    quote: "Верность присяге до последнего дыхания.",
    media: {
      photo: "assets/images/heroes/chupin.jpg",
      audioGuide: "assets/audio/guides/chupin.mp3",
      documents: ["Студенческая учетная карточка выпуска 2019 г."]
    },
    memorialStatus: "Увековечен на правой плите Мемориала Славы СРМК",
    mapCoords: { lat: 48.2500, lng: 37.4000, locationName: "Покровское направление" }
  }
];

/* Вспомогательный API-модуль базы */
const MuseumAPI = {
  getAllHeroes: () => heroesDatabase,
  getHeroById: (id) => heroesDatabase.find(h => h.id === id),
  getHeroesByPlaque: (side) => heroesDatabase.filter(h => h.plaque === side),
  getMapMarkers: () => {
    return heroesDatabase.map(h => ({
      id: h.id,
      name: h.name,
      rank: h.military.rank,
      coords: [h.mapCoords.lat, h.mapCoords.lng],
      location: h.mapCoords.locationName,
      badgeColor: "#9e1b20"
    }));
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MUSEUM_CONFIG, SPECIALTIES_TAXONOMY, heroesDatabase, MuseumAPI };
}