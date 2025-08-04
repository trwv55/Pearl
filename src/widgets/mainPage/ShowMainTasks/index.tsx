import { useEffect, useCallback, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import styles from "./ShowTasks.module.css";
import { EmptyTaskState } from "../shared/EmptyTaskState";
import type { Task } from "@/entities/task/types";
import { MainTaskStack } from "@/components/dashboard/MainTaskStack";

interface ShowTasksProps {
	tasks: Task[];
	showDots?: boolean;
}

export function ShowMainTasks({ tasks, showDots }: ShowTasksProps) {
        const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
        const [selectedIndex, setSelectedIndex] = useState(0);
        const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
        const [isStackExpanded, setIsStackExpanded] = useState(false);

	// следим за изменением выбранного слайда
	const onSelect = useCallback(() => {
		if (!emblaApi) return;
		setSelectedIndex(emblaApi.selectedScrollSnap());
	}, [emblaApi]);

	// инициализация
	useEffect(() => {
		if (!emblaApi) return;
		setScrollSnaps(emblaApi.scrollSnapList());
		emblaApi.on("select", onSelect);
		onSelect();
	}, [emblaApi, onSelect]);

	const renderFirstSlide = () => {
		if (tasks.length === 0) {
			return <EmptyTaskState />;
		}

                return (
                        <div className="flex flex-col gap-2">
                                <MainTaskStack tasks={tasks} onExpandChange={setIsStackExpanded} />
                        </div>
                );
	};

        if (isStackExpanded) {
                return (
                        <div className="w-full">
                                <MainTaskStack tasks={tasks} isExpanded onExpandChange={setIsStackExpanded} />
                                {showDots && (
                                        <div className={styles.dotsWrap}>
                                                <button
                                                        onClick={() => setIsStackExpanded(false)}
                                                        className={styles.closeLine}
                                                />
                                        </div>
                                )}
                        </div>
                );
        }

        return (
                <div className="w-full">
                        <div className="overflow-hidden" ref={emblaRef}>
                                <div className="flex">
                                        {/* Слайд 1 */}
                                        <div className="flex-[0_0_100%]">{renderFirstSlide()}</div>
                                        {/* Слайд 2 (пока пустой) */}
                                        <div className="flex-[0_0_100%] px-4">
                                                <div className="">Пустой слайд</div>
                                        </div>
                                </div>
                        </div>

                        {/* 🔵 Точки переключения */}
                        {showDots && (
                                <div className={styles.dotsWrap}>
                                        {scrollSnaps.map((_, index) => (
                                                <button
                                                        key={index}
                                                        onClick={() => emblaApi && emblaApi.scrollTo(index)}
                                                        className={`${styles.dot} ${selectedIndex === index ? styles.dotActive : ""}`}
                                                />
                                        ))}
                                </div>
                        )}
                </div>
        );
}
