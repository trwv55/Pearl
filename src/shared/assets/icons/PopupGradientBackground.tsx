import React from "react";

interface PopupGradientBackgroundProps {
	className?: string;
}

export const PopupGradientBackground: React.FC<PopupGradientBackgroundProps> = ({ className }) => {
	return (
		<svg
			width="90%"
			height="687"
			viewBox="0 0 375 687"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={className}
			preserveAspectRatio="xMidYMid meet"
		>
			<g filter="url(#filter0_fn_638_68439)">
				<ellipse cx="187.5" cy="299.926" rx="187.5" ry="299.926" fill="#AE96FF" />
				<ellipse
					cx="187.5"
					cy="299.926"
					rx="187.5"
					ry="299.926"
					fill="url(#paint0_radial_638_68439)"
					fillOpacity="0.5"
				/>
			</g>
			<defs>
				<filter
					id="filter0_fn_638_68439"
					x="-256"
					y="-256"
					width="887"
					height="1111.85"
					filterUnits="userSpaceOnUse"
					colorInterpolationFilters="sRGB"
				>
					<feFlood floodOpacity="0" result="BackgroundImageFix" />
					<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
					<feGaussianBlur stdDeviation="128" result="effect1_foregroundBlur_638_68439" />
					<feTurbulence
						type="fractalNoise"
						baseFrequency="1 1"
						stitchTiles="stitch"
						numOctaves="3"
						result="noise"
						seed="271"
					/>
					<feColorMatrix in="noise" type="luminanceToAlpha" result="alphaNoise" />
					<feComponentTransfer in="alphaNoise" result="coloredNoise1">
						<feFuncA
							type="discrete"
							tableValues="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 "
						/>
					</feComponentTransfer>
					<feComposite operator="in" in2="effect1_foregroundBlur_638_68439" in="coloredNoise1" result="noise1Clipped" />
					<feFlood floodColor="rgba(255, 255, 255, 0.5)" result="color1Flood" />
					<feComposite operator="in" in2="noise1Clipped" in="color1Flood" result="color1" />
					<feMerge result="effect2_noise_638_68439">
						<feMergeNode in="effect1_foregroundBlur_638_68439" />
						<feMergeNode in="color1" />
					</feMerge>
				</filter>
				<radialGradient
					id="paint0_radial_638_68439"
					cx="0"
					cy="0"
					r="1"
					gradientTransform="matrix(217.013 -443.654 320.625 300.284 164.13 40.0698)"
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="#AE96FF" />
					<stop offset="0.533004" stopColor="#3D00CB" />
					<stop offset="1" stopColor="#3D00CB" />
				</radialGradient>
			</defs>
		</svg>
	);
};
