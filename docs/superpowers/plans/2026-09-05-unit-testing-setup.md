# Unit Testing Setup (Vitest) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить в Pearl юнит-тесты на бизнес-логику (MobX-сторы, `taskApi`, уведомления, хелперы) на Vitest и шаг проверки в GitHub Actions.

**Architecture:** Vitest + jsdom, тесты рядом с файлами (`*.test.ts`), общие хелперы в `src/shared/testing/`. Сеть изолируется на одной границе — `@/shared/api/taskApi` — для чего прямые обращения `taskStore` к Firestore переезжают в `taskApi`. Capacitor и sonner мокаются на уровне модулей. Классы сторов экспортируются, каждый тест создаёт свежий инстанс.

**Tech Stack:** Vitest (≥3), jsdom, vite-tsconfig-paths, MobX 6, date-fns 4, Firebase 11 (только типы/моки), GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-05-unit-testing-setup-design.md`

## Global Constraints

- Тесты — рядом с файлом: `src/shared/model/taskStore.test.ts`, не в корневом `tests/`.
- `globals: false` — `describe/it/expect/vi/beforeEach/afterEach` импортируются явно из `vitest`.
- В тестах сторов мокаются всегда: `@/shared/api/taskApi`, `@/shared/lib/notifications`, `@/shared/lib/showToast`, `@/shared/lib/showUndoToast`.
- После рефакторинга `src/shared/model/taskStore.ts` **не импортирует** `firebase/firestore` и `@/shared/lib/firebase`.
- Даты в тестах — только локальные конструкторы `new Date(2026, 8, 5)`, никаких ISO-строк.
- Комментарии в коде и UI-тексты — на русском; коммит-сообщения — кратко, на английском.
- `git push` не делать. Коммит после каждой задачи.
- Не трогать: `src/features/auth/lib/yupShemas.tsx` (чужое незакоммиченное изменение в рабочем дереве — не добавлять в коммиты).
- Финальные проверки (Task 10): `npm run lint` (0 ошибок), `npm run typecheck`, `npm test`, `npm run build` — все зелёные.

## Уже сделано (не повторять)

- `eslint.config.mjs` переписан на нативный flat-конфиг `eslint-config-next@16`, `eslint.config.js` удалён, `"lint": "eslint ."`, `jsx-key` в регистрации починен (коммит `8bd083b`). `npm run lint` → 0 ошибок / 59 предупреждений.

## Карта файлов

| Файл | Действие | Ответственность |
|---|---|---|
| `package.json` | modify | dev-зависимости, скрипты `test`, `test:watch`, `typecheck` |
| `vitest.config.ts` | create | конфиг раннера |
| `src/shared/testing/setup.ts` | create | `afterEach`-сброс: localStorage, таймеры, состояние мока API |
| `src/shared/testing/factories.ts` | create | `makeTask`/`makeMain`/`makeRoutine`, `TEST_DATE` |
| `src/shared/testing/async.ts` | create | `flushPromises()` |
| `src/shared/testing/mocks/taskApi.ts` | create | типизированный мок `taskApi` + `emitSnapshot`/`emitSubscriptionError`/`failNext`/`resetTaskApiMock` |
| `src/shared/types/task.test.ts` | create | `compareTaskOrder`, type guards |
| `src/shared/api/taskApi.ts` | modify | + `subscribeToTasksInRange` |
| `src/shared/api/taskApi.test.ts` | create | `mapDocToTask`, `updateTask`, батчи, подписка |
| `src/shared/model/taskStore.ts` | modify | вызовы Firestore → `taskApi`; `export class TaskStore` |
| `src/shared/model/statsStore.ts` | modify | `export class StatsStore` |
| `src/shared/model/taskRolloverStore.ts` | modify | `export class TaskRolloverStore` |
| `src/shared/model/notificationSettingsStore.ts` | modify | `export class NotificationSettingsStore` |
| `src/shared/model/taskStore.test.ts` | create | основной набор тестов стора |
| `src/shared/model/statsStore.test.ts` | create | недельная статистика |
| `src/shared/model/taskRolloverStore.test.ts` | create | тумблер автопродления |
| `src/shared/lib/notifications.test.ts` | create | id уведомлений, планирование |
| `src/shared/model/notificationSettingsStore.test.ts` | create | тумблер уведомлений |
| `.github/workflows/ci.yml` | create | lint + typecheck + test на push/PR |
| `CLAUDE.md` | modify | раздел про тесты, исправленный lint |

---

### Task 1: Vitest — установка, конфиг, хелперы, первый тест

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/shared/testing/setup.ts`
- Create: `src/shared/testing/factories.ts`
- Create: `src/shared/testing/async.ts`
- Test: `src/shared/types/task.test.ts`

**Interfaces:**
- Produces: `makeTask(overrides?: Partial<Task>): Task`, `makeMain(overrides?): TaskMain`, `makeRoutine(overrides?): TaskRoutine`, `TEST_DATE: Date` (5 сентября 2026, локальное), `flushPromises(): Promise<void>`.
- Produces: скрипты `npm test`, `npm run test:watch`, `npm run typecheck`.

- [ ] **Step 1: Установить зависимости**

Run: `npm install -D vitest jsdom vite-tsconfig-paths`
Expected: в `package.json` → `devDependencies` появились три пакета; `package-lock.json` обновлён. Убедиться, что версия vitest ≥ 3: `npx vitest --version`.

- [ ] **Step 2: Добавить скрипты в `package.json`**

В блоке `"scripts"` (сейчас: `dev`, `build`, `start`, `lint`) добавить:

```json
"test": "vitest run",
"test:watch": "vitest",
"typecheck": "tsc --noEmit"
```

- [ ] **Step 3: Создать `vitest.config.ts`**

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

- [ ] **Step 4: Создать `src/shared/testing/factories.ts`**

```ts
import type { Task, TaskMain, TaskRoutine } from "@/shared/types/task";

// Опорная дата тестов: 5 сентября 2026, локальное время (без TZ-сюрпризов ISO-строк).
export const TEST_DATE = new Date(2026, 8, 5);

let seq = 0;

// Валидная задача с дефолтами; переопределяется через overrides.
export function makeTask(overrides: Partial<Task> = {}): Task {
	seq += 1;
	return {
		id: `t${seq}`,
		title: `Задача ${seq}`,
		comment: "",
		date: TEST_DATE,
		emoji: "✅",
		isMain: false,
		markerColor: "#000000",
		isCompleted: false,
		completedAt: null,
		time: null,
		order: 0,
		createdAt: new Date(2026, 8, 1, 12, 0, seq),
		...overrides,
	};
}

export const makeMain = (overrides: Partial<Task> = {}): TaskMain =>
	makeTask({ ...overrides, isMain: true }) as TaskMain;

export const makeRoutine = (overrides: Partial<Task> = {}): TaskRoutine =>
	makeTask({ ...overrides, isMain: false }) as TaskRoutine;
```

- [ ] **Step 5: Создать `src/shared/testing/async.ts`**

```ts
// Дожидается microtask-очереди и одного макротаска: нужно, чтобы отработали
// .catch-ветки оптимистичных операций после реджекта мока API.
// При включённых fake timers вместо этого использовать vi.runAllTimersAsync().
export const flushPromises = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));
```

- [ ] **Step 6: Создать `src/shared/testing/setup.ts`**

Пока без сброса мока API (он появится в Task 4):

```ts
import { afterEach, vi } from "vitest";

afterEach(() => {
	window.localStorage.clear();
	vi.useRealTimers();
});
```

- [ ] **Step 7: Написать первый тест `src/shared/types/task.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { compareTaskOrder, isTaskMain, isTaskRoutine, NO_ORDER } from "@/shared/types/task";
import { makeMain, makeRoutine, makeTask } from "@/shared/testing/factories";

describe("compareTaskOrder", () => {
	it("сортирует по order по возрастанию", () => {
		const a = makeTask({ order: 2 });
		const b = makeTask({ order: 1 });
		expect([a, b].sort(compareTaskOrder).map((t) => t.id)).toEqual([b.id, a.id]);
	});

	it("при равном order — старые (по createdAt) раньше", () => {
		const older = makeTask({ order: 0, createdAt: new Date(2026, 8, 1, 10) });
		const newer = makeTask({ order: 0, createdAt: new Date(2026, 8, 1, 11) });
		expect([newer, older].sort(compareTaskOrder).map((t) => t.id)).toEqual([older.id, newer.id]);
	});

	it("задачи без order (NO_ORDER) уходят в конец", () => {
		const legacy = makeTask({ order: NO_ORDER });
		const explicit = makeTask({ order: 5 });
		expect([legacy, explicit].sort(compareTaskOrder).map((t) => t.id)).toEqual([explicit.id, legacy.id]);
	});

	it("при равном order задача без createdAt — последняя", () => {
		const withDate = makeTask({ order: 0, createdAt: new Date(2026, 8, 1) });
		const noDate = makeTask({ order: 0, createdAt: null });
		expect([noDate, withDate].sort(compareTaskOrder).map((t) => t.id)).toEqual([withDate.id, noDate.id]);
	});
});

describe("type guards", () => {
	it("isTaskMain / isTaskRoutine различают по isMain", () => {
		expect(isTaskMain(makeMain())).toBe(true);
		expect(isTaskRoutine(makeMain())).toBe(false);
		expect(isTaskMain(makeRoutine())).toBe(false);
		expect(isTaskRoutine(makeRoutine())).toBe(true);
	});
});
```

