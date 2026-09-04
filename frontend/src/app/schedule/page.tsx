export const revalidate = 14400;

import type { Metadata } from "next";
import { Suspense } from "react";
import { manrope } from "@/_lib/fonts";
import { getInstructorCourseSummaries, getScheduleData } from "@/_utils/server";
import ScheduleClient from "./_components/ScheduleClient";

export const metadata: Metadata = {
	title: "Queens College Course Schedules & Class Lookup",
	description:
		"Search and browse current and upcoming Queens College (CUNY) course schedules across all departments, sections, meeting times, and instructors.",
	alternates: {
		canonical: "/schedule",
	},
	openGraph: {
		title: "Queens College Course Schedules & Class Lookup | QC Schedules",
		description:
			"Search and browse current and upcoming Queens College (CUNY) course schedules across all departments, sections, meeting times, and instructors.",
		url: "/schedule",
	},
};

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
