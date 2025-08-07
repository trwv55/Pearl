export const markerColorToBackground: Record<string, string> = {
	"#3d00cb": "linear-gradient(135deg, #ae96ff 0%, #3d00cb 60%)",
	"#2688eb": "linear-gradient(135deg, #96daff 0%, #2688eb 60%)",
	"#ffa931": "linear-gradient(135deg, #ffb872 0%, #ff5e00 60%)",
};

export function getTaskBackground(markerColor: string) {
	return markerColorToBackground[markerColor.toLocaleLowerCase()] || "linear-gradient(135deg, #ae96ff 0%, #3d00cb 60%)"; // дефолтный цвет, если markerColor не найден
}
