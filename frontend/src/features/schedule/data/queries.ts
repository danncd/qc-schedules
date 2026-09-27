import "server-only";
import { cache } from "react";
import { database, readRows } from "@/lib/supabase/server";
import { termFromTable } from "@/lib/terms";
import { getInstructors } from "@/features/instructors/data/queries";
import { mapSection } from "./mapping";
import { groupSections } from "../lib/sections";
import { attachStatistics } from "../lib/statistics";

export const getTerms = cache(async () => {
    const client = database();
    const year = new Date().getUTCFullYear();
    const tables = await Promise.all(
        [year - 1, year, year + 1].map(async (year) => {
            const { data, error } = await client.rpc("get_tables_by_year", {
                year_text: String(year),
            });
            if (error) throw new Error("Unable to load semesters.");
            return ((data as { table_name: string }[]) || [])
                .map((row) => termFromTable(row.table_name))
                .filter((term) => term !== null);
        }),
    );
    return tables.flat().sort((a, b) => b.year - a.year || b.order - a.order);
});

const getSubjectSummaries = cache((subject: string) =>
    readRows(
        "instructor_course_summary",
        "*",
        ["Instructor", "Course Number"],
        ["Subject", subject],
    ),
);

export const getSections = cache(async (term: string) => {
    if (!termFromTable(term)) throw new Error("Invalid semester.");
    const [rows, directory] = await Promise.all([
        readRows(term, "*", ["Code", "Sec", "Day", "Time"]),
        getInstructors(),
    ]);
    const sections = groupSections(rows.map(mapSection));
    const subjects = [...new Set(sections.map((section) => section.subject))];
    const summaries = (
        await Promise.all(subjects.map(getSubjectSummaries))
    ).flat();
    return attachStatistics(sections, summaries, directory);
});

export async function getScheduleSnapshot() {
    const terms = await getTerms();
    const entries = await Promise.all(
        terms.map(
            async (term) => [term.id, await getSections(term.id)] as const,
        ),
    );
    return { terms, schedules: Object.fromEntries(entries) };
}
