import DataRefresh from "@/components/layout/DataRefresh";
import { Suspense } from "react";
import type { Metadata } from "next";
import { getInstructors } from "@/features/instructors/data/queries";
import InstructorDirectory from "@/features/instructors/components/InstructorDirectory";
export const revalidate = 14400;

export const metadata: Metadata = {
    title: "Instructor Lookup",
    alternates: { canonical: "/instructor" },
};
export default async function Instructors() {
    const instructors = await getInstructors();
    return (
        <>
            <DataRefresh />
            <h1 className="page-title">Instructor Lookup</h1>
            <Suspense fallback={null}>
                <InstructorDirectory instructors={instructors} />
            </Suspense>
        </>
    );
}