- [ ] **Step 8: Запустить тесты**

Run: `npm test`
Expected: `1 passed (1)` файл, 5 тестов PASS. Если падает резолв `@/…` — проверить, что `vite-tsconfig-paths` подключён в `vitest.config.ts`.

- [ ] **Step 9: Проверить typecheck и lint**

Run: `npm run typecheck && npm run lint`
Expected: typecheck без вывода (exit 0); lint — 0 ошибок (предупреждения допустимы).

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/shared/testing src/shared/types/task.test.ts
git commit -m "test: add vitest setup, factories and compareTaskOrder tests"
```

---

### Task 2: `taskApi.subscribeToTasksInRange` + тесты `taskApi`

**Files:**
- Modify: `src/shared/api/taskApi.ts` (импорты строки 3-18; добавить функцию после `getTasksForRange`, строка ~110)
- Test: `src/shared/api/taskApi.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export const subscribeToTasksInRange = (
  	userId: string,
  	startDate: Date,
  	endDate: Date,
  	onTasks: (tasks: Task[]) => void,
  	onError: (error: Error) => void,
  ): (() => void)
  ```
  Диапазон — `[startOfDay(startDate), startOfDay(endDate + 1 день))`, как у `getTasksForRange`. Возвращает функцию отписки `onSnapshot`.

- [ ] **Step 1: Написать тесты `src/shared/api/taskApi.test.ts`**

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDocs, onSnapshot, updateDoc, writeBatch } from "firebase/firestore";
import {
	getTasksForRange,
	mapDocToTask,
	rolloverTasks,
	subscribeToTasksInRange,
	updateTask,
	updateTasksOrder,
} from "@/shared/api/taskApi";
import { NO_ORDER } from "@/shared/types/task";

vi.mock("@/shared/lib/firebase", () => ({ getFirebaseDb: () => ({}) }));

vi.mock("firebase/firestore", () => ({
	collection: vi.fn((_db: unknown, ...path: string[]) => ({ path })),
	doc: vi.fn((_db: unknown, ...path: string[]) => ({ path })),
	query: vi.fn((ref: unknown, ...constraints: unknown[]) => ({ ref, constraints })),
	where: vi.fn((field: string, op: string, value: unknown) => ({ field, op, value })),
	getDocs: vi.fn(),
	getDoc: vi.fn(),
	setDoc: vi.fn(),
	updateDoc: vi.fn(),
	deleteDoc: vi.fn(),
	addDoc: vi.fn(),
	runTransaction: vi.fn(),
	serverTimestamp: vi.fn(() => "SERVER_TIMESTAMP"),
	writeBatch: vi.fn(),
	onSnapshot: vi.fn(),
}));

// Имитация Firestore Timestamp: у него есть toDate().
const ts = (d: Date) => ({ toDate: () => d });

const baseDoc = {
	title: "Купить хлеб",
	comment: "",
	emoji: "🍞",
	isMain: true,
	markerColor: "#fff",
	isCompleted: false,
};

describe("mapDocToTask", () => {
	it("разворачивает Timestamp в Date и подставляет дефолты", () => {
		const date = new Date(2026, 8, 5);
		const created = new Date(2026, 8, 1);
		const task = mapDocToTask("id1", {
			...baseDoc,
			date: ts(date),
			completedAt: null,
			time: 600,
			order: 2,
			createdAt: ts(created),
		});
		expect(task).toEqual({
			id: "id1",
			...baseDoc,
			date,
			completedAt: null,
			time: 600,
			order: 2,
			createdAt: created,
		});
	});

	it("принимает date как обычный Date", () => {
		const date = new Date(2026, 8, 5);
		expect(mapDocToTask("id1", { ...baseDoc, date }).date).toBe(date);
	});

	it("отсутствующие completedAt/createdAt → null, time не число → null, нет order → NO_ORDER", () => {
		const task = mapDocToTask("id1", { ...baseDoc, date: new Date(2026, 8, 5), time: "10:00" });
		expect(task.completedAt).toBeNull();
		expect(task.createdAt).toBeNull();
		expect(task.time).toBeNull();
		expect(task.order).toBe(NO_ORDER);
	});

	it("completedAt с Timestamp разворачивается в Date", () => {
		const done = new Date(2026, 8, 5, 15);
		const task = mapDocToTask("id1", { ...baseDoc, date: new Date(2026, 8, 5), completedAt: ts(done) });
		expect(task.completedAt).toEqual(done);
	});
});

describe("updateTask", () => {
	it("пишет только заданные поля плюс updatedAt", async () => {
		await updateTask("u1", "t1", { title: "Новое", time: undefined });
		expect(updateDoc).toHaveBeenCalledTimes(1);
		const [, data] = vi.mocked(updateDoc).mock.calls[0];
		expect(data).toEqual({ title: "Новое", updatedAt: "SERVER_TIMESTAMP" });
	});
});

describe("батчи", () => {
	let batch: { update: ReturnType<typeof vi.fn>; commit: ReturnType<typeof vi.fn> };

	beforeEach(() => {
		batch = { update: vi.fn(), commit: vi.fn(async () => {}) };
		vi.mocked(writeBatch).mockReturnValue(batch as never);
	});

	it("updateTasksOrder: пустой список — батч не создаётся", async () => {
		await updateTasksOrder("u1", []);
		expect(writeBatch).not.toHaveBeenCalled();
	});

	it("updateTasksOrder: по update на задачу и один commit", async () => {
		await updateTasksOrder("u1", [
			{ id: "a", order: 0 },
			{ id: "b", order: 1 },
		]);
		expect(batch.update).toHaveBeenCalledTimes(2);
		expect(batch.update.mock.calls[1][1]).toEqual({ order: 1, updatedAt: "SERVER_TIMESTAMP" });
		expect(batch.commit).toHaveBeenCalledTimes(1);
	});

	it("rolloverTasks: пустой список — батч не создаётся", async () => {
		await rolloverTasks("u1", []);
		expect(writeBatch).not.toHaveBeenCalled();
	});

	it("rolloverTasks: пишет date, isMain, order и updatedAt", async () => {
		const date = new Date(2026, 8, 5);
		await rolloverTasks("u1", [{ id: "a", date, isMain: false, order: 3 }]);
		expect(batch.update.mock.calls[0][1]).toEqual({ date, isMain: false, order: 3, updatedAt: "SERVER_TIMESTAMP" });
		expect(batch.commit).toHaveBeenCalledTimes(1);
	});
});

describe("getTasksForRange", () => {
	it("маппит документы снапшота в Task", async () => {
		vi.mocked(getDocs).mockResolvedValue({
			docs: [{ id: "a", data: () => ({ ...baseDoc, date: new Date(2026, 8, 5) }) }],
		} as never);
		const tasks = await getTasksForRange("u1", new Date(2026, 8, 1), new Date(2026, 8, 7));
		expect(tasks).toHaveLength(1);
		expect(tasks[0].id).toBe("a");
	});
});

describe("subscribeToTasksInRange", () => {
	it("прокидывает смаппленные задачи в onTasks, ошибку — в onError, возвращает отписку", () => {
		const unsubscribe = vi.fn();
		vi.mocked(onSnapshot).mockReturnValue(unsubscribe as never);

		const onTasks = vi.fn();
		const onError = vi.fn();
		const result = subscribeToTasksInRange("u1", new Date(2026, 8, 1), new Date(2026, 8, 7), onTasks, onError);

		expect(result).toBe(unsubscribe);
		const [, onNext, onErr] = vi.mocked(onSnapshot).mock.calls[0] as unknown as [
			unknown,
			(snap: { docs: { id: string; data: () => unknown }[] }) => void,
			(e: Error) => void,
		];

		onNext({ docs: [{ id: "a", data: () => ({ ...baseDoc, date: new Date(2026, 8, 5) }) }] });
		expect(onTasks).toHaveBeenCalledTimes(1);
		expect(onTasks.mock.calls[0][0][0].id).toBe("a");

		const err = new Error("permission-denied");
		onErr(err);
		expect(onError).toHaveBeenCalledWith(err);
	});
});
```

- [ ] **Step 2: Запустить — убедиться, что падает на отсутствующем экспорте**

Run: `npx vitest run src/shared/api/taskApi.test.ts`
Expected: FAIL — `subscribeToTasksInRange` не экспортируется (`is not a function` / `No "subscribeToTasksInRange" export`). Остальные describe могут проходить.

- [ ] **Step 3: Добавить `subscribeToTasksInRange` в `src/shared/api/taskApi.ts`**

В импорт из `firebase/firestore` (строки 3-18) добавить `onSnapshot`. После `getTasksForRange` (после строки 110) вставить:

```ts
// Живая подписка на задачи диапазона [startDate, endDate] (по дням, включительно).
// Каждый снапшот целиком отдаётся в onTasks уже смаппленным. Возвращает функцию отписки.
export const subscribeToTasksInRange = (
	userId: string,
	startDate: Date,
	endDate: Date,
	onTasks: (tasks: Task[]) => void,
	onError: (error: Error) => void,
): (() => void) => {
	const db = getFirebaseDb();
	const q = query(
		collection(db, "users", userId, "tasks"),
		where("date", ">=", startOfDay(startDate)),
		where("date", "<", startOfDay(addDays(endDate, 1))),
	);

	return onSnapshot(
		q,
		(snapshot) => onTasks(snapshot.docs.map((d) => mapDocToTask(d.id, d.data()))),
		onError,
	);
};
```

