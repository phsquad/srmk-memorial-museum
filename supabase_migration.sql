-- ============================================================
-- SRMK Memorial Complex: Supabase Database Migration Script
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
  id TEXT PRIMARY KEY, -- ID героя (например, 'hero_001')
  name TEXT NOT NULL,  -- ФИО
  plaque TEXT CHECK (plaque IN ('left', 'right', 'general')), -- Расположение на стене
  spec_tag TEXT,       -- Специальность (например, 'Авиамеханик')
  
  -- JSONB поля для гибкой структуры данных
  dates JSONB DEFAULT '{"birth": "", "death": ""}',
  education JSONB DEFAULT '{"school": "", "college": ""}',
  military JSONB DEFAULT '{"service": "", "rank": ""}',
  awards TEXT[] DEFAULT '{}', -- Массив наград
  deed TEXT,           -- Подвиг
  quote TEXT,          -- Цитата
  
  -- Медиа и геолокация
  media JSONB DEFAULT '{"photo": "", "audio": ""}',
  map_coords JSONB DEFAULT '{"lat": 0, "lng": 0}',
  
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
-- ТАБЛИЦА 3: guestbook_tributes (Стена Памяти)
-- Сообщения от посетителей
-- ============================================================
CREATE TABLE IF NOT EXISTS guestbook_tributes (
  id TEXT PRIMARY KEY,
  author TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'guest',
  role_label TEXT,
  dedication_id TEXT NOT NULL DEFAULT 'general',
  dedication_name TEXT,
  message TEXT NOT NULL,
  theme TEXT NOT NULL DEFAULT 'theme-parchment',
  date TEXT,
  flames INTEGER NOT NULL DEFAULT 0 CHECK (flames >= 0),
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tributes_feed ON guestbook_tributes(is_pinned DESC, created_at DESC);

-- ============================================================
-- ТАБЛИЦА 4: quiz_results (Результаты викторины)
-- Лидерборд
-- ============================================================
CREATE TABLE IF NOT EXISTS quiz_results (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_name TEXT NOT NULL,
  group_name TEXT,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_score ON quiz_results(score DESC);

-- ============================================================
-- ТАБЛИЦА 5: certificates_registry (Реестр сертификатов)
-- Валидация выданных сертификатов
-- ============================================================
CREATE TABLE IF NOT EXISTS certificates_registry (
  serial TEXT PRIMARY KEY,
  student_name TEXT NOT NULL,
  group_name TEXT,
  specialty TEXT,
  nomination TEXT,
  issue_date TEXT NOT NULL,
  crypto_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cert_recipient ON certificates_registry(student_name);

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
ALTER TABLE guestbook_tributes ENABLE ROW LEVEL SECURITY;
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
CREATE POLICY "Public read guestbook" ON guestbook_tributes FOR SELECT USING (true);
CREATE POLICY "Public create guestbook" ON guestbook_tributes FOR INSERT WITH CHECK (true);
-- Удаление/редактирование только админам
CREATE POLICY "Admin manage guestbook" ON guestbook_tributes FOR ALL USING (auth.role() = 'authenticated');

-- 4. Quiz: Чтение всем (лидерборд), Создание всем
CREATE POLICY "Public read quiz" ON quiz_results FOR SELECT USING (true);
CREATE POLICY "Public create quiz" ON quiz_results FOR INSERT WITH CHECK (true);

-- 5. Certificates: Чтение и создание всем (генератор и проверка)
CREATE POLICY "Public read certs" ON certificates_registry FOR SELECT USING (true);
CREATE POLICY "Public create certs" ON certificates_registry FOR INSERT WITH CHECK (true);
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

-- ============================================================
-- СИНХРОНИЗАЦИОННЫЙ КОНТРАКТ ФРОНТЕНДА (v4)
-- Применяется тем же запуском; также безопасен для уже созданной базы.
-- ============================================================

-- Счётчики не зависят от облачной копии heroes_database: реестр героев
-- хранится в js/data.js и может обновляться независимо от Supabase.
ALTER TABLE memorial_counters DROP CONSTRAINT IF EXISTS memorial_counters_hero_id_fkey;

-- Исправление ошибочного триггера: у memorial_counters есть last_updated,
-- а не updated_at.
CREATE OR REPLACE FUNCTION update_counter_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS counters_updated_at ON memorial_counters;
CREATE TRIGGER counters_updated_at
  BEFORE UPDATE ON memorial_counters
  FOR EACH ROW
  EXECUTE FUNCTION update_counter_timestamp();

-- Стена Памяти: имена полей соответствуют GuestbookEngine и CloudSync.
CREATE TABLE IF NOT EXISTS guestbook_tributes (
  id TEXT PRIMARY KEY,
  author TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'guest',
  role_label TEXT,
  dedication_id TEXT NOT NULL DEFAULT 'general',
  dedication_name TEXT,
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 1 AND 2000),
  theme TEXT NOT NULL DEFAULT 'theme-parchment',
  date TEXT,
  flames INTEGER NOT NULL DEFAULT 0 CHECK (flames >= 0),
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tributes_feed
  ON guestbook_tributes (is_pinned DESC, created_at DESC);

-- Викторина использует одну таблицу и из встроенного сценария, и из js/quiz.js.
ALTER TABLE quiz_results ADD COLUMN IF NOT EXISTS group_name TEXT;
ALTER TABLE quiz_results ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Приводим старый реестр сертификатов к полям генератора и страницы проверки.
ALTER TABLE certificates_registry ADD COLUMN IF NOT EXISTS certificate_id TEXT;
ALTER TABLE certificates_registry ADD COLUMN IF NOT EXISTS serial TEXT;
ALTER TABLE certificates_registry ADD COLUMN IF NOT EXISTS student_name TEXT;
ALTER TABLE certificates_registry ADD COLUMN IF NOT EXISTS group_name TEXT;
ALTER TABLE certificates_registry ADD COLUMN IF NOT EXISTS specialty TEXT;
ALTER TABLE certificates_registry ADD COLUMN IF NOT EXISTS nomination TEXT;
ALTER TABLE certificates_registry ADD COLUMN IF NOT EXISTS issue_date TEXT;
ALTER TABLE certificates_registry ADD COLUMN IF NOT EXISTS crypto_hash TEXT;
DO $$
BEGIN
  -- В старой схеме certificate_id был первичным ключом. Переносим его в
  -- serial и освобождаем колонку только при обновлении такой базы.
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'certificates_registry'
      AND column_name = 'certificate_id' AND is_nullable = 'NO'
  ) THEN
    UPDATE certificates_registry
    SET serial = certificate_id
    WHERE serial IS NULL AND certificate_id IS NOT NULL;
    ALTER TABLE certificates_registry DROP CONSTRAINT IF EXISTS certificates_registry_pkey;
    ALTER TABLE certificates_registry ALTER COLUMN certificate_id DROP NOT NULL;
  END IF;
END;
$$;
CREATE UNIQUE INDEX IF NOT EXISTS idx_certificates_serial
  ON certificates_registry (serial) WHERE serial IS NOT NULL;

-- RLS: посетители читают данные, а записи создаются только через разрешённые
-- сценарии интерфейса. Модерация и изменение остаются для authenticated.
ALTER TABLE guestbook_tributes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read tributes" ON guestbook_tributes;
DROP POLICY IF EXISTS "Public create tributes" ON guestbook_tributes;
DROP POLICY IF EXISTS "Admin manage tributes" ON guestbook_tributes;
CREATE POLICY "Public read tributes" ON guestbook_tributes FOR SELECT USING (true);
CREATE POLICY "Public create tributes" ON guestbook_tributes FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin manage tributes" ON guestbook_tributes FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Public update counters" ON memorial_counters;
DROP POLICY IF EXISTS "Public create certs" ON certificates_registry;
CREATE POLICY "Public create certs" ON certificates_registry FOR INSERT WITH CHECK (true);

-- Атомарные операции вместо клиентских UPDATE исключают потери данных при
-- одновременных действиях нескольких посетителей.
CREATE OR REPLACE FUNCTION increment_hero_candle(target_hero_id TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE new_count INTEGER;
BEGIN
  INSERT INTO memorial_counters (hero_id, candles, flowers)
  VALUES (target_hero_id, 1, 0)
  ON CONFLICT (hero_id) DO UPDATE SET candles = memorial_counters.candles + 1
  RETURNING candles INTO new_count;
  RETURN new_count;
END;
$$;

CREATE OR REPLACE FUNCTION increment_hero_flower(target_hero_id TEXT, qty INTEGER DEFAULT 1)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE new_count INTEGER;
BEGIN
  IF qty IS NULL OR qty < 1 OR qty > 10 THEN
    RAISE EXCEPTION 'qty must be between 1 and 10';
  END IF;
  INSERT INTO memorial_counters (hero_id, candles, flowers)
  VALUES (target_hero_id, 0, qty)
  ON CONFLICT (hero_id) DO UPDATE SET flowers = memorial_counters.flowers + qty
  RETURNING flowers INTO new_count;
  RETURN new_count;
END;
$$;

CREATE OR REPLACE FUNCTION toggle_tribute_flame(target_tribute_id TEXT, delta INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE new_count INTEGER;
BEGIN
  IF delta NOT IN (-1, 1) THEN
    RAISE EXCEPTION 'delta must be -1 or 1';
  END IF;
  UPDATE guestbook_tributes
  SET flames = GREATEST(0, flames + delta)
  WHERE id = target_tribute_id
  RETURNING flames INTO new_count;
  RETURN new_count;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_hero_candle(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_hero_flower(TEXT, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION toggle_tribute_flame(TEXT, INTEGER) TO anon, authenticated;

-- Realtime нужен для мгновенного обновления стены и счётчиков.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'memorial_counters'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE memorial_counters;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'guestbook_tributes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE guestbook_tributes;
  END IF;
END;
$$;
