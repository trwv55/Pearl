import { afterEach, beforeEach, vi } from "vitest";
import { resetTaskApiMock } from "./mocks/taskApi";

// Мок taskApi нужно сбрасывать ДО теста, а не только после: resetTaskApiMock
// обнуляет module-level состояние (счётчик id, подписку) и переустанавливает
// дефолтные реализации, которых clearMocks/restoreMocks из vitest.config.ts
// не касаются, — иначе тест может унаследовать состояние из предыдущего.
beforeEach(() => {
	resetTaskApiMock();
});

afterEach(() => {
	window.localStorage.clear();
	vi.useRealTimers();
});