- [ ] **Step 4: Запустить тесты**

Run: `npx vitest run src/shared/api/taskApi.test.ts`
Expected: все тесты файла PASS (11 тестов).

- [ ] **Step 5: Typecheck и commit**

Run: `npm run typecheck`
Expected: exit 0.

```bash
git add src/shared/api/taskApi.ts src/shared/api/taskApi.test.ts
git commit -m "feat(api): add subscribeToTasksInRange, cover taskApi mapping and batches"
```

---

### Task 3: Рефакторинг `taskStore` на границу `taskApi` + экспорт классов

**Files:**
- Modify: `src/shared/model/taskStore.ts` (импорты строки 3-30; методы `fetchTasks` 131-151, `fetchTasksForRange` 153-191, `subscribeToRange` 197-239, `rolloverOverdueMainTasks` 485-545; объявление класса строка 32)
- Modify: `src/shared/model/statsStore.ts:18` (`class StatsStore` → `export class StatsStore`)
- Modify: `src/shared/model/taskRolloverStore.ts:12` (`class TaskRolloverStore` → `export class TaskRolloverStore`)
- Modify: `src/shared/model/notificationSettingsStore.ts:12` (`class NotificationSettingsStore` → `export class NotificationSettingsStore`)

**Interfaces:**
- Consumes: `getTasksByDate`, `getTasksForRange`, `subscribeToTasksInRange` из `@/shared/api/taskApi` (Task 2).
- Produces: `export class TaskStore`, `StatsStore`, `TaskRolloverStore`, `NotificationSettingsStore`. Публичные сигнатуры методов не меняются.

- [ ] **Step 1: Заменить импорты в `taskStore.ts`**

Удалить строки:

```ts
import { getFirebaseDb } from "@/shared/lib/firebase";
import { collection, getDocs, onSnapshot, query, where } from "firebase/firestore";
```

Импорт из `@/shared/api/taskApi` привести к виду (убран `mapDocToTask`, добавлены три функции чтения):

```ts
import {
	deleteTask as deleteTaskApi,
	toggleTaskCompletion,
	addTaskWithId,
	generateTaskId,
	updateTask,
	updateTasksOrder,
	rolloverTasks,
	getTasksByDate,
	getTasksForRange,
	subscribeToTasksInRange,
	type TaskPayload,
} from "@/shared/api/taskApi";
```

- [ ] **Step 2: `class TaskStore` → `export class TaskStore`** (строка 32). Синглтон `export const taskStore = new TaskStore();` остаётся.

- [ ] **Step 3: Переписать `fetchTasks`**

```ts
	async fetchTasks(userId: string, date: Date = this.selectedDate) {
		try {
			const tasks = await getTasksByDate(userId, date);

			runInAction(() => {
				const key = this.getDateKey(date);
				this.taskCache.set(key, tasks);

				if (this.getDateKey(this.selectedDate) === key) {
					this.tasks = tasks;
				}
			});
		} catch (error) {
			console.error("Ошибка при загрузке задач:", error);
		}
	}
```

- [ ] **Step 4: Переписать `fetchTasksForRange`**

```ts
	async fetchTasksForRange(userId: string, startDate: Date, endDate: Date) {
		try {
			const tasks = await getTasksForRange(userId, startDate, endDate);
			const groupedTasks: Map<string, Task[]> = new Map();

			tasks.forEach((task) => {
				const key = this.getDateKey(task.date);
				if (!groupedTasks.has(key)) {
					groupedTasks.set(key, []);
				}
				groupedTasks.get(key)!.push(task);
			});

			runInAction(() => {
				// Помечаем загруженным ВЕСЬ диапазон, включая дни без задач —
				// иначе пустой день выглядит как незагруженный и мы шлём лишний запрос.
				for (let d = startOfDay(startDate); d < startOfDay(addDays(endDate, 1)); d = addDays(d, 1)) {
					const key = this.getDateKey(d);
					this.taskCache.set(key, groupedTasks.get(key) ?? []);
				}

				const selectedKey = this.getDateKey(this.selectedDate);
				if (this.taskCache.has(selectedKey)) {
					this.tasks = this.taskCache.get(selectedKey)!;
				}
			});
		} catch (error) {
			console.error("Ошибка при загрузке задач за диапазон:", error);
		}
	}
```

- [ ] **Step 5: Переписать `subscribeToRange`**

```ts
	// Живая подписка на задачи диапазона: изменения (в т.ч. с другого устройства)
	// прилетают сразу. Возвращает функцию отписки. onReady зовётся после первого
	// снапшота (для снятия скелетона). Задачи в pendingDeletions игнорируются —
	// иначе сервер «вернул» бы задачу в окне undo-удаления.
	subscribeToRange(userId: string, startDate: Date, endDate: Date, onReady?: () => void): () => void {
		const start = startOfDay(startDate);
		const end = startOfDay(addDays(endDate, 1));

		let ready = false;
		const markReady = () => {
			if (ready) return;
			ready = true;
			onReady?.();
		};

		return subscribeToTasksInRange(
			userId,
			startDate,
			endDate,
			(tasks) => {
				const grouped: Map<string, Task[]> = new Map();
				tasks.forEach((task) => {
					if (this.pendingDeletions.has(task.id)) return;
					const key = this.getDateKey(task.date);
					if (!grouped.has(key)) grouped.set(key, []);
					grouped.get(key)!.push(task);
				});

				runInAction(() => {
					for (let d = start; d < end; d = addDays(d, 1)) {
						const key = this.getDateKey(d);
						this.taskCache.set(key, grouped.get(key) ?? []);
					}
					const selectedKey = this.getDateKey(this.selectedDate);
					if (this.taskCache.has(selectedKey)) {
						this.tasks = this.taskCache.get(selectedKey)!;
					}
				});
				markReady();
			},
			(error) => {
				console.error("Ошибка realtime-подписки на задачи:", error);
				markReady();
			},
		);
	}
```

- [ ] **Step 6: В `rolloverOverdueMainTasks` заменить блок запроса**

Строки 494-501 (от `const db = getFirebaseDb();` до `const all = snapshot.docs.map(...)`) заменить на:

```ts
		// Одним запросом тянем и просроченные дни [since, activeDay), и сам activeDay:
		// существующие главные активного дня считаем из ТОЙ ЖЕ свежей выборки, а не
		// из локального кэша — иначе счётчик отставал и главных становилось >3.
		const all = await getTasksForRange(userId, since, activeDay);
```

Остальное тело метода — без изменений.

- [ ] **Step 7: Экспортировать остальные классы**

В `statsStore.ts`, `taskRolloverStore.ts`, `notificationSettingsStore.ts` добавить `export` перед `class …`. Синглтоны не трогать.

- [ ] **Step 8: Убедиться, что Firestore из стора ушёл**

Run: `grep -n "firebase" src/shared/model/taskStore.ts`
Expected: пусто.

- [ ] **Step 9: Typecheck, lint, тесты, сборка**

Run: `npm run typecheck && npm run lint && npm test && npm run build`
Expected: typecheck exit 0; lint 0 ошибок; тесты PASS; `next build` завершается успешно, `out/` обновлён.

- [ ] **Step 10: Commit**

```bash
git add src/shared/model/taskStore.ts src/shared/model/statsStore.ts src/shared/model/taskRolloverStore.ts src/shared/model/notificationSettingsStore.ts
git commit -m "refactor(store): route all Firestore reads through taskApi, export store classes"
```

---

### Task 4: Мок `taskApi` + тесты кэша/загрузки/подписки `taskStore`

**Files:**
- Create: `src/shared/testing/mocks/taskApi.ts`
- Modify: `src/shared/testing/setup.ts`
- Test: `src/shared/model/taskStore.test.ts` (создать; дополняется в Tasks 5-7)

**Interfaces:**
- Produces из `@/shared/testing/mocks/taskApi`:
  - `mockTaskApi` — объект со всеми экспортами `taskApi` как `vi.fn` с дефолтными реализациями (промисы резолвятся; `generateTaskId` → `"task-1"`, `"task-2"`, …; `subscribeToTasksInRange` запоминает колбэки и возвращает `unsubscribeMock`).
  - `unsubscribeMock: Mock`
  - `emitSnapshot(tasks: Task[]): void` — вызывает сохранённый `onTasks`.
  - `emitSubscriptionError(error: Error): void` — вызывает сохранённый `onError`.
  - `failNext(name: keyof typeof mockTaskApi, error?: Error): void` — `mockRejectedValueOnce`.
  - `resetTaskApiMock(): void` — сброс счётчика id и колбэков.
- Способ подключения в тестах:
  ```ts
  vi.mock("@/shared/api/taskApi", async () => (await import("@/shared/testing/mocks/taskApi")).mockTaskApi);
  ```

- [ ] **Step 1: Создать `src/shared/testing/mocks/taskApi.ts`**

