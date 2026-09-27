"use client";
import { useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import type { GradeRecord } from "@/features/grades/types";
import { groupHistory } from "../lib/history";
import SemesterSection from "./SemesterSection";
export default function InstructorHistory({
    records,
}: {
    records: GradeRecord[];
}) {
    const groups = useMemo(() => groupHistory(records), [records]);
    const [closed, setClosed] = useState<string[]>([]);
    const allOpen = closed.length === 0;
    return (
        <>
            <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-base font-semibold">Course history</h2>
                <Button
                    onClick={() =>
                        setClosed(allOpen ? groups.map(([term]) => term) : [])
                    }
                >
                    {allOpen ? "Collapse All" : "Expand All"}
                </Button>
            </div>
            <div className="space-y-5">
                {groups.map(([term, courses]) => (
                    <SemesterSection
                        key={term}
                        term={term}
                        records={courses}
                        open={!closed.includes(term)}
                        onToggle={() =>
                            setClosed((old) =>
                                old.includes(term)
                                    ? old.filter((value) => value !== term)
                                    : [...old, term],
                            )
                        }
                    />
                ))}
            </div>
        </>
    );
}
