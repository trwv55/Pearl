import { afterEach, vi } from "vitest";

afterEach(() => {
	window.localStorage.clear();
	vi.useRealTimers();
});
