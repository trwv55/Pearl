# Юнит-тестирование бизнес-логики (Vitest)

Дата: 2026-09-05

## Цель

Добавить в проект юнит-тесты на бизнес-логику — MobX-сторы, `taskApi`, уведомления,
хелперы — и шаг проверки в CI. UI-компоненты, хуки и e2e в эту задачу не входят.

## Ключевые решения (из брейнсторминга)

- **Область:** только бизнес-логика. Компонентные тесты и e2e — не сейчас.
- **Раннер:** Vitest + jsdom. Причина: `firebase` и `date-fns` v4 — ESM-пакеты, Vitest ест их
  без трансформ-настроек; Jest потребовал бы `transformIgnorePatterns`.
- **Изоляция Firestore:** моки на уровне модулей (`vi.mock`), без Firebase Emulator.
  Эмулятор можно добавить позже вторым контуром только для `taskApi`.
- **Рефакторинг разрешён точечно:** прямые обращения `taskStore` к Firestore переезжают
  в `taskApi`, чтобы мокать одну границу. Поведение не меняется.
- **Расположение тестов:** рядом с файлом (`taskStore.test.ts`), не в корневом `tests/`.
  FSD не регламентирует место тестов, но принцип самодостаточного слайса и запрет
  импортов «сверху» говорят за колокацию.
- **CI:** отдельный workflow на push/PR (lint + typecheck + test). Vercel-деплой не трогаем.

## Что тестируем: ответы сервера

Граница `taskApi` мокается, и каждый тест сам задаёт «ответ сервера»: промис резолвится —
проверяем итоговое состояние; реджектится — проверяем **откат оптимистичного изменения,
error-тост и восстановление уведомления**. Это главный класс тестов: все `.catch`-ветки
оптимистичных методов `taskStore` сейчас не покрыты. Ошибка realtime-подписки тоже
покрывается (`onReady` вызывается, скелетон снимается).

Не покрывается без эмулятора: реальные сетевые/permission-ошибки Firebase SDK и
корректность составления Firestore-запросов внутри `taskApi`.

## 1. Структура и конфигурация

**Dev-зависимости:** `vitest`, `jsdom`, `vite-tsconfig-paths`.

**`vitest.config.ts`** (корень):

```ts
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	plugins: [tsconfigPaths()],
	test: {
		environment: "jsdom",
		include: ["src/**/*.test.{ts,tsx}"],
		setupFiles: ["src/shared/testing/setup.ts"],
		globals: false,
		restoreMocks: true,
		clearMocks: true,
	},
});
```

- `globals: false` — `describe/it/expect/vi` импортируются явно из `vitest`; `tsconfig.types`
  не трогаем, Next-сборка не видит глобалов.
- Алиас `@/*` берётся из `tsconfig.json` через плагин — третья копия алиаса не нужна.

**Тесты** — рядом с кодом: `src/shared/model/taskStore.test.ts`, `src/shared/api/taskApi.test.ts`
и т.д.

**Хелперы** — `src/shared/testing/`:

- `setup.ts` — `afterEach`: `localStorage.clear()`, `vi.useRealTimers()`.
- `factories.ts` — `makeTask(overrides?: Partial<Task>): Task` с валидными дефолтами
  (`order: 0`, `createdAt: new Date(...)`, `time: null`, `isCompleted: false`), плюс
  `makeMain(...)` / `makeRoutine(...)`. Даты — локальные конструкторы `new Date(2026, 8, 5)`,
  без ISO-строк, чтобы не ловить TZ-сдвиги.
- `mocks/taskApi.ts` — типизированный мок API (см. §3).

**Скрипты `package.json`:**

```json
"test": "vitest run",
"test:watch": "vitest",
"typecheck": "tsc --noEmit",
"lint": "eslint ."
```

**Влияние на сборку:** `tsconfig` включает `**/*.ts`, поэтому `next build` тайпчекает
тест-файлы — это допустимо (типы `vitest` установлены). В бандл они не попадают: App Router
собирает только по импортам из `app/`.

## 2. Рефакторинг `taskStore` → `taskApi`

Цель: `taskStore` не импортирует `firebase/firestore` и `getFirebaseDb`. Вся сеть — за
границей `taskApi`.

**`taskApi.ts` — добавить:**

