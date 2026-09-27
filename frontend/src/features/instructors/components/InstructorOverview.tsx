import type { GradeRecord } from "@/features/grades/types";
import { statistics } from "@/features/grades/lib/calculations";
import { statisticTone } from "@/features/grades/lib/colors";
import { metric } from "@/features/grades/lib/formatting";
import GradeStatistics from "@/features/grades/components/GradeStatistics";
import GradeDistribution from "@/features/grades/components/GradeDistribution";
export default function InstructorOverview({
    records,
}: {
    records: GradeRecord[];
}) {
    const subjects = [
        ...new Set(records.map((record) => record.subject)),
    ].sort();
    return (
        <section className="card mb-6">
            <h2 className="font-semibold text-sm mb-3">Summary</h2>
            <GradeStatistics stats={statistics(records)} />
            <div className="facts">
                {subjects.map((subject) => {
                    const summary = statistics(
                        records.filter((record) => record.subject === subject),
                    );
                    return (
                        <p key={subject}>
                            {subject}:{" "}
                            <span className={statisticTone("gpa", summary.gpa)}>
                                {metric(summary.gpa, "", 2)} GPA
                            </span>{" "}
                            ·{" "}
                            <span
                                className={statisticTone(
                                    "withdrawal",
                                    summary.withdrawal,
                                )}
                            >
                                {metric(summary.withdrawal, "%")} withdrawals
                            </span>
                        </p>
                    );
                })}
            </div>
            <GradeDistribution records={records} />
        </section>
    );
}
