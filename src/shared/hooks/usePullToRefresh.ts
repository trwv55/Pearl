import { useEffect, useRef, useState } from "react";

const THRESHOLD = 70; // сколько нужно оттянуть, чтобы запустить обновление
const MAX_PULL = 110; // максимальное визуальное смещение
const RESISTANCE = 0.5; // «сопротивление» — палец проходит вдвое больше, чем едет лоадер

interface UsePullToRefreshResult {
	pullDistance: number;
	isRefreshing: boolean;
	threshold: number;
}

// Pull-to-refresh для страницы, скроллящейся на window. Жест активен только у
// самого верха (scrollY <= 0) и только при движении вниз, чтобы не мешать
// обычному скроллу. onRefresh вызывается один раз при отпускании за порогом.
export function usePullToRefresh(onRefresh: () => Promise<void> | void): UsePullToRefreshResult {
	const [pullDistance, setPullDistance] = useState(0);
	const [isRefreshing, setIsRefreshing] = useState(false);

	const startYRef = useRef<number | null>(null);
	const activeRef = useRef(false);
	const refreshingRef = useRef(false);
	const pullRef = useRef(0);
	const onRefreshRef = useRef(onRefresh);

	useEffect(() => {
		onRefreshRef.current = onRefresh;
	}, [onRefresh]);

	useEffect(() => {
		const setPull = (v: number) => {
			pullRef.current = v;
			setPullDistance(v);
		};

		const onTouchStart = (e: TouchEvent) => {
			if (refreshingRef.current || window.scrollY > 0) return;
			startYRef.current = e.touches[0].clientY;
			activeRef.current = true;
		};

		const onTouchMove = (e: TouchEvent) => {
			if (!activeRef.current || startYRef.current === null || refreshingRef.current) return;

			const dy = e.touches[0].clientY - startYRef.current;

			// Тянут вверх или уже прокрутили страницу — это не наш жест.
			if (dy <= 0 || window.scrollY > 0) {
				activeRef.current = dy > 0 ? activeRef.current : false;
				if (pullRef.current !== 0) setPull(0);
				return;
			}

			// Тянут вниз у верха — перехватываем, чтобы не сработал нативный bounce.
			e.preventDefault();
			setPull(Math.min(MAX_PULL, dy * RESISTANCE));
		};

		const onTouchEnd = async () => {
			if (!activeRef.current) return;
			activeRef.current = false;
			startYRef.current = null;

			if (pullRef.current >= THRESHOLD && !refreshingRef.current) {
				refreshingRef.current = true;
				setIsRefreshing(true);
				setPull(THRESHOLD);
				try {
					await onRefreshRef.current();
				} finally {
					refreshingRef.current = false;
					setIsRefreshing(false);
					setPull(0);
				}
			} else {
				setPull(0);
			}
		};

		window.addEventListener("touchstart", onTouchStart, { passive: true });
		window.addEventListener("touchmove", onTouchMove, { passive: false });
		window.addEventListener("touchend", onTouchEnd);
		window.addEventListener("touchcancel", onTouchEnd);

		return () => {
			window.removeEventListener("touchstart", onTouchStart);
			window.removeEventListener("touchmove", onTouchMove);
			window.removeEventListener("touchend", onTouchEnd);
			window.removeEventListener("touchcancel", onTouchEnd);
		};
	}, []);

	return { pullDistance, isRefreshing, threshold: THRESHOLD };
}
