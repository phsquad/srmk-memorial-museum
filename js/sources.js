/**
 * ============================================================================
 * ГЕРАЛЬДИЧЕСКИЙ АТЛАС НАГРАД И ГАЛЕРЕЯ: js/sources.js (v10.0 Ultra Master)
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
 * 1. АВТОНОМНЫЕ ВЕКТОРНЫЕ ИЗОБРАЖЕНИЯ НАГРАД РФ (SVG DATA URI)
 * Гарантирует 100% отображение без внешних запросов и CORS-блокировок
 */
const HERALDIC_SVGS = {
  // ОРДЕН МУЖЕСТВА (Серебряный крест с орлом и рельефом)
  ORDER_OF_COURAGE_BADGE: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 300' width='300' height='300'%3E%3Cdefs%3E%3CradialGradient id='silverMetal' cx='50%25' cy='50%25' r='50%25'%3E%3Cstop offset='0%25' stop-color='%23ffffff'/%3E%3Cstop offset='45%25' stop-color='%23d8dde6'/%3E%3Cstop offset='85%25' stop-color='%238a93a0'/%3E%3Cstop offset='100%25' stop-color='%23505763'/%3E%3C/radialGradient%3E%3ClinearGradient id='goldShine' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23fff3b0'/%3E%3Cstop offset='50%25' stop-color='%23c5a059'/%3E%3Cstop offset='100%25' stop-color='%23856427'/%3E%3C/linearGradient%3E%3Cfilter id='dropShadow' x='-20%25' y='-20%25' width='140%25' height='140%25'%3E%3CfeDropShadow dx='0' dy='8' stdDeviation='8' flood-color='%23000' flood-opacity='0.6'/%3E%3C/filter%3E%3C/defs%3E%3Cg filter='url(%23dropShadow)'%3E%3Cpath d='M150 20 L178 95 C195 98 202 105 205 122 L280 150 L205 178 C202 195 195 202 178 205 L150 280 L122 205 C105 202 98 195 95 178 L20 150 L95 122 C98 105 105 98 122 95 Z' fill='url(%23silverMetal)' stroke='%23424752' stroke-width='3'/%3E%3Cpath d='M150 45 L168 105 L228 122 L172 150 L228 178 L168 195 L150 255 L132 195 L72 178 L128 150 L72 122 L132 105 Z' fill='%239aa3b0' opacity='0.5'/%3E%3Ccircle cx='150' cy='150' r='58' fill='url(%23silverMetal)' stroke='%23363a43' stroke-width='2.5'/%3E%3Ccircle cx='150' cy='150' r='48' fill='%2312151d' stroke='url(%23goldShine)' stroke-width='2'/%3E%3Cpath d='M150 118 L154 132 L168 132 L157 141 L161 155 L150 146 L139 155 L143 141 L132 132 L146 132 Z' fill='url(%23goldShine)'/%3E%3Ctext x='150' y='178' text-anchor='middle' fill='%23ffffff' font-family='sans-serif' font-weight='900' font-size='11' letter-spacing='2'%3EМУЖЕСТВО%3C/text%3E%3C/g%3E%3C/svg%3E",
  
  // ПЛАНКА ОРДЕНА МУЖЕСТВА (Красная с белыми краями)
  ORDER_OF_COURAGE_RIBBON: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 70' width='240' height='70'%3E%3Crect width='240' height='70' rx='4' fill='%238a1c22' stroke='%23222' stroke-width='2'/%3E%3Crect x='0' y='0' width='16' height='70' fill='%23ffffff' rx='2'/%3E%3Crect x='224' y='0' width='16' height='70' fill='%23ffffff' rx='2'/%3E%3Crect width='240' height='70' rx='4' fill='none' stroke='%23c5a059' stroke-width='1.5' stroke-opacity='0.4'/%3E%3C/svg%3E",

  // МЕДАЛЬ «ЗА ОТВАГУ» (Серебряная медаль с танком и самолетами)
  MEDAL_FOR_COURAGE_BADGE: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 300' width='300' height='300'%3E%3Cdefs%3E%3CradialGradient id='silverCoin' cx='40%25' cy='40%25' r='60%25'%3E%3Cstop offset='0%25' stop-color='%23ffffff'/%3E%3Cstop offset='70%25' stop-color='%23b8c0cc'/%3E%3Cstop offset='100%25' stop-color='%237a828f'/%3E%3C/radialGradient%3E%3Cfilter id='dropShadow' x='-20%25' y='-20%25' width='140%25' height='140%25'%3E%3CfeDropShadow dx='0' dy='8' stdDeviation='8' flood-color='%23000' flood-opacity='0.6'/%3E%3C/filter%3E%3C/defs%3E%3Cg filter='url(%23dropShadow)'%3E%3Ccircle cx='150' cy='150' r='120' fill='url(%23silverCoin)' stroke='%234f5560' stroke-width='4'/%3E%3Ccircle cx='150' cy='150' r='112' fill='none' stroke='%23ffffff' stroke-width='1.5' stroke-opacity='0.6'/%3E%3Cpath d='M80 75 L100 85 L90 88 Z M140 60 L165 72 L152 75 Z M200 78 L220 88 L210 91 Z' fill='%23505763'/%3E%3Ctext x='150' y='142' text-anchor='middle' fill='%23991b1b' font-family='sans-serif' font-weight='900' font-size='22' letter-spacing='3'%3EЗА ОТВАГУ%3C/text%3E%3Crect x='100' y='165' width='100' height='26' rx='6' fill='%23505763'/%3E%3Ccircle cx='115' cy='182' r='7' fill='%23222'/%3E%3Ccircle cx='138' cy='182' r='7' fill='%23222'/%3E%3Ccircle cx='162' cy='182' r='7' fill='%23222'/%3E%3Ccircle cx='185' cy='182' r='7' fill='%23222'/%3E%3Cpath d='M105 165 L125 152 L175 152 L195 165 Z' fill='%23383d47'/%3E%3Cline x1='80' y1='158' x2='125' y2='158' stroke='%23222' stroke-width='4' stroke-linecap='round'/%3E%3Ctext x='150' y='225' text-anchor='middle' fill='%23991b1b' font-family='sans-serif' font-weight='800' font-size='14' letter-spacing='5'%3EСССР%3C/text%3E%3C/g%3E%3C/svg%3E",

  // ПЛАНКА МЕДАЛИ «ЗА ОТВАГУ» (Серая с синими полосками по краям)
  MEDAL_FOR_COURAGE_RIBBON: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 70' width='240' height='70'%3E%3Crect width='240' height='70' rx='4' fill='%239da6b3' stroke='%23222' stroke-width='2'/%3E%3Crect x='10' y='0' width='14' height='70' fill='%231d4ed8'/%3E%3Crect x='216' y='0' width='14' height='70' fill='%231d4ed8'/%3E%3Crect width='240' height='70' rx='4' fill='none' stroke='%23c5a059' stroke-width='1.5' stroke-opacity='0.4'/%3E%3C/svg%3E",

  // МЕДАЛЬ СУВОРОВА
  MEDAL_OF_SUVOROV_BADGE: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 300' width='300' height='300'%3E%3Cdefs%3E%3CradialGradient id='goldCoin' cx='40%25' cy='40%25' r='60%25'%3E%3Cstop offset='0%25' stop-color='%23fff3b0'/%3E%3Cstop offset='70%25' stop-color='%23c5a059'/%3E%3Cstop offset='100%25' stop-color='%2378561d'/%3E%3C/radialGradient%3E%3Cfilter id='dropShadow' x='-20%25' y='-20%25' width='140%25' height='140%25'%3E%3CfeDropShadow dx='0' dy='8' stdDeviation='8' flood-color='%23000' flood-opacity='0.6'/%3E%3C/filter%3E%3C/defs%3E%3Cg filter='url(%23dropShadow)'%3E%3Ccircle cx='150' cy='150' r='120' fill='url(%23goldCoin)' stroke='%23543d14' stroke-width='4'/%3E%3Ccircle cx='150' cy='150' r='112' fill='none' stroke='%23fff' stroke-width='1.5' stroke-opacity='0.5'/%3E%3Ccircle cx='150' cy='130' r='40' fill='%238f6b28' stroke='%23fff' stroke-width='2' opacity='0.8'/%3E%3Cpath d='M130 135 C130 110 170 110 170 135 C170 150 130 150 130 135 Z' fill='%23ffffff'/%3E%3Cpath d='M85 210 L215 210' stroke='%2338270a' stroke-width='5' stroke-linecap='round'/%3E%3Cpath d='M95 220 L205 200' stroke='%2338270a' stroke-width='3' stroke-linecap='round'/%3E%3Ctext x='150' y='190' text-anchor='middle' fill='%232e2007' font-family='serif' font-weight='900' font-size='17' letter-spacing='2'%3EА. СУВОРОВ%3C/text%3E%3C/g%3E%3C/svg%3E",

  // ПЛАНКА МЕДАЛИ СУВОРОВА (Красная с зелеными полосами)
  MEDAL_OF_SUVOROV_RIBBON: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 70' width='240' height='70'%3E%3Crect width='240' height='70' rx='4' fill='%23b91c1c' stroke='%23222' stroke-width='2'/%3E%3Crect x='10' y='0' width='14' height='70' fill='%2315803d'/%3E%3Crect x='216' y='0' width='14' height='70' fill='%2315803d'/%3E%3Crect width='240' height='70' rx='4' fill='none' stroke='%23c5a059' stroke-width='1.5' stroke-opacity='0.4'/%3E%3C/svg%3E",

  // МЕДАЛЬ «ЗА ХРАБРОСТЬ» II СТЕПЕНИ
  MEDAL_FOR_BRAVERY_BADGE: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 300' width='300' height='300'%3E%3Cdefs%3E%3CradialGradient id='silverBravery' cx='45%25' cy='45%25' r='55%25'%3E%3Cstop offset='0%25' stop-color='%23ffffff'/%3E%3Cstop offset='70%25' stop-color='%23c2c8d2'/%3E%3Cstop offset='100%25' stop-color='%23717885'/%3E%3C/radialGradient%3E%3Cfilter id='dropShadow' x='-20%25' y='-20%25' width='140%25' height='140%25'%3E%3CfeDropShadow dx='0' dy='8' stdDeviation='8' flood-color='%23000' flood-opacity='0.6'/%3E%3C/filter%3E%3C/defs%3E%3Cg filter='url(%23dropShadow)'%3E%3Ccircle cx='150' cy='150' r='120' fill='url(%23silverBravery)' stroke='%23454b57' stroke-width='4'/%3E%3Cpath d='M150 45 L160 110 L150 115 L140 110 Z M150 255 L160 190 L150 185 L140 190 Z M45 150 L110 160 L115 150 L110 140 Z M255 150 L190 160 L185 150 L190 140 Z' fill='%238a1c22'/%3E%3Ccircle cx='150' cy='150' r='55' fill='%2312151c' stroke='%23c5a059' stroke-width='3'/%3E%3Ctext x='150' y='146' text-anchor='middle' fill='%23ffffff' font-family='sans-serif' font-weight='900' font-size='15' letter-spacing='2'%3EЗА ХРАБРОСТЬ%3C/text%3E%3Ctext x='150' y='170' text-anchor='middle' fill='%23c5a059' font-family='serif' font-weight='900' font-size='18'%3EII СТЕПЕНЬ%3C/text%3E%3C/g%3E%3C/svg%3E",

  // ПЛАНКА МЕДАЛИ «ЗА ХРАБРОСТЬ»
  MEDAL_FOR_BRAVERY_RIBBON: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 70' width='240' height='70'%3E%3Crect width='240' height='70' rx='4' fill='%23111827' stroke='%23222' stroke-width='2'/%3E%3Crect x='0' y='0' width='120' height='70' fill='%23ea580c'/%3E%3Crect x='40' y='0' width='40' height='70' fill='%23111827'/%3E%3Crect x='140' y='0' width='20' height='70' fill='%23ffffff'/%3E%3Crect x='180' y='0' width='20' height='70' fill='%23ffffff'/%3E%3Crect width='240' height='70' rx='4' fill='none' stroke='%23c5a059' stroke-width='1.5' stroke-opacity='0.4'/%3E%3C/svg%3E",

  // ЗНАК «ВЕТЕРАН БОЕВЫХ ДЕЙСТВИЙ»
  VETERAN_BADGE: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 300' width='300' height='300'%3E%3Cdefs%3E%3ClinearGradient id='brassShield' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23ffeaa7'/%3E%3Cstop offset='60%25' stop-color='%23c5a059'/%3E%3Cstop offset='100%25' stop-color='%237d5c1b'/%3E%3C/linearGradient%3E%3Cfilter id='dropShadow' x='-20%25' y='-20%25' width='140%25' height='140%25'%3E%3CfeDropShadow dx='0' dy='8' stdDeviation='8' flood-color='%23000' flood-opacity='0.6'/%3E%3C/filter%3E%3C/defs%3E%3Cg filter='url(%23dropShadow)'%3E%3Cpath d='M150 25 C230 25 250 65 250 140 C250 215 150 275 150 275 C150 275 50 215 50 140 C50 65 70 25 150 25 Z' fill='url(%23brassShield)' stroke='%23382705' stroke-width='4'/%3E%3Cpath d='M150 40 C215 40 232 75 232 140 C232 202 150 255 150 255 C150 255 68 202 68 140 C68 75 85 40 150 40 Z' fill='%238a1c22' stroke='%23fff' stroke-width='1.5'/%3E%3Cpath d='M150 85 L158 110 L185 110 L163 126 L171 150 L150 135 L129 150 L137 126 L115 110 L142 110 Z' fill='url(%23brassShield)' stroke='%23fff' stroke-width='1'/%3E%3Ctext x='150' y='185' text-anchor='middle' fill='%23ffffff' font-family='sans-serif' font-weight='900' font-size='15' letter-spacing='2'%3EВЕТЕРАН%3C/text%3E%3Ctext x='150' y='208' text-anchor='middle' fill='%23ffeaa7' font-family='sans-serif' font-weight='800' font-size='12' letter-spacing='1.5'%3EБОЕВЫХ ДЕЙСТВИЙ%3C/text%3E%3C/g%3E%3C/svg%3E"
};

