-- ============================================================
-- SRMK Memorial Complex: Supabase Database Migration Script v2.0
-- Полная синхронизация с облаком для GitHub Pages
-- ============================================================
-- Инструкция:
-- 1. Зайдите в Dashboard вашего проекта Supabase.
-- 2. Перейдите в раздел "SQL Editor".
-- 3. Скопируйте этот код целиком и нажмите "Run".
-- ============================================================

-- 1. Включаем расширение UUID (если еще не включено)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ТАБЛИЦА 1: heroes_database (База героев)
-- Основной источник истины о персоналиях
-- ============================================================
CREATE TABLE IF NOT EXISTS heroes_database (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  plaque TEXT CHECK (plaque IN ('left', 'right', 'general', 'none')),
  spec_tag TEXT,
  dates JSONB DEFAULT '{"birth": "", "death": ""}',
  education JSONB DEFAULT '{"school": "", "college": ""}',
  military JSONB DEFAULT '{"service": "", "rank": ""}',
  awards TEXT[] DEFAULT '{}',
  deed TEXT,
  quote TEXT,
  media JSONB DEFAULT '{"photo": "", "audioGuide": "", "documents": []}',
  map_coords JSONB DEFAULT '{"lat": 45.0448, "lng": 41.9691, "locationName": "г. Ставрополь"}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индекс для быстрого поиска по имени
CREATE INDEX IF NOT EXISTS idx_heroes_name ON heroes_database USING gin (to_tsvector('russian', name));

-- ============================================================
-- ТАБЛИЦА 2: memorial_counters (Свечи и Цветы)
-- Счетчики памятных действий
-- ============================================================
CREATE TABLE IF NOT EXISTS memorial_counters (
  hero_id TEXT PRIMARY KEY REFERENCES heroes_database(id) ON DELETE CASCADE,
  candles INTEGER DEFAULT 0,
  flowers INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ТАБЛИЦА 3: guestbook_entries (Гостевая книга)
-- Сообщения от посетителей
-- ============================================================
CREATE TABLE IF NOT EXISTS guestbook_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  author_name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_verified BOOLEAN DEFAULT FALSE, -- Модерация (опционально)
  ip_hash TEXT -- Хеш IP для защиты от спама (не храним сам IP)
);

CREATE INDEX IF NOT EXISTS idx_guestbook_date ON guestbook_entries(created_at DESC);

-- ============================================================
-- ТАБЛИЦА 4: quiz_results (Результаты викторины)
-- Лидерборд
-- ============================================================
CREATE TABLE IF NOT EXISTS quiz_results (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_name TEXT NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_score ON quiz_results(score DESC);

-- ============================================================
-- ТАБЛИЦА 5: certificates_registry (Реестр сертификатов)
-- Валидация выданных сертификатов
-- ============================================================
CREATE TABLE IF NOT EXISTS certificates_registry (
  certificate_id TEXT PRIMARY KEY, -- Уникальный номер сертификата
  recipient_name TEXT NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  course_name TEXT,
  is_valid BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_cert_recipient ON certificates_registry(recipient_name);

-- ============================================================
-- ТАБЛИЦА 6: heraldry_cache (Кэш геральдики)
-- Кэширование ссылок на изображения гербов (Wikimedia)
-- ============================================================
CREATE TABLE IF NOT EXISTS heraldry_cache (
  file_name TEXT PRIMARY KEY,
  image_url TEXT NOT NULL,
  width INTEGER,
  cached_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- БЕЗОПАСНОСТЬ (Row Level Security - RLS)
-- ============================================================

-- Включаем RLS для всех таблиц
ALTER TABLE heroes_database ENABLE ROW LEVEL SECURITY;
ALTER TABLE memorial_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE guestbook_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE heraldry_cache ENABLE ROW LEVEL SECURITY;

-- ПОЛИТИКИ ДОСТУПА:

-- 1. Heroes: Чтение всем, Запись только авторизованным (админам)
CREATE POLICY "Public read access" ON heroes_database FOR SELECT USING (true);
CREATE POLICY "Admin write access" ON heroes_database FOR ALL USING (auth.role() = 'authenticated');

-- 2. Counters: Чтение всем, Инкремент всем (для свечей), Полная запись админам
CREATE POLICY "Public read counters" ON memorial_counters FOR SELECT USING (true);
-- Разрешаем обновлять счетчики любому пользователю (для анонимных возложений)
CREATE POLICY "Public update counters" ON memorial_counters FOR UPDATE USING (true); 
CREATE POLICY "Admin full counters" ON memorial_counters FOR ALL USING (auth.role() = 'authenticated');

-- 3. Guestbook: Чтение всем, Создание всем (можно добавить модерацию)
CREATE POLICY "Public read guestbook" ON guestbook_entries FOR SELECT USING (true);
CREATE POLICY "Public create guestbook" ON guestbook_entries FOR INSERT WITH CHECK (true);
-- Удаление/редактирование только админам
CREATE POLICY "Admin manage guestbook" ON guestbook_entries FOR ALL USING (auth.role() = 'authenticated');

-- 4. Quiz: Чтение всем (лидерборд), Создание всем
CREATE POLICY "Public read quiz" ON quiz_results FOR SELECT USING (true);
CREATE POLICY "Public create quiz" ON quiz_results FOR INSERT WITH CHECK (true);

-- 5. Certificates: Чтение всем (проверка), Запись админам
CREATE POLICY "Public read certs" ON certificates_registry FOR SELECT USING (true);
CREATE POLICY "Admin write certs" ON certificates_registry FOR ALL USING (auth.role() = 'authenticated');

-- 6. Heraldry Cache: Чтение/Запись всем (техническая таблица)
CREATE POLICY "Public access cache" ON heraldry_cache FOR ALL USING (true);

-- ============================================================
-- ТРИГГЕРЫ (Автоматическое обновление updated_at)
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Применяем триггер к таблице героев
DROP TRIGGER IF EXISTS heroes_updated_at ON heroes_database;
CREATE TRIGGER heroes_updated_at
  BEFORE UPDATE ON heroes_database
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Триггер для обновления времени в счетчиках при изменении
DROP TRIGGER IF EXISTS counters_updated_at ON memorial_counters;
CREATE TRIGGER counters_updated_at
  BEFORE UPDATE ON memorial_counters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- НАЧАЛЬНЫЕ ДАННЫЕ (Seed Data)
-- Заполняем таблицу счетчиков для всех существующих героев
-- Если герои еще не добавлены, этот шаг можно пропустить или запустить позже
-- ============================================================

-- Пример: Инициализация счетчиков (если таблица героев уже заполнена)
-- INSERT INTO memorial_counters (hero_id, candles, flowers)
-- SELECT id, 0, 0 FROM heroes_database
-- ON CONFLICT (hero_id) DO NOTHING;

-- ============================================================
-- RPC ФУНКЦИИ (Server-side logic)
-- ============================================================

-- Функция безопасного инкремента свечи (защита от race conditions)
CREATE OR REPLACE FUNCTION increment_candle(p_hero_id TEXT)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE memorial_counters
  SET candles = candles + 1, last_updated = NOW()
  WHERE hero_id = p_hero_id
  RETURNING candles INTO new_count;
  
  IF new_count IS NULL THEN
    -- Если записи нет, создаем её
    INSERT INTO memorial_counters (hero_id, candles, flowers)
    VALUES (p_hero_id, 1, 0)
    RETURNING candles INTO new_count;
  END IF;
  
  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция безопасного инкремента цветка
CREATE OR REPLACE FUNCTION increment_flower(p_hero_id TEXT)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE memorial_counters
  SET flowers = flowers + 1, last_updated = NOW()
  WHERE hero_id = p_hero_id
  RETURNING flowers INTO new_count;
  
  IF new_count IS NULL THEN
    INSERT INTO memorial_counters (hero_id, candles, flowers)
    VALUES (p_hero_id, 0, 1)
    RETURNING flowers INTO new_count;
  END IF;
  
  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- ГОТОВО!
-- ============================================================
