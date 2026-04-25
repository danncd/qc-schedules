export const revalidate = 3600;

import { getInstructorHistory } from "@/utils/server/utils";
import { notFound } from "next/navigation";
import InstructorContent from "./components/Content";

type Props = {
	params: Promise<{ id: string }>;
};

export default async function InstructorPage({ params }: Props) {
	const { id } = await params;

	const nameParts = String(id).split("-");
	const instructorName = `${nameParts[0]}, ${nameParts[1]}`.replaceAll("%2B", " ");

	const instructorData = await getInstructorHistory(instructorName);

	if (!instructorData || Object.keys(instructorData).length === 0) notFound();

	return (
		<InstructorContent
			instructorName={instructorName}
			instructorData={instructorData}
		/>
	);
}
