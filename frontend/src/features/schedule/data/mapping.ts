import type { DatabaseRow } from "@/lib/supabase/server";
import { numeric } from "@/features/grades/lib/calculations";
import type { CourseSection } from "../types";
export function mapSection(row: DatabaseRow): CourseSection {
    const [subject = "", number = ""] = String(row["Course (hr, crd)"] ?? "")
        .trim()
        .split(/\s+/);
    const instructor = String(row.Instructor ?? "").trim();
    return {
        code: String(row.Code ?? ""),
        section: String(row.Sec ?? ""),
        subject,
        number,
        title: String(row.Description ?? ""),
        mode: String(row["Mode of Instruction"] ?? ""),
        enrolled: numeric(row.Enrolled),
        limit: numeric(row.Limit),
        created:
            typeof row.created === "string"
                ? /(?:Z|[+-]\d{2}:?\d{2})$/i.test(row.created)
                    ? row.created
                    : `${row.created}Z`
                : null,
        instructor: instructor === "," ? "" : instructor,
        instructorSlug: null,
        stats: null,
        meetings: [
            {
                days: String(row.Day ?? ""),
                time: String(row.Time ?? ""),
                room: String(row.Location ?? ""),
                instructor,
            },
        ],
    };
}
