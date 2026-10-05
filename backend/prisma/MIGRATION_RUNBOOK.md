# Prisma migrations — безопасный порядок работы

## Главное

Для существующей базы **не использовать** `prisma migrate reset`.

Проект содержит каталог миграций Prisma. Обычная синхронизация выполняется через:

```powershell
cd C:\projects\webCustomPC\custompc
git pull origin main

cd backend
npm install
npx prisma generate
npm run db:status
npm run db:deploy
```

После `db:deploy` снова проверить:

```powershell
npm run db:status
```

Ожидаемый результат:

```
Database schema is up to date!
```

## Текущий repair-кейс

Миграция:

`20261005100000_repair_missing_status_history_tables`

восстанавливает таблицы:

- `LeadStatusHistory`
- `OrderStatusHistory`

Она сделана идемпотентно через `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS` и проверку foreign key.

Это важно для баз, в которых старые миграции были отмечены Prisma как выполненные, но физические таблицы отсутствовали.

## Чистая новая база

Для новой пустой PostgreSQL-базы ничего вручную создавать не нужно:

```powershell
npm run db:deploy
npx prisma generate
```

Prisma применит всю цепочку миграций по порядку.

## Существующая база с данными

Не удалять базу и не выполнять `migrate reset`.

Порядок:

1. Забрать актуальный `main`.
2. Сгенерировать Prisma Client.
3. Проверить статус миграций.
4. Выполнить `db:deploy`.
5. Перезапустить backend.
6. Проверить критические admin/API сценарии.

## Почему `migrate status` мог сказать "up to date"

Prisma проверяет наличие и состояние миграций, которые присутствуют локально в `prisma/migrations`.

Если локальный checkout содержит 8 миграций, а актуальный `main` уже содержит 9-ю repair-миграцию, локальная Prisma может сказать:

`Database schema is up to date!`

при этом новая repair-миграция ещё физически не запускалась.

Поэтому после изменений в `main` сначала нужно обновить рабочую копию:

```powershell
git pull origin main
```

## Запрещённый сценарий для этой базы

Не выполнять:

```powershell
npx prisma migrate reset
```

если нет отдельного решения удалить все данные.

Также не нужно вручную удалять записи из `_prisma_migrations`, чтобы "заставить" Prisma повторить старую миграцию. Для исправления уже существующей базы используется новая repair-миграция.
