"use client";

import { useEffect, useState } from "react";
import { manrope } from "@/_lib/fonts";
import { IconChevronDown } from "@tabler/icons-react";
import { InstructorSummary } from "@/_lib/types";
import Button from "@/_components/ui/Button";
import { InstructorCourseCard } from "./InstructorCourseCard";

type Props = {
    term: string;
    courses: InstructorSummary[];
    isAllExpanded: boolean;
};

export default function InstructorSemesterCard({ term, courses, isAllExpanded }: Props) {
    const [isSemOpen, setIsSemOpen] = useState(true);

    useEffect(() => {
        setIsSemOpen(isAllExpanded);
    }, [isAllExpanded]);

    return (
        <section className="space-y-3">
            <div className="flex flex-row gap-3 items-center">
                <h2 className={`${manrope.className} font-bold text-base tracking-tight text-neutral-900 dark:text-neutral-100`}>
                    {term}
                </h2>
                <Button
                    onClick={() => setIsSemOpen((prev) => !prev)}
                    variant="Ghost"
                    className="w-7! h-7! p-0! rounded-full flex items-center justify-center border border-neutral-200/60 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"
                    aria-label={`Toggle ${term}`}
                >
                    <IconChevronDown
                        size={16}
                        className={`text-neutral-700 dark:text-neutral-300 ${isSemOpen ? "rotate-180" : "rotate-0"}`}
                    />
                </Button>
            </div>
            
            <div
                className={`grid overflow-hidden ${
                    isSemOpen
                        ? "grid-rows-[1fr] opacity-100 mt-3"
                        : "grid-rows-[0fr] opacity-0 mt-0"
                }`}
            >
                <div className="min-h-0 flex flex-col gap-4 mb-3.5">
                    {courses.map((c) => (
                        <InstructorCourseCard
                            key={`${c.Subject}-${c["Course Number"]}-${c.Section}`} 
                            course={c} 
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}