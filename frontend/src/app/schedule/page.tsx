export const revalidate = 3600;

import { getCoursesBySemester, getInstructorSummaries, getSemesters } from "@/utils/server/utils";
import ScheduleContent from "./components/Content";
import { Suspense } from "react";

export default async function Schedule() {
    const semesterData = await getCoursesBySemester();
    const semesters = await getSemesters();
    const instructorSummaries = await getInstructorSummaries();

    return (
        <main className="min-h-[calc(100vh-4rem)]">
            <Suspense fallback={<div className="w-full h-screen animate-pulse bg-gray-100 dark:bg-gray-800/20 rounded-lg" />}>
                <ScheduleContent 
                    semesters={semesters}
                    semesterData={semesterData}
                    instructorSummaries={instructorSummaries}
                />
            </Suspense>
        </main>
    );
}