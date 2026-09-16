# 🔐 Руководство по безопасности Supabase

## Обзор изменений

В рамках улучшения безопасности проекта «Виртуальный музей ГБПОУ СРМК» были внедрены следующие изменения:

### ✅ Выполненные изменения

1. **Создан файл `.env.example`** - шаблон для конфигурации окружения
2. **Обновлен `.gitignore`** - игнорирует файлы `.env` с секретами
3. **Модернизирован `js/cloud-sync.js`** (v4.1):
   - Ключи загружаются из `window.CloudConfig`
   - Добавлена валидация конфигурации перед инициализацией
   - Улучшена обработка ошибок
4. **Обновлены HTML-файлы**:
   - Добавлен атрибут `integrity` для SRI проверки
   - Конфигурация вынесена в отдельный скрипт перед `cloud-sync.js`

---

## 📋 Инструкция по настройке

### Шаг 1: Создайте файл `.env`

```bash
cd /workspace
cp .env.example .env
```

### Шаг 2: Заполните `.env` своими значениями

Откройте файл `.env` и убедитесь, что ключи соответствуют вашему проекту Supabase:

```env
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key-here"
```

### Шаг 3: Настройте RLS (Row Level Security) в Supabase

1. Войдите в [Supabase Dashboard](https://supabase.com/dashboard)
2. Выберите ваш проект
3. Перейдите в **SQL Editor**
4. Выполните скрипт из файла `supabase_migration.sql`

Этот скрипт создаст:
- Все необходимые таблицы
- RLS политики для безопасного доступа
- Хранимые процедуры для атомарных операций

### Шаг 4: Проверьте RLS политики

Убедитесь, что для каждой таблицы настроены правильные политики:

#### Таблица `guestbook_tributes`:
```sql
-- Чтение доступно всем
CREATE POLICY "Public read tributes" 
  ON guestbook_tributes FOR SELECT 
  USING (true);

-- Создание доступно всем (для посетителей)
CREATE POLICY "Public create tributes" 
  ON guestbook_tributes FOR INSERT 
  WITH CHECK (true);

-- Полное управление только для аутентифицированных администраторов
CREATE POLICY "Admin manage tributes" 
  ON guestbook_tributes FOR ALL 
  USING (auth.role() = 'authenticated');
```

#### Таблица `memorial_counters`:
```sql
-- Чтение доступно всем
CREATE POLICY "Public read counters" 
  ON memorial_counters FOR SELECT 
  USING (true);

-- Обновление через хранимые процедуры
CREATE POLICY "Public update counters" 
  ON memorial_counters FOR UPDATE 
  USING (true);
```

### Шаг 5: Обновите HTML-файлы

Для каждого HTML-файла, использующего Supabase, добавьте:

```html
<!-- 1. Подключение SDK с SRI -->
<script 
  src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2" 
  integrity="sha384-..." 
  crossorigin="anonymous">
</script>

<!-- 2. Конфигурация -->
<script>
  window.CloudConfig = {
    SUPABASE_URL: "https://your-project.supabase.co",
    SUPABASE_ANON_KEY: "your-anon-key-here"
  };
</script>

<!-- 3. CloudSync -->
<script src="js/cloud-sync.js"></script>
```

---

## 🔒 Рекомендации по безопасности

### 1. Никогда не коммитьте `.env` в репозиторий

Файл `.env` уже добавлен в `.gitignore`. Проверяйте перед коммитом:

```bash
git status
git add .
# Убедитесь, что .env не попал в список
```

### 2. Используйте сервисный ключ только на сервере

Если вы создаете Edge Functions или серверный код:

```javascript
// ❌ НИКОГДА не делайте это на клиенте
const adminClient = supabase.createClient(URL, SERVICE_ROLE_KEY);

// ✅ Используйте только в Edge Functions
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  );
  // ... ваш код
});
```

### 3. Регулярно обновляйте ключи

Рекомендуется ротация ключей каждые 90 дней:

1. Создайте новый ключ в Dashboard
2. Обновите `.env` и HTML-файлы
3. Протестируйте
4. Удалите старый ключ

### 4. Мониторинг подозрительной активности

Включите логи в Supabase:
- Settings → Database → Log Explorer
- Отслеживайте необычные паттерны запросов

---

## 🧪 Тестирование

### Проверка подключения

Откройте консоль браузера на любой странице и выполните:

```javascript
// Должно вывести true
CloudSync.isLive

// Должно показать объект клиента
CloudSync.client
```

### Проверка RLS политик

Попробуйте выполнить несанкционированную операцию через консоль:

```javascript
// Эта операция должна быть заблокирована RLS
const { error } = await CloudSync.client
  .from('guestbook_tributes')
  .delete()
  .eq('id', 'some-id');

console.error(error); // Должна быть ошибка permissions
```

### Проверка атомарности счетчиков

Откройте две вкладки одновременно и попробуйте зажечь свечу:

```javascript
// Вкладка 1
CloudSync.pushCandle('hero_001');

// Вкладка 2 (одновременно)
CloudSync.pushCandle('hero_001');

// Оба вызова должны успешно выполниться без потери данных
```

---

## 📊 Архитектура безопасности

```
┌─────────────────────────────────────────────────────────┐
│                    БРАУЗЕР КЛИЕНТА                       │
├─────────────────────────────────────────────────────────┤
│  window.CloudConfig (публичные ключи)                    │
│  ↓                                                       │
│  cloud-sync.js v4.1 (валидация конфигурации)            │
│  ↓                                                       │
│  Supabase JS SDK (с SRI проверкой)                      │
└─────────────────────────────────────────────────────────┘
                          ↓ HTTPS
┌─────────────────────────────────────────────────────────┐
│                    SUPABASE CLOUD                        │
├─────────────────────────────────────────────────────────┤
│  API Gateway                                             │
│  ↓                                                       │
│  Row Level Security (RLS) Policies                      │
│  ↓                                                       │
│  PostgreSQL Database                                    │
│  - heroes_database                                      │
│  - memorial_counters                                    │
│  - guestbook_tributes                                   │
│  - certificates_registry                                │
│  - quiz_results                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🆘 Устранение проблем

### Ошибка: "CloudSync ⚠️ SUPABASE_URL не настроен"

**Причина:** Ключи не загружены в `window.CloudConfig`

**Решение:**
1. Проверьте, что скрипт конфигурации загружается перед `cloud-sync.js`
2. Убедитесь, что URL не содержит плейсхолдер "ВАШ_PROJECT_ID"

### Ошибка: "permission denied for table"

**Причина:** RLS политика блокирует операцию

**Решение:**
1. Проверьте RLS политики в Supabase Dashboard
2. Убедитесь, что операция разрешена для роли `anon`
3. При необходимости создайте новую политику

### Ошибка: "Invalid API key"

**Причина:** Ключ неверный или истек

**Решение:**
1. Проверьте ключ в `.env` и HTML-файлах
2. Создайте новый ключ в Supabase Dashboard
3. Обновите конфигурацию

---

## 📚 Дополнительные ресурсы

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/security)
- [Subresource Integrity (SRI)](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

**Версия документа:** 1.0  
**Дата обновления:** 2025-01-XX  
**Ответственный:** Команда разработки
