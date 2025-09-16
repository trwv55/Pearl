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

export const ProgressWheel = ({
        radius,
        strokeWidth,
        value,
        total,
        gradientStops,
        backgroundColor,
        className,
        animationDuration = 600,
        overshootDegrees = 8,
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

        const stops = useMemo(() => {
                const list = gradientStops && gradientStops.length > 0 ? gradientStops : DEFAULT_STOPS;
                return list
                        .slice()
                        .sort((a, b) => a.offset - b.offset)
                        .map((stop) => ({
                                ...stop,
                        }));
        }, [gradientStops]);


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
<!--                                 <defs> -->
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
