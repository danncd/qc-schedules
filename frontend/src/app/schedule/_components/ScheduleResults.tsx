import { InstructorCourseSummary, ScheduleCourse } from "@/_lib/types";
import { normalizeInstructorName } from "@/_utils/client";
import { useMemo } from "react";
import ScheduleCourseCard from "./ScheduleCourseCard";

type Props = {
    scheduleResults: ScheduleCourse[],
    instructorCourseSummary: InstructorCourseSummary[],
}

export default function ScheduleResults({ scheduleResults, instructorCourseSummary }: Props) {

    const summaryMap = useMemo(() => {
        const map = new Map<string, InstructorCourseSummary>();
        
        instructorCourseSummary.forEach((s) => {
            const instructor = normalizeInstructorName(s.Instructor);
            const key = `${instructor}|${s.Subject}|${s["Course Number"]}`;
            map.set(key, s);
        });
        
        return map;
    }, [instructorCourseSummary]);

    return (
        <div className="grid md:grid-cols-2 gap-4 transition-opacity duration-200">
            {scheduleResults.map((course, index) => {
                const parts = course["Course (hr, crd)"].split(" ");
                const subject = parts[0];
                const courseNum = parts[1];
                
                const instructor = normalizeInstructorName(course.Instructor);
                
                const lookupKey = `${instructor}|${subject}|${courseNum}`;
                const summary = summaryMap.get(lookupKey);

                return (
                    <ScheduleCourseCard
                        key={`${course.Code}-${course.Sec}-${index}`} 
                        course={course}
                        instructorSummary={summary}
                    />
                );
            })}
        </div>
    );
}