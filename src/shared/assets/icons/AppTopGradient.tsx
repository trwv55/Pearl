import { SVGProps } from "react";

// url(#filter0_fn_340_161829)

export const AppTopGradient = (props: SVGProps<SVGSVGElement>) => (
	<svg width="100%" height="250" viewBox="0 0 375 286" fill="none" xmlns="http://www.w3.org/2000/svg">
		<g filter="url(#filter0_fn_340_160140)">
			<ellipse cx="187.5" cy="61" rx="220.5" ry="125" fill="url(#paint0_linear_340_160140)" />
			<path
				d="M187.5 -63.5C248.319 -63.5 303.356 -49.5237 343.171 -26.9531C383 -4.3741 407.5 26.7412 407.5 61C407.5 95.2588 383 126.374 343.171 148.953C303.356 171.524 248.319 185.5 187.5 185.5C126.681 185.5 71.6436 171.524 31.8291 148.953C-8.00007 126.374 -32.5 95.2588 -32.5 61C-32.5 26.7412 -8.00007 -4.3741 31.8291 -26.9531C71.6436 -49.5237 126.681 -63.5 187.5 -63.5Z"
				stroke="black"
			/>
		</g>
		<defs>
			<filter
				id="filter0_fn_340_160140"
				x="-133"
				y="-164"
				width="641"
				height="450"
				filterUnits="userSpaceOnUse"
				color-interpolation-filters="sRGB"
			>
				<feFlood flood-opacity="0" result="BackgroundImageFix" />
				<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
				<feGaussianBlur stdDeviation="50" result="effect1_foregroundBlur_340_160140" />
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
				<feComposite operator="in" in2="effect1_foregroundBlur_340_160140" in="coloredNoise1" result="noise1Clipped" />
				<feFlood flood-color="rgba(255, 255, 255, 0.25)" result="color1Flood" />
				<feComposite operator="in" in2="noise1Clipped" in="color1Flood" result="color1" />
				<feMerge result="effect2_noise_340_160140">
					<feMergeNode in="effect1_foregroundBlur_340_160140" />
					<feMergeNode in="color1" />
				</feMerge>
			</filter>
			<linearGradient id="paint0_linear_340_160140" x1="187.5" y1="-64" x2="187.5" y2="186" gradientUnits="userSpaceOnUse">
				<stop stop-color="#3D00CB" />
				<stop offset="1" stop-color="#3D00CB" />
			</linearGradient>
		</defs>
	</svg>
);