```ts
// Живая подписка на задачи диапазона [startDate, endDate] (по дням, включительно).
// Возвращает функцию отписки.
export const subscribeToTasksInRange = (
	userId: string,
	startDate: Date,
	endDate: Date,
	onTasks: (tasks: Task[]) => void,
	onError: (error: Error) => void,
): (() => void) => { /* onSnapshot(q, snap => onTasks(snap.docs.map(mapDocToTask)), onError) */ };
```

`getTasksByDate` и `getTasksForRange` уже существуют и дублируют код стора — новых функций
для них не нужно.

**`taskStore.ts`:**

| Метод | Было | Станет |
|---|---|---|
| `fetchTasks` | `query/getDocs` + `mapDocToTask` | `await getTasksByDate(userId, date)` |
| `fetchTasksForRange` | `query/getDocs` + группировка | `await getTasksForRange(userId, startDate, endDate)` + группировка (остаётся в сторе — это логика кэша) |
| `subscribeToRange` | `onSnapshot` | `subscribeToTasksInRange(userId, start, end, onTasks, onError)`; фильтр `pendingDeletions`, группировка, `markReady` — в сторе |
| `rolloverOverdueMainTasks` | `query/getDocs` `[since, activeDay+1)` | `await getTasksForRange(userId, since, activeDay)` — границы совпадают, `since` уже `startOfDay` |

Снимаются импорты `collection/getDocs/onSnapshot/query/where`, `getFirebaseDb`, `mapDocToTask`.

**Экспорт классов:** `export class TaskStore`, `StatsStore`, `TaskRolloverStore`,
`NotificationSettingsStore`. Синглтоны остаются как есть; тесты создают свежий инстанс.

**Конструктор `TaskStore`** (слушатель `visibilitychange`) — не меняется; в jsdom `document`
есть, слушатель тестируется.

**Не трогаем:** `userApi`, `auth/*`, `day-switcher` (только тип `Timestamp`),
`DuplicateTaskForm` (прямой `addTask` — отдельная тема).

**Порядок:** рефакторинг — первый коммит, проверка `tsc --noEmit` + `next build`. Тесты
пишутся уже против новой границы.

## 3. Моки и хелперы

**В тестах сторов мокаются всегда** (через `vi.mock` в начале файла):

| Модуль | Зачем | Как |
|---|---|---|
| `@/shared/api/taskApi` | сеть | все функции → `vi.fn()`, по умолчанию `resolves(undefined)`; `generateTaskId` → `"task-1"`, `"task-2"`, …; `subscribeToTasksInRange` сохраняет колбэки — тест сам эмитит снапшот или ошибку |
| `@/shared/lib/notifications` | Capacitor | `scheduleTaskNotification` / `cancelTaskNotification` / `cancelAllTaskNotifications` / `hasNotificationPermission` / `requestNotificationPermission` → `vi.fn()`; проверяем факт и аргументы вызова |
| `@/shared/lib/showToast`, `@/shared/lib/showUndoToast` | sonner + React | `vi.fn()`; `showUndoToast` сохраняет `onUndo`, чтобы тест «нажал Отменить» |

`@/shared/lib/firebase` сторы после §2 не импортируют — мок не нужен. В тестах самого
`taskApi` мокаются `firebase/firestore` и `@/shared/lib/firebase`.

**`src/shared/testing/mocks/taskApi.ts`:** экспортирует `mockTaskApi` типа
`{ [K in keyof typeof import("@/shared/api/taskApi")]: Mock }` и хелперы:

- `emitSnapshot(tasks: Task[])` — вызвать сохранённый `onTasks`;
- `emitSubscriptionError(err: Error)` — вызвать `onError`;
- `failNext(name)` — `mockRejectedValueOnce(new Error("boom"))` для указанной функции;
- `resetTaskApiMock()` — сброс счётчика id и колбэков (вызывается из `setup.ts`).

Использование: `vi.mock("@/shared/api/taskApi", () => mockTaskApi)`.

**Время:** `vi.useFakeTimers()` только в тестах с таймерами (undo-окно, `visibilitychange`);
rollover — `vi.setSystemTime(new Date(2026, 8, 5, 10, 0))` и `(…, 3, 30)` для границы 04:00.
После реджекта дожидаемся microtask-очереди: `await vi.runAllTimersAsync()` при фейковых
таймерах, иначе `await Promise.resolve()` (при необходимости дважды).

**Свежий стор на тест:** `let store: TaskStore; beforeEach(() => { store = new TaskStore(); })`.

