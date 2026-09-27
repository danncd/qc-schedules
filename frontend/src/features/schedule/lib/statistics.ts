import type { DatabaseRow } from "@/lib/supabase/server";
import type { Instructor } from "@/features/instructors/types";
import {
    nameKey,
    matchesInstructorName,
} from "@/features/instructors/lib/identity";
import { numeric } from "@/features/grades/lib/calculations";
import type { CourseSection } from "../types";

export function attachStatistics(
    sections: CourseSection[],
    summaries: DatabaseRow[],
    instructors: Instructor[],
): CourseSection[] {
    const summaryIndex = new Map<string, DatabaseRow[]>();
    for (const row of summaries) {
        const key = `${nameKey(String(row.Instructor))}|${row.Subject}|${row["Course Number"]}`;
        if (!summaryIndex.has(key)) summaryIndex.set(key, []);
        summaryIndex.get(key)!.push(row);
    }
    const nameIndex = new Map<string, Set<string>>();
    for (const section of sections) {
        const key = `${section.subject}|${nameKey(section.instructor)}`;
        if (!nameIndex.has(key)) nameIndex.set(key, new Set());
        nameIndex.get(key)!.add(section.instructor);
    }
    const instructorIndex = new Map(
        instructors.map((person) => [person.rawName, person]),
    );
    return sections.map((section) => {
        if (
            !section.instructor ||
            section.instructor === "Multiple instructors"
        )
            return section;
        const key = nameKey(section.instructor);
        const matches =
            summaryIndex.get(`${key}|${section.subject}|${section.number}`) ||
            [];
        const names = nameIndex.get(`${section.subject}|${key}`)!;
        if (matches.length !== 1 || names.size > 1) return section;
        const row = matches[0];
        const person = instructorIndex.get(String(row.Instructor));
        if (
            !person ||
            person.ambiguous ||
            !matchesInstructorName(person.rawName, section.instructor)
        )
            return section;
        return {
            ...section,
            instructorSlug: person.slug,
            stats: {
                gpa: numeric(row["avg gpa"]),
                withdrawal: numeric(row["Withdrawal_Rate (%)"]),
                passing: numeric(row["Pass_Rate_Effective (%)"]),
                students: numeric(row.Total_Students),
            },
        };
    });
}
