# ✅ Реализация Subresource Integrity (SRI)

## Выполненные изменения

Все HTML-файлы проекта обновлены для использования SRI-проверки при загрузке Supabase SDK.

### Обновленные файлы (9 файлов):

| Файл | Статус | Версия SDK |
|------|--------|------------|
| `index.html` | ✅ Обновлено | 2.39.0 |
| `guestbook.html` | ✅ Обновлено | 2.39.0 |
| `certificate.html` | ✅ Обновлено | 2.39.0 |
| `desk-qr.html` | ✅ Обновлено | 2.39.0 |
| `memory-book.html` | ✅ Обновлено | 2.39.0 |
| `mobile.html` | ✅ Обновлено | 2.39.0 |
| `quiz.html` | ✅ Обновлено | 2.39.0 |
| `reader.html` | ✅ Обновлено | 2.39.0 |
| `verify.html` | ✅ Обновлено | 2.39.0 |

### Пример реализации:

```html
<!-- Supabase JS SDK с проверкой целостности (SRI) -->
<script 
  src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.0/dist/umd/supabase.min.js" 
  integrity="sha384-wgi7s9Y2xefdDru3II6Xb11y/YNoKVbuydTikWejwId9z2xRd8SveCTrJjj/QAnH" 
  crossorigin="anonymous">
</script>
```

### Хэш целостности (SHA-384):
```
sha384-wgi7s9Y2xefdDru3II6Xb11y/YNoKVbuydTikWejwId9z2xRd8SveCTrJjj/QAnH
```

## Примечания

### Yandex Maps API
Для `api-maps.yandex.ru` SRI не применяется, так как это **динамический скрипт**, который генерируется сервером и может меняться без изменения версии. Это стандартная практика для динамических API.

```html
<!-- Примечание: Yandex Maps API - динамический скрипт, SRI не применяется -->
<script src="https://api-maps.yandex.ru/2.1/?lang=ru_RU" type="text/javascript"></script>
```

## Как обновить хэш при смене версии

При обновлении версии Supabase SDK необходимо пересчитать хэш:

```bash
curl -s https://cdn.jsdelivr.net/npm/@supabase/supabase-js@<VERSION>/dist/umd/supabase.min.js | \
  openssl dgst -sha384 -binary | openssl base64 -A
```

Замените `<VERSION>` на нужную версию (например, `2.40.0`).

## Преимущества SRI

1. **Защита от подмены**: Браузер проверяет целостность файла перед выполнением
2. **Защита от MITM-атак**: Даже если CDN скомпрометирован, вредоносный код не выполнится
3. **Соответствие стандартам**: Рекомендация OWASP и W3C
4. **Безопасность цепочки поставок**: Гарантия, что файл не был изменён при доставке

## Проверка работы

Откройте консоль разработчика в браузере и убедитесь, что нет ошибок вида:
```
Failed to find a valid digest in the 'integrity' attribute
```

Если ошибок нет — SRI работает корректно.

---
**Дата обновления**: 2025
**Версия документа**: 1.0
