import React, { useId, useMemo } from 'react';
import clsx from 'clsx';
import styles from './RadialRing.module.css';

type Props = {
	/** 0..1 */
	value: number;
	/** Диаметр SVG (px) */
	size?: number;
	/** Толщина дуги (px) */
	stroke?: number;
	/** Радиус внутренней «дырки» фона (для толщины трека) */
	trackStroke?: number;
	/** Сколько градусов сместить старт (-90 = сверху) */
	startAngle?: number;
	/** Показать точку-маркер на конце дуги */
	showEndDot?: boolean;
	/** Цвет/градиент прогресса (id или массив стопов) */
	gradientStops?: { offset: string; color: string }[]; // если задано — создаём <linearGradient>
	/** Цвет трека (фонового круга) */
	trackColor?: string;
	/** Скруглять концы дуги */
	roundCaps?: boolean;
	className?: string;
};

export const RadialRing: React.FC<Props> = ({
	value,
	size = 160,
	stroke = 12,
	trackStroke,
	startAngle = -90,
	showEndDot = true,
	gradientStops,
	trackColor = 'rgba(0,0,0,0.08)',
	roundCaps = true,
	className,
}) => {
	const id = useId();
	const half = size / 2;
	const radius = half - stroke / 2;
	const length = 2 * Math.PI * radius;
	const clamped = Math.max(0, Math.min(1, value));
	const dashoffset = length * (1 - clamped);
	const _trackStroke = trackStroke ?? stroke;

	// координаты точки конца дуги
	const endPoint = useMemo(() => {
		const angle = (startAngle + clamped * 360) * (Math.PI / 180);
		return {
			x: half + radius * Math.cos(angle),
			y: half + radius * Math.sin(angle),
		};
	}, [clamped, half, radius, startAngle]);

	const gradientId = `${id}-grad`;

	return (
		<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={clsx(styles.svg, className)}>
			{/* Фон-колечко (трек) */}
			<circle cx={half} cy={half} r={radius} fill="none" stroke={trackColor} strokeWidth={_trackStroke} />

			{/* Градиент (если задан) */}
			{gradientStops && (
				<defs>
					<linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
						{gradientStops.map((s, i) => (
							<stop key={i} offset={s.offset} stopColor={s.color} />
						))}
					</linearGradient>
				</defs>
			)}

			{/* Дуга прогресса */}
			<g
				style={{
					transformOrigin: `${half}px ${half}px`,
					transform: `rotate(${startAngle}deg)`,
				}}
			>
				<circle
					className={styles.progress}
					cx={half}
					cy={half}
					r={radius}
					fill="none"
					stroke={gradientStops ? `url(#${gradientId})` : 'currentColor'}
					strokeWidth={stroke}
					strokeDasharray={length}
					strokeDashoffset={dashoffset}
					strokeLinecap={roundCaps ? 'round' : 'butt'}
				/>
			</g>

			{/* Маркер в конце дуги */}
			{showEndDot && clamped > 0 && <circle cx={endPoint.x} cy={endPoint.y} r={stroke / 2.6} className={styles.endDot} />}
		</svg>
	);
};
