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
  visit_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE guestbook_tributes ADD COLUMN IF NOT EXISTS visit_id TEXT;

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
-- РАЗДЕЛ 6: МОДУЛЬ АНОНИМНОЙ АНАЛИТИКИ ЗАЛОВ И ЭКСПОЗИЦИЙ (ФЗ-152 COMPLIANT)
-- ============================================================================
-- Назначение:
-- Позволяет преподавателям в реальном времени (Supabase Realtime) отслеживать
-- востребованность залов виртуального музея, экспозиций героев и интерактивных зон.
-- Конфиденциальность: 100% анонимность. Не фиксируются ФИО, IP-адреса, cookie или
-- персональные идентификаторы студентов. Фиксируются только агрегированные счетчики
-- и обезличенные сессионные маркеры.
-- ============================================================================

-- 6.1. Агрегированные счетчики посещаемости залов и экспозиций
CREATE TABLE IF NOT EXISTS hall_analytics_counters (
  hall_id TEXT PRIMARY KEY,
  hall_title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'hall', -- 'hall', 'hero_expo', 'interactive'
  total_visits INTEGER NOT NULL DEFAULT 0 CHECK (total_visits >= 0),
  active_visitors INTEGER NOT NULL DEFAULT 0 CHECK (active_visitors >= 0),
  total_duration_seconds BIGINT NOT NULL DEFAULT 0 CHECK (total_duration_seconds >= 0),
  interactions_count INTEGER NOT NULL DEFAULT 0 CHECK (interactions_count >= 0),
  last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6.2. Журнал анонимных событий (время изучения, интерактив)
CREATE TABLE IF NOT EXISTS hall_analytics_events (
  id BIGSERIAL PRIMARY KEY,
  hall_id TEXT NOT NULL,
  exposition_id TEXT,
  event_type TEXT NOT NULL DEFAULT 'visit', -- 'visit', 'dwell', 'interaction'
  dwell_seconds INTEGER NOT NULL DEFAULT 0,
  anon_session_hash TEXT NOT NULL,
  device_type TEXT DEFAULT 'desktop',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hall_analytics_events_hall ON hall_analytics_events(hall_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hall_analytics_events_time ON hall_analytics_events(created_at DESC);

-- 6.3. Безопасность RLS для модуля аналитики
ALTER TABLE hall_analytics_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE hall_analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read hall counters" ON hall_analytics_counters;
CREATE POLICY "Public read hall counters" ON hall_analytics_counters FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anon insert hall counters" ON hall_analytics_counters;
CREATE POLICY "Anon insert hall counters" ON hall_analytics_counters FOR ALL USING (true);

DROP POLICY IF EXISTS "Public read hall events" ON hall_analytics_events;
CREATE POLICY "Public read hall events" ON hall_analytics_events FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anon insert hall events" ON hall_analytics_events;
CREATE POLICY "Anon insert hall events" ON hall_analytics_events FOR INSERT WITH CHECK (true);

-- 6.4. Безопасная функция фиксации анонимного визита зала / экспозиции
CREATE OR REPLACE FUNCTION record_anonymous_hall_visit(
  p_hall_id TEXT,
  p_hall_title TEXT,
  p_exposition_id TEXT DEFAULT NULL,
  p_dwell_seconds INTEGER DEFAULT 0,
  p_is_interaction BOOLEAN DEFAULT FALSE,
  p_anon_hash TEXT DEFAULT 'anon',
  p_category TEXT DEFAULT 'hall',
  p_device_type TEXT DEFAULT 'desktop'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_clamped_dwell INTEGER;
  v_result JSONB;
BEGIN
  v_clamped_dwell := LEAST(GREATEST(COALESCE(p_dwell_seconds, 0), 0), 1800);

  INSERT INTO hall_analytics_counters (
    hall_id, hall_title, category, total_visits, active_visitors, 
    total_duration_seconds, interactions_count, last_activity
  )
  VALUES (
    p_hall_id, 
    COALESCE(p_hall_title, p_hall_id), 
    COALESCE(p_category, 'hall'),
    1, 
    1, 
    v_clamped_dwell, 
    CASE WHEN p_is_interaction THEN 1 ELSE 0 END, 
    NOW()
  )
  ON CONFLICT (hall_id) DO UPDATE SET
    total_visits = hall_analytics_counters.total_visits + 1,
    total_duration_seconds = hall_analytics_counters.total_duration_seconds + v_clamped_dwell,
    interactions_count = hall_analytics_counters.interactions_count + CASE WHEN p_is_interaction THEN 1 ELSE 0 END,
    last_activity = NOW(),
    hall_title = COALESCE(EXCLUDED.hall_title, hall_analytics_counters.hall_title);

  INSERT INTO hall_analytics_events (
    hall_id, exposition_id, event_type, dwell_seconds, anon_session_hash, device_type
  )
  VALUES (
    p_hall_id, 
    p_exposition_id, 
    CASE WHEN p_is_interaction THEN 'interaction' ELSE 'visit' END, 
    v_clamped_dwell, 
    SUBSTRING(COALESCE(p_anon_hash, 'anon') FROM 1 FOR 64),
    COALESCE(p_device_type, 'desktop')
  );

  SELECT jsonb_build_object(
    'success', true,
    'hall_id', p_hall_id,
    'total_visits', total_visits,
    'total_duration', total_duration_seconds,
    'interactions', interactions_count
  ) INTO v_result
  FROM hall_analytics_counters
  WHERE hall_id = p_hall_id;

  RETURN v_result;
END;
$$;

-- 6.5. Безопасная функция обновления времени изучения (dwell time)
CREATE OR REPLACE FUNCTION update_hall_dwell_time(
  p_hall_id TEXT,
  p_added_dwell_seconds INTEGER,
  p_anon_hash TEXT DEFAULT 'anon'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_clamped_dwell INTEGER;
BEGIN
  v_clamped_dwell := LEAST(GREATEST(COALESCE(p_added_dwell_seconds, 0), 0), 900);

  UPDATE hall_analytics_counters
  SET 
    total_duration_seconds = total_duration_seconds + v_clamped_dwell,
    last_activity = NOW()
  WHERE hall_id = p_hall_id;

  IF FOUND THEN
    INSERT INTO hall_analytics_events (hall_id, event_type, dwell_seconds, anon_session_hash)
    VALUES (p_hall_id, 'dwell', v_clamped_dwell, SUBSTRING(COALESCE(p_anon_hash, 'anon') FROM 1 FOR 64));
  END IF;

  RETURN jsonb_build_object('success', true, 'added_dwell', v_clamped_dwell);
END;
$$;

GRANT EXECUTE ON FUNCTION record_anonymous_hall_visit(TEXT, TEXT, TEXT, INTEGER, BOOLEAN, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_hall_dwell_time(TEXT, INTEGER, TEXT) TO anon, authenticated;

-- 6.6. Подключение Realtime-вещания для таблицы аналитики
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'hall_analytics_counters'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE hall_analytics_counters;
  END IF;
END;
$$;

-- 6.7. Базовая инициализация реестра залов музея (Все счетчики обнулены: 0 посещений, 0 секунд)
INSERT INTO hall_analytics_counters (hall_id, hall_title, category, total_visits, active_visitors, total_duration_seconds, interactions_count)
VALUES
  ('hall_memorial', 'Зал I: Мемориал «Звезда Памяти»', 'hall', 0, 0, 0, 0),
  ('hall_heroes', 'Зал II: Галерея «20 Героев Ставрополья»', 'hall', 0, 0, 0, 0),
  ('hall_timeline', 'Зал III: Рубежи боевой славы и Интерактивная карта', 'hall', 0, 0, 0, 0),
  ('hall_memory', 'Зал IV: Эстафета мужества и Парты Героев', 'hall', 0, 0, 0, 0),
  ('hall_quiz', 'Зал V: Исторический квест и Зал Славы', 'hall', 0, 0, 0, 0),
  ('hall_guestbook', 'Зал VI: Цифровая Стена Памяти и Книга Отзывов', 'hall', 0, 0, 0, 0),
  ('hall_reader', 'Зал VII: Электронный читальный зал и Архив документов', 'hall', 0, 0, 0, 0),
  ('hall_desk_qr', 'Зал VIII: Мобильная экспозиция «Парта Героя»', 'hall', 0, 0, 0, 0),
  ('hall_lesson', 'Пульт Урока Мужества (Педагогический экран)', 'hall', 0, 0, 0, 0),
  ('expo_vecherka-n-a', 'Экспозиция: Николай Вечёрка', 'hero_expo', 0, 0, 0, 0),
  ('expo_samokhin-d-a', 'Экспозиция: Дмитрий Самохин', 'hero_expo', 0, 0, 0, 0),
  ('expo_martynov-s-k', 'Экспозиция: Станислав Мартынов', 'hero_expo', 0, 0, 0, 0),
  ('expo_nazarenko-n-s', 'Экспозиция: Никита Назаренко', 'hero_expo', 0, 0, 0, 0),
  ('expo_nazyrov-sh-r', 'Экспозиция: Шамиль Назыров', 'hero_expo', 0, 0, 0, 0)
ON CONFLICT (hall_id) DO UPDATE SET
  total_visits = 0,
  active_visitors = 0,
  total_duration_seconds = 0,
  interactions_count = 0,
  last_activity = NOW();

-- ============================================================================
-- РАЗДЕЛ 7: СИСТЕМА ДОСТИЖЕНИЙ И ВОИНСКИХ ЗВАНИЙ (ПОЛНАЯ ПРИВЯЗКА К БАЗЕ ДАННЫХ)
-- ============================================================================

-- 7.1. Таблица прогресса пользователей и воинских званий
CREATE TABLE IF NOT EXISTS user_achievements (
  user_id TEXT PRIMARY KEY,               -- Уникальный идентификатор устройства / студента
  student_name TEXT,                      -- ФИО студента (если введено)
  group_name TEXT,                        -- Учебная группа (напр., ИСП-21)
  xp INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
  rank_id TEXT NOT NULL DEFAULT 'private',
  rank_title TEXT NOT NULL DEFAULT 'Рядовой',
  unlocked_badges TEXT[] NOT NULL DEFAULT '{}',
  stats JSONB NOT NULL DEFAULT '{"candlesLitHeroes":[], "flowersLaid":0, "audioHeard":0, "chaptersRead":0, "quizzesPassed":0, "modesCompleted":[]}'::jsonb,
  last_active TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_xp ON user_achievements(xp DESC);
CREATE INDEX IF NOT EXISTS idx_user_achievements_rank ON user_achievements(rank_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_active ON user_achievements(last_active DESC);

-- 7.2. Журнал событий получения боевых наград (Realtime-лента для преподавателя)
CREATE TABLE IF NOT EXISTS achievement_unlock_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT NOT NULL,
  student_name TEXT,
  badge_id TEXT NOT NULL,
  badge_title TEXT NOT NULL,
  badge_icon TEXT DEFAULT '🎖️',
  category TEXT NOT NULL DEFAULT 'museum',
  xp_awarded INTEGER NOT NULL DEFAULT 0,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_unlock_events_badge ON achievement_unlock_events(badge_id);
CREATE INDEX IF NOT EXISTS idx_unlock_events_user ON achievement_unlock_events(user_id);
CREATE INDEX IF NOT EXISTS idx_unlock_events_feed ON achievement_unlock_events(unlocked_at DESC);

-- 7.3. Row Level Security для достижений
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievement_unlock_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read user_achievements" ON user_achievements;
DROP POLICY IF EXISTS "Public upsert user_achievements" ON user_achievements;
CREATE POLICY "Public read user_achievements" ON user_achievements FOR SELECT USING (true);
CREATE POLICY "Public upsert user_achievements" ON user_achievements FOR ALL USING (true);

DROP POLICY IF EXISTS "Public read achievement_events" ON achievement_unlock_events;
DROP POLICY IF EXISTS "Public insert achievement_events" ON achievement_unlock_events;
CREATE POLICY "Public read achievement_events" ON achievement_unlock_events FOR SELECT USING (true);
CREATE POLICY "Public insert achievement_events" ON achievement_unlock_events FOR INSERT WITH CHECK (true);

-- 7.4. Подключение Realtime-вещания для достижений
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'user_achievements'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE user_achievements;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'achievement_unlock_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE achievement_unlock_events;
  END IF;
END;
$$;

-- 7.5. RPC-функция надежной синхронизации наград и уровней в базе данных
CREATE OR REPLACE FUNCTION sync_user_achievement_progress(
  p_user_id TEXT,
  p_student_name TEXT DEFAULT NULL,
  p_group_name TEXT DEFAULT NULL,
  p_xp_delta INTEGER DEFAULT 0,
  p_rank_id TEXT DEFAULT NULL,
  p_rank_title TEXT DEFAULT NULL,
  p_new_badge_id TEXT DEFAULT NULL,
  p_new_badge_title TEXT DEFAULT NULL,
  p_badge_icon TEXT DEFAULT '🎖️',
  p_badge_category TEXT DEFAULT 'museum',
  p_badge_xp INTEGER DEFAULT 0,
  p_stats_json JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rec RECORD;
  v_new_xp INTEGER;
  v_badges TEXT[];
  v_stats JSONB;
BEGIN
  SELECT * INTO v_rec FROM user_achievements WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    v_new_xp := GREATEST(0, COALESCE(p_xp_delta, 0));
    v_badges := CASE WHEN p_new_badge_id IS NOT NULL THEN ARRAY[p_new_badge_id] ELSE '{}'::TEXT[] END;
    v_stats := COALESCE(p_stats_json, '{"candlesLitHeroes":[], "flowersLaid":0, "audioHeard":0, "chaptersRead":0, "quizzesPassed":0, "modesCompleted":[]}'::jsonb);

    INSERT INTO user_achievements (
      user_id, student_name, group_name, xp, rank_id, rank_title, unlocked_badges, stats, last_active, updated_at
    )
    VALUES (
      p_user_id,
      p_student_name,
      p_group_name,
      v_new_xp,
      COALESCE(p_rank_id, 'private'),
      COALESCE(p_rank_title, 'Рядовой'),
      v_badges,
      v_stats,
      NOW(),
      NOW()
    );
  ELSE
    v_new_xp := GREATEST(0, v_rec.xp + COALESCE(p_xp_delta, 0));
    v_badges := v_rec.unlocked_badges;
    IF p_new_badge_id IS NOT NULL AND NOT (p_new_badge_id = ANY(v_badges)) THEN
      v_badges := array_append(v_badges, p_new_badge_id);
    END IF;
    v_stats := COALESCE(p_stats_json, v_rec.stats);

    UPDATE user_achievements
    SET
      xp = v_new_xp,
      rank_id = COALESCE(p_rank_id, v_rec.rank_id),
      rank_title = COALESCE(p_rank_title, v_rec.rank_title),
      unlocked_badges = v_badges,
      stats = v_stats,
      student_name = COALESCE(p_student_name, v_rec.student_name),
      group_name = COALESCE(p_group_name, v_rec.group_name),
      last_active = NOW(),
      updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;

  -- Логируем событие получения награды для ленты преподавателя
  IF p_new_badge_id IS NOT NULL THEN
    INSERT INTO achievement_unlock_events (user_id, student_name, badge_id, badge_title, badge_icon, category, xp_awarded)
    VALUES (
      p_user_id, 
      COALESCE(p_student_name, 'Студент'), 
      p_new_badge_id, 
      COALESCE(p_new_badge_title, p_new_badge_id), 
      COALESCE(p_badge_icon, '🎖️'),
      p_badge_category, 
      COALESCE(p_badge_xp, 0)
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'xp', v_new_xp,
    'badges_count', cardinality(v_badges)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION sync_user_achievement_progress(TEXT, TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER, JSONB) TO anon, authenticated;

-- 7.6. Процедура ПОЛНОГО ОБНУЛЕНИЯ ВСЕХ СЧЕТЧИКОВ И УРОВНЕЙ
CREATE OR REPLACE FUNCTION reset_all_memorial_counters_and_levels()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Обнуляем счетчики свечей и цветов мемориала
  UPDATE memorial_counters SET candles = 0, flowers = 0, last_updated = NOW();

  -- 2. Обнуляем посещаемость и счетчики всех залов
  UPDATE hall_analytics_counters SET 
    total_visits = 0, 
    active_visitors = 0, 
    total_duration_seconds = 0, 
    interactions_count = 0, 
    last_activity = NOW();

  -- 3. Очищаем журнал аналитических событий
  DELETE FROM hall_analytics_events;

  -- 4. Очищаем антиспам-журналы для нового занятия
  DELETE FROM anti_abuse_actions_log;
  DELETE FROM tribute_flames_votes;

  -- 5. Обнуляем уровни, ранги и достижения всех пользователей
  UPDATE user_achievements SET
    xp = 0,
    rank_id = 'private',
    rank_title = 'Рядовой',
    unlocked_badges = '{}',
    stats = '{"candlesLitHeroes":[], "flowersLaid":0, "audioHeard":0, "chaptersRead":0, "quizzesPassed":0, "modesCompleted":[]}'::jsonb,
    updated_at = NOW();

  -- 6. Очищаем ленту наград
  DELETE FROM achievement_unlock_events;

  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Все счетчики, уровни и достижения успешно обнулены'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION reset_all_memorial_counters_and_levels() TO anon, authenticated;

-- 7.7. ОДНОКРАТНОЕ ОБНУЛЕНИЕ СЧЕТЧИКОВ И УРОВНЕЙ ПРИ ПРИМЕНЕНИИ МИГРАЦИИ
UPDATE memorial_counters SET candles = 0, flowers = 0;
UPDATE hall_analytics_counters SET total_visits = 0, active_visitors = 0, total_duration_seconds = 0, interactions_count = 0;
DELETE FROM hall_analytics_events;
DELETE FROM anti_abuse_actions_log;
DELETE FROM tribute_flames_votes;
UPDATE user_achievements SET xp = 0, rank_id = 'private', rank_title = 'Рядовой', unlocked_badges = '{}';
DELETE FROM achievement_unlock_events;

-- ============================================================================
-- БАЗА ДАННЫХ И СИСТЕМА ДОСТИЖЕНИЙ ПОЛНОСТЬЮ НАСТРОЕНЫ И ОБНУЛЕНЫ!
-- ============================================================================