```ts
import { vi, type Mock } from "vitest";
import type { Task } from "@/shared/types/task";

type Subscription = {
	onTasks: (tasks: Task[]) => void;
	onError: (error: Error) => void;
};

let idCounter = 0;
let subscription: Subscription | null = null;

export const unsubscribeMock = vi.fn();

// Полный мок @/shared/api/taskApi: все функции — vi.fn с «успешной» реализацией
// по умолчанию. Подключается в тестах через
//   vi.mock("@/shared/api/taskApi", async () => (await import("@/shared/testing/mocks/taskApi")).mockTaskApi);
export const mockTaskApi = {
	generateTaskId: vi.fn((_userId: string) => `task-${++idCounter}`),
	addTaskWithId: vi.fn(async () => {}),
	addTask: vi.fn(async () => `task-${++idCounter}`),
	mapDocToTask: vi.fn(),
	getTasksByDate: vi.fn(async (): Promise<Task[]> => []),
	getTasksForRange: vi.fn(async (): Promise<Task[]> => []),
	subscribeToTasksInRange: vi.fn(
		(
			_userId: string,
			_startDate: Date,
			_endDate: Date,
			onTasks: Subscription["onTasks"],
			onError: Subscription["onError"],
		) => {
			subscription = { onTasks, onError };
			return unsubscribeMock;
		},
	),
	deleteTask: vi.fn(async () => {}),
	updateTasksOrder: vi.fn(async () => {}),
	rolloverTasks: vi.fn(async () => {}),
	getTaskById: vi.fn(async () => null),
	updateTask: vi.fn(async () => {}),
	toggleTaskCompletion: vi.fn(async () => ({}) as Task),
};

// Эмитит снапшот в последнюю подписку subscribeToTasksInRange.
export function emitSnapshot(tasks: Task[]) {
	if (!subscription) throw new Error("subscribeToTasksInRange ещё не вызывался");
	subscription.onTasks(tasks);
}

export function emitSubscriptionError(error: Error) {
	if (!subscription) throw new Error("subscribeToTasksInRange ещё не вызывался");
	subscription.onError(error);
}

// Следующий вызов указанной функции API реджектится.
export function failNext(name: keyof typeof mockTaskApi, error: Error = new Error("boom")) {
	(mockTaskApi[name] as unknown as Mock).mockRejectedValueOnce(error);
}

export function resetTaskApiMock() {
	idCounter = 0;
	subscription = null;
}
```

- [ ] **Step 2: Подключить сброс в `src/shared/testing/setup.ts`**

```ts
import { afterEach, vi } from "vitest";
import { resetTaskApiMock } from "./mocks/taskApi";

afterEach(() => {
	window.localStorage.clear();
	vi.useRealTimers();
	resetTaskApiMock();
});
```

- [ ] **Step 3: Создать `src/shared/model/taskStore.test.ts` с шапкой и тестами кэша/загрузки/подписки**

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { addDays } from "date-fns";
import { TaskStore } from "@/shared/model/taskStore";
import { makeMain, makeRoutine, makeTask, TEST_DATE } from "@/shared/testing/factories";
import { flushPromises } from "@/shared/testing/async";
import {
	emitSnapshot,
	emitSubscriptionError,
	failNext,
	mockTaskApi,
	unsubscribeMock,
} from "@/shared/testing/mocks/taskApi";
import { NO_ORDER, type Task } from "@/shared/types/task";
import { showErrorToast } from "@/shared/lib/showToast";
import { showUndoToast } from "@/shared/lib/showUndoToast";
import { cancelTaskNotification, scheduleTaskNotification } from "@/shared/lib/notifications";

vi.mock("@/shared/api/taskApi", async () => (await import("@/shared/testing/mocks/taskApi")).mockTaskApi);
vi.mock("@/shared/lib/notifications", () => ({
	scheduleTaskNotification: vi.fn(async () => {}),
	cancelTaskNotification: vi.fn(async () => {}),
}));
vi.mock("@/shared/lib/showToast", () => ({
	showErrorToast: vi.fn(),
	showSuccessToast: vi.fn(),
}));
vi.mock("@/shared/lib/showUndoToast", () => ({
	showUndoToast: vi.fn(),
}));

const USER = "u1";
const OTHER_DATE = addDays(TEST_DATE, 1);
const ids = (tasks: Task[]) => tasks.map((t) => t.id);

let store: TaskStore;

beforeEach(() => {
	store = new TaskStore();
	store.setSelectedDate(TEST_DATE);
});

describe("кэш и выбранная дата", () => {
	it("setSelectedDate берёт задачи из кэша или даёт пустой список", async () => {
		const task = makeTask({ date: TEST_DATE });
		mockTaskApi.getTasksByDate.mockResolvedValueOnce([task]);
		await store.fetchTasks(USER, TEST_DATE);

		store.setSelectedDate(OTHER_DATE);
		expect(store.tasks).toEqual([]);

		store.setSelectedDate(TEST_DATE);
		expect(ids(store.tasks)).toEqual([task.id]);
	});

	it("hasTasksForDate ложно для пустого, но загруженного дня; isDateLoaded — истинно", async () => {
		mockTaskApi.getTasksByDate.mockResolvedValueOnce([]);
		await store.fetchTasks(USER, TEST_DATE);

		expect(store.isDateLoaded(TEST_DATE)).toBe(true);
		expect(store.hasTasksForDate(TEST_DATE)).toBe(false);
		expect(store.isDateLoaded(OTHER_DATE)).toBe(false);
	});

	it("clearCache очищает кэш и текущий список", async () => {
		mockTaskApi.getTasksByDate.mockResolvedValueOnce([makeTask()]);
		await store.fetchTasks(USER, TEST_DATE);

		store.clearCache();
		expect(store.tasks).toEqual([]);
		expect(store.isDateLoaded(TEST_DATE)).toBe(false);
	});
});

describe("fetchTasks", () => {
	it("кладёт задачи в кэш даты и обновляет tasks только для выбранной даты", async () => {
		const other = makeTask({ date: OTHER_DATE });
		mockTaskApi.getTasksByDate.mockResolvedValueOnce([other]);
		await store.fetchTasks(USER, OTHER_DATE);

		expect(store.tasks).toEqual([]);
		expect(ids(store.getTasksForDate(OTHER_DATE))).toEqual([other.id]);
	});

	it("ошибка API — состояние не меняется", async () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		failNext("getTasksByDate");
		await store.fetchTasks(USER, TEST_DATE);

		expect(store.isDateLoaded(TEST_DATE)).toBe(false);
		expect(store.tasks).toEqual([]);
	});
});

describe("fetchTasksForRange", () => {
	it("помечает загруженными все дни диапазона, включая пустые", async () => {
		const start = TEST_DATE;
		const end = addDays(TEST_DATE, 2);
		const mid = makeTask({ date: addDays(TEST_DATE, 1) });
		mockTaskApi.getTasksForRange.mockResolvedValueOnce([mid]);

		await store.fetchTasksForRange(USER, start, end);

		expect(store.isDateLoaded(start)).toBe(true);
		expect(store.isDateLoaded(addDays(start, 1))).toBe(true);
		expect(store.isDateLoaded(end)).toBe(true);
		expect(store.isDateLoaded(addDays(end, 1))).toBe(false);
		expect(ids(store.getTasksForDate(addDays(start, 1)))).toEqual([mid.id]);
	});

	it("обновляет tasks, если выбранная дата в диапазоне", async () => {
		const task = makeTask({ date: TEST_DATE });
		mockTaskApi.getTasksForRange.mockResolvedValueOnce([task]);
		await store.fetchTasksForRange(USER, addDays(TEST_DATE, -1), addDays(TEST_DATE, 1));
		expect(ids(store.tasks)).toEqual([task.id]);
	});
});

describe("ensureTasksForDate", () => {
	it("не дублирует запрос при параллельном вызове и не ходит за загруженной датой", async () => {
		let resolve!: (tasks: Task[]) => void;
		mockTaskApi.getTasksByDate.mockReturnValueOnce(new Promise<Task[]>((r) => (resolve = r)));

		const p1 = store.ensureTasksForDate(USER, TEST_DATE);
		const p2 = store.ensureTasksForDate(USER, TEST_DATE);
		expect(mockTaskApi.getTasksByDate).toHaveBeenCalledTimes(1);

		resolve([]);
		await Promise.all([p1, p2]);
		expect(store.isDateLoaded(TEST_DATE)).toBe(true);

		await store.ensureTasksForDate(USER, TEST_DATE);
		expect(mockTaskApi.getTasksByDate).toHaveBeenCalledTimes(1);
	});
});

