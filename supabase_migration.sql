-- ============================================================================
-- МЕМОРИАЛЬНО-ОБРАЗОВАТЕЛЬНЫЙ КОМПЛЕКС ГБПОУ СРМК «БЫТЬ ВОИНОМ — ЖИТЬ ВЕЧНО»
-- SUPABASE MASTER DATABASE MIGRATION SCRIPT (v6.0 Enterprise Shield Edition)
-- ============================================================================
-- НАЗНАЧЕНИЕ:
-- Полная настройка таблиц, политик безопасности RLS и многоуровневой системы
-- защиты от накрутки, ботов, спама и манипуляций со статистикой мемориала.
-- 
-- ИНСТРУКЦИЯ ПО ПРИМЕНЕНИЮ:
-- 1. Перейдите в Supabase Dashboard вашего проекта: https://supabase.com/dashboard
-- 2. В боковом меню откройте раздел "SQL Editor" -> "New query".
-- 3. Скопируйте и вставьте этот скрипт целиком, затем нажмите кнопку "Run".
-- 4. Скрипт идемпотентен: его можно запускать повторно без риска потери данных.
-- ============================================================================

-- 1. Расширение UUID для уникальных идентификаторов
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- РАЗДЕЛ 1: ОСНОВНЫЕ ТАБЛИЦЫ ДАННЫХ
-- ============================================================================