/**
 * БАЗА ДАННЫХ ГОСУДАРСТВЕННЫХ НАГРАД
 */
const AWARDS_DATABASE = {
  "орден мужества": {
    name: "Орден Мужества",
    badge: HERALDIC_SVGS.ORDER_OF_COURAGE_BADGE,
    ribbon: HERALDIC_SVGS.ORDER_OF_COURAGE_RIBBON,
    established: "Учрежден в 1994 г.",
    criteria: "Высшая государственная награда за самоотверженность, мужество и отвагу при исполнении воинского долга."
  },
  "медаль «за отвагу»": {
    name: "Медаль «За отвагу»",
    badge: HERALDIC_SVGS.MEDAL_FOR_COURAGE_BADGE,
    ribbon: HERALDIC_SVGS.MEDAL_FOR_COURAGE_RIBBON,
    established: "Учреждена в 1994 г.",
    criteria: "Государственная награда за личное мужество и отвагу, проявленные в боях при защите Отечества."
  },
  "медаль суворова": {
    name: "Медаль Суворова",
    badge: HERALDIC_SVGS.MEDAL_OF_SUVOROV_BADGE,
    ribbon: HERALDIC_SVGS.MEDAL_OF_SUVOROV_RIBBON,
    established: "Учреждена в 1994 г.",
    criteria: "Награда военнослужащих сухопутных войск за личное мужество и отвагу при защите рубежей Отечества."
  },
  "медаль «за храбрость»": {
    name: "Медаль «За храбрость» II степени",
    badge: HERALDIC_SVGS.MEDAL_FOR_BRAVERY_BADGE,
    ribbon: HERALDIC_SVGS.MEDAL_FOR_BRAVERY_RIBBON,
    established: "Учреждена в 2023 г.",
    criteria: "Награда за храбрость и мужество в ходе выполнения боевых и специальных задач по защите Родины."
  },
  "ветеран боевых действий": {
    name: "Ветеран боевых действий",
    badge: HERALDIC_SVGS.VETERAN_BADGE,
    ribbon: HERALDIC_SVGS.VETERAN_BADGE,
    established: "Государственный статус РФ",
    criteria: "Знак отличия и государственный статус за участие в боевых действиях по защите интересов Отечества."
  }
};