describe("subscribeToRange", () => {
	it("раскладывает снапшот по датам и обновляет выбранную", () => {
		const a = makeTask({ date: TEST_DATE });
		const b = makeTask({ date: OTHER_DATE });
		store.subscribeToRange(USER, TEST_DATE, OTHER_DATE);

		emitSnapshot([a, b]);

		expect(ids(store.tasks)).toEqual([a.id]);
		expect(ids(store.getTasksForDate(OTHER_DATE))).toEqual([b.id]);
		expect(store.isDateLoaded(OTHER_DATE)).toBe(true);
	});

	it("onReady вызывается один раз — на первом снапшоте", () => {
		const onReady = vi.fn();
		store.subscribeToRange(USER, TEST_DATE, OTHER_DATE, onReady);

		emitSnapshot([]);
		emitSnapshot([]);
		expect(onReady).toHaveBeenCalledTimes(1);
	});

	it("onReady вызывается и при ошибке подписки", () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		const onReady = vi.fn();
		store.subscribeToRange(USER, TEST_DATE, OTHER_DATE, onReady);

		emitSubscriptionError(new Error("permission-denied"));
		expect(onReady).toHaveBeenCalledTimes(1);
	});

	it("игнорирует задачи, ожидающие удаления (окно undo)", () => {
		vi.useFakeTimers();
		const task = makeTask({ date: TEST_DATE });
		store.subscribeToRange(USER, TEST_DATE, OTHER_DATE);
		emitSnapshot([task]);

		store.deleteWithUndo(USER, task);
		emitSnapshot([task]); // сервер ещё «видит» задачу

		expect(store.tasks).toEqual([]);
	});

	it("возвращает функцию отписки из API", () => {
		expect(store.subscribeToRange(USER, TEST_DATE, OTHER_DATE)).toBe(unsubscribeMock);
	});
});
```

- [ ] **Step 4: Запустить**

Run: `npx vitest run src/shared/model/taskStore.test.ts`
Expected: все тесты PASS (13). Если `vi.mock` ругается на отсутствующий экспорт — сверить список ключей `mockTaskApi` с импортами `taskStore.ts`.

- [ ] **Step 5: Typecheck и commit**

Run: `npm run typecheck`
Expected: exit 0. Неиспользуемые импорты в тест-файле (`makeMain`, `makeRoutine`, `NO_ORDER`, `showErrorToast`, `showUndoToast`, `scheduleTaskNotification`, `cancelTaskNotification`, `flushPromises`) пока дадут warning от eslint — они понадобятся в Tasks 5-7; это допустимо (warn, не error).

```bash
git add src/shared/testing src/shared/model/taskStore.test.ts
git commit -m "test(store): taskApi mock helper, cache/fetch/subscribe tests for TaskStore"
```

---

### Task 5: Оптимистичные операции `taskStore` — create / update / reorder / toggle

**Files:**
- Test: `src/shared/model/taskStore.test.ts` (дописать в конец)

**Interfaces:**
- Consumes: `store.createOptimistic(userId, payload): string`, `store.updateOptimistic(userId, prevTask, payload)`, `store.reorderOptimistic(userId, orderedTasks)`, `store.toggleCompletion(userId, taskId): Promise<void>`; моки из Task 4.

- [ ] **Step 1: Дописать тесты**

```ts
const payload = (overrides: Partial<Parameters<TaskStore["createOptimistic"]>[1]> = {}) => ({
	title: "Новая",
	comment: "",
	date: TEST_DATE,
	emoji: "🆕",
	isMain: false,
	markerColor: "#000000",
	time: null,
	...overrides,
});

describe("createOptimistic", () => {
	it("сразу кладёт задачу в кэш своей даты и планирует уведомление", () => {
		const id = store.createOptimistic(USER, payload({ date: OTHER_DATE, time: 600 }));

		expect(id).toBe("task-1");
		expect(store.tasks).toEqual([]); // выбрана TEST_DATE, задача на OTHER_DATE
		expect(ids(store.getTasksForDate(OTHER_DATE))).toEqual(["task-1"]);
		expect(scheduleTaskNotification).toHaveBeenCalledWith(expect.objectContaining({ id: "task-1", time: 600 }));
		expect(mockTaskApi.addTaskWithId).toHaveBeenCalledWith(USER, "task-1", expect.objectContaining({ title: "Новая" }), 0);
	});

	it("order = max среди задач того же типа + 1, NO_ORDER игнорируется", async () => {
		mockTaskApi.getTasksByDate.mockResolvedValueOnce([
			makeRoutine({ order: 4 }),
			makeRoutine({ order: NO_ORDER }),
			makeMain({ order: 9 }),
		]);
		await store.fetchTasks(USER, TEST_DATE);

		store.createOptimistic(USER, payload({ isMain: false }));
		expect(store.getTasksForDate(TEST_DATE)[0].order).toBe(5);
	});

	it("ошибка API → задача убрана, уведомление отменено, error-тост", async () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		failNext("addTaskWithId");

		const id = store.createOptimistic(USER, payload());
		expect(ids(store.tasks)).toEqual([id]);

		await flushPromises();

		expect(store.tasks).toEqual([]);
		expect(cancelTaskNotification).toHaveBeenCalledWith(id);
		expect(showErrorToast).toHaveBeenCalledTimes(1);
	});
});

describe("updateOptimistic", () => {
	it("заменяет задачу на месте, сохраняя позицию", async () => {
		const a = makeTask({ title: "A" });
		const b = makeTask({ title: "B" });
		mockTaskApi.getTasksByDate.mockResolvedValueOnce([a, b]);
		await store.fetchTasks(USER, TEST_DATE);

		store.updateOptimistic(USER, b, { title: "B2" });

		expect(store.tasks.map((t) => t.title)).toEqual(["A", "B2"]);
		expect(mockTaskApi.updateTask).toHaveBeenCalledWith(USER, b.id, { title: "B2" });
	});

	it("перенос на другую дату: уходит из старого кэша, появляется в новом", async () => {
		const task = makeTask({ date: TEST_DATE });
		mockTaskApi.getTasksByDate.mockResolvedValueOnce([task]);
		await store.fetchTasks(USER, TEST_DATE);

		store.updateOptimistic(USER, task, { date: OTHER_DATE });

		expect(store.tasks).toEqual([]);
		expect(ids(store.getTasksForDate(OTHER_DATE))).toEqual([task.id]);
		expect(cancelTaskNotification).toHaveBeenCalledWith(task.id);
		expect(scheduleTaskNotification).toHaveBeenLastCalledWith(expect.objectContaining({ id: task.id, date: OTHER_DATE }));
	});

	it("ошибка API → откат, включая обратный перенос даты", async () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		const task = makeTask({ date: TEST_DATE, title: "Старое" });
		mockTaskApi.getTasksByDate.mockResolvedValueOnce([task]);
		await store.fetchTasks(USER, TEST_DATE);
		failNext("updateTask");

		store.updateOptimistic(USER, task, { date: OTHER_DATE, title: "Новое" });
		await flushPromises();

		expect(store.tasks.map((t) => t.title)).toEqual(["Старое"]);
		expect(store.getTasksForDate(OTHER_DATE)).toEqual([]);
		expect(scheduleTaskNotification).toHaveBeenLastCalledWith(expect.objectContaining({ title: "Старое" }));
		expect(showErrorToast).toHaveBeenCalledTimes(1);
	});
});

describe("reorderOptimistic", () => {
	it("проставляет order по индексу и шлёт батч", async () => {
		const a = makeRoutine({ order: 0 });
		const b = makeRoutine({ order: 1 });
		mockTaskApi.getTasksByDate.mockResolvedValueOnce([a, b]);
		await store.fetchTasks(USER, TEST_DATE);

		store.reorderOptimistic(USER, [b, a]);

		expect(store.routineTasks.map((t) => t.id)).toEqual([b.id, a.id]);
		expect(mockTaskApi.updateTasksOrder).toHaveBeenCalledWith(USER, [
			{ id: b.id, order: 0 },
			{ id: a.id, order: 1 },
		]);
	});

	it("пустой список — noop", () => {
		store.reorderOptimistic(USER, []);
		expect(mockTaskApi.updateTasksOrder).not.toHaveBeenCalled();
	});

	it("ошибка API → прежний порядок восстановлен, тост", async () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		const a = makeRoutine({ order: 0 });
		const b = makeRoutine({ order: 1 });
		mockTaskApi.getTasksByDate.mockResolvedValueOnce([a, b]);
		await store.fetchTasks(USER, TEST_DATE);
		failNext("updateTasksOrder");

		store.reorderOptimistic(USER, [b, a]);
		await flushPromises();

		expect(store.routineTasks.map((t) => t.id)).toEqual([a.id, b.id]);
		expect(showErrorToast).toHaveBeenCalledTimes(1);
	});
});

describe("toggleCompletion", () => {
	it("выставляет completedAt и отменяет уведомление; повторно — снимает и планирует", async () => {
		const task = makeTask({ time: 600 });
		mockTaskApi.getTasksByDate.mockResolvedValueOnce([task]);
		await store.fetchTasks(USER, TEST_DATE);

		await store.toggleCompletion(USER, task.id);
		expect(store.tasks[0].isCompleted).toBe(true);
		expect(store.tasks[0].completedAt).toBeInstanceOf(Date);
		expect(cancelTaskNotification).toHaveBeenCalledWith(task.id);

		await store.toggleCompletion(USER, task.id);
		expect(store.tasks[0].isCompleted).toBe(false);
		expect(store.tasks[0].completedAt).toBeNull();
		expect(scheduleTaskNotification).toHaveBeenLastCalledWith(expect.objectContaining({ id: task.id, isCompleted: false }));
	});

	it("апдейт привязан к дате задачи: смена дня во время запроса не теряет галочку", async () => {
		const task = makeTask({ date: TEST_DATE });
		mockTaskApi.getTasksByDate.mockResolvedValueOnce([task]);
		await store.fetchTasks(USER, TEST_DATE);

		let resolve!: () => void;
		mockTaskApi.toggleTaskCompletion.mockReturnValueOnce(new Promise<Task>((r) => (resolve = () => r({} as Task))));

		const pending = store.toggleCompletion(USER, task.id);
		store.setSelectedDate(OTHER_DATE);
		resolve();
		await pending;

		store.setSelectedDate(TEST_DATE);
		expect(store.tasks[0].isCompleted).toBe(true);
	});

	it("ошибка API → откат статуса и уведомления, тост", async () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		const task = makeTask({ time: 600 });
		mockTaskApi.getTasksByDate.mockResolvedValueOnce([task]);
		await store.fetchTasks(USER, TEST_DATE);
		failNext("toggleTaskCompletion");

		await store.toggleCompletion(USER, task.id);

		expect(store.tasks[0].isCompleted).toBe(false);
		expect(scheduleTaskNotification).toHaveBeenLastCalledWith(expect.objectContaining({ id: task.id }));
		expect(showErrorToast).toHaveBeenCalledTimes(1);
	});

	it("неизвестный id — резолвится без обращения к API", async () => {
		await expect(store.toggleCompletion(USER, "nope")).resolves.toBeUndefined();
		expect(mockTaskApi.toggleTaskCompletion).not.toHaveBeenCalled();
	});
});

