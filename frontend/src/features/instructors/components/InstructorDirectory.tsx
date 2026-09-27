"use client";
import { matchesSearch } from "@/lib/search";
import SearchInput from "@/components/ui/SearchInput";
import Pagination from "@/components/ui/Pagination";
import { useLocalQuery } from "@/lib/url-state";
import { pageNumber } from "@/lib/pagination";
import type { Instructor } from "../types";
import InstructorCard from "./InstructorCard";
export default function InstructorDirectory({
    instructors,
}: {
    instructors: Instructor[];
}) {
    const { params, update } = useLocalQuery();
    const query = params.get("q") || "";
    const filtered = instructors.filter((person) =>
        matchesSearch(
            `${person.name} ${person.rawName} ${person.subjects.join(" ")}`,
            query,
        ),
    );
    const page = pageNumber(params.get("page"), filtered.length, 30);
    return (
        <>
            <SearchInput
                value={query}
                onChange={(q) => update({ q, page: null })}
                placeholder="Search an instructor or subject"
            />
            <p
                className="results-count mt-4"
                aria-live="polite"
            >
                {filtered.length.toLocaleString("en-US")} instructors
            </p>
            <div className="flex flex-col gap-3">
                {filtered.slice((page - 1) * 30, page * 30).map((person) => (
                    <InstructorCard
                        key={person.slug}
                        person={person}
                    />
                ))}
            </div>
            {!filtered.length && (
                <p className="empty-state">No matching instructors.</p>
            )}
            <div className="results-footer">
                <Pagination
                    page={page}
                    total={Math.ceil(filtered.length / 30)}
                    onChange={(value) => {
                        update({ page: String(value) });
                        window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                />
            </div>
        </>
    );
}
