import type { CourseSection } from "../types";
import CourseCard from "./CourseCard";
export default function CourseResults({
    courses,
}: {
    courses: CourseSection[];
}) {
    if (!courses.length)
        return (
            <div className="empty-state">
                No matching sections. Try another search or semester.
            </div>
        );
    return (
        <div className="card-grid">
            {courses.map((course) => (
                <CourseCard
                    key={`${course.code}|${course.section}|${course.subject}|${course.number}`}
                    course={course}
                />
            ))}
        </div>
    );
}