describe("computed", () => {
	it("mainTasks / routineTasks фильтруют по типу и сортируют по order", async () => {
		const m2 = makeMain({ order: 2 });
		const m1 = makeMain({ order: 1 });
		const r1 = makeRoutine({ order: 0 });
		mockTaskApi.getTasksByDate.mockResolvedValueOnce([m2, r1, m1]);
		await store.fetchTasks(USER, TEST_DATE);

		expect(store.mainTasks.map((t) => t.id)).toEqual([m1.id, m2.id]);
		expect(store.routineTasks.map((t) => t.id)).toEqual([r1.id]);
	});
});
```

- [ ] **Step 2: Запустить**

Run: `npx vitest run src/shared/model/taskStore.test.ts`
Expected: PASS (13 из Task 4 + 15 новых). Если тест на откат падает из-за того, что `.catch` ещё не отработал — увеличить ожидание: `await flushPromises(); await flushPromises();`.

- [ ] **Step 3: Commit**

```bash
git add src/shared/model/taskStore.test.ts
git commit -m "test(store): optimistic create/update/reorder/toggle incl. rollback on API errors"
```

---

### Task 6: `deleteWithUndo`, `flushPendingDeletes`, `visibilitychange`

**Files:**
- Test: `src/shared/model/taskStore.test.ts` (дописать в конец)

**Interfaces:**
- Consumes: `store.deleteWithUndo(userId, task, delayMs = 4000, onDeleted?)`, `store.flushPendingDeletes()`; `showUndoToast` мок — `onUndo` берётся из `vi.mocked(showUndoToast).mock.calls[0][0].onUndo`.

- [ ] **Step 1: Дописать тесты**

```ts
describe("deleteWithUndo", () => {
	const setHidden = (hidden: boolean) =>
		Object.defineProperty(document, "hidden", { configurable: true, get: () => hidden });

	const undoOf = () => vi.mocked(showUndoToast).mock.calls[0][0].onUndo!;

	let task: Task;

	beforeEach(async () => {
		vi.useFakeTimers();
		task = makeTask({ time: 600 });
		mockTaskApi.getTasksByDate.mockResolvedValueOnce([task]);
		await store.fetchTasks(USER, TEST_DATE);
	});

	it("задача исчезает сразу, по таймеру уходит в API, onDeleted вызван", async () => {
		const onDeleted = vi.fn();
		store.deleteWithUndo(USER, task, 4000, onDeleted);

		expect(store.tasks).toEqual([]);
		expect(cancelTaskNotification).toHaveBeenCalledWith(task.id);
		expect(mockTaskApi.deleteTask).not.toHaveBeenCalled();

		await vi.advanceTimersByTimeAsync(4000);

		expect(mockTaskApi.deleteTask).toHaveBeenCalledWith(USER, task.id);
		expect(onDeleted).toHaveBeenCalledTimes(1);
	});

	it("«Отменить» до таймера — задача возвращается, API не вызван, уведомление восстановлено", async () => {
		store.deleteWithUndo(USER, task);
		undoOf()();

		expect(ids(store.tasks)).toEqual([task.id]);
		expect(scheduleTaskNotification).toHaveBeenLastCalledWith(expect.objectContaining({ id: task.id }));

		await vi.advanceTimersByTimeAsync(4000);
		expect(mockTaskApi.deleteTask).not.toHaveBeenCalled();
	});

	it("повторный вызов для той же задачи — noop", () => {
		store.deleteWithUndo(USER, task);
		store.deleteWithUndo(USER, task);
		expect(showUndoToast).toHaveBeenCalledTimes(1);
	});

	it("ошибка удаления → задача возвращается, тост", async () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		failNext("deleteTask");
		store.deleteWithUndo(USER, task);

		await vi.advanceTimersByTimeAsync(4000);

		expect(ids(store.tasks)).toEqual([task.id]);
		expect(showErrorToast).toHaveBeenCalledTimes(1);
	});

	it("flushPendingDeletes коммитит немедленно, таймер потом не срабатывает второй раз", async () => {
		store.deleteWithUndo(USER, task);
		store.flushPendingDeletes();
		await vi.runAllTimersAsync();

		expect(mockTaskApi.deleteTask).toHaveBeenCalledTimes(1);

		await vi.advanceTimersByTimeAsync(4000);
		expect(mockTaskApi.deleteTask).toHaveBeenCalledTimes(1);
	});

	it("уход приложения в фон (visibilitychange + hidden) коммитит отложенные удаления", async () => {
		store.deleteWithUndo(USER, task);

		setHidden(true);
		document.dispatchEvent(new Event("visibilitychange"));
		await vi.runAllTimersAsync();
		setHidden(false);

		expect(mockTaskApi.deleteTask).toHaveBeenCalledWith(USER, task.id);
	});
});
```

- [ ] **Step 2: Запустить**

Run: `npx vitest run src/shared/model/taskStore.test.ts`
Expected: PASS (28 + 6). Примечание: каждый `new TaskStore()` вешает свой слушатель `visibilitychange` на `document`; у прежних инстансов `pending` пуст, поэтому лишние срабатывания безвредны.

- [ ] **Step 3: Commit**

```bash
git add src/shared/model/taskStore.test.ts
git commit -m "test(store): deleteWithUndo timer, undo, flush and background commit"
```

---

### Task 7: `rolloverOverdueMainTasks`

**Files:**
- Test: `src/shared/model/taskStore.test.ts` (дописать в конец)

**Interfaces:**
- Consumes: `store.rolloverOverdueMainTasks(userId, sinceDate): Promise<void>`; `mockTaskApi.getTasksForRange`, `mockTaskApi.rolloverTasks`; `MAX_MAIN_TASKS = 3`, `ROLLOVER_CUTOFF_HOUR = 4`.

- [ ] **Step 1: Дописать тесты**

```ts
describe("rolloverOverdueMainTasks", () => {
	const SEP = (day: number, hour = 0, minute = 0) => new Date(2026, 8, day, hour, minute);

	it("до 04:00 активный день — вчера; since == активный день → API не вызывается", async () => {
		vi.setSystemTime(SEP(5, 3, 30));
		await store.rolloverOverdueMainTasks(USER, SEP(4));
		expect(mockTaskApi.getTasksForRange).not.toHaveBeenCalled();
	});

	it("до 04:00 диапазон запроса — [since, вчера]", async () => {
		vi.setSystemTime(SEP(5, 3, 30));
		await store.rolloverOverdueMainTasks(USER, SEP(3));
		expect(mockTaskApi.getTasksForRange).toHaveBeenCalledWith(USER, SEP(3), SEP(4));
	});

	it("нет просроченных главных → rolloverTasks не вызывается", async () => {
		vi.setSystemTime(SEP(5, 10));
		mockTaskApi.getTasksForRange.mockResolvedValueOnce([
			makeMain({ date: SEP(4), isCompleted: true }),
			makeRoutine({ date: SEP(4) }),
			makeMain({ date: SEP(5) }),
		]);
		await store.rolloverOverdueMainTasks(USER, SEP(1));
		expect(mockTaskApi.rolloverTasks).not.toHaveBeenCalled();
	});

	it("переносит невыполненные главные; при лимите лишние становятся рутинными; order сеется от свежей выборки", async () => {
		vi.setSystemTime(SEP(5, 10));
		const o1 = makeMain({ id: "o1", date: SEP(3), order: 1 });
		const o0 = makeMain({ id: "o0", date: SEP(3), order: 0 });
		const o4 = makeMain({ id: "o4", date: SEP(4), order: 0 });
		const existingMains = [makeMain({ date: SEP(5), order: 0 }), makeMain({ date: SEP(5), order: 1 })];
		const existingRoutine = makeRoutine({ date: SEP(5), order: 0 });
		mockTaskApi.getTasksForRange.mockResolvedValueOnce([
			o1,
			o0,
			o4,
			makeMain({ date: SEP(4), isCompleted: true }),
			makeRoutine({ date: SEP(3) }),
			...existingMains,
			existingRoutine,
		]);

		await store.rolloverOverdueMainTasks(USER, SEP(1));

		// Порядок обработки: дата → order: o0 (3 сент, 0), o1 (3 сент, 1), o4 (4 сент).
		// На 5 сентября уже 2 главные → o0 становится третьей главной (order 2),
		// o1 и o4 — рутинными с order 1 и 2 (после существующей рутинной с order 0).
		expect(mockTaskApi.rolloverTasks).toHaveBeenCalledWith(USER, [
			{ id: "o0", date: SEP(5), isMain: true, order: 2 },
			{ id: "o1", date: SEP(5), isMain: false, order: 1 },
			{ id: "o4", date: SEP(5), isMain: false, order: 2 },
		]);

		const moved = store.getTasksForDate(SEP(5));
		expect(moved.find((t) => t.id === "o0")).toMatchObject({ isMain: true, order: 2, date: SEP(5) });
		expect(moved.find((t) => t.id === "o1")).toMatchObject({ isMain: false, order: 1 });
		expect(ids(store.getTasksForDate(SEP(3)))).not.toContain("o0");
	});

	it("ошибка API — только лог, локальное состояние остаётся перенесённым", async () => {
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		vi.setSystemTime(SEP(5, 10));
		mockTaskApi.getTasksForRange.mockResolvedValueOnce([makeMain({ id: "o0", date: SEP(4) })]);
		failNext("rolloverTasks");

		await expect(store.rolloverOverdueMainTasks(USER, SEP(1))).resolves.toBeUndefined();

		expect(errorSpy).toHaveBeenCalled();
		expect(ids(store.getTasksForDate(SEP(5)))).toContain("o0");
	});
});
```

- [ ] **Step 2: Запустить**

Run: `npx vitest run src/shared/model/taskStore.test.ts`
Expected: PASS (34 + 5). `vi.setSystemTime` без `useFakeTimers` подменяет только `Date` — этого достаточно; сброс делает `vi.useRealTimers()` в `setup.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/shared/model/taskStore.test.ts
git commit -m "test(store): rollover of overdue main tasks incl. 4am boundary and main limit"
```

---

### Task 8: `statsStore` и `taskRolloverStore`

**Files:**
- Test: `src/shared/model/statsStore.test.ts`
- Test: `src/shared/model/taskRolloverStore.test.ts`

**Interfaces:**
- Consumes: `StatsStore.fetchWeekStats(userId, weekStart)`, `statsStore.completedDaysCount`; `TaskRolloverStore.initialize()/enable()/disable()`, поля `isEnabled`, `enabledDate`, `isInitialized`; ключи localStorage `pearl.rollover.enabled`, `pearl.rollover.enabledDate`.

- [ ] **Step 1: Написать `src/shared/model/statsStore.test.ts`**

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { addDays } from "date-fns";
import { StatsStore } from "@/shared/model/statsStore";
import { makeMain, makeRoutine } from "@/shared/testing/factories";
import { failNext, mockTaskApi } from "@/shared/testing/mocks/taskApi";

vi.mock("@/shared/api/taskApi", async () => (await import("@/shared/testing/mocks/taskApi")).mockTaskApi);

const USER = "u1";
const WEEK_START = new Date(2026, 8, 7); // понедельник
const day = (offset: number) => addDays(WEEK_START, offset);

let store: StatsStore;

beforeEach(() => {
	store = new StatsStore();
});

describe("fetchWeekStats", () => {
	it("запрашивает 7 дней от weekStart и строит по дню на каждый", async () => {
		await store.fetchWeekStats(USER, WEEK_START);

		expect(mockTaskApi.getTasksForRange).toHaveBeenCalledWith(USER, WEEK_START, day(6));
		expect(store.weekStats?.days).toHaveLength(7);
		expect(store.weekStats?.days[0].date).toEqual(WEEK_START);
		expect(store.weekStats?.days[6].date).toEqual(day(6));
	});

	it("день выполнен только при 3 главных, все выполнены", async () => {
		mockTaskApi.getTasksForRange.mockResolvedValueOnce([
			// день 0: 3/3
			makeMain({ date: day(0), isCompleted: true }),
			makeMain({ date: day(0), isCompleted: true }),
			makeMain({ date: day(0), isCompleted: true }),
			// день 1: 2/3
			makeMain({ date: day(1), isCompleted: true }),
			makeMain({ date: day(1), isCompleted: true }),
			makeMain({ date: day(1), isCompleted: false }),
			// день 2: 2 главные, обе выполнены — но их не 3
			makeMain({ date: day(2), isCompleted: true }),
			makeMain({ date: day(2), isCompleted: true }),
			// день 3: только рутинные
			makeRoutine({ date: day(3), isCompleted: true }),
		]);

		await store.fetchWeekStats(USER, WEEK_START);
		const days = store.weekStats!.days;

		expect(days[0]).toMatchObject({ isCompleted: true, completedMainTasksCount: 3 });
		expect(days[1]).toMatchObject({ isCompleted: false, completedMainTasksCount: 2 });
		expect(days[2]).toMatchObject({ isCompleted: false, completedMainTasksCount: 2 });
		expect(days[3]).toMatchObject({ isCompleted: false, completedMainTasksCount: 0 });
		expect(store.completedDaysCount).toBe(1);
	});

	it("completedDaysCount = 0 без данных", () => {
		expect(store.completedDaysCount).toBe(0);
	});

	it("ошибка API → weekStats не меняется", async () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		failNext("getTasksForRange");
		await store.fetchWeekStats(USER, WEEK_START);
		expect(store.weekStats).toBeNull();
	});
});
```