-- 1.1. База героев колледжа
CREATE TABLE IF NOT EXISTS heroes_database (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  plaque TEXT CHECK (plaque IN ('left', 'right', 'general')),
  spec_tag TEXT,
  dates JSONB DEFAULT '{"birth": "", "death": ""}',
  education JSONB DEFAULT '{"school": "", "college": ""}',
  military JSONB DEFAULT '{"service": "", "rank": ""}',
  awards TEXT[] DEFAULT '{}',
  deed TEXT,
  quote TEXT,
  media JSONB DEFAULT '{"photo": "", "audio": ""}',
  map_coords JSONB DEFAULT '{"lat": 0, "lng": 0}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_heroes_name ON heroes_database USING gin (to_tsvector('russian', name));

-- 1.2. Счетчики Памяти (Свечи и Цветы)
CREATE TABLE IF NOT EXISTS memorial_counters (
  hero_id TEXT PRIMARY KEY,
  candles INTEGER NOT NULL DEFAULT 0 CHECK (candles >= 0),
  flowers INTEGER NOT NULL DEFAULT 0 CHECK (flowers >= 0),
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.3. Цифровая Стена Памяти и послания
CREATE TABLE IF NOT EXISTS guestbook_tributes (
  id TEXT PRIMARY KEY,
  author TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'guest',
  role_label TEXT,
  dedication_id TEXT NOT NULL DEFAULT 'general',
  dedication_name TEXT,
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 1 AND 2500),
  theme TEXT NOT NULL DEFAULT 'theme-parchment',
  date TEXT,
  flames INTEGER NOT NULL DEFAULT 0 CHECK (flames >= 0),
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tributes_feed ON guestbook_tributes(is_pinned DESC, created_at DESC);

-- 1.4. Результаты Исторического Квеста (Зал Славы)
CREATE TABLE IF NOT EXISTS quiz_results (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_name TEXT NOT NULL,
  group_name TEXT,
  score INTEGER NOT NULL CHECK (score >= 0),
  total_questions INTEGER NOT NULL CHECK (total_questions > 0),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_score ON quiz_results(score DESC, completed_at ASC);

-- 1.5. Реестр выданных сертификатов
CREATE TABLE IF NOT EXISTS certificates_registry (
  serial TEXT PRIMARY KEY,
  certificate_id TEXT,
  student_name TEXT NOT NULL,
  group_name TEXT,
  specialty TEXT,
  nomination TEXT,
  issue_date TEXT NOT NULL,
  crypto_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cert_recipient ON certificates_registry(student_name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_certificates_serial ON certificates_registry(serial);

-- 1.6. Кэш геральдических знаков
CREATE TABLE IF NOT EXISTS heraldry_cache (
  file_name TEXT PRIMARY KEY,
  image_url TEXT NOT NULL,
  width INTEGER,
  cached_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- РАЗДЕЛ 2: ТАБЛИЦЫ ЗАЩИТЫ ОТ НАКРУТКИ И СПАМА (ANTI-ABUSE SHIELD)
-- ============================================================================

-- 2.1. Журнал аудита действий (свечи, цветы, квиз, сообщения)
CREATE TABLE IF NOT EXISTS anti_abuse_actions_log (
  id BIGSERIAL PRIMARY KEY,
  action_type TEXT NOT NULL, -- 'candle', 'flower', 'quiz_submit', 'tribute_create'
  target_id TEXT,            -- ID героя, ID квеста, etc.
  fingerprint TEXT NOT NULL, -- Аппаратный хэш устройства
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anti_abuse_lookup 
  ON anti_abuse_actions_log (fingerprint, action_type, target_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_anti_abuse_throttle 
  ON anti_abuse_actions_log (fingerprint, created_at DESC);

-- 2.2. Реестр голосов за лампады Стены Памяти (1 голос на 1 устройство)
-- Исключает бесконечную накрутку «лайков» / зажжений лампад
CREATE TABLE IF NOT EXISTS tribute_flames_votes (
  tribute_id TEXT NOT NULL,
  fingerprint TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tribute_id, fingerprint)
);

CREATE INDEX IF NOT EXISTS idx_flames_votes_tribute ON tribute_flames_votes(tribute_id);

-- ============================================================================
-- РАЗДЕЛ 3: БЕЗОПАСНОСТЬ (ROW LEVEL SECURITY - RLS)
-- ============================================================================

-- Включаем RLS для всех таблиц
ALTER TABLE heroes_database ENABLE ROW LEVEL SECURITY;
ALTER TABLE memorial_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE guestbook_tributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE heraldry_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE anti_abuse_actions_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE tribute_flames_votes ENABLE ROW LEVEL SECURITY;

-- 3.1. База героев: просмотр всем, изменение только администраторам
DROP POLICY IF EXISTS "Public read heroes" ON heroes_database;
DROP POLICY IF EXISTS "Admin write heroes" ON heroes_database;
CREATE POLICY "Public read heroes" ON heroes_database FOR SELECT USING (true);
CREATE POLICY "Admin write heroes" ON heroes_database FOR ALL USING (auth.role() = 'authenticated');

-- 3.2. Счетчики мемориала: 
-- КРИТИЧЕСКИ ВАЖНО ДЛЯ ЗАЩИТЫ ОТ НАКРУТКИ:
-- Публичный UPDATE и INSERT напрямую отключены! 
-- Изменение счетчиков возможно ТОЛЬКО через защищенные RPC-функции с проверкой кулдаунов.
DROP POLICY IF EXISTS "Public read counters" ON memorial_counters;
DROP POLICY IF EXISTS "Public update counters" ON memorial_counters;
DROP POLICY IF EXISTS "Public insert counters" ON memorial_counters;
DROP POLICY IF EXISTS "Admin full counters" ON memorial_counters;
CREATE POLICY "Public read counters" ON memorial_counters FOR SELECT USING (true);
CREATE POLICY "Admin full counters" ON memorial_counters FOR ALL USING (auth.role() = 'authenticated');

-- 3.3. Стена Памяти:
-- Публичный INSERT разрешен только для валидных сообщений (без права самовольного закрепления или верификации)
-- Публичный UPDATE отключен (лампады переключаются исключительно через RPC toggle_tribute_flame)
DROP POLICY IF EXISTS "Public read tributes" ON guestbook_tributes;
DROP POLICY IF EXISTS "Public create tributes" ON guestbook_tributes;
DROP POLICY IF EXISTS "Public update tributes" ON guestbook_tributes;
DROP POLICY IF EXISTS "Admin manage tributes" ON guestbook_tributes;
CREATE POLICY "Public read tributes" ON guestbook_tributes FOR SELECT USING (true);
CREATE POLICY "Public create tributes" ON guestbook_tributes FOR INSERT WITH CHECK (
  is_pinned = false AND
  is_verified = false AND
  flames <= 1 AND
  char_length(author) BETWEEN 2 AND 100 AND
  char_length(message) BETWEEN 3 AND 2000
);
CREATE POLICY "Admin manage tributes" ON guestbook_tributes FOR ALL USING (auth.role() = 'authenticated');

-- 3.4. Результаты квиза:
-- Защита от фальшивых рекордов: score не может превышать total_questions
DROP POLICY IF EXISTS "Public read quiz" ON quiz_results;
DROP POLICY IF EXISTS "Public create quiz" ON quiz_results;
DROP POLICY IF EXISTS "Admin manage quiz" ON quiz_results;
CREATE POLICY "Public read quiz" ON quiz_results FOR SELECT USING (true);
CREATE POLICY "Public create quiz" ON quiz_results FOR INSERT WITH CHECK (
  score >= 0 AND 
  score <= total_questions AND 
  total_questions BETWEEN 5 AND 50 AND
  char_length(student_name) BETWEEN 2 AND 100
);
CREATE POLICY "Admin manage quiz" ON quiz_results FOR ALL USING (auth.role() = 'authenticated');

-- 3.5. Реестр сертификатов:
DROP POLICY IF EXISTS "Public read certs" ON certificates_registry;
DROP POLICY IF EXISTS "Public create certs" ON certificates_registry;
DROP POLICY IF EXISTS "Admin write certs" ON certificates_registry;
CREATE POLICY "Public read certs" ON certificates_registry FOR SELECT USING (true);
CREATE POLICY "Public create certs" ON certificates_registry FOR INSERT WITH CHECK (
  char_length(student_name) BETWEEN 2 AND 100 AND
  char_length(serial) BETWEEN 5 AND 50
);
CREATE POLICY "Admin write certs" ON certificates_registry FOR ALL USING (auth.role() = 'authenticated');

-- 3.6. Геральдика и системные логи
DROP POLICY IF EXISTS "Public access cache" ON heraldry_cache;
CREATE POLICY "Public access cache" ON heraldry_cache FOR ALL USING (true);

DROP POLICY IF EXISTS "Admin manage anti abuse logs" ON anti_abuse_actions_log;
CREATE POLICY "Admin manage anti abuse logs" ON anti_abuse_actions_log FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin manage flame votes" ON tribute_flames_votes;
CREATE POLICY "Admin manage flame votes" ON tribute_flames_votes FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================================
-- РАЗДЕЛ 4: ЗАЩИЩЕННЫЕ RPC-ФУНКЦИИ С КОНТРОЛЕМ НАКРУТКИ
-- ============================================================================

-- 4.1. Безопасное зажжение Свечи Памяти с суточным кулдауном и защитой от флуда
CREATE OR REPLACE FUNCTION increment_hero_candle(
  target_hero_id TEXT, 
  client_fingerprint TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count INTEGER;
  cooldown_exists BOOLEAN := FALSE;
  recent_requests_count INTEGER := 0;
BEGIN
  -- Защита от спам-атак по фингерпринту
  IF client_fingerprint IS NOT NULL AND client_fingerprint <> '' THEN
    -- 1. Троттлинг: не более 15 запросов в минуту с одного устройства
    SELECT COUNT(*) INTO recent_requests_count
    FROM anti_abuse_actions_log
    WHERE fingerprint = client_fingerprint 
      AND created_at > NOW() - INTERVAL '1 minute';
      
    IF recent_requests_count >= 15 THEN
      SELECT candles INTO new_count FROM memorial_counters WHERE hero_id = target_hero_id;
      RETURN COALESCE(new_count, 0);
    END IF;

    -- 2. Суточный/12-часовой кулдаун: одна свеча одному герою раз в 12 часов
    SELECT EXISTS(
      SELECT 1 FROM anti_abuse_actions_log
      WHERE action_type = 'candle'
        AND target_id = target_hero_id
        AND fingerprint = client_fingerprint
        AND created_at > NOW() - INTERVAL '12 hours'
    ) INTO cooldown_exists;

    IF cooldown_exists THEN
      -- Действие уже совершено: возвращаем текущее значение без накрутки
      SELECT candles INTO new_count FROM memorial_counters WHERE hero_id = target_hero_id;
      RETURN COALESCE(new_count, 0);
    END IF;
  END IF;

  -- 3. Атомарное обновление с фиксацией времени
  INSERT INTO memorial_counters (hero_id, candles, flowers, last_updated)
  VALUES (target_hero_id, 1, 0, NOW())
  ON CONFLICT (hero_id) DO UPDATE 
    SET candles = memorial_counters.candles + 1,
        last_updated = NOW()
  RETURNING candles INTO new_count;

  -- 4. Запись в лог защиты от накрутки
  IF client_fingerprint IS NOT NULL AND client_fingerprint <> '' THEN
    INSERT INTO anti_abuse_actions_log (action_type, target_id, fingerprint, created_at)
    VALUES ('candle', target_hero_id, client_fingerprint, NOW());
  END IF;

  RETURN new_count;
END;
$$;

-- 4.2. Безопасное возложение цветов с защитой от накрутки
CREATE OR REPLACE FUNCTION increment_hero_flower(
  target_hero_id TEXT, 
  qty INTEGER DEFAULT 2, 
  client_fingerprint TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count INTEGER;
  cooldown_exists BOOLEAN := FALSE;
  validated_qty INTEGER := 2;
BEGIN
  -- Защита от передачи аномального числа цветов (строго 1 или 2 цветка)
  IF qty IS NOT NULL AND qty = 1 THEN
    validated_qty := 1;
  ELSE
    validated_qty := 2;
  END IF;

  IF client_fingerprint IS NOT NULL AND client_fingerprint <> '' THEN
    SELECT EXISTS(
      SELECT 1 FROM anti_abuse_actions_log
      WHERE action_type = 'flower'
        AND target_id = target_hero_id
        AND fingerprint = client_fingerprint
        AND created_at > NOW() - INTERVAL '12 hours'
    ) INTO cooldown_exists;

    IF cooldown_exists THEN
      SELECT flowers INTO new_count FROM memorial_counters WHERE hero_id = target_hero_id;
      RETURN COALESCE(new_count, 0);
    END IF;
  END IF;

  INSERT INTO memorial_counters (hero_id, candles, flowers, last_updated)
  VALUES (target_hero_id, 0, validated_qty, NOW())
  ON CONFLICT (hero_id) DO UPDATE 
    SET flowers = memorial_counters.flowers + validated_qty,
        last_updated = NOW()
  RETURNING flowers INTO new_count;

  IF client_fingerprint IS NOT NULL AND client_fingerprint <> '' THEN
    INSERT INTO anti_abuse_actions_log (action_type, target_id, fingerprint, created_at)
    VALUES ('flower', target_hero_id, client_fingerprint, NOW());
  END IF;

  RETURN new_count;
END;
$$;

-- 4.3. Безопасное переключение лампады на Стене Памяти (1 устройство = максимум 1 голос)
CREATE OR REPLACE FUNCTION toggle_tribute_flame(
  target_tribute_id TEXT, 
  delta INTEGER, 
  client_fingerprint TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count INTEGER;
  already_voted BOOLEAN := FALSE;
BEGIN
  IF delta NOT IN (-1, 1) THEN
    RAISE EXCEPTION 'delta must be -1 or 1';
  END IF;

  IF client_fingerprint IS NOT NULL AND client_fingerprint <> '' THEN
    SELECT EXISTS(
      SELECT 1 FROM tribute_flames_votes
      WHERE tribute_id = target_tribute_id AND fingerprint = client_fingerprint
    ) INTO already_voted;

    IF delta = 1 THEN
      IF already_voted THEN
        -- Повторный голос исключен: возвращаем текущее количество без накрутки
        SELECT flames INTO new_count FROM guestbook_tributes WHERE id = target_tribute_id;
        RETURN COALESCE(new_count, 0);
      ELSE
        INSERT INTO tribute_flames_votes (tribute_id, fingerprint, created_at)
        VALUES (target_tribute_id, client_fingerprint, NOW())
        ON CONFLICT (tribute_id, fingerprint) DO NOTHING;
      END IF;
    ELSIF delta = -1 THEN
      IF already_voted THEN
        DELETE FROM tribute_flames_votes
        WHERE tribute_id = target_tribute_id AND fingerprint = client_fingerprint;
      ELSE
        -- Пользователь не голосовал за эту лампаду: уменьшать нельзя
        SELECT flames INTO new_count FROM guestbook_tributes WHERE id = target_tribute_id;
        RETURN COALESCE(new_count, 0);
      END IF;
    END IF;
  END IF;

  UPDATE guestbook_tributes
  SET flames = GREATEST(0, flames + delta)
  WHERE id = target_tribute_id
  RETURNING flames INTO new_count;

  RETURN new_count;
END;
$$;

-- 4.4. Защищенная публикация результатов квиза (проверка времени прохождения и лимитов)
CREATE OR REPLACE FUNCTION submit_quiz_result(
  p_student_name TEXT,
  p_group_name TEXT,
  p_score INTEGER,
  p_total_questions INTEGER,
  p_duration_seconds INTEGER DEFAULT 0,
  client_fingerprint TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sanitized_name TEXT;
  sanitized_group TEXT;
  recent_submissions INTEGER := 0;
  new_id UUID;
BEGIN
  sanitized_name := trim(p_student_name);
  sanitized_group := trim(p_group_name);

  -- Валидация входных данных
  IF char_length(sanitized_name) < 2 OR char_length(sanitized_name) > 100 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Некорректное имя участника');
  END IF;

  IF p_total_questions < 5 OR p_total_questions > 50 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Недопустимое количество вопросов');
  END IF;

  IF p_score < 0 OR p_score > p_total_questions THEN
    RETURN jsonb_build_object('success', false, 'error', 'Балл превышает число вопросов');
  END IF;

  -- Детекция бот-спидрана (невозможно ответить на 10 вопросов быстрее чем за 6 секунд)
  IF p_total_questions >= 10 AND p_duration_seconds > 0 AND p_duration_seconds < 6 AND p_score >= 8 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Аномально высокая скорость прохождения');
  END IF;

  -- Лимит отправки с одного устройства (максимум 5 попыток за 15 минут)
  IF client_fingerprint IS NOT NULL AND client_fingerprint <> '' THEN
    SELECT COUNT(*) INTO recent_submissions
    FROM anti_abuse_actions_log
    WHERE action_type = 'quiz_submit'
      AND fingerprint = client_fingerprint
      AND created_at > NOW() - INTERVAL '15 minutes';

    IF recent_submissions >= 5 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Превышен лимит попыток. Подождите 15 минут.');
    END IF;

    INSERT INTO anti_abuse_actions_log (action_type, target_id, fingerprint, created_at)
    VALUES ('quiz_submit', p_score::TEXT || '/' || p_total_questions::TEXT, client_fingerprint, NOW());
  END IF;

  INSERT INTO quiz_results (student_name, group_name, score, total_questions, completed_at)
  VALUES (sanitized_name, sanitized_group, p_score, p_total_questions, NOW())
  RETURNING id INTO new_id;

  RETURN jsonb_build_object('success', true, 'id', new_id);
END;
$$;

-- 4.5. Устаревшие безопасные обёртки для обратной совместимости
CREATE OR REPLACE FUNCTION increment_candle(p_hero_id TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN increment_hero_candle(p_hero_id, NULL);
END;
$$;

CREATE OR REPLACE FUNCTION increment_flower(p_hero_id TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN increment_hero_flower(p_hero_id, 2, NULL);
END;
$$;

-- 4.6. Автоматическая очистка старых аудит-логов (храним 45 дней для экономии места)
CREATE OR REPLACE FUNCTION cleanup_anti_abuse_logs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_rows INTEGER;
BEGIN
  DELETE FROM anti_abuse_actions_log
  WHERE created_at < NOW() - INTERVAL '45 days';
  GET DIAGNOSTICS deleted_rows = ROW_COUNT;
  RETURN deleted_rows;
END;
$$;

-- Выдача прав на выполнение RPC для анонимных и авторизованных пользователей
GRANT EXECUTE ON FUNCTION increment_hero_candle(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_hero_flower(TEXT, INTEGER, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION toggle_tribute_flame(TEXT, INTEGER, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION submit_quiz_result(TEXT, TEXT, INTEGER, INTEGER, INTEGER, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_candle(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_flower(TEXT) TO anon, authenticated;

-- ============================================================================
-- РАЗДЕЛ 5: REALTIME-ВЕЩАНИЕ (WebSockets)
-- ============================================================================
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

-- ============================================================================
-- СИСТЕМА ЗАЩИТЫ ОТ НАКРУТКИ И СПАМА УСПЕШНО НАСТРОЕНА!
-- ============================================================================
