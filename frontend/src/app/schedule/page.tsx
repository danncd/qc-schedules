export const revalidate = 14400;

import { Suspense } from "react";
import { manrope } from "@/_lib/fonts";
import { getInstructorCourseSummaries, getScheduleData } from "@/_utils/server";
import ScheduleClient from "./_components/ScheduleClient";

export default async function SchedulePage() {
	const { semesterData, semesterNames } = await getScheduleData();
	const instructorCourseSummary = await getInstructorCourseSummaries();

	return (
		<main>
			<h1 className={`${manrope.className} font-bold text-xl`}>
				Course Schedule Lookup
			</h1>
			<Suspense fallback={null}>
				<ScheduleClient
					semesterData={semesterData}
					semesterNames={semesterNames}
					instructorCourseSummary={instructorCourseSummary}
				/>
			</Suspense>
		</main>
	);
}