- [ ] **Step 2: Написать `src/shared/model/taskRolloverStore.test.ts`**

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TaskRolloverStore } from "@/shared/model/taskRolloverStore";

const ENABLED_KEY = "pearl.rollover.enabled";
const DATE_KEY = "pearl.rollover.enabledDate";

let store: TaskRolloverStore;

beforeEach(() => {
	store = new TaskRolloverStore();
});

describe("initialize", () => {
	it("по умолчанию выключен", () => {
		store.initialize();
		expect(store.isEnabled).toBe(false);
		expect(store.enabledDate).toBeNull();
		expect(store.isInitialized).toBe(true);
	});

	it("читает включённое состояние и дату из localStorage", () => {
		localStorage.setItem(ENABLED_KEY, "true");
		localStorage.setItem(DATE_KEY, "2026-09-01");
		store.initialize();
		expect(store.isEnabled).toBe(true);
		expect(store.enabledDate).toBe("2026-09-01");
	});

	it("идемпотентен — повторный вызов не перечитывает хранилище", () => {
		store.initialize();
		localStorage.setItem(ENABLED_KEY, "true");
		store.initialize();
		expect(store.isEnabled).toBe(false);
	});
});

describe("enable / disable", () => {
	it("enable пишет флаг и сегодняшнюю дату", () => {
		vi.setSystemTime(new Date(2026, 8, 5, 12));
		store.enable();
		expect(store.isEnabled).toBe(true);
		expect(store.enabledDate).toBe("2026-09-05");
		expect(localStorage.getItem(ENABLED_KEY)).toBe("true");
		expect(localStorage.getItem(DATE_KEY)).toBe("2026-09-05");
	});

	it("disable сбрасывает флаг и удаляет дату", () => {
		store.enable();
		store.disable();
		expect(store.isEnabled).toBe(false);
		expect(store.enabledDate).toBeNull();
		expect(localStorage.getItem(ENABLED_KEY)).toBe("false");
		expect(localStorage.getItem(DATE_KEY)).toBeNull();
	});
});
```

- [ ] **Step 3: Запустить**

Run: `npx vitest run src/shared/model/statsStore.test.ts src/shared/model/taskRolloverStore.test.ts`
Expected: PASS (4 + 5).

- [ ] **Step 4: Commit**

```bash
git add src/shared/model/statsStore.test.ts src/shared/model/taskRolloverStore.test.ts
git commit -m "test(store): weekly stats and rollover toggle"
```

---

### Task 9: `notifications.ts` и `notificationSettingsStore`

**Files:**
- Test: `src/shared/lib/notifications.test.ts`
- Test: `src/shared/model/notificationSettingsStore.test.ts`

**Interfaces:**
- Consumes: `scheduleTaskNotification(task)`, `cancelTaskNotification(taskId)`, `getNotificationsTogglePreference()`, `setNotificationsTogglePreference(bool)`, `hasNotificationPermission()`, `requestNotificationPermission()`, `cancelAllTaskNotifications()`; `NotificationSettingsStore.initialize()/enableNotifications()/disableNotifications()`.
- Ключи localStorage: `pearl.notifications.enabled`, `pearl.notifications.idMap`, `pearl.notifications.idCounter`.

- [ ] **Step 1: Написать `src/shared/lib/notifications.test.ts`**

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import {
	cancelTaskNotification,
	scheduleTaskNotification,
	setNotificationsTogglePreference,
} from "@/shared/lib/notifications";
import { makeTask, TEST_DATE } from "@/shared/testing/factories";

vi.mock("@capacitor/core", () => ({
	Capacitor: { isNativePlatform: vi.fn(() => true) },
}));
vi.mock("@capacitor/local-notifications", () => ({
	LocalNotifications: {
		schedule: vi.fn(async () => ({ notifications: [] })),
		cancel: vi.fn(async () => {}),
		checkPermissions: vi.fn(async () => ({ display: "granted" })),
		requestPermissions: vi.fn(async () => ({ display: "granted" })),
		getPending: vi.fn(async () => ({ notifications: [] })),
	},
}));

const scheduledId = (callIndex = 0) =>
	vi.mocked(LocalNotifications.schedule).mock.calls[callIndex][0].notifications[0].id;

beforeEach(() => {
	// 08:00 5 сентября 2026 — задачи на 10:00 ещё впереди.
	vi.setSystemTime(new Date(2026, 8, 5, 8, 0));
});

describe("scheduleTaskNotification", () => {
	it("планирует за 30 минут до времени задачи с ожидаемым текстом", async () => {
		const task = makeTask({ id: "abc", title: "Позвонить", emoji: "📞", date: TEST_DATE, time: 10 * 60 });
		await scheduleTaskNotification(task);

		expect(LocalNotifications.schedule).toHaveBeenCalledTimes(1);
		const notification = vi.mocked(LocalNotifications.schedule).mock.calls[0][0].notifications[0];
		expect(notification).toMatchObject({
			title: "📞 Позвонить",
			body: "Сегодня в 10:00",
			extra: { taskId: "abc" },
		});
		expect(notification.schedule?.at).toEqual(new Date(2026, 8, 5, 9, 30));
	});

	it("не планирует вне нативной платформы", async () => {
		vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
		await scheduleTaskNotification(makeTask({ time: 600 }));
		expect(LocalNotifications.schedule).not.toHaveBeenCalled();
	});

	it("не планирует без времени", async () => {
		await scheduleTaskNotification(makeTask({ time: null }));
		expect(LocalNotifications.schedule).not.toHaveBeenCalled();
	});

	it("не планирует при выключенном тумблере", async () => {
		setNotificationsTogglePreference(false);
		await scheduleTaskNotification(makeTask({ time: 600 }));
		expect(LocalNotifications.schedule).not.toHaveBeenCalled();
	});

	it("не планирует без разрешения", async () => {
		vi.mocked(LocalNotifications.checkPermissions).mockResolvedValue({ display: "denied" as const });
		await scheduleTaskNotification(makeTask({ time: 600 }));
		expect(LocalNotifications.schedule).not.toHaveBeenCalled();
	});

	it("не планирует, если момент уведомления уже прошёл", async () => {
		vi.setSystemTime(new Date(2026, 8, 5, 9, 45));
		await scheduleTaskNotification(makeTask({ time: 600 }));
		expect(LocalNotifications.schedule).not.toHaveBeenCalled();
	});
});

describe("устойчивые id уведомлений", () => {
	it("одна задача — всегда один id, разные задачи — разные", async () => {
		await scheduleTaskNotification(makeTask({ id: "a", time: 600 }));
		await scheduleTaskNotification(makeTask({ id: "b", time: 600 }));
		await scheduleTaskNotification(makeTask({ id: "a", time: 600 }));

		expect(scheduledId(0)).toBe(scheduledId(2));
		expect(scheduledId(0)).not.toBe(scheduledId(1));
	});

	it("cancelTaskNotification использует тот же id, что и schedule", async () => {
		await scheduleTaskNotification(makeTask({ id: "a", time: 600 }));
		await cancelTaskNotification("a");

		expect(vi.mocked(LocalNotifications.cancel).mock.calls[0][0].notifications[0].id).toBe(scheduledId(0));
	});

	it("битый JSON в хранилище не роняет планирование", async () => {
		localStorage.setItem("pearl.notifications.idMap", "{oops");
		await scheduleTaskNotification(makeTask({ id: "a", time: 600 }));
		expect(LocalNotifications.schedule).toHaveBeenCalledTimes(1);
		expect(typeof scheduledId()).toBe("number");
	});
});
```