**localStorage:** настоящий из jsdom; `TaskRolloverStore` и `notifications.ts` тестируются без
моков хранилища.

## 4. Первый набор тестов

Всё ниже входит в первую итерацию.

**`src/shared/types/task.test.ts`** — `compareTaskOrder`: по `order`; при равных — по
`createdAt`; `NO_ORDER` и `createdAt: null` — в конец; `isTaskMain` / `isTaskRoutine`.

**`src/shared/api/taskApi.test.ts`** (мок `firebase/firestore`):
- `mapDocToTask`: `Timestamp`-подобный объект с `toDate()` vs обычный `Date`;
  `completedAt` отсутствует → `null`; `time` не число → `null`; `order` отсутствует →
  `NO_ORDER`; `createdAt` отсутствует → `null`.
- `updateTask`: в `updateDoc` попадают только заданные поля + `updatedAt`; `undefined` не
  пролезает.
- `updateTasksOrder`, `rolloverTasks`: пустой массив → `writeBatch` не вызывается.

**`src/shared/model/taskStore.test.ts`** — основной файл:
- Кэш: `setSelectedDate` берёт из кэша / даёт пустой список; `hasTasksForDate` vs
  `isDateLoaded` на пустом загруженном дне; `getTasksForDate`; `clearCache`.
- `fetchTasks`: кладёт в кэш даты; обновляет `tasks`, только если дата выбрана; ошибка →
  лог, состояние не тронуто.
- `fetchTasksForRange`: все дни диапазона помечены загруженными, включая пустые; `tasks`
  обновляется, только если выбранная дата в диапазоне.
- `ensureTasksForDate`: не дублирует запрос при параллельном вызове по одной дате; не ходит
  за загруженной датой.
- `subscribeToRange`: снапшот раскладывается по датам; задачи из `pendingDeletions`
  игнорируются; `onReady` вызывается ровно один раз — и на первом снапшоте, и на ошибке;
  возвращённая функция отписки — та, что вернул API.
- `createOptimistic`: задача сразу в кэше своей даты (не обязательно выбранной); `order` =
  max+1 среди задач того же типа, `NO_ORDER` игнорируется, первый = 0; уведомление
  запланировано; **ошибка API → задача убрана, уведомление отменено, error-тост**.
- `updateOptimistic`: замена на месте с сохранением позиции; перенос между датами; **ошибка →
  откат, включая обратный перенос даты**, уведомление перепланировано на прежнюю задачу.
- `reorderOptimistic`: `order` по индексу; пустой список — noop; **ошибка → прежние `order`
  восстановлены**, тост.
- `toggleCompletion`: `completedAt` выставляется/сбрасывается; апдейт привязан к дате задачи —
  смена `selectedDate` во время запроса не теряет обновление; уведомление отменяется при
  выполнении и возвращается при снятии; **ошибка → откат**; неизвестный id → resolved noop.
- `deleteWithUndo` (fake timers): задача исчезает сразу; по таймеру `deleteTask` вызван и
  `onDeleted` сработал; «Отменить» до таймера → задача вернулась, API не вызван, уведомление
  восстановлено; повторный вызов для той же задачи — noop; **ошибка удаления → задача
  вернулась, тост**; `flushPendingDeletes` и `visibilitychange` при `document.hidden = true` →
  немедленный коммит, таймер после этого не коммитит второй раз.
- `rolloverOverdueMainTasks` (system time): до 04:00 активный день — вчера; `since >=
  activeDay` → API не вызывается; переносятся только главные невыполненные не с активного
  дня, порядок дата→`order`; при 3 главных на активном дне лишние становятся рутинными;
  `order` сеется от свежей выборки, а не от кэша; кэш обновлён (ушли со старой даты,
  появились на активной); `rolloverTasks` получает ровно ожидаемые апдейты; ошибка API —
  только лог, локальное состояние остаётся.
- computed `mainTasks` / `routineTasks` отфильтрованы и отсортированы.

**`src/shared/model/statsStore.test.ts`**: день выполнен только при 3 главных и всех
выполненных; 2 из 2 выполненных → не выполнен; всегда 7 дней от `weekStart`;
`completedDaysCount`; ошибка API → `weekStats` не меняется.

