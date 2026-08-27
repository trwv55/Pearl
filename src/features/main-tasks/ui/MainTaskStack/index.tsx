import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type Modifier } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Тащим карточку только по вертикали — иначе она уезжает за палец вбок и
// сдвигает экран вправо. Вбок карточка не выходит, по вертикали — свободно.
const restrictToVerticalAxis: Modifier = ({ transform }) => ({ ...transform, x: 0 });

// Геометрия свёрнутой стопки: каждая следующая карта ниже на 11px и мельче на 7%.
// Эти же числа задают стартовую точку «разлёта» при раскрытии, поэтому вынесены
// в константы — иначе анимация начнётся не там, где карточка реально стояла.
const STACK_OFFSET = 11;
const STACK_SCALE_STEP = 0.07;
// Отступ между карточками в раскрытом списке — должен совпадать с gap у .expanded.
const LIST_GAP = 10;
// Запасная высота карточки, пока ResizeObserver не измерил реальную.
const FALLBACK_ITEM_H = 80;
import { isTaskMain, type Task, type TaskMain } from "@/shared/types/task";
import { MainTaskItem } from "@/features/main-tasks/ui/MainTaskItem";
import { EmptyMainTaskSlot } from "@/features/main-tasks/ui/EmptyMainTaskSlot";
import styles from "./MainTaskStack.module.css";
import { userStore } from "@/shared/model/userStore";
import { taskStore } from "@/shared/model/taskStore";
import { toast } from "sonner";
import { statsStore } from "@/shared/model/statsStore";
import { startOfWeek } from "date-fns";
import { useHaptics } from "@/shared/hooks/useHaptics";
import { HAPTIC_LIGHT } from "@/shared/lib/haptics";

interface SortableMainTaskProps {
	task: TaskMain;
	onDelete: (taskId: string) => void;
	onComplete: (task: Task) => void;
}

// Обёртка для drag-and-drop в раскрытом стеке. transform от dnd-kit идёт на
// внешнем div, а framer-motion-анимация (y:0/scale:1) — на внутреннем в стеке,
// поэтому источники transform не конфликтуют.
const SortableMainTask: React.FC<SortableMainTaskProps> = ({ task, onDelete, onComplete }) => {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		zIndex: isDragging ? 1 : 0,
		position: "relative" as const,
	};

	return (
		<div ref={setNodeRef} style={style} {...attributes} {...listeners}>
			<MainTaskItem task={task} isExpanded isDragging={isDragging} onDelete={onDelete} onComplete={onComplete} />
		</div>
	);
};

interface MainTaskStackProps {
	tasks: (TaskMain | null)[];
	isExpanded?: boolean;
	onExpandChange?: (expanded: boolean) => void;
	canExpand?: boolean;
}

