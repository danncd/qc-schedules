import type { Statistics } from "../types";
import { statisticTone } from "../lib/colors";
import { metric } from "../lib/formatting";
export default function GradeStatistics({ stats }: { stats: Statistics }) {
    return (
        <dl className="grade-statistics">
            <div>
                <dt>Average GPA</dt>
                <dd className={statisticTone("gpa", stats.gpa)}>
                    {metric(stats.gpa, "", 2)}
                </dd>
            </div>
            <div>
                <dt>C or better</dt>
                <dd className={statisticTone("passing", stats.passing)}>
                    {metric(stats.passing, "%")}
                </dd>
            </div>
            <div>
                <dt>Withdrawal rate</dt>
                <dd className={statisticTone("withdrawal", stats.withdrawal)}>
                    {metric(stats.withdrawal, "%")}
                </dd>
            </div>
        </dl>
    );
}
