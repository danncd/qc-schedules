import type { GradeRecord } from "../types";
import { gradeColor } from "../lib/colors";
import { gradeLabels } from "../lib/calculations";
export default function GradeDistribution({
    records,
}: {
    records: GradeRecord[];
}) {
    const buckets = gradeLabels.map((label) => ({
        label: label.toUpperCase(),
        count: records.reduce((sum, row) => sum + (row.counts[label] ?? 0), 0),
    }));
    const max = Math.max(...buckets.map((bucket) => bucket.count), 1);
    if (!buckets.some((bucket) => bucket.count)) return null;
    return (
        <figure className="grade-distribution">
            <div className="grade-bars">
                {buckets.map((bucket) => (
                    <div
                        className="grade-column"
                        key={bucket.label}
                    >
                        <span className="grade-count">{bucket.count}</span>
                        <div className="grade-track">
                            <div
                                className="grade-bar"
                                style={{
                                    backgroundColor: gradeColor(bucket.label),
                                    height: `${(bucket.count / max) * 100}%`,
                                }}
                            />
                        </div>
                        <span className="grade-label">{bucket.label}</span>
                    </div>
                ))}
            </div>
        </figure>
    );
}
