export const revalidate = 14400;

import { getInstructorNames } from "@/_utils/server";
import InstructorClient from "./_components/InstructorClient";
import { manrope } from "@/_lib/fonts";

export default async function InstructorPage() {
	const instructorData = await getInstructorNames();

	return (
		<main>
			<h1 className={`${manrope.className} font-bold text-xl`}>
				Instructor Lookup
			</h1>
			<InstructorClient instructorData={instructorData} />
		</main>
	);
}
