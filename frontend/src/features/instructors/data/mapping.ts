import type { DatabaseRow } from "@/lib/supabase/server";
import { gradeLabels, numeric } from "@/features/grades/lib/calculations";
import type { GradeRecord } from "@/features/grades/types";
export function mapGrade(row: DatabaseRow): GradeRecord {
    return {
        term: String(row.Term ?? "Unknown"),
        subject: String(row.Subject ?? ""),
        number: String(row["Course Number"] ?? ""),
        section: String(row.Section ?? ""),
        title: String(row["Course Name"] ?? "").replace(
            /^(?:VT|SCM|SCS):\s*/i,
            "",
        ),
        total: numeric(row.Total),
        reportedGpa: numeric(row["avg gpa"]),
        counts: Object.fromEntries(
            gradeLabels.map((grade) => [grade, numeric(row[grade])]),
        ),
    };
}
