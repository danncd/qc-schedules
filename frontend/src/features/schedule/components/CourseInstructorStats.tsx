import { statisticTone } from "@/features/grades/lib/colors";
import Link from "next/link";
import Disclosure from "@/components/ui/Disclosure";
import GradeStatistics from "@/features/grades/components/GradeStatistics";
import type { CourseSection } from "../types";
export default function CourseInstructorStats({
    course,
}: {
    course: CourseSection;
}) {
    const title = (
        <>
            <span className="muted">Instructor: </span>
            <strong>{course.instructor || "Unassigned"}</strong>
        </>
    );
    return (
        <div
            className={`instructor-block ${statisticTone("gpa", course.stats?.gpa ?? null)}`}
        >
            {course.stats ? (
                <Disclosure title={title}>
                    <p className="text-xs font-semibold mb-2">
                        Overall {course.subject} {course.number} statistics
                    </p>
                    <GradeStatistics stats={course.stats} />
                    {course.instructorSlug && (
                        <Link
                            className="button inline-flex mt-3"
                            href={`/instructor/${course.instructorSlug}`}
                        >
                            Visit instructor’s page ↗
                        </Link>
                    )}
                </Disclosure>
            ) : (
                <div className="flex min-h-[26px] items-center text-xs">
                    <span>{title}</span>
                </div>
            )}
        </div>
    );
}
