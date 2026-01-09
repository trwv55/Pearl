// Градиенты для активных (невыполненных) задач
export const markerColorToBackground: Record<string, string> = {
	"#ff5e00": "linear-gradient(111.98deg, rgba(255, 184, 114, 1) 0%, rgba(255, 94, 0, 1) 60.012%)",
	"#ffa931": "linear-gradient(111.98deg, rgba(255, 226, 152, 1) 0%, rgba(255, 169, 49, 1) 60.012%)",
	"#96c937": "linear-gradient(111.98deg, rgba(227, 237, 168, 1) 0%, rgba(150, 201, 55, 1) 60.012%)",
	"#2688eb": "linear-gradient(111.98deg, rgba(150, 218, 255, 1) 0%, rgba(38, 136, 235, 1) 60.012%)",
	"#3d00cb": "linear-gradient(111.98deg, rgba(174, 150, 255, 1) 0%, rgba(61, 0, 203, 1) 60.012%)",
	"#9b41e0": "linear-gradient(111.98deg, rgba(219, 185, 255, 1) 0%, rgba(155, 65, 224, 1) 60.012%)",
	"#f480ff": "linear-gradient(111.98deg, rgba(250, 194, 255, 1) 0%, rgba(244, 128, 255, 1) 60.012%)",
};

// Однотонные цвета для выполненных задач
export const markerColorToCompletedBackground: Record<string, string> = {
	"#ff5e00": "#f9ccb3",
	"#ffa931": "#f9dfbf",
	"#96c937": "#dfe7c0",
	"#2688eb": "#c3d7ed",
	"#3d00cb": "#c8b5e5",
	"#9b41e0": "#e0c5eb",
	"#f480ff": "#f6d6f2",
};

export function getTaskBackground(markerColor: string, isCompleted: boolean = false): string {
	const normalizedColor = markerColor.toLowerCase();

	// Если задача выполнена, используем специальные градиенты
	if (isCompleted && markerColorToCompletedBackground[normalizedColor]) {
		return markerColorToCompletedBackground[normalizedColor];
	}

	// Возвращаем градиент для активной задачи или дефолтный
	return markerColorToBackground[normalizedColor] || markerColorToBackground["#3d00cb"];
}
