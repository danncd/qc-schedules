export const revalidate = 14400;

import { notFound } from "next/navigation";
import InstructorIDClient from "./_components/InstructorIDClient";
import { getInstructorHistory } from "@/_utils/server";

type Props = {
	params: Promise<{ id: string }>;
};

export default async function InstructorIDPage({ params }: Props) {
	const { id } = await params;

	const instructorName = decodeURIComponent(id);
	const instructorData = await getInstructorHistory(instructorName);

	

	return (
		<main>
    <pre>{JSON.stringify(instructorData, null, 2)}</pre>
</main>
	);
}
