import { useId, useMemo } from 'react';
import clsx from 'clsx';
import styles from './ProgressWheel.module.css';

export type ProgressWheelGradientStop = {
	offset: number;
	color: string;
	opacity?: number;
};

export type ProgressWheelProps = {
	radius: number;
	strokeWidth: number;
	value: number;
	total: number;
	trackColor?: string;
	gradientStops?: ProgressWheelGradientStop[];
	backgroundColor?: string;
	className?: string;
	animationDuration?: number;
	overshootDegrees?: number;
	endCapBorderColor?: string;
	endCapBorderWidth?: number;
	startAngle?: number;
	startIndicatorColor?: string;
};

const DEFAULT_STOPS: ProgressWheelGradientStop[] = [
	{ offset: 0, color: '#5EB1F5' },
	{ offset: 0.5, color: '#96DAFF' },
	{ offset: 0.5, color: '#2688EB' },
	{ offset: 1, color: '#5EB1F5' },
];

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const hexToRgba = (hex: string, alpha: number) => {
	let normalized = hex.replace('#', '');

	if (normalized.length === 3) {
		normalized = normalized
			.split('')
			.map((char) => `${char}${char}`)
			.join('');
	}

	if (normalized.length !== 6) {
		return hex;
	}

	const r = parseInt(normalized.slice(0, 2), 16);
	const g = parseInt(normalized.slice(2, 4), 16);
	const b = parseInt(normalized.slice(4, 6), 16);

	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const applyOpacity = (color: string, opacity?: number) => {
	if (opacity == null) {
		return color;
	}

	if (color.startsWith('#')) {
		return hexToRgba(color, opacity);
	}

	if (color.startsWith('rgba(')) {
		return color.replace(
			/rgba\(([^,]+),([^,]+),([^,]+),[^)]+\)/,
			(_, r, g, b) => `rgba(${r.trim()}, ${g.trim()}, ${b.trim()}, ${opacity})`,
		);
	}

	if (color.startsWith('rgb(')) {
		return color.replace(/rgb\(([^)]+)\)/, `rgba($1, ${opacity})`);
	}

	return color;
};

const formatDegrees = (offset: number) => `${Number((clamp01(offset) * 360).toFixed(3))}deg`;

const ANIMATION_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';

