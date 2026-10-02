import type { GradeRecord } from "@/features/grades/types";
import { statistics } from "@/features/grades/lib/calculations";
import GradeStatistics from "@/features/grades/components/GradeStatistics";
import GradeDistribution from "@/features/grades/components/GradeDistribution";
export default function InstructorCourseCard({
    record,
}: {
    record: GradeRecord;
}) {
    return (
        <article className="card">
            <div className="course-id">
                <h3>
                    {record.subject} {record.number}
                </h3>
                <span className="badge">Section {record.section}</span>
                <span className="badge">Students {record.total ?? "—"}</span>
            </div>
            <p className="course-title">{record.title}</p>
            <GradeDistribution records={[record]} />
            <div className="stats-surface">
                <GradeStatistics stats={statistics([record])} />
            </div>
        </article>
    );
}
