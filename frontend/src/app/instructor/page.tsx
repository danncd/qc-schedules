export const revalidate = 14400;

import type { Metadata } from "next";
import { getInstructorNames } from "@/_utils/server";
import InstructorClient from "./_components/InstructorClient";
import { manrope } from "@/_lib/fonts";

export const metadata: Metadata = {
	title: "Queens College Professors & Grade Distributions Directory",
	description:
		"Browse Queens College faculty and professors. View historical grade distributions, average GPAs, and passing rates across all departments.",
	alternates: {
		canonical: "/instructor",
	},
	openGraph: {
		title: "Queens College Professors & Grade Distributions Directory | QC Schedules",
		description:
			"Browse Queens College faculty and professors. View historical grade distributions, average GPAs, and passing rates across all departments.",
		url: "/instructor",
	},
};

export default async function InstructorPage() {
	const instructorData = await getInstructorNames();

	return (
		<main className="min-h-[calc(100vh-4rem)]">
			<h1 className={`${manrope.className} font-bold text-xl`}>
				Instructor Lookup
			</h1>
			<InstructorClient instructorData={instructorData} />
		</main>
	);
}
