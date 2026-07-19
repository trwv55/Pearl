# Персистентный DnD-порядок задач (главные + рутинные)

Дата: 2026-07-19

## Цель

Добавить drag-and-drop переупорядочивание **главных** задач в раскрытом стеке (по образцу
рутинных). Порядок сохраняется в Firestore. Заодно рутинные задачи получают персистентный
порядок (сейчас их DnD-порядок живёт только в сессии и сбрасывается при перезагрузке).

## Ключевые решения (из брейнсторминга)

- Порядок **персистится** в Firestore (не только в сессии).
- Применяется к **обоим** типам задач (главные и рутинные) — единый механизм.
- Числовое поле `order: number`; при DnD пересчитываются затронутые задачи, запись батчем.
- Существующие задачи без `order` — **ленивый фолбэк** при чтении (без разовой миграции).
  Фолбэк-ключ: `createdAt` (добавляется в маппинг). Задачи без `order` уходят в конец
  в порядке создания; при первом перетаскивании получают явный `order`.
- DnD включается **только в раскрытом стеке** главных; свёрнутый стек и его
  framer-motion анимация не трогаются.
- Свайп-для-удаления в главных **не должен пострадать** — переносим механизм
  сосуществования жестов из рутинных.

## Данные

### Модель `Task` (`src/shared/types/task.ts`)

Добавить:
- `order: number` — позиция в списке своего типа внутри дня.
- `createdAt: Date | null` — для фолбэк-сортировки старых задач.

### Маппинг doc→Task (3 места)

`taskStore.fetchTasks`, `taskStore.fetchTasksForRange`, `taskApi` (`getTasksByDate`,
`getTasksForRange`, `getTaskById`) — читать `order` (`typeof data.order === "number" ? data.order : undefined`… при
типе `number` в модели используем фолбэк на уровне сортировки) и `createdAt`
(`data.createdAt?.toDate() ?? null`).

Замечание: чтобы не ломать тип `order: number`, при чтении отсутствующего `order`
подставляем сентинел (напр. `Number.MAX_SAFE_INTEGER`), а тай-брейк — по `createdAt`.

### Сортировка

Единый компаратор:
```
by order asc (отсутствующий order = MAX_SAFE_INTEGER),
затем by createdAt asc (null = в конец).
```

## API (`src/shared/api/taskApi.ts`)

- `addTaskWithId` — принимает `order` в payload и пишет его в документ (расширяем `TaskPayload`
  либо отдельным аргументом; выбрать при реализации так, чтобы не сломать существующие вызовы).
- `updateTasksOrder(userId, updates: { id: string; order: number }[])` — батч-запись `order`
  через `writeBatch`.

## Стор (`src/shared/model/taskStore.ts`)

- computed `mainTasks` / `routineTasks` — применять компаратор сортировки.
- `createOptimistic` — вычислять `order` новой задачи локально: `max(order своего типа в дне) + 1`.
- `reorderOptimistic(userId, orderedTasks)` — оптимистично проставляет новые `order` в кэше
  текущей даты, батч-запись в фон, откат при ошибке (по образцу `createOptimistic`/`updateOptimistic`).

## UI

### Рутинные (`src/widgets/show-routine-tasks/index.tsx`)

`handleDragEnd` — после `arrayMove` вызвать `reorderOptimistic`, чтобы порядок персистился.
Локальный `taskOrder` остаётся для мгновенной отрисовки.

### Главные — `MainTaskStack` (`src/features/main-tasks/ui/MainTaskStack/index.tsx`)

- В раскрытом режиме (`isExpanded`) обернуть карты в `DndContext` + `SortableContext`
  (вертикальный список). Карты остаются `motion.div`.
- Свёрнутый режим — без изменений.
- Плейсхолдеры (`null`-задачи «Будущая задача») — **не** draggable.
- `handleDragEnd` → `reorderOptimistic`.

### `MainTaskItem` (`src/features/main-tasks/ui/MainTaskItem/index.tsx`)

- Задействовать проп `isDragging` (сейчас принимается, но не используется): сброс `showDelete`.
- Добавить `touchAction: "pan-y"` на карту.

## Сосуществование жестов (критично)

Переносим проверенный механизм из рутинных:
- `PointerSensor` с `activationConstraint: { delay: 1000, tolerance: 50 }`.
- `touchAction: "pan-y"` на карте — разводит оси (горизонтальный свайп → удаление,
  вертикальный drag → reorder).
- Сброс `showDelete` при `isDragging`.

Свайп-удаление в главных работает только при `isExpanded` — там же, где DnD, поэтому
разведение жестов обязательно.

## Что НЕ трогаем

- Свёрнутый стек и framer-motion анимацию.
- Логику завершения/удаления задач.
- Auth, статистику, прочее.

## Порядок реализации

1. Модель + маппинг (`order`, `createdAt` в 3 местах) + компаратор в computed.
2. API: `order` при создании + `updateTasksOrder` (батч).
3. Стор: `reorderOptimistic` + `order` в `createOptimistic`.
4. Рутинные: персист в `handleDragEnd`.
5. Главные: DnD в раскрытом стеке + жесты.
6. Сборка → проверка в симуляторе (свайп-удаление первым пунктом). Коммит только после
   подтверждения вживую.

## Риски

- DnD + framer-motion + жесты **не** верифицируются статически — обязательна проверка в
  симуляторе.
- Конфликт `transform` framer-motion vs dnd-kit: в раскрытом виде `y/scale` статичны,
  поэтому dnd-kit — единственный источник `transform` при драге.
