'use client';

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Button from "@/_components/ui/Button";
import Searchbar from "@/_components/ui/Searchbar";
import { manrope } from "@/_lib/fonts";
import { InstructorCourseSummary, ScheduleCourse } from "@/_lib/types";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import ScheduleResults from "./ScheduleResults";

type Props = {
    semesterData: ScheduleCourse[],
    semesterNames: string[],
    instructorCourseSummary: InstructorCourseSummary[],
}

const ITEMS_PER_PAGE = 50;
const RECENT_THRESHOLD_MS = 1000 * 60 * 60 * 24 * 2;

export default function ScheduleClient({ semesterData, semesterNames, instructorCourseSummary }: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
    const [debouncedQuery, setDebouncedQuery] = useState(searchParams.get("q") || "");
    const [currentPage, setCurrentPage] = useState(Number(searchParams.get("page")) || 1);
    const [selectedSem, setSelectedSem] = useState(searchParams.get("sem") || semesterNames[0] || "");
    const [showNewOnly, setShowNewOnly] = useState(searchParams.get("new") === "true");

    useEffect(() => {
        const params = new URLSearchParams();
        if (currentPage > 1) params.set("page", currentPage.toString());
        if (selectedSem !== semesterNames[0]) params.set("sem", selectedSem);
        if (showNewOnly) params.set("new", "true");
        if (debouncedQuery.trim()) params.set("q", debouncedQuery.trim());

        const query = params.toString() ? `?${params.toString()}` : "";
        const newUrl = `${pathname}${query}`;
        
        window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl);
    }, [currentPage, selectedSem, showNewOnly, debouncedQuery, pathname, semesterNames]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
            setCurrentPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const filteredCourses = useMemo(() => {
        const query = debouncedQuery.toLowerCase().trim();
        const now = Date.now();

        return semesterData.filter((c) => {
            const matchesSearch = !query || 
                [c["Course (hr, crd)"], c.Description, c.Instructor, c.Code]
                .some(field => field?.toString().toLowerCase().includes(query));

            const matchesSemester = !selectedSem || c.semester === selectedSem;
            
            const isRecent = !showNewOnly || 
                (now - new Date(c.created).getTime() <= RECENT_THRESHOLD_MS);

            return matchesSearch && matchesSemester && isRecent;
        });
    }, [semesterData, debouncedQuery, selectedSem, showNewOnly]);

    const totalPages = Math.ceil(filteredCourses.length / ITEMS_PER_PAGE);
    const paginatedCourses = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredCourses.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredCourses, currentPage]);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [currentPage]);

    return (
        <>
            <header>
                <Searchbar 
                    courseSearchbar 
                    semesters={semesterNames}
                    selectedSem={selectedSem}
                    value={searchQuery}
                    onChange={setSearchQuery}
                    onSelect={(val) => { setSelectedSem(val); setCurrentPage(1); }}
                    onSelectNew={() => { setShowNewOnly(prev => !prev); setCurrentPage(1); }}
                    isNewSelected={showNewOnly}
                />
            </header>

            <section className="my-6">

                <h2 className={`${manrope.className} font-semibold text-xs text-neutral-700 dark:text-neutral-300 mb-3`}>
                    Found {filteredCourses.length} result
                    {(filteredCourses.length > 1 || filteredCourses.length == 0) && "s"}.
                </h2>

                <ScheduleResults
                    scheduleResults={paginatedCourses}
                    instructorCourseSummary={instructorCourseSummary}
                />

                {totalPages > 1 && (
                    <div className="flex justify-center my-8">
                        <nav className="inline-flex items-center gap-3 px-3 py-1.5 rounded-full bg-white/80 dark:bg-[#181818]/80 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs backdrop-blur-xs" aria-label="Pagination">
                            <Button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                variant="Ghost"
                                className="w-7! h-7! p-0! rounded-full flex items-center justify-center disabled:opacity-30 text-neutral-700 dark:text-neutral-300"
                                aria-label="Previous page"
                            >
                                <IconChevronLeft size={16} />
                            </Button>

                            <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200 select-none">
                                Page {currentPage} of {totalPages}
                            </span>

                            <Button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                variant="Ghost"
                                className="w-7! h-7! p-0! rounded-full flex items-center justify-center disabled:opacity-30 text-neutral-700 dark:text-neutral-300"
                                aria-label="Next page"
                            >
                                <IconChevronRight size={16} />
                            </Button>
                        </nav>
                    </div>
                )}
            </section>
        </>
    );
}