import { CourseRecord, InstructorCourseSummary } from "@/lib/types";
import { normalizeInstructorName } from "@/utils/client/utils";
import { useMemo } from "react";
import CourseCard from "./CourseCard";

type Props = {
    results: CourseRecord[];
    instructorSummaries: InstructorCourseSummary[];
}

export default function Results({ results, instructorSummaries }: Props) {

    const summaryMap = useMemo(() => {
        const map = new Map<string, InstructorCourseSummary>();
        
        instructorSummaries.forEach((s) => {
            const instructor = normalizeInstructorName(s.Instructor);
            const key = `${instructor}|${s.Subject}|${s["Course Number"]}`;
            map.set(key, s);
        });
        
        return map;
    }, [instructorSummaries]);
    
    return (
        <div className="grid md:grid-cols-2 gap-4 transition-opacity duration-200">
            {results.map((course, index) => {
                const parts = course["Course (hr, crd)"].split(" ");
                const subject = parts[0];
                const courseNum = parts[1];
                
                const instructor = normalizeInstructorName(course.Instructor);
                
                const lookupKey = `${instructor}|${subject}|${courseNum}`;
                const summary = summaryMap.get(lookupKey);

                return (
                    <CourseCard
                        key={`${course.Code}-${course.Sec}-${index}`} 
                        course={course}
                        instructor={summary}
                    />
                );
            })}
        </div>
    );
}