# CustomPS

Веб-сервис локальной продажи и сборки персональных компьютеров (Нефтекамск).

Подбор ПК, каталог готовых сборок, приём заявок, административная панель.

## Технологии

- **Frontend:** Next.js (App Router) + React + TypeScript + Tailwind CSS
- **Backend:** NestJS + TypeScript
- **База данных:** PostgreSQL
- **ORM:** Prisma
- **Инфраструктура:** Docker / Docker Compose

## Требования к системе

Перед началом убедись, что на компьютере установлено:

| Инструмент | Версия | Зачем | Скачать |
|---|---|---|---|
| Node.js | 24.x LTS или новее | Запуск backend и frontend | https://nodejs.org |
| Docker Desktop | любая актуальная | Локальный запуск PostgreSQL | https://www.docker.com |
| Git | любая актуальная | Клонирование репозитория | https://git-scm.com |

Проверить, что всё установлено:

```bash
node -v
docker --version
git --version
```

## Установка с нуля

### 1. Склонировать репозиторий

```bash
git clone <ссылка-на-репозиторий>
cd custompc
```

### 2. Поднять базу данных

Из корня проекта (рядом с `docker-compose.yml`):

```bash
docker compose up -d
```

Это запустит:
- **PostgreSQL** — порт `5432`
- **Adminer** (веб-просмотр БД) — http://localhost:8080

Проверить, что контейнеры работают: `docker ps` — должны быть видны `customps_postgres` и `customps_adminer`.

> Docker Desktop должен быть запущен (открыт как приложение) до выполнения этой команды.

### 3. Настроить и запустить backend

```bash
cd backend
npm install
```

Создай файл `backend/.env` (скопируй из `backend/.env.example`, если он есть в репозитории, либо создай вручную) со следующим содержимым:

```env
DATABASE_URL="postgresql://customps:customps_dev_password@localhost:5432/customps?schema=public"
JWT_SECRET="change_this_to_a_long_random_string"
JWT_EXPIRES_IN="7d"
PORT=3001
FRONTEND_URL="http://localhost:3000"
```

Применить схему БД:

```bash
npx prisma migrate dev
```

(Опционально) наполнить БД тестовыми данными:

```bash
npx prisma db seed
```

Запустить backend в режиме разработки:

```bash
npm run start:dev
```

Backend будет доступен на **http://localhost:3001**.

### 4. Настроить и запустить frontend

В новом окне терминала:

```bash
cd frontend
npm install
```

Создай файл `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Запустить frontend:

```bash
npm run dev
```

Сайт будет доступен на **http://localhost:3000**.

## Ежедневный запуск (когда всё уже настроено)

Три отдельных окна терминала:

```bash
# 1. База данных (из корня проекта)
docker compose up -d

# 2. Backend
cd backend
npm run start:dev

# 3. Frontend
cd frontend
npm run dev
```

## Структура проекта

```
custompc/
├── docker-compose.yml    # PostgreSQL + Adminer
├── backend/               # NestJS API
│   ├── prisma/
│   │   ├── schema.prisma  # Модель данных
│   │   └── seed.ts        # Тестовые данные
│   └── src/
│       ├── prisma/        # Подключение к БД
│       ├── pc-builds/     # Каталог готовых сборок
│       └── leads/         # Приём заявок
└── frontend/               # Next.js сайт
    ├── app/
    │   ├── page.tsx        # Главная страница
    │   └── request/        # Страница заявки
    ├── components/
    └── lib/
```

## Доступные API-эндпоинты (backend)

| Метод | Путь | Описание |
|---|---|---|
| GET | `/pc-builds` | Список готовых сборок ПК |
| GET | `/pc-builds/:slug` | Карточка одной сборки |
| POST | `/leads` | Отправка заявки |
| GET | `/leads` | Список заявок (для админки) |

## Просмотр базы данных

Через браузер: http://localhost:8080 (Adminer)

- Система: `PostgreSQL`
- Сервер: `postgres`
- Пользователь: `customps`
- Пароль: `customps_dev_password`
- База данных: `customps`

Либо через Prisma Studio (из папки `backend`):

```bash
npx prisma studio
```

## Частые проблемы

**`EADDRINUSE: address already in use`** — порт уже занят другим запущенным процессом. Останови предыдущий процесс (Ctrl+C в его окне терминала) или найди и останови процесс командой (Windows):
```bash
netstat -ano | findstr :3001
taskkill /PID <номер_процесса> /F
```

**Ошибка подключения к БД при `prisma migrate`** — проверь, что Docker Desktop запущен и контейнер `customps_postgres` в статусе running (`docker ps`).

**CORS-ошибка в браузере при отправке формы** — проверь, что в `backend/src/main.ts` включён `app.enableCors(...)`, и что backend запущен на порту `3001`, а frontend — на `3000`.

## Что дальше (Этап 2-3 по ТЗ)

См. основной файл технического задания — реализовано пока только MVP-ядро: каталог, приём заявок. Впереди: конфигуратор, авторизация и админ-панель, портфолио, отзывы, полноценное управление заказами.