export const ProgressWheel = ({
	radius,
	strokeWidth,
	value,
	total,
	trackColor = '#EBE6E3',
	gradientStops,
	backgroundColor,
	className,
	animationDuration = 600,
	overshootDegrees = 8,
	endCapBorderColor = 'rgba(255, 255, 255, 0.85)',
	endCapBorderWidth = 2,
	startAngle = -90,
	startIndicatorColor,
}: ProgressWheelProps) => {
	const clampedRadius = Math.max(strokeWidth / 2, radius);
	const size = clampedRadius * 2;
	const normalizedRadius = clampedRadius - strokeWidth / 2;
	const circumference = 2 * Math.PI * normalizedRadius;
	const safeTotal = total <= 0 ? 1 : total;
	const rawProgress = value / safeTotal;
	const progress = Math.max(0, rawProgress);
	const overshootRatio = overshootDegrees / 360;
	const effectiveProgress = progress >= 1 ? 1 + overshootRatio : Math.min(progress, 1 + overshootRatio);
	const dashOffset = circumference * (1 - effectiveProgress);

	const maskId = useId();
	const filterId = useId();

	const stops = useMemo(() => {
		const list = gradientStops && gradientStops.length > 0 ? gradientStops : DEFAULT_STOPS;
		return list
			.slice()
			.sort((a, b) => a.offset - b.offset)
			.map((stop) => ({
				...stop,
				offset: clamp01(stop.offset),
			}));
	}, [gradientStops]);

	const gradient = useMemo(() => {
		if (stops.length === 0) {
			return undefined;
		}

		const rotation = startAngle + 90;
		const parts = stops.map((stop) => `${applyOpacity(stop.color, stop.opacity)} ${formatDegrees(stop.offset)}`);

		const lastStop = stops[stops.length - 1];
		if (lastStop.offset < 1) {
			parts.push(`${applyOpacity(lastStop.color, lastStop.opacity)} 360deg`);
		}

		return `conic-gradient(from ${rotation}deg, ${parts.join(', ')})`;
	}, [stops, startAngle]);

	const finalStop = stops[stops.length - 1] ?? DEFAULT_STOPS[DEFAULT_STOPS.length - 1];
	const endColor = applyOpacity(finalStop.color, finalStop.opacity);

	const initialStop = stops[0] ?? DEFAULT_STOPS[0];
	const startColor = startIndicatorColor ?? applyOpacity(initialStop.color, initialStop.opacity);

	const angle = startAngle + effectiveProgress * 360;
	const angleInRad = (angle * Math.PI) / 180;
	const endX = clampedRadius + normalizedRadius * Math.cos(angleInRad);
	const endY = clampedRadius + normalizedRadius * Math.sin(angleInRad);

	const startAngleInRad = (startAngle * Math.PI) / 180;
	const startX = clampedRadius + normalizedRadius * Math.cos(startAngleInRad);
	const startY = clampedRadius + normalizedRadius * Math.sin(startAngleInRad);

	const showEndCap = effectiveProgress > 0;

	return (
		<div className={clsx(styles.root, className)} style={{ width: size, height: size, backgroundColor }}>
			<svg className={styles.svg} viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
				<defs>
					<filter
						id={filterId}
						x={0}
						y={0}
						width={size}
						height={size + 2}
						filterUnits="userSpaceOnUse"
						colorInterpolationFilters="sRGB"
					>
						<feFlood floodOpacity="0" result="BackgroundImageFix" />
						<feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
						<feColorMatrix
							in="SourceAlpha"
							type="matrix"
							values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
							result="hardAlpha"
						/>
						<feOffset dy="1" />
						<feGaussianBlur stdDeviation="1" />
						<feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
						<feColorMatrix type="matrix" values="0 0 0 0 0.74902 0 0 0 0 0.74902 0 0 0 0 0.74902 0 0 0 1 0" />
						<feBlend mode="normal" in2="shape" result="effect1_innerShadow" />
					</filter>

					<mask id={maskId} maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse">
						<rect width={size} height={size} fill="black" />
						<circle
							className={styles.maskCircle}
							cx={clampedRadius}
							cy={clampedRadius}
							r={normalizedRadius}
							fill="none"
							stroke="white"
							strokeWidth={strokeWidth}
							strokeLinecap="round"
							strokeDasharray={circumference}
							strokeDashoffset={dashOffset}
							transform={`rotate(${startAngle} ${clampedRadius} ${clampedRadius})`}
							style={{
								transition: `stroke-dashoffset ${animationDuration}ms ${ANIMATION_EASING}`,
							}}
						/>
					</mask>
				</defs>

				<g filter={`url(#${filterId})`}>
					<circle
						stroke={trackColor}
						strokeWidth={strokeWidth}
						fill="none"
						cx={clampedRadius}
						cy={clampedRadius}
						r={normalizedRadius}
					/>
				</g>

				<g mask={`url(#${maskId})`}>
					<foreignObject x={0} y={0} width={size} height={size}>
						<div className={styles.gradient} style={{ background: gradient }} />
					</foreignObject>
				</g>

				<circle cx={startX} cy={startY} r={strokeWidth / 2} fill={startColor} />

				{/* {showEndCap && (
					<circle
						className={styles.endCap}
						cx={endX}
						cy={endY}
						r={strokeWidth / 2}
						fill={endColor}
						stroke={endCapBorderColor}
						strokeWidth={endCapBorderWidth}
					/>
				)} */}
			</svg>
		</div>
	);
};