const ArchiveService = {
  _imageCache: new Map(),

  /**
   * 2. АВТОМАТИЧЕСКАЯ СБОРКА МУЛЬТИМЕДИЙНОЙ ГАЛЕРЕИ БЕЗ БИТЫХ КВАДРАТОВ
   */
  buildDynamicGallery(hero) {
    const gallery = [];

    // 1. Портрет героя (фото или векторный аватар)
    const photoUrl = hero.media?.photo || hero.photo || this.generateFallbackAvatar(hero);
    gallery.push({
      url: photoUrl,
      caption: `Портрет: ${hero.name}`,
      desc: hero.education?.specialty || hero.specialty || "Выпускник колледжа",
      type: "portrait"
    });

    // 2. Государственные награды и орденские планки
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

    // 3. Мемориал колледжа
    gallery.push({
      url: "assets/images/cover-master.jpg",
      caption: "Мемориал Славы «Звезда Памяти»",
      desc: `Памятная ${hero.plaque === 'left' ? 'левая' : 'правая'} плита монумента ГБПОУ СРМК`,
      type: "memorial"
    });

    return gallery;
  },

  /**
   * 3. ПОЛУЧЕНИЕ НАГРАДЫ ПО ТЕКСТУ
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
   * 4. ГЕНЕРАТОР ВЕКТОРНЫХ МЕМОРИАЛЬНЫХ АВАТАРОВ (SVG)
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

        <!-- Центральный орденский медальон -->
        <g transform="translate(200, 175)">
          <circle r="80" fill="#0f1218" stroke="url(#goldGrad)" stroke-width="2"/>
          <path d="M-46 -46 L46 46 M-46 46 L46 -46" stroke="#8a1c22" stroke-width="12" stroke-linecap="round"/>
          <circle r="48" fill="#8a1c22" stroke="url(#goldGrad)" stroke-width="2"/>
          <text y="9" text-anchor="middle" fill="#ffffff" font-family="'Cinzel', Georgia, serif" font-weight="900" font-size="26" letter-spacing="2">${initials}</text>
        </g>

        <!-- Георгиевская лента -->
        <g transform="translate(45, 295)">
          <rect width="310" height="8" fill="#f97316"/>
          <rect x="62" width="31" height="8" fill="#111111"/>
          <rect x="155" width="31" height="8" fill="#111111"/>
          <rect x="248" width="31" height="8" fill="#111111"/>
        </g>

        <!-- Типографика -->
        <text x="200" y="340" text-anchor="middle" fill="#c5a059" font-family="'Montserrat', sans-serif" font-weight="700" font-size="14" letter-spacing="1">ГБПОУ СРМК</text>
        <text x="200" y="365" text-anchor="middle" fill="#9da6b3" font-family="'Montserrat', sans-serif" font-size="11">${specialtyName.length > 34 ? specialtyName.substring(0, 31) + '...' : specialtyName}</text>
        <text x="200" y="388" text-anchor="middle" fill="#606875" font-family="'Montserrat', sans-serif" font-size="11.5">${yearsText}</text>
        
        <text x="200" y="435" text-anchor="middle" fill="#f1f3f7" font-family="'Cinzel', Georgia, serif" font-weight="700" font-size="12" letter-spacing="3">НАВЕЧНО В СТРОЮ</text>
      </svg>
    `;

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }
};

window.ArchiveService = ArchiveService;
window.HERALDIC_SVGS = HERALDIC_SVGS;