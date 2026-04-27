"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
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
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
    const [debouncedQuery, setDebouncedQuery] = useState(searchParams.get("q") || "");
    const [currentPage, setCurrentPage] = useState(
        Number(searchParams.get("page")) || 1
    );
    const [selectedSem, setSelectedSem] = useState<string>(
        searchParams.get("sem") || semesters[0] || ""
    );
    const [showNewOnly, setShowNewOnly] = useState(
        searchParams.get("new") === "true"
    );

    const isFirstRender = useRef(true);

    const updateURL = (page: number, sem: string, isNew: boolean, q: string) => {
        const params = new URLSearchParams(window.location.search);
        
        if (page <= 1) params.delete("page"); 
        else params.set("page", page.toString());
        
        if (sem === semesters[0]) params.delete("sem");
        else params.set("sem", sem);

        if (!isNew) params.delete("new");
        else params.set("new", "true");

        if (!q.trim()) params.delete("q");
        else params.set("q", q.trim());

        window.history.pushState(null, "", `${pathname}?${params.toString()}`);
    };

    const handlePageChange = (p: number) => {
        setCurrentPage(p);
        updateURL(p, selectedSem, showNewOnly, searchQuery);
    };

    const handleSemChange = (val: string) => {
        setSelectedSem(val);
        setCurrentPage(1);
        updateURL(1, val, showNewOnly, searchQuery);
    };

    const handleNewToggle = () => {
        const nextNew = !showNewOnly;
        setShowNewOnly(nextNew);
        setCurrentPage(1);
        updateURL(1, selectedSem, nextNew, searchQuery);
    };
    
    const DAY_MS = 1000 * 60 * 60 * 24 * 2;

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
                Date.now() - new Date(c.created).getTime() <= DAY_MS;
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
            if (isFirstRender.current) {
                isFirstRender.current = false;
            } else {
                setCurrentPage(1);
                updateURL(1, selectedSem, showNewOnly, searchQuery);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        if (!isFirstRender.current) {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
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
                    onSelect={handleSemChange}
                    onSelectNew={handleNewToggle}
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
                            handlePageChange(Math.max(1, currentPage - 1));
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
                            handlePageChange(Math.min(totalPages, currentPage + 1));
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