import { SVGProps } from "react";

export const AppBack = (props: SVGProps<SVGSVGElement>) => (
	<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
		<defs>
			<mask id="arrow-mask">
				<rect width="28" height="28" fill="white" />
				<path d="M16 20L10 14L16 8" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
			</mask>
		</defs>

		<circle cx="14" cy="14" r="13" fill="white" mask="url(#arrow-mask)" />
		<circle cx="14" cy="14" r="13" stroke="white" strokeWidth="2" />
	</svg>
);
