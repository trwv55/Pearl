"use client";

import { useState, memo } from "react";
import clsx from "clsx";
import styles from "./MarkerSelect.module.css";

interface Props {
	value?: string;
	onChange: (val: string) => void;
}

interface ColorOption {
	bg: string;
	border: string;
}

const COLORS: ColorOption[] = [
	{ bg: "#ff5e00", border: "#ffb872" },
	{ bg: "#ffa931", border: "#ffe298" },
	{ bg: "#96c937", border: "#e3eda8" },
	{ bg: "#2688eb", border: "#96daff" },
	{ bg: "#3d00cb", border: "#ae96ff" },
	{ bg: "#9b41e0", border: "#dbb9ff" },
	{ bg: "#f480ff", border: "#fac2ff" },
];

function MarkerSelect({ value, onChange }: Props) {
	const [internalValue, setInternalValue] = useState<string>(COLORS[4].bg);
	const selected = value ?? internalValue;

	const handleChange = (color: string) => {
		setInternalValue(color);
		onChange(color);
	};

	return (
		<div className={styles.wrap}>
			{COLORS.map(color => (
				<button
					key={color.bg}
					type="button"
					onClick={() => handleChange(color.bg)}
					className={clsx(styles.marker, selected === color.bg && styles.selected)}
					style={{
						backgroundColor: color.bg,
						border: `2px solid ${color.border}`,
					}}
				/>
			))}
		</div>
	);
}

export default memo(MarkerSelect);
