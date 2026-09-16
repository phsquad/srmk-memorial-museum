/**
 * ============================================================================
 * ГЕРАЛЬДИЧЕСКИЙ АТЛАС НАГРАД И ГАЛЕРЕЯ: js/sources.js (v11.0 Ultra Master)
 * Мемориально-образовательный комплекс ГБПОУ СРМК «Быть воином — жить вечно»
 * 
 * Включает:
 * 1. Векторные SVG-рендеры подлинных государственных наград и орденских планок РФ
 * 2. Автоматический сборщик мультимедийной галереи без битых ссылок и черных квадратов
 * 3. Генератор мемориальных гербовых аватаров колледжа
 * ============================================================================
 */

'use strict';

/**
 * Хелпер создания 100% валидных SVG Data URI без проблем с кодировкой
 */
function createSvgDataUri(svgString) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString.trim())}`;
}

/**
 * 1. ВЕКТОРНЫЕ ИСХОДНИКИ ГОСУДАРСТВЕННЫХ НАГРАД И ПЛАНАТ ОРДЕНОВ РФ
 */
const HERALDIC_SVGS = {
  // ОРДЕН МУЖЕСТВА (Серебряный рельефный крест с орлом)
  ORDER_OF_COURAGE_BADGE: createSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
      <defs>
        <radialGradient id="silverMetal" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="40%" stop-color="#e2e8f0"/>
          <stop offset="75%" stop-color="#94a3b8"/>
          <stop offset="100%" stop-color="#475569"/>
        </radialGradient>
        <linearGradient id="goldShine" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fff3b0"/>
          <stop offset="50%" stop-color="#c5a059"/>
          <stop offset="100%" stop-color="#78561d"/>
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000000" flood-opacity="0.6"/>
        </filter>
      </defs>
      <g filter="url(#shadow)">
        <path d="M150 15 L182 92 C202 96 208 104 212 122 L285 150 L212 178 C208 196 202 204 182 208 L150 285 L118 208 C98 204 92 196 88 178 L15 150 L88 122 C92 104 98 96 118 92 Z" fill="url(#silverMetal)" stroke="#334155" stroke-width="3"/>
        <path d="M150 40 L168 102 L228 120 L172 150 L228 180 L168 198 L150 260 L132 198 L72 180 L128 150 L72 120 L132 102 Z" fill="#64748b" opacity="0.4"/>
        <circle cx="150" cy="150" r="58" fill="url(#silverMetal)" stroke="#1e293b" stroke-width="3"/>
        <circle cx="150" cy="150" r="48" fill="#12151d" stroke="url(#goldShine)" stroke-width="2"/>
        <path d="M150 118 L154 132 L168 132 L157 141 L161 155 L150 146 L139 155 L143 141 L132 132 L146 132 Z" fill="url(#goldShine)"/>
        <text x="150" y="178" text-anchor="middle" fill="#ffffff" font-family="'Cinzel', serif" font-weight="900" font-size="11" letter-spacing="2">МУЖЕСТВО</text>
      </g>
    </svg>
  `),
  
  // ПЛАНКА ОРДЕНА МУЖЕСТВА (Красная лента с белыми полосами по краям)
  ORDER_OF_COURAGE_RIBBON: createSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 70" width="240" height="70">
      <rect width="240" height="70" rx="4" fill="#8a1c22" stroke="#111111" stroke-width="2"/>
      <rect x="0" y="0" width="16" height="70" fill="#ffffff"/>
      <rect x="224" y="0" width="16" height="70" fill="#ffffff"/>
      <rect width="240" height="70" rx="4" fill="none" stroke="#c5a059" stroke-width="1.5" stroke-opacity="0.5"/>
    </svg>
  `),

  // МЕДАЛЬ «ЗА ОТВАГУ» (Серебряный круг с танком Т-35 и самолетами)
  MEDAL_FOR_COURAGE_BADGE: createSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
      <defs>
        <radialGradient id="silverCoin" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="70%" stop-color="#cbd5e1"/>
          <stop offset="100%" stop-color="#64748b"/>
        </radialGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000000" flood-opacity="0.6"/>
        </filter>
      </defs>
      <g filter="url(#shadow)">
        <circle cx="150" cy="150" r="120" fill="url(#silverCoin)" stroke="#334155" stroke-width="4"/>
        <circle cx="150" cy="150" r="112" fill="none" stroke="#ffffff" stroke-width="1.5" opacity="0.6"/>
        <path d="M80 75 L100 85 L90 88 Z M140 60 L165 72 L152 75 Z M200 78 L220 88 L210 91 Z" fill="#475569"/>
        <text x="150" y="142" text-anchor="middle" fill="#991b1b" font-family="'Montserrat', sans-serif" font-weight="900" font-size="22" letter-spacing="3">ЗА ОТВАГУ</text>
        <rect x="100" y="165" width="100" height="26" rx="6" fill="#475569"/>
        <circle cx="115" cy="182" r="7" fill="#1e293b"/>
        <circle cx="138" cy="182" r="7" fill="#1e293b"/>
        <circle cx="162" cy="182" r="7" fill="#1e293b"/>
        <circle cx="185" cy="182" r="7" fill="#1e293b"/>
        <path d="M105 165 L125 152 L175 152 L195 165 Z" fill="#334155"/>
        <line x1="80" y1="158" x2="125" y2="158" stroke="#1e293b" stroke-width="4" stroke-linecap="round"/>
        <text x="150" y="225" text-anchor="middle" fill="#991b1b" font-family="'Montserrat', sans-serif" font-weight="800" font-size="14" letter-spacing="5">СССР</text>
      </g>
    </svg>
  `),

  // ПЛАНКА МЕДАЛИ «ЗА ОТВАГУ» (Серая с синими полосками по краям)
  MEDAL_FOR_COURAGE_RIBBON: createSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 70" width="240" height="70">
      <rect width="240" height="70" rx="4" fill="#94a3b8" stroke="#111111" stroke-width="2"/>
      <rect x="10" y="0" width="14" height="70" fill="#1d4ed8"/>
      <rect x="216" y="0" width="14" height="70" fill="#1d4ed8"/>
      <rect width="240" height="70" rx="4" fill="none" stroke="#c5a059" stroke-width="1.5" stroke-opacity="0.4"/>
    </svg>
  `),

  // МЕДАЛЬ СУВОРОВА (Золотисто-бронзовый барельеф)
  MEDAL_OF_SUVOROV_BADGE: createSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
      <defs>
        <radialGradient id="goldCoin" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#fff3b0"/>
          <stop offset="70%" stop-color="#c5a059"/>
          <stop offset="100%" stop-color="#78561d"/>
        </radialGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000000" flood-opacity="0.6"/>
        </filter>
      </defs>
      <g filter="url(#shadow)">
        <circle cx="150" cy="150" r="120" fill="url(#goldCoin)" stroke="#543d14" stroke-width="4"/>
        <circle cx="150" cy="150" r="112" fill="none" stroke="#ffffff" stroke-width="1.5" opacity="0.5"/>
        <circle cx="150" cy="125" r="38" fill="#8f6b28" stroke="#ffffff" stroke-width="2" opacity="0.8"/>
        <path d="M132 130 C132 108 168 108 168 130 C168 145 132 145 132 130 Z" fill="#ffffff"/>
        <path d="M85 205 L215 205" stroke="#38270a" stroke-width="5" stroke-linecap="round"/>
        <path d="M95 215 L205 195" stroke="#38270a" stroke-width="3" stroke-linecap="round"/>
        <text x="150" y="185" text-anchor="middle" fill="#2e2007" font-family="'Cinzel', serif" font-weight="900" font-size="16" letter-spacing="2">А. СУВОРОВ</text>
      </g>
    </svg>
  `),

  // ПЛАНКА МЕДАЛИ СУВОРОВА
  MEDAL_OF_SUVOROV_RIBBON: createSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 70" width="240" height="70">
      <rect width="240" height="70" rx="4" fill="#b91c1c" stroke="#111111" stroke-width="2"/>
      <rect x="10" y="0" width="14" height="70" fill="#15803d"/>
      <rect x="216" y="0" width="14" height="70" fill="#15803d"/>
      <rect width="240" height="70" rx="4" fill="none" stroke="#c5a059" stroke-width="1.5" stroke-opacity="0.4"/>
    </svg>
  `),

  // МЕДАЛЬ «ЗА ХРАБРОСТЬ» II СТЕПЕНИ
  MEDAL_FOR_BRAVERY_BADGE: createSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
      <defs>
        <radialGradient id="silverBravery" cx="45%" cy="45%" r="55%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="70%" stop-color="#cbd5e1"/>
          <stop offset="100%" stop-color="#64748b"/>
        </radialGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000000" flood-opacity="0.6"/>
        </filter>
      </defs>
      <g filter="url(#shadow)">
        <circle cx="150" cy="150" r="120" fill="url(#silverBravery)" stroke="#334155" stroke-width="4"/>
        <path d="M150 45 L160 110 L150 115 L140 110 Z M150 255 L160 190 L150 185 L140 190 Z M45 150 L110 160 L115 150 L110 140 Z M255 150 L190 160 L185 150 L190 140 Z" fill="#8a1c22"/>
        <circle cx="150" cy="150" r="55" fill="#12151c" stroke="#c5a059" stroke-width="3"/>
        <text x="150" y="146" text-anchor="middle" fill="#ffffff" font-family="'Montserrat', sans-serif" font-weight="900" font-size="14" letter-spacing="1">ЗА ХРАБРОСТЬ</text>
        <text x="150" y="170" text-anchor="middle" fill="#c5a059" font-family="'Cinzel', serif" font-weight="900" font-size="16">II СТЕПЕНЬ</text>
      </g>
    </svg>
  `),

  // ПЛАНКА МЕДАЛИ «ЗА ХРАБРОСТЬ»
  MEDAL_FOR_BRAVERY_RIBBON: createSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 70" width="240" height="70">
      <rect width="240" height="70" rx="4" fill="#111827" stroke="#111111" stroke-width="2"/>
      <rect x="0" y="0" width="120" height="70" fill="#ea580c"/>
      <rect x="40" y="0" width="40" height="70" fill="#111827"/>
      <rect x="140" y="0" width="20" height="70" fill="#ffffff"/>
      <rect x="180" y="0" width="20" height="70" fill="#ffffff"/>
      <rect width="240" height="70" rx="4" fill="none" stroke="#c5a059" stroke-width="1.5" stroke-opacity="0.4"/>
    </svg>
  `),

  // ВЕТЕРАН БОЕВЫХ ДЕЙСТВИЙ
  VETERAN_BADGE: createSvgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
      <defs>
        <linearGradient id="brassShield" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffeaa7"/>
          <stop offset="60%" stop-color="#c5a059"/>
          <stop offset="100%" stop-color="#7d5c1b"/>
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000000" flood-opacity="0.6"/>
        </filter>
      </defs>
      <g filter="url(#shadow)">
        <path d="M150 25 C230 25 250 65 250 140 C250 215 150 275 150 275 C150 275 50 215 50 140 C50 65 70 25 150 25 Z" fill="url(#brassShield)" stroke="#382705" stroke-width="4"/>
        <path d="M150 40 C215 40 232 75 232 140 C232 202 150 255 150 255 C150 255 68 202 68 140 C68 75 85 40 150 40 Z" fill="#8a1c22" stroke="#ffffff" stroke-width="1.5"/>
        <path d="M150 85 L158 110 L185 110 L163 126 L171 150 L150 135 L129 150 L137 126 L115 110 L142 110 Z" fill="url(#brassShield)" stroke="#ffffff" stroke-width="1"/>
        <text x="150" y="185" text-anchor="middle" fill="#ffffff" font-family="'Montserrat', sans-serif" font-weight="900" font-size="15" letter-spacing="2">ВЕТЕРАН</text>
        <text x="150" y="208" text-anchor="middle" fill="#ffeaa7" font-family="'Montserrat', sans-serif" font-weight="800" font-size="11" letter-spacing="1.5">БОЕВЫХ ДЕЙСТВИЙ</text>
      </g>
    </svg>
  `)
};

