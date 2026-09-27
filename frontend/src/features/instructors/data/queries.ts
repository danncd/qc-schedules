import "server-only";
import { cache } from "react";
import { database, readRows } from "@/lib/supabase/server";
import { buildDirectory, resolveDisplayNames } from "../lib/identity";
import { mapGrade } from "./mapping";

async function readScheduleNames() {
    const { data: tables, error } = await database().rpc("get_tables_by_year", {
        year_text: String(new Date().getUTCFullYear()),
    });
    if (error) throw new Error("Unable to load instructor names.");
    const validTables = ((tables || []) as { table_name: string }[]).filter(
        (row) =>
            /^(winter|spring|summer_[12]|fall)_20\d{2}$/.test(row.table_name),
    );
    return (
        await Promise.all(
            validTables.map((row) =>
                readRows(row.table_name, 'Instructor,"Course (hr, crd)"', [
                    "Code",
                    "Sec",
                    "Day",
                    "Time",
                ]),
            ),
        )
    ).flat();
}

export const getInstructors = cache(async () => {
    const [rows, schedules] = await Promise.all([
        readRows("instructor_course_summary", "Instructor,Subject", [
            "Instructor",
            "Subject",
            "Course Number",
        ]),
        readScheduleNames(),
    ]);
    const directory = buildDirectory(
        rows.map((row) => ({
            name: String(row.Instructor ?? "").trim(),
            subject: String(row.Subject ?? "").trim(),
        })),
    );
    return resolveDisplayNames(
        directory,
        schedules.map((row) => ({
            name: String(row.Instructor ?? "").trim(),
            subject: String(row["Course (hr, crd)"] ?? "")
                .trim()
                .split(/\s+/)[0],
        })),
    );
});
export const getHistory = cache(async (rawName: string) => {
    const rows = await readRows(
        "instructor_grades",
        "*",
        ["Term", "Subject", "Course Number", "Section"],
        ["Instructor", rawName],
    );
    return rows
        .filter((row) => !String(row.Term).startsWith("COMBINED"))
        .map(mapGrade);
});
