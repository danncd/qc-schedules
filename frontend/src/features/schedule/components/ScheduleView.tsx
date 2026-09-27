"use client";
import { useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import Pagination from "@/components/ui/Pagination";
import type { Term } from "@/lib/terms";
import type { CourseSection } from "../types";
import { filterSections } from "../lib/filters";
import { pageNumber } from "@/lib/pagination";
import { useLocalQuery } from "@/lib/url-state";
import ScheduleToolbar from "./ScheduleToolbar";
import CourseResults from "./CourseResults";
export default function ScheduleView({
    courses,
    terms,
    term,
    now,
}: {
    courses: CourseSection[];
    terms: Term[];
    term: string;
    now: number;
}) {
    const { params, update } = useLocalQuery();
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const query = params.get("q") || "";
    const onlyNew = params.get("new") === "true";
    const results = useMemo(
        () => filterSections(courses, query, onlyNew, now),
        [courses, query, onlyNew, now],
    );
    const page = pageNumber(params.get("page"), results.length);
    return (
        <div aria-busy={pending}>
            <ScheduleToolbar
                query={query}
                onQuery={(q) => update({ q, page: null })}
                term={term}
                terms={terms}
                onTerm={(value) => {
                    const next = new URLSearchParams(params.toString());
                    next.set("sem", value);
                    next.delete("page");
                    startTransition(() =>
                        router.push(`/schedule?${next}`, { scroll: false }),
                    );
                }}
                onlyNew={onlyNew}
                onNew={() =>
                    update({ new: onlyNew ? null : "true", page: null })
                }
                pending={pending}
            />
            <p
                className="results-count"
                aria-live="polite"
            >
                {pending
                    ? "Loading semester…"
                    : `${results.length.toLocaleString("en-US")} sections · ${terms.find((item) => item.id === term)?.label}`}
            </p>
            <div className={pending ? "opacity-50" : ""}>
                <CourseResults
                    courses={results.slice((page - 1) * 50, page * 50)}
                />
            </div>
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