/**
 * 2. СВЯЗУЮЩАЯ БАЗА НАГРАД
 */
const AWARDS_DATABASE = {
  "орден мужества": {
    name: "Орден Мужества",
    badge: HERALDIC_SVGS.ORDER_OF_COURAGE_BADGE,
    ribbon: HERALDIC_SVGS.ORDER_OF_COURAGE_RIBBON,
    established: "Учрежден в 1994 г.",
    criteria: "Высшая награда за самоотверженность, мужество и отвагу при исполнении воинского долга."
  },
  "медаль «за отвагу»": {
    name: "Медаль «За отвагу»",
    badge: HERALDIC_SVGS.MEDAL_FOR_COURAGE_BADGE,
    ribbon: HERALDIC_SVGS.MEDAL_FOR_COURAGE_RIBBON,
    established: "Учреждена в 1994 г.",
    criteria: "Награда за личное мужество и отвагу, проявленные в боях при защите Отечества."
  },
  "медаль суворова": {
    name: "Медаль Суворова",
    badge: HERALDIC_SVGS.MEDAL_OF_SUVOROV_BADGE,
    ribbon: HERALDIC_SVGS.MEDAL_OF_SUVOROV_RIBBON,
    established: "Учреждена в 1994 г.",
    criteria: "Награда за личное мужество и отвагу при защите сухопутных рубежей Отечества."
  },
  "медаль «за храбрость»": {
    name: "Медаль «За храбрость» II степени",
    badge: HERALDIC_SVGS.MEDAL_FOR_BRAVERY_BADGE,
    ribbon: HERALDIC_SVGS.MEDAL_FOR_BRAVERY_RIBBON,
    established: "Учреждена в 2023 г.",
    criteria: "Награда за храбрость и мужество в ходе выполнения специальных и боевых задач."
  },
  "ветеран боевых действий": {
    name: "Ветеран боевых действий",
    badge: HERALDIC_SVGS.VETERAN_BADGE,
    ribbon: HERALDIC_SVGS.VETERAN_BADGE,
    established: "Государственный статус РФ",
    criteria: "Знак отличия и статус за участие в боевых действиях по защите интересов страны."
  }
};

