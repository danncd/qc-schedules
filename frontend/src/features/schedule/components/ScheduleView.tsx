"use client";
import { useMemo } from "react";
import Pagination from "@/components/ui/Pagination";
import { defaultTerm, type Term } from "@/lib/terms";
import { useCurrentTime } from "../hooks/useCurrentTime";
import type { CourseSection } from "../types";
import { filterSections } from "../lib/filters";
import { pageNumber } from "@/lib/pagination";
import { useLocalQuery } from "@/lib/url-state";
import ScheduleToolbar from "./ScheduleToolbar";
import CourseResults from "./CourseResults";
export default function ScheduleView({
    schedules,
    terms,
}: {
    schedules: Record<string, CourseSection[]>;
    terms: Term[];
}) {
    const { params, update } = useLocalQuery();
    const now = useCurrentTime();
    const requested = params.get("sem");
    const term =
        terms.find((item) => item.id === requested || item.label === requested)
            ?.id || defaultTerm(terms, new Date(now));
    const courses = schedules[term];
    const query = params.get("q") || "";
    const onlyNew = params.get("new") === "true";
    const results = useMemo(
        () => filterSections(courses, query, onlyNew, now),
        [courses, query, onlyNew, now],
    );
    const page = pageNumber(params.get("page"), results.length);
    return (
        <div>
            <ScheduleToolbar
                query={query}
                onQuery={(q) => update({ q, page: null })}
                term={term}
                terms={terms}
                onTerm={(value) => update({ sem: value, page: null }, "push")}
                onlyNew={onlyNew}
                onNew={() =>
                    update({ new: onlyNew ? null : "true", page: null })
                }
            />
            <p
                className="results-count"
                aria-live="polite"
            >
                {results.length.toLocaleString("en-US")} sections ·{" "}
                {terms.find((item) => item.id === term)?.label}
            </p>
            <CourseResults
                courses={results.slice((page - 1) * 50, page * 50)}
            />
            <div className="results-footer">
                <Pagination
                    page={page}
                    total={Math.ceil(results.length / 50)}
                    onChange={(value) => {
                        update({ page: String(value) });
                        window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                />
            </div>
        </div>
    );
}
