import { SVGProps } from "react";

interface TaskGradientEllipseProps extends SVGProps<SVGSVGElement> {
	color: string;
	uniqueId: string;
}

export const TaskGradientEllipse = ({ color, uniqueId, className, ...props }: TaskGradientEllipseProps) => (
	<svg
		className={className}
		width="100%"
		height="206"
		viewBox="0 0 375 206"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		preserveAspectRatio="xMidYMin slice"
		{...props}
	>
		<defs>
			<filter
				id={`filter0_fn_${uniqueId}`}
				x="-133"
				y="-244"
				width="641"
				height="450"
				filterUnits="userSpaceOnUse"
				colorInterpolationFilters="sRGB"
			>
				<feFlood floodOpacity="0" result="BackgroundImageFix" />
				<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
				<feGaussianBlur stdDeviation="50" result="effect1_foregroundBlur" />
				<feTurbulence
					type="fractalNoise"
					baseFrequency="1 1"
					stitchTiles="stitch"
					numOctaves="3"
					result="noise"
					seed="372"
				/>
				<feColorMatrix in="noise" type="luminanceToAlpha" result="alphaNoise" />
				<feComponentTransfer in="alphaNoise" result="coloredNoise1">
					<feFuncA
						type="discrete"
						tableValues="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 "
					/>
				</feComponentTransfer>
				<feComposite operator="in" in2="effect1_foregroundBlur" in="coloredNoise1" result="noise1Clipped" />
				<feFlood floodColor="rgba(255, 255, 255, 0.25)" result="color1Flood" />
				<feComposite operator="in" in2="noise1Clipped" in="color1Flood" result="color1" />
				<feMerge result="effect2_noise">
					<feMergeNode in="effect1_foregroundBlur" />
					<feMergeNode in="color1" />
				</feMerge>
			</filter>
			<linearGradient
				id={`paint0_linear_${uniqueId}`}
				x1="187.5"
				y1="-144"
				x2="187.5"
				y2="106"
				gradientUnits="userSpaceOnUse"
			>
				<stop stopColor={color} />
				<stop offset="1" stopColor={color} />
			</linearGradient>
		</defs>
		<g filter={`url(#filter0_fn_${uniqueId})`}>
			<ellipse cx="187.5" cy="-19" rx="220.5" ry="125" fill={`url(#paint0_linear_${uniqueId})`} />
		</g>
	</svg>
);