const ArchiveService = {
  _imageCache: new Map(),

  /**
   * 3. СБОРЩИК ГАЛЕРЕИ В ДОСЬЕ ГЕРОЯ (БЕЗ ЧЕРНЫХ КВАДРАТОВ)
   */
  buildDynamicGallery(hero) {
    const gallery = [];

    // 1. Портрет героя
    const photoUrl = hero.media?.photo || hero.photo || this.generateFallbackAvatar(hero);
    gallery.push({
      url: photoUrl,
      caption: `Портрет: ${hero.name}`,
      desc: hero.education?.specialty || hero.specialty || "Выпускник СРМК",
      type: "portrait"
    });

    // 2. Векторные знаки и планки орденов
    if (hero.awards && Array.isArray(hero.awards)) {
      hero.awards.forEach(awardTitle => {
        const visual = this.getAwardVisual(awardTitle);
        
        if (visual.badge) {
          gallery.push({
            url: visual.badge,
            caption: `Государственная награда: ${visual.name}`,
            desc: visual.criteria || visual.established,
            type: "award_badge"
          });
        }

        if (visual.ribbon && visual.ribbon !== visual.badge) {
          gallery.push({
            url: visual.ribbon,
            caption: `Орденская планка: ${visual.name}`,
            desc: visual.established || "Лента государственной награды РФ",
            type: "award_ribbon"
          });
        }
      });
    }

    // 3. Памятник монумента СРМК
    gallery.push({
      url: "assets/images/cover-master.jpg",
      caption: "Мемориал Славы «Звезда Памяти»",
      desc: `Памятная ${hero.plaque === 'left' ? 'левая' : 'правая'} плита во дворе ГБПОУ СРМК`,
      type: "memorial"
    });

    return gallery;
  },

  /**
   * 4. ПОИСК НАГРАДЫ ПО ТЕКСТОВОМУ ИМЕНИ
   */
  getAwardVisual(awardTitle) {
    if (!awardTitle) return { name: "Награда РФ", badge: HERALDIC_SVGS.ORDER_OF_COURAGE_BADGE, ribbon: HERALDIC_SVGS.ORDER_OF_COURAGE_RIBBON, criteria: "" };

    const lower = awardTitle.toLowerCase().trim();
    const key = Object.keys(AWARDS_DATABASE).find(k => lower.includes(k));

    if (key) {
      return AWARDS_DATABASE[key];
    }

    return {
      name: awardTitle,
      badge: HERALDIC_SVGS.ORDER_OF_COURAGE_BADGE,
      ribbon: HERALDIC_SVGS.ORDER_OF_COURAGE_RIBBON,
      established: "Государственная награда РФ",
      criteria: "Награда Российской Федерации за проявленный героизм и самоотверженность."
    };
  },

  /**
   * 5. ГЕНЕРАТОР ГЕРБОВЫХ ВЕКТОРНЫХ АВАТАРОВ (SVG)
   */
  generateFallbackAvatar(hero) {
    const parts = (hero.name || "Герой СРМК").split(' ');
    const initials = ((parts[0] ? parts[0][0] : '') + (parts[1] ? parts[1][0] : '')).toUpperCase();
    const specialtyName = hero.education?.specialty || hero.specialty || "Выпускник колледжа";
    const yearsText = hero.dates?.years || hero.years || "Навечно в строю";

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500">
        <defs>
          <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#181d27"/>
            <stop offset="100%" stop-color="#0a0c10"/>
          </linearGradient>
          <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#fdf0b2"/>
            <stop offset="100%" stop-color="#c5a059"/>
          </linearGradient>
        </defs>

        <rect width="400" height="500" fill="url(#bgGrad)"/>
        <rect x="14" y="14" width="372" height="472" fill="none" stroke="url(#goldGrad)" stroke-width="1.5" stroke-opacity="0.3" rx="4"/>

        <g transform="translate(200, 175)">
          <circle r="80" fill="#0f1218" stroke="url(#goldGrad)" stroke-width="2"/>
          <path d="M-46 -46 L46 46 M-46 46 L46 -46" stroke="#8a1c22" stroke-width="12" stroke-linecap="round"/>
          <circle r="48" fill="#8a1c22" stroke="url(#goldGrad)" stroke-width="2"/>
          <text y="9" text-anchor="middle" fill="#ffffff" font-family="'Cinzel', Georgia, serif" font-weight="900" font-size="26" letter-spacing="2">${initials}</text>
        </g>

        <g transform="translate(45, 295)">
          <rect width="310" height="8" fill="#f97316"/>
          <rect x="62" width="31" height="8" fill="#111111"/>
          <rect x="155" width="31" height="8" fill="#111111"/>
          <rect x="248" width="31" height="8" fill="#111111"/>
        </g>

        <text x="200" y="340" text-anchor="middle" fill="#c5a059" font-family="'Montserrat', sans-serif" font-weight="700" font-size="14" letter-spacing="1">ГБПОУ СРМК</text>
        <text x="200" y="365" text-anchor="middle" fill="#9da6b3" font-family="'Montserrat', sans-serif" font-size="11">${specialtyName.length > 34 ? specialtyName.substring(0, 31) + '...' : specialtyName}</text>
        <text x="200" y="388" text-anchor="middle" fill="#606875" font-family="'Montserrat', sans-serif" font-size="11.5">${yearsText}</text>
        
        <text x="200" y="435" text-anchor="middle" fill="#f1f3f7" font-family="'Cinzel', Georgia, serif" font-weight="700" font-size="12" letter-spacing="3">НАВЕЧНО В СТРОЮ</text>
      </svg>
    `;

    return createSvgDataUri(svg);
  }
};

window.ArchiveService = ArchiveService;
window.HERALDIC_SVGS = HERALDIC_SVGS;
window.AWARDS_DATABASE = AWARDS_DATABASE;