import type { CourseSection } from "../types";
export function groupSections(rows: CourseSection[]) {
    const sections = new Map<string, CourseSection>();
    for (const row of rows) {
        const key = `${row.code}|${row.section}|${row.subject}|${row.number}`;
        const existing = sections.get(key);
        if (!existing) {
            sections.set(key, { ...row, meetings: [...row.meetings] });
            continue;
        }
        for (const meeting of row.meetings) {
            if (
                !existing.meetings.some(
                    (item) => JSON.stringify(item) === JSON.stringify(meeting),
                )
            )
                existing.meetings.push(meeting);
        }
        if (existing.instructor !== row.instructor) {
            existing.instructor = "Multiple instructors";
            existing.instructorSlug = null;
            existing.stats = null;
        }
    }
    return [...sections.values()];
}
