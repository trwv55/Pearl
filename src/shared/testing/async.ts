// Дожидается microtask-очереди и одного макротаска: нужно, чтобы отработали
// .catch-ветки оптимистичных операций после реджекта мока API.
// При включённых fake timers вместо этого использовать vi.runAllTimersAsync().
export const flushPromises = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));
