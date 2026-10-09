# Prisma migrations — clean development baseline

## Что изменено

Историческая цепочка из нескольких миграций была заменена на одну чистую baseline-миграцию:

`20261007000000_clean_baseline`

Она соответствует текущему `backend/prisma/schema.prisma` и сразу создаёт актуальную структуру CustomPC.

В baseline уже включены:

- все текущие ENUM;
- каталог комплектующих и сборок;
- конфигуратор;
- услуги;
- заявки и заказы;
- LeadStatusHistory;
- OrderStatusHistory;
- платежи;
- costPrice / profit;
- agreedPrice;
- Customer.email;
- SiteSettings;
- портфолио, отзывы, статьи и SEO.

Старые repair-миграции больше не нужны.

## Важно

Эта ветка предназначена для **чистой dev-базы**.

Если база содержит данные, сначала сделай резервную копию. Не запускай reset на базе, данные которой нужно сохранить.

## Чистый запуск с нуля

После checkout этой ветки:

```powershell
cd C:\projects\webCustomPC\custompc
git checkout refactor/clean-prisma-migrations
git pull origin refactor/clean-prisma-migrations

cd backend
npm install
npx prisma generate
npx prisma migrate reset --force
npx prisma migrate status
```

После reset ожидается:

```
Database schema is up to date!
```

Затем можно наполнить базу:

```powershell
npm run seed:content
```

## Почему здесь допустим migrate reset

Мы сознательно пересобираем **локальную development-базу с нуля**. Reset удаляет существующие dev-данные и создаёт схему заново по одной baseline-миграции.

Для production или базы с важными данными этот сценарий не использовать.

## После миграции

Проверить:

```powershell
npx prisma generate
npm run build
npm run db:status
```

Затем запустить backend:

```powershell
npm run start:dev
```

## Следующий шаг

После успешной проверки этой ветки создаём PR в `main`.

Не надо возвращать старые миграции или добавлять очередные repair-миграции поверх baseline.
