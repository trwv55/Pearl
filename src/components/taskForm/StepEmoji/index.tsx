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

	/**
	 * Регулярка для поиска эмодзи:
	 * - \p{Extended_Pictographic} — большинство эмодзи
	 * - \uFE0F, \uFE0E — вариационные селекторы
	 * - \p{Emoji_Modifier} — модификаторы (тона кожи)
	 * - \u200D — ZWJ (Zero Width Joiner) для сложных эмодзи (семьи, флаги и т.п.)
	 * - \p{Regional_Indicator}{2} — флаги по двум буквам
	 */
	const emojiSeqRegex = useMemo(
		() =>
			/(?:\p{Extended_Pictographic}(?:\uFE0F|\uFE0E|\p{Emoji_Modifier})?(?:\u200D\p{Extended_Pictographic}(?:\uFE0F|\uFE0E|\p{Emoji_Modifier})?)*)|(?:\p{Regional_Indicator}{2})/gu,
		[],
	);

	/**
	 * Разделяет строку на «кластеры эмодзи»,
	 * чтобы корректно обрабатывать сложные эмодзи, состоящие из нескольких символов
	 */
	const extractEmojiClusters = (text: string): string[] => {
		return text.match(emojiSeqRegex) ?? [];
	};

	/**
	 * Проверяет, что введённая строка состоит только из эмодзи
	 */
	const isEmojiOnly = (text: string) => {
		const trimmed = text.trim();
		if (!trimmed) return false;
		const clusters = extractEmojiClusters(trimmed);
		return clusters.join("") === trimmed;
	};

	/**
	 * Включает класс ошибки и выключает его через 0.5 секунды
	 */
	const triggerFlashInvalid = () => {
		setFlashInvalid(true);
		if (flashTimer.current) window.clearTimeout(flashTimer.current);
		flashTimer.current = window.setTimeout(() => setFlashInvalid(false), 500);
	};

	/**
	 * Обработчик ввода "на лету" — блокирует ввод не-эмодзи
	 */
	const handleBeforeInput = (e: React.FormEvent<HTMLTextAreaElement> & { data?: string }) => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const data = (e as any).data as string | undefined;
		if (!data) return;
		if (!isEmojiOnly(data)) {
			e.preventDefault();
			triggerFlashInvalid();
		}
	};

	/**
	 * Обработчик вставки (paste) — оставляет только первый найденный эмодзи
	 */
	const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
		const text = e.clipboardData.getData("text");
		const emojis = extractEmojiClusters(text);
		if (emojis.length === 0) {
			e.preventDefault();
			triggerFlashInvalid();
			return;
		}
		e.preventDefault();
		onChange?.(emojis[0]); // вставляем только один эмодзи
	};

	/**
	 * Обработчик изменения текста — страховка на случай обхода beforeinput/paste
	 */
	const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const emojis = extractEmojiClusters(e.target.value);
		onChange?.(emojis[0] ?? "");
		if (e.target.value && emojis.length === 0) triggerFlashInvalid();
	};

	// Поле считается ошибочным, если:
	// - flashInvalid=true (последняя попытка была неверной)
	// - введено что-то, но это не ровно один эмодзи
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
