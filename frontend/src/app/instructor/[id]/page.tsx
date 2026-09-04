export const revalidate = 14400;

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import InstructorIDClient from "./_components/InstructorIDClient";
import { getInstructorHistory } from "@/_utils/server";
import { getSummary } from "@/_utils/client";

type Props = {
	params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { id } = await params;
	const { instructorData, displayName, slug } = await getInstructorHistory(id);

	if (!instructorData || Object.keys(instructorData).length === 0) {
		return {
			title: "Instructor Not Found",
			description: "Instructor profile not found in Queens College records.",
		};
	}

	const summary = getSummary(instructorData);
	const subjects = summary.teaching.join(", ");
	const gpaText = summary.overall.gpa > 0 ? ` (Average GPA: ${summary.overall.gpa})` : "";
	const departmentText = subjects ? ` in ${subjects}` : "";

	const title = `${displayName} - Queens College Professor Grades & Courses`;
	const description = `View historical grade distributions${gpaText}, passing rates, and course history for ${displayName}${departmentText} at Queens College (CUNY).`;
	const canonicalUrl = `/instructor/${slug}`;

	return {
		title,
		description,
		alternates: {
			canonical: canonicalUrl,
		},
		openGraph: {
			title,
			description,
			url: canonicalUrl,
			type: "profile",
		},
		twitter: {
			card: "summary",
			title,
			description,
		},
	};
}

export default async function InstructorIDPage({ params }: Props) {
	const { id } = await params;

	const { instructorData, displayName, slug } = await getInstructorHistory(id);

	if (!instructorData || Object.keys(instructorData).length === 0) notFound();

	const schemaData = {
		"@context": "https://schema.org",
		"@type": "ProfilePage",
		mainEntity: {
			"@type": "Person",
			name: displayName,
			jobTitle: "Professor / Instructor",
			worksFor: {
				"@type": "CollegeOrUniversity",
				name: "Queens College, City University of New York",
				sameAs: "https://www.qc.cuny.edu",
			},
		},
		breadcrumb: {
			"@type": "BreadcrumbList",
			itemListElement: [
				{
					"@type": "ListItem",
					position: 1,
					name: "Home",
					item: "https://qcs.danncd.com",
				},
				{
					"@type": "ListItem",
					position: 2,
					name: "Instructors",
					item: "https://qcs.danncd.com/instructor",
				},
				{
					"@type": "ListItem",
					position: 3,
					name: displayName,
					item: `https://qcs.danncd.com/instructor/${slug}`,
				},
			],
		},
	};

	return (
		<main>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
			/>
            <InstructorIDClient
                instructorName={displayName}
                instructorData={instructorData}
            />
        </main>
	);
}