export const MainTaskStack: React.FC<MainTaskStackProps> = ({
	tasks,
	isExpanded: controlledExpanded,
	onExpandChange,
	canExpand,
}) => {
	const [uncontrolledExpanded, setUncontrolledExpanded] = useState(false);
	const isControlled = controlledExpanded !== undefined;
	const isExpanded = isControlled ? controlledExpanded : uncontrolledExpanded;
	const prevTasksRef = useRef<string>("");
	const firstItemRef = useRef<HTMLDivElement | null>(null);
	const [itemH, setItemH] = useState<number>(0);
	const uid = userStore.user?.uid;
	const { trigger } = useHaptics();

	// Во время драга глушим выделение текста/callout на странице через класс на body.
	useEffect(() => () => document.body.classList.remove("dnd-dragging"), []);

	useEffect(() => {
		if (isControlled) return;
		const ids = tasks.map((t) => t?.id).join(",");
		if (prevTasksRef.current !== ids) {
			setUncontrolledExpanded(false);
			prevTasksRef.current = ids;
		}
	}, [tasks, isControlled]);

	useLayoutEffect(() => {
		if (!firstItemRef.current) return;
		const el = firstItemRef.current;

		const update = () => setItemH(el.getBoundingClientRect().height);
		update();

		const ro = new ResizeObserver(update);
		ro.observe(el);
		return () => ro.disconnect();
	}, [tasks]);

	const handleToggle = useCallback(() => {
		trigger(...HAPTIC_LIGHT);
		const next = !isExpanded;
		if (!isControlled) setUncontrolledExpanded(next);
		onExpandChange?.(next);
	}, [isExpanded, isControlled, onExpandChange, trigger]);

	const handleDelete = useCallback(
		(taskId: string) => {
			if (!uid) {
				toast.error("Нет данных пользователя");
				return;
			}
			const full = tasks.find((t) => t?.id === taskId);
			if (!full) return;
			onExpandChange?.(false);
			if (!isControlled) setUncontrolledExpanded(false);

			const weekStart = startOfWeek(taskStore.selectedDate, { weekStartsOn: 1 });
			taskStore.deleteWithUndo(uid, full, 4000, () => {
				statsStore.fetchWeekStats(uid, weekStart);
			});
		},
		[tasks, isControlled, onExpandChange, uid],
	);

	const handleComplete = useCallback(
		async (task: Task) => {
			if (!uid) {
				toast.error("Нет данных пользователя");
				return;
			}
			await taskStore.toggleCompletion(uid, task.id);
			const weekStart = startOfWeek(taskStore.selectedDate, { weekStartsOn: 1 });
			statsStore.fetchWeekStats(uid, weekStart);
		},
		[uid, taskStore.selectedDate],
	);

	// Реальные (не-плейсхолдер) главные задачи — только их можно перетаскивать.
	const realTasks = useMemo(() => tasks.filter((t): t is TaskMain => !!t && isTaskMain(t)), [tasks]);

	// Задержка активации как у рутинных: короткий свайп → удаление, удержание → drag.
	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { delay: 1000, tolerance: 50 } }));

	const handleDragEnd = useCallback(
		(event: { active: { id: string | number }; over: { id: string | number } | null }) => {
			const { active, over } = event;
			if (!over || active.id === over.id) return;

			const oldIndex = realTasks.findIndex((t) => t.id === active.id);
			const newIndex = realTasks.findIndex((t) => t.id === over.id);
			if (oldIndex === -1 || newIndex === -1) return;

			const reordered = arrayMove(realTasks, oldIndex, newIndex);
			if (uid) taskStore.reorderOptimistic(uid, reordered);
		},
		[realTasks, uid],
	);

	const handleDragStart = useCallback(() => {
		document.body.classList.add("dnd-dragging");
	}, []);

	const handleDragEndWrapped = useCallback(
		(event: { active: { id: string | number }; over: { id: string | number } | null }) => {
			document.body.classList.remove("dnd-dragging");
			handleDragEnd(event);
		},
		[handleDragEnd],
	);

	const handleDragCancel = useCallback(() => {
		document.body.classList.remove("dnd-dragging");
	}, []);

	const expandedHeight = 300;
	const collapsedHeight = itemH || undefined;
	const containerAnimate = itemH ? { height: isExpanded ? expandedHeight : collapsedHeight } : undefined;

	// Стартовая точка «разлёта»: карточка начинает ровно там, где стояла в
	// свёрнутой стопке, и пружиной встаёт на своё место в списке. В стопке
	// карта i смещена на i*11, в списке — на i*(высота+gap); значит лететь ей
	// нужно ровно эту разницу, снизу вверх. Верхняя карта уже на месте.
	const cardH = itemH || FALLBACK_ITEM_H;
	const spreadFrom = (index: number) => ({
		y: -index * (cardH + LIST_GAP - STACK_OFFSET),
		scale: 1 - index * STACK_SCALE_STEP,
		opacity: index === 0 ? 1 : 0.95,
	});

	// Раскрытый стек: вертикальный список с drag-and-drop. Реальные задачи
	// перетаскиваются, плейсхолдеры («Будущая задача») — статичны.
	if (isExpanded) {
		return (
			<motion.div
				initial={false}
				animate={containerAnimate}
				transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
				className={`${styles.stack} ${styles.expanded}`}
				style={{ overflow: "hidden" }}
			>
				<DndContext
					sensors={sensors}
					collisionDetection={closestCenter}
					modifiers={[restrictToVerticalAxis]}
					onDragStart={handleDragStart}
					onDragEnd={handleDragEndWrapped}
					onDragCancel={handleDragCancel}
				>
					<SortableContext items={realTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
						{tasks.map((task, index) => (
							<motion.div
								key={task ? task.id : `placeholder-${index}`}
								className={styles.taskItemWrapper}
								initial={spreadFrom(index)}
								animate={{ y: 0, scale: 1, opacity: 1 }}
								transition={{ type: "spring", stiffness: 400, damping: 30, delay: index * 0.05 }}
							>
								<div className={styles.taskItemWrap} ref={index === 0 ? firstItemRef : undefined}>
									{task ? (
										<SortableMainTask task={task} onDelete={handleDelete} onComplete={handleComplete} />
									) : (
										<EmptyMainTaskSlot />
									)}
								</div>
							</motion.div>
						))}
					</SortableContext>
				</DndContext>
			</motion.div>
		);
	}

	// Свёрнутый стек: карты наложены друг на друга (framer-motion), без DnD.
	return (
		<motion.div
			initial={false}
			animate={containerAnimate}
			transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
			className={styles.stack}
			style={{ overflow: "hidden" }}
		>
			{tasks.map((task, index) => {
				const offset = index * STACK_OFFSET;
				const scale = 1 - index * STACK_SCALE_STEP;
				const z = tasks.length - index;

				return (
					<motion.div
						key={task ? task.id : `placeholder-${index}`}
						initial={false}
						animate={{
							y: offset,
							scale: scale,
							opacity: index === 0 ? 1 : 0.95,
						}}
						transition={{ type: "tween", duration: 0.4, ease: "easeOut" }}
						style={{
							position: "absolute",
							top: 0,
							left: 0,
							width: "100%",
							zIndex: z,
							cursor: index === 0 ? "pointer" : "default",
						}}
						onClick={() => {
							if (index === 0 && canExpand) handleToggle();
						}}
						className={styles.taskItemWrapper}
					>
						<div className={styles.taskItemWrap} ref={index === 0 ? firstItemRef : undefined}>
							{task ? (
								<MainTaskItem task={task} isExpanded={false} onDelete={handleDelete} onComplete={handleComplete} />
							) : (
								<EmptyMainTaskSlot />
							)}
						</div>
					</motion.div>
				);
			})}
		</motion.div>
	);
};
