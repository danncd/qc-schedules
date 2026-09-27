import DataRefresh from "@/components/layout/DataRefresh";
import { Suspense } from "react";
import { connection } from "next/server";
import type { Metadata } from "next";
import { getInstructors } from "@/features/instructors/data/queries";
import InstructorDirectory from "@/features/instructors/components/InstructorDirectory";
export const metadata: Metadata = {
    title: "Instructor Lookup",
    alternates: { canonical: "/instructor" },
};
export default async function Instructors() {
    await connection();
    const instructors = await getInstructors();
    return (
        <>
            <DataRefresh />
            <h1 className="page-title">Instructor Lookup</h1>
            <Suspense fallback={<p>Loading instructors…</p>}>
                <InstructorDirectory instructors={instructors} />
            </Suspense>
        </>
    );
}
