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
};

const DEFAULT_STOPS: ProgressWheelGradientStop[] = [
        { offset: 0, color: '#7bc6ff' },
        { offset: 0.5, color: '#51a1ff' },
        { offset: 1, color: '#1868ff' },
];

export const ProgressWheel = ({
        radius,
        strokeWidth,
        value,
        total,
        trackColor = 'rgba(255, 255, 255, 0.12)',
        gradientStops,
        backgroundColor,
        className,
        animationDuration = 600,
        overshootDegrees = 8,
        endCapBorderColor = '#ffffff',
        endCapBorderWidth = 2,
        startAngle = -90,
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

        const gradientId = useId();

        const stops = useMemo(() => {
                const list = gradientStops && gradientStops.length > 0 ? gradientStops : DEFAULT_STOPS;
                return list
                        .slice()
                        .sort((a, b) => a.offset - b.offset)
                        .map((stop) => ({
                                ...stop,
                                offset: Math.min(1, Math.max(0, stop.offset)),
                        }));
        }, [gradientStops]);

        const finalStop = stops[stops.length - 1];
        const endColor = finalStop?.color ?? DEFAULT_STOPS[DEFAULT_STOPS.length - 1].color;

        const angle = startAngle + effectiveProgress * 360;
        const angleInRad = (angle * Math.PI) / 180;
        const endX = clampedRadius + normalizedRadius * Math.cos(angleInRad);
        const endY = clampedRadius + normalizedRadius * Math.sin(angleInRad);

        const showEndCap = effectiveProgress > 0;

        return (
                <div
                        className={clsx(styles.root, className)}
                        style={{ width: size, height: size, backgroundColor }}
                >
                        <svg
                                className={styles.svg}
                                viewBox={`0 0 ${size} ${size}`}
                                width={size}
                                height={size}
                        >
                                <defs>
                                        <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={size} y2={size}>
                                                {stops.map((stop) => (
                                                        <stop
                                                                key={`${stop.offset}-${stop.color}`}
                                                                offset={`${stop.offset * 100}%`}
                                                                stopColor={stop.color}
                                                                stopOpacity={stop.opacity}
                                                        />
                                                ))}
                                        </linearGradient>
                                </defs>

                                <circle
                                        stroke={trackColor}
                                        strokeWidth={strokeWidth}
                                        fill="none"
                                        cx={clampedRadius}
                                        cy={clampedRadius}
                                        r={normalizedRadius}
                                />

                                <circle
                                        className={styles.progress}
                                        stroke={`url(#${gradientId})`}
                                        strokeWidth={strokeWidth}
                                        strokeLinecap="round"
                                        fill="none"
                                        cx={clampedRadius}
                                        cy={clampedRadius}
                                        r={normalizedRadius}
                                        strokeDasharray={circumference}
                                        strokeDashoffset={dashOffset}
                                        style={{
                                                transition: `stroke-dashoffset ${animationDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
                                                transform: `rotate(${startAngle}deg)`,
                                                transformOrigin: '50% 50%',
                                        }}
                                />

                                {showEndCap && (
                                        <circle
                                                className={styles.endCap}
                                                cx={endX}
                                                cy={endY}
                                                r={strokeWidth / 2}
                                                fill={endColor}
                                                stroke={endCapBorderColor}
                                                strokeWidth={endCapBorderWidth}
                                        />
                                )}
                        </svg>
                </div>
        );
};
