export const revalidate = 14400;

import { getInstructorNames } from "@/utils/server/utils";
import InstructorContent from "./components/Content";

export default async function Instructor() {

    const instructorData = await getInstructorNames();
    
    return (
        <main className="min-h-[calc(100vh-4rem)]">
            <InstructorContent instructorData={instructorData}/>
        </main>
    );
}