import Disclosure from "@/components/ui/Disclosure";
import type { GradeRecord } from "@/features/grades/types";
import { historyTerm } from "@/lib/terms";
import InstructorCourseCard from "./InstructorCourseCard";
export default function SemesterSection({
    term,
    records,
    open,
    onToggle,
}: {
    term: string;
    records: GradeRecord[];
    open: boolean;
    onToggle: () => void;
}) {
    return (
        <section className="semester-section">
            <Disclosure
                title={
                    <span className="font-semibold text-base">
                        {historyTerm(term).label}{" "}
                        <span className="muted text-xs font-normal">
                            · {records.length} sections
                        </span>
                    </span>
                }
                open={open}
                onToggle={onToggle}
                chevron
            >
                <div className="card-grid">
                    {records.map((record, index) => (
                        <InstructorCourseCard
                            key={`${record.subject}|${record.number}|${record.section}|${index}`}
                            record={record}
                        />
                    ))}
                </div>
            </Disclosure>
        </section>
    );
}
