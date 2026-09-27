import { matchesSearch } from "@/lib/search";
import type { CourseSection } from "../types";
export function filterSections(
    sections: CourseSection[],
    query: string,
    onlyNew: boolean,
    now: number,
) {
    const search = query.trim().toLowerCase();
    return sections.filter((section) => {
        const age = section.created
            ? now - Date.parse(section.created)
            : Infinity;
        return (
            (!onlyNew || (age >= 0 && age <= 172800000)) &&
            (!search ||
                [
                    section.code,
                    `${section.subject} ${section.number}`,
                    section.title,
                    section.instructor,
                    ...section.meetings.flatMap((meeting) => [
                        meeting.instructor,
                        meeting.room,
                    ]),
                ].some((value) => matchesSearch(value, search)))
        );
    });
}
