"use client";
import { memo, useMemo, useRef, useState } from "react";
import styles from "../StepTitle/StepTitle.module.css";

interface StepEmojiProps {
	placeholder?: string;
	note?: string;
	rows?: number;
	value?: string;
	onChange?: (value: string) => void;
}

function StepEmoji({
	placeholder = "Подбери символ...",
	note = "Только один эмодзи",
	rows = 3,
	value,
	onChange,
}: StepEmojiProps) {
	const [flashInvalid, setFlashInvalid] = useState(false);
	const flashTimer = useRef<number | null>(null);

	const emojiSeqRegex = useMemo(
		() =>
			/(?:\p{Extended_Pictographic}(?:\uFE0F|\uFE0E|\p{Emoji_Modifier})?(?:\u200D\p{Extended_Pictographic}(?:\uFE0F|\uFE0E|\p{Emoji_Modifier})?)*)|(?:\p{Regional_Indicator}{2})/gu,
		[],
	);

	const extractEmojiClusters = (text: string): string[] => {
		return text.match(emojiSeqRegex) ?? [];
	};

	const isEmojiOnly = (text: string) => {
		const trimmed = text.trim();
		if (!trimmed) return false;
		const clusters = extractEmojiClusters(trimmed);
		return clusters.join("") === trimmed;
	};

	const triggerFlashInvalid = () => {
		setFlashInvalid(true);
		if (flashTimer.current) window.clearTimeout(flashTimer.current);
		flashTimer.current = window.setTimeout(() => setFlashInvalid(false), 500);
	};

	const handleBeforeInput = (e: React.FormEvent<HTMLTextAreaElement> & { data?: string }) => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const data = (e as any).data as string | undefined;
		if (!data) return;
		if (!isEmojiOnly(data)) {
			e.preventDefault();
			triggerFlashInvalid();
		}
	};

	const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
		const text = e.clipboardData.getData("text");
		const emojis = extractEmojiClusters(text);
		if (emojis.length === 0) {
			e.preventDefault();
			triggerFlashInvalid();
			return;
		}
		e.preventDefault();
		onChange?.(emojis[0]);
	};

	const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const emojis = extractEmojiClusters(e.target.value);
		onChange?.(emojis[0] ?? "");
		if (e.target.value && emojis.length === 0) triggerFlashInvalid();
	};

	const isInvalidNow = flashInvalid || (!!value && extractEmojiClusters(value).length !== 1);

	return (
		<div className={styles.wrap}>
			<div className={styles.textareaWrap}>
				<textarea
					className={`${styles.textarea} ${isInvalidNow ? styles.error : ""}`}
					placeholder={placeholder}
					rows={rows}
					style={{ lineHeight: "120%" }}
					value={value}
					onBeforeInput={handleBeforeInput}
					onPaste={handlePaste}
					onChange={handleChange}
				/>
				<span>{note}</span>
			</div>
		</div>
	);
}

export default memo(StepEmoji);
