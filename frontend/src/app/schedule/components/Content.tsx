"use client";

import { useEffect, useMemo, useState } from "react";
import Searchbar from "./Searchbar";
import { manrope } from "@/lib/fonts";
import { CourseRecord, InstructorCourseSummary } from "@/lib/types";
import Button from "@/components/ui/Button";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import Results from "./Results";

type Props = {
	semesters: string[];
	semesterData: CourseRecord[];
	instructorSummaries: InstructorCourseSummary[];
};

const ITEMS_PER_PAGE = 50;

export default function ScheduleContent({
	semesters,
	semesterData,
	instructorSummaries,
}: Props) {
	const [searchQuery, setSearchQuery] = useState("");
	const [debouncedQuery, setDebouncedQuery] = useState("");
	const [currentPage, setCurrentPage] = useState(1);

	const [selectedSem, setSelectedSem] = useState<string>(semesters[0] || "");
	const [showNewOnly, setShowNewOnly] = useState(false);
	
	const ONE_DAY_MS = 1000 * 60 * 60 * 24;

	const filteredCourses = useMemo(() => {
		const q = debouncedQuery.toLowerCase().trim();
		return semesterData.filter((c) => {
			const matchesSearch =
				!q ||
				c["Course (hr, crd)"]?.toLowerCase().includes(q) ||
				c.Description?.toLowerCase().includes(q) ||
				c.Instructor?.toLowerCase().includes(q) ||
				c.Code?.toString().includes(q);

			const matchesSemester = !selectedSem || c.semester === selectedSem;

			const isNew =
				!showNewOnly ||
				Date.now() - new Date(c.created).getTime() <= ONE_DAY_MS;
			return matchesSearch && matchesSemester && isNew;
		});
	}, [semesterData, debouncedQuery, selectedSem, showNewOnly]);

	const totalPages = Math.ceil(filteredCourses.length / ITEMS_PER_PAGE);

	const paginatedCourses = useMemo(() => {
		const start = (currentPage - 1) * ITEMS_PER_PAGE;
		const end = start + ITEMS_PER_PAGE;
		return filteredCourses.slice(start, end);
	}, [filteredCourses, currentPage]);

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedQuery(searchQuery);
			setCurrentPage(1);
		}, 300);
		return () => clearTimeout(timer);
	}, [searchQuery]);

	useEffect(() => {
		window.scrollTo({ top: 0, behavior: "smooth" });
	}, [currentPage]);

	return (
		<>
			<header className="flex flex-col gap-2 ">
				<h1 className={`${manrope.className} font-bold text-xl`}>
					Course Schedule Lookup
				</h1>
				<Searchbar
					semesters={semesters}
					selected={selectedSem}
					value={searchQuery}
					onChange={(val) => {
						setSearchQuery(val);
					}}
					onSelect={(val) => {
						setSelectedSem(val);
						setCurrentPage(1);
					}}
					onSelectNew={() => {
						setShowNewOnly((v) => !v);
					}}
					isNewSelected={showNewOnly}
				/>
			</header>
			<section className="my-6">
				<h3 className={`${manrope.className} font-bold text-lg mb-3`}>
					Found {filteredCourses.length} result
					{(filteredCourses.length > 1 || filteredCourses.length == 0) && "s"}.
				</h3>
				<Results
					results={paginatedCourses}
					instructorSummaries={instructorSummaries}
				/>
				{filteredCourses.length > ITEMS_PER_PAGE && <nav className="flex items-center justify-center gap-4 my-6">
					<Button
						onClick={() => {
							setCurrentPage((p) => Math.max(1, p - 1));
						}}
						disabled={currentPage === 1}
						className="disabled:opacity-30 p-1.5!"
					>
						<IconChevronLeft size={18} />
					</Button>

					<span className="text-sm font-medium">
						Page {currentPage} of {totalPages}
					</span>

					<Button
						onClick={() => {
							setCurrentPage(
								Math.min(totalPages, currentPage + 1),
							);
						}}
						disabled={currentPage === totalPages}
						className="disabled:opacity-30 p-1.5!"
					>
						<IconChevronRight size={18} />
					</Button>
				</nav>}
			</section>
		</>
	);
}
