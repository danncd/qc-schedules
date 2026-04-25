export const revalidate = 3600;

import { getCoursesBySemester, getInstructorSummaries, getSemesters } from "@/utils/server/utils";
import ScheduleContent from "./components/Content";

export default async function Schedule() {
	const semesterData = await getCoursesBySemester();
	const semesters = await getSemesters();
    const instructorSummaries = await getInstructorSummaries();
	return (
		<main className="min-h-[calc(100vh-4rem)]">
			<ScheduleContent 
                semesters={semesters}
                semesterData = {semesterData}
                instructorSummaries={instructorSummaries}
            />
		</main>
	);
}