- [ ] **Step 2: Написать `src/shared/model/notificationSettingsStore.test.ts`**

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationSettingsStore } from "@/shared/model/notificationSettingsStore";
import {
	cancelAllTaskNotifications,
	getNotificationsTogglePreference,
	hasNotificationPermission,
	requestNotificationPermission,
	setNotificationsTogglePreference,
} from "@/shared/lib/notifications";

vi.mock("@/shared/lib/notifications", () => ({
	cancelAllTaskNotifications: vi.fn(async () => {}),
	getNotificationsTogglePreference: vi.fn((): boolean | null => null),
	hasNotificationPermission: vi.fn(async () => true),
	requestNotificationPermission: vi.fn(async () => true),
	setNotificationsTogglePreference: vi.fn(),
}));

let store: NotificationSettingsStore;

beforeEach(() => {
	store = new NotificationSettingsStore();
});

describe("initialize", () => {
	it("включён, если есть разрешение и тумблер не выключен явно", async () => {
		await store.initialize();
		expect(store.isNotificationsEnabled).toBe(true);
		expect(store.isInitialized).toBe(true);
	});

	it("выключен без разрешения", async () => {
		vi.mocked(hasNotificationPermission).mockResolvedValue(false);
		await store.initialize();
		expect(store.isNotificationsEnabled).toBe(false);
	});

	it("выключен, если тумблер сохранён как false", async () => {
		vi.mocked(getNotificationsTogglePreference).mockReturnValue(false);
		await store.initialize();
		expect(store.isNotificationsEnabled).toBe(false);
	});

	it("идемпотентен", async () => {
		await store.initialize();
		await store.initialize();
		expect(hasNotificationPermission).toHaveBeenCalledTimes(1);
	});
});

describe("enableNotifications / disableNotifications", () => {
	it("enable сохраняет результат запроса разрешения", async () => {
		vi.mocked(requestNotificationPermission).mockResolvedValue(false);
		await expect(store.enableNotifications()).resolves.toBe(false);
		expect(setNotificationsTogglePreference).toHaveBeenCalledWith(false);
		expect(store.isNotificationsEnabled).toBe(false);
	});

	it("disable пишет false и отменяет все уведомления", async () => {
		await store.disableNotifications();
		expect(setNotificationsTogglePreference).toHaveBeenCalledWith(false);
		expect(cancelAllTaskNotifications).toHaveBeenCalledTimes(1);
		expect(store.isNotificationsEnabled).toBe(false);
	});
});
```

- [ ] **Step 3: Запустить**

Run: `npx vitest run src/shared/lib/notifications.test.ts src/shared/model/notificationSettingsStore.test.ts`
Expected: PASS (9 + 6). Если `notification.schedule?.at` не совпадает по типу — сравнивать через `expect(notification.schedule).toEqual({ at: new Date(2026, 8, 5, 9, 30) })`.

- [ ] **Step 4: Commit**

```bash
git add src/shared/lib/notifications.test.ts src/shared/model/notificationSettingsStore.test.ts
git commit -m "test: notification scheduling, stable ids and settings store"
```

---

### Task 10: CI workflow, CLAUDE.md, финальная проверка

**Files:**
- Create: `.github/workflows/ci.yml`
- Modify: `CLAUDE.md` (раздел «Команды», строки про `npm run lint` и «Тестов в проекте нет»)

- [ ] **Step 1: Создать `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
  pull_request:

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  check:
    name: Lint, typecheck, test
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Typecheck
        run: npm run typecheck

      - name: Test
        run: npm test
```

- [ ] **Step 2: Обновить `CLAUDE.md`**

В разделе «Команды» заменить строку `- \`npm run lint\`` на:

```markdown
- `npm run lint` — ESLint (`eslint .`, flat-конфиг из `eslint-config-next@16`; `next lint` в Next 16 удалён). Три правила React Compiler понижены до warn — компилятор в проекте не используется.
- `npm run typecheck` — `tsc --noEmit`
```

Заменить строку `- Тестов в проекте нет.` на:

```markdown
- `npm test` / `npm run test:watch` — Vitest (jsdom). Тесты лежат рядом с кодом (`*.test.ts`), покрывают бизнес-логику: MobX-сторы, `taskApi`, уведомления, хелперы. UI не тестируется. Хелперы в `src/shared/testing/`: `factories.ts` (`makeTask`/`makeMain`/`makeRoutine`), `mocks/taskApi.ts` (полный мок API + `emitSnapshot`/`failNext`), `setup.ts`. В тестах сторов всегда мокаются `@/shared/api/taskApi`, `@/shared/lib/notifications`, `showToast`, `showUndoToast`; Firestore напрямую не мокается — сторы к нему не обращаются.
- CI: `.github/workflows/ci.yml` — lint + typecheck + test на каждый push/PR. `ci-test.yml` — только деплой ветки `test` в Vercel.
```

В разделе «Архитектура → Данные (Firebase)» заменить абзац «Нюанс: `taskStore.fetchTasks`/`fetchTasksForRange` ходят в Firestore напрямую…» на:

```markdown
Все чтения/записи задач идут только через `taskApi` (включая realtime-подписку `subscribeToTasksInRange`); сторы `firebase/firestore` не импортируют.
```

В разделе «Состояние (MobX)» после «четыре независимых синглтона» уточнить: классы сторов экспортируются (`export class TaskStore` и т.д.) для создания свежих инстансов в тестах; приложение использует только синглтоны.

- [ ] **Step 3: Полная проверка**

Run: `npm run lint && npm run typecheck && npm test && npm run build`
Expected: lint — 0 ошибок; typecheck — exit 0; тесты — все файлы PASS (ориентир: 8 файлов, ~65 тестов); `next build` успешен.

- [ ] **Step 4: Проверить, что ничего лишнего не попало в индекс**

Run: `git status --short`
Expected: только `.github/workflows/ci.yml` и `CLAUDE.md` новые/изменённые (плюс чужой `src/features/auth/lib/yupShemas.tsx` — его не добавлять).

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/ci.yml CLAUDE.md
git commit -m "ci: run lint, typecheck and tests on push/PR; document testing setup"
```

- [ ] **Step 6: Отчёт**

Сообщить пользователю: число тестов, что `push` не выполнялся, и что для проверки workflow нужен push в GitHub (по его команде).
