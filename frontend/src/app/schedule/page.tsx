import { manrope } from "@/_lib/fonts";
import { getInstructorCourseSummaries, getScheduleData } from "@/_utils/server";
import ScheduleClient from "./_components/ScheduleClient";
import { Suspense } from "react";

export default async function SchedulePage() {
	const { semesterData, semesterNames } = await getScheduleData();
	const instructorCourseSummary = await getInstructorCourseSummaries();

	return (
		<main>
			<h1 className={`${manrope.className} font-bold text-xl`}>
				Course Schedule Lookup
			</h1>
			<Suspense fallback={<div className="w-full h-screen animate-pulse bg-gray-100 dark:bg-gray-800/20 rounded-lg" />}>
				<ScheduleClient semesterData={semesterData} semesterNames={semesterNames} instructorCourseSummary={instructorCourseSummary}/>
			</Suspense>
		</main>
	);
}
