"use client";

import Button from "@/components/ui/Button";
import { manrope } from "@/lib/fonts";
import { IconChevronDown } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { CourseCard } from "./CourseCard";

type Props = {
	term: string;
	courses: any[];
	isAllExpanded: Boolean;
};
export default function SemesterCard({ term, courses, isAllExpanded }: Props) {
	const [isSemOpen, setIsSemOpen] = useState(true);

	useEffect(() => {
		setIsSemOpen(!!isAllExpanded);
	}, [isAllExpanded])

	return (
		<section>
			<div className="flex flex-row gap-4 items-center mb-3">
				<h2 className={`${manrope.className} font-bold text-lg`}>
					{term}
				</h2>
				<Button
					onClick={() => setIsSemOpen(!isSemOpen)}
					variant="Ghost"
					className="p-1!"
				>
					<IconChevronDown
						size={20}
						className={`transition-transform duration-300 ${isSemOpen ? "rotate-180" : "rotate-0"}`}
					/>
				</Button>
			</div>
			<div
				className={`grid transition-[grid-template-rows,opacity,margin-top] duration-300 ease-in-out overflow-hidden ${
					isSemOpen
						? "grid-rows-[1fr] opacity-100 mt-3"
						: "grid-rows-[0fr] opacity-0 mt-0"
				}`}
			>
				<div className="min-h-0 flex flex-col gap-4 mb-3.5">
					{courses.map((c, i) => (
						<CourseCard key={`${c.Subject}-${c["Course Number"]}-${c.Section}`} course={c}/>
					))}
				</div>
			</div>
		</section>
	);
}