**`src/shared/model/taskRolloverStore.test.ts`**: `initialize` читает localStorage и
идемпотентен; `enable` пишет сегодняшнюю дату (`yyyy-MM-dd`); `disable` чистит дату.

**`src/shared/lib/notifications.test.ts`** (мок `@capacitor/core`,
`@capacitor/local-notifications`): стабильные id — одна задача всегда получает один id, разные
задачи — разные, счётчик растёт, битый JSON в storage не роняет; `scheduleTaskNotification` не
планирует вне натива, при `time: null`, при выключенном тумблере, без permission, при времени
уведомления в прошлом; планирует за 30 минут с ожидаемыми `id`, `title`, `body`, `extra`;
`cancelTaskNotification` использует тот же id.

**`src/shared/model/notificationSettingsStore.test.ts`**: `initialize` = permission &&
(preference ?? true), идемпотентен; `enableNotifications` пишет preference по результату
запроса; `disableNotifications` пишет `false` и отменяет все уведомления.

**Сознательно вне набора:** `userStore`, `auth/*`, `userApi`, хуки, UI.

## 5. CI и lint

**`.github/workflows/ci.yml`** (новый):

- `on: push` (все ветки) и `pull_request`; `concurrency: ci-${{ github.ref }}` с отменой.
- Job `check`: `actions/checkout@v4` → `actions/setup-node@v4` (node 20, `cache: npm`) →
  `npm ci` → `npm run lint` → `npm run typecheck` → `npm test`.
- Секреты не нужны: тесты не инициализируют Firebase SDK.

**Lint — текущее состояние сломано, чиним в этой задаче:**

- `next lint` удалён в Next 16 — скрипт падает.
- В корне два конфига: `eslint.config.js` (typescript-eslint, без `ignores`) перекрывает
  `eslint.config.mjs` (next). Прямой `eslint .` линтует `out/`, `.next/`, `public/sw.js` →
  ~54 000 ошибок.
- Сам `eslint.config.mjs` тоже неработоспособен: `FlatCompat.extends("next/core-web-vitals")`
  падает с `eslint-config-next@16` — пакет перешёл на нативные flat-конфиги.

**Правила** — не свои, а готовые из `eslint-config-next@16`: `core-web-vitals`
(react, react-hooks v6 с правилами React Compiler, @next/next, jsx-a11y, import) и
`typescript` (typescript-eslint recommended). Новый `eslint.config.mjs`:

```js
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
	...nextVitals,
	...nextTs,
	{
		rules: {
			// Правила готовности к React Compiler — компилятор в проекте не используется,
			// код с ними не приводили. Пока warn, чтобы не блокировать CI.
			"react-hooks/set-state-in-effect": "warn",
			"react-hooks/immutability": "warn",
			"react-hooks/preserve-manual-memoization": "warn",
		},
	},
	globalIgnores(["out/", ".next/", "ios/", "public/sw.js", "public/workbox-*.js", "next-env.d.ts"]),
]);
```

Действия: удалить `eslint.config.js`; заменить `eslint.config.mjs` на конфиг выше;
`"lint": "eslint ."`.

**Baseline** (замер на текущем `src/`, 134 файла): 15 ошибок, 49 предупреждений.
- `react/jsx-key` ×5 в `src/features/auth/register/index.tsx:58-71` — **чиним** (реальная
  проблема, тривиально: `key` на элементы массива шагов).
- React Compiler ×10 (`set-state-in-effect` ×6, `immutability` ×3,
  `preserve-manual-memoization` ×1) в `MainTaskItem`, `MainTaskStack`, `RoutineTaskItem`,
  `DateTimeSelector`, `useDragToClose`, `SheetHandle`, `day-switcher` — **понижены до warn**
  (см. конфиг). Исправление — переписывание эффектов и жестов, отдельная задача.
- Предупреждения (`no-unused-vars` ×33, `exhaustive-deps` ×13, `no-img-element` ×3) CI не
  валят, не трогаем.

**Документация:** в `CLAUDE.md` заменить «Тестов в проекте нет» на: `npm test` /
`npm run test:watch`, тесты рядом с файлами, хелперы в `src/shared/testing/`, что мокается;
обновить описание `lint`.

## Критерии готовности

- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` проходят локально.
- `taskStore.ts` не импортирует `firebase/firestore`.
- Все тесты из §4 написаны и зелёные.
- Workflow `ci.yml` зелёный на ветке.
- `CLAUDE.md` обновлён.
