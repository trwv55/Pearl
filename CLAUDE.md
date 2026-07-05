# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## О проекте

Pearl — ежедневный планировщик задач (русскоязычный UI): Next.js (App Router, static export) + Capacitor для iOS. Домен: задачи по дням — **главные** (максимум 3 в день, `MAX_MAIN_TASKS` в `src/shared/config/tasks.ts`) и **рутинные** (без лимита, сортировка drag-and-drop через dnd-kit). День считается выполненным, когда закрыты все 3 главные задачи; недельная статистика (WeeklyStats) считает выполненные дни.

## Команды

- `npm run dev` — dev-сервер (turbopack)
- `npm run build` — прод-сборка: принудительно webpack (`next build --webpack`) из-за кастомных SVGR-правил; static export в `out/`
- `npm run lint`
- Тестов в проекте нет.
- Env: `cp .env.example .env`, переменные `NEXT_PUBLIC_FIREBASE_*`.
- iOS: `out/` — это `webDir` Capacitor (`capacitor.config.ts`, appId `com.pearl-app.app`); после сборки — `npx cap sync ios`, проект в `ios/App`.

## Архитектура

Структура `src/` в духе Feature-Sliced Design:

- `app/` — маршруты App Router (тонкие реэкспорты views/features) + `providers/` (`AuthProvider` — подписка на `onAuthStateChanged` → `userStore`; `ProtectedRoute` — клиентский гард, редирект на `/auth`; `SplashProvider`) + `layouts/`. Роуты: `/` (главная), `/auth`, `/auth/login`, `/auth/register`, `/create`. Константы роутов — `src/shared/lib/routes.ts`.
- `views/` — страничные композиции: `main` (DaysSwitcher + MainTasks + RoutineTasks, префетч задач на ±15 дней), `create-task`.
- `widgets/` — `day-switcher`, `main-page-top-bar`, `tasks-and-stats` (embla-карусель: стек главных задач + WeeklyStats), `WeeklyStats` (+ProgressWheel), `show-routine-tasks`.
- `features/` — `auth`, `create-task`, `task-form` (мультишаговая форма; шаги в `src/shared/ui/task-form-steps/`), `main-tasks`, `routine-tasks`, `task-view`, `task-edit`, `task-duplicate`, `settings` (SettingsPopup: тумблер уведомлений, EditNamePopup, Logout).
- `shared/` — `model/` (MobX-сторы), `lib/`, `api/`, `ui/`, `hooks/`, `types/`, `config/`.

### Состояние (MobX)

Root store и React Context отсутствуют: четыре независимых синглтона в `src/shared/model/`, импортируются напрямую; компоненты оборачиваются в `observer()` из mobx-react-lite:

- `taskStore` — задачи выбранной даты, кэш по датам (`taskCache` Map), оптимистичное удаление с undo (4 с, `deleteWithUndo`), `toggleCompletion`; computed `mainTasks`/`routineTasks`.
- `userStore` — Firebase `User | null`.
- `statsStore` — недельная статистика (день выполнен = 3/3 главных).
- `notificationSettingsStore` — тумблер уведомлений (OS-разрешение + localStorage).

### Данные (Firebase)

Используются только Auth и Firestore. Инициализация — ленивый клиентский синглтон `src/shared/lib/firebase.ts` (persistence: indexedDB на нативе, browserLocal в вебе). CRUD задач — `src/shared/api/taskApi.ts` (коллекция `users/{uid}/tasks/{taskId}`); профиль — `userApi.ts` (`users/{uid}`); auth-операции — `src/shared/lib/auth/*`.

Нюанс: `taskStore.fetchTasks`/`fetchTasksForRange` ходят в Firestore напрямую, минуя `taskApi` (маппинг doc→Task продублирован).

### Уведомления

Локальные напоминания через `@capacitor/local-notifications` — **только iOS**: `scheduleTaskNotification` в `src/shared/lib/notifications.ts` делает early-return вне нативной платформы; напоминание «за 30 минут» до времени задачи. В вебе — только запрос разрешения, планирования нет. Push-уведомлений нет; `public/sw.js` — сгенерированный Workbox-воркер next-pwa (только кэширование, перегенерируется при сборке — руками не править).

### Модель Task

`src/shared/types/task.ts`: `{ id, title, comment, date, emoji, isMain, markerColor, isCompleted, completedAt, time }` (`time` — минуты дня или `null`). `TaskMain`/`TaskRoutine` различаются по `isMain`, есть type guards `isTaskMain`/`isTaskRoutine`.

## Git

- **Никогда не делать `git push` без явной просьбы пользователя** (правило из `.cursor/rules/git-workflow.mdc`). Коммиты можно, push — только по явной команде.
- Коммит-сообщения — кратко, на английском.

## Соглашения

- Алиас `@/*` → `src/*` (tsconfig `paths`, продублирован в webpack-конфиге `next.config.ts`).
- Tailwind CSS 4 + shadcn/ui (`components.json`: `ui` → `@/shared/ui`) + CSS Modules в фичах/виджетах; `cn()` в `src/shared/lib/utils.ts`.
- SVG импортируются как React-компоненты (SVGR); с суффиксом `?url` — как файл.
- UI-тексты и комментарии в коде — на русском.
