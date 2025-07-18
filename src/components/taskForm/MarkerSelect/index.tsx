"use client";

import clsx from "clsx";

interface Props {
    value: string;
    onChange: (val: string) => void;
}

const COLORS = ["#f87171", "#fbbf24", "#34d399", "#60a5fa", "#a78bfa"];

export default function MarkerSelect({ value, onChange }: Props) {
    return (
        <div className="flex gap-2 py-2">
            {COLORS.map(color => (
                <button
                    key={color}
                    type="button"
                    onClick={() => onChange(color)}
                    className={clsx(
                        "w-8 h-8 rounded-full",
                        value === color && "ring-2 ring-black"
                    )}
                    style={{ backgroundColor: color }}
                />
            ))}
        </div>
    );
}
