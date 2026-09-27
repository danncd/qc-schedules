import type { GradeRecord, Statistics } from "../types";
export const weights: Record<string, number> = {
    "a+": 4,
    a: 4,
    "a-": 3.7,
    "b+": 3.3,
    b: 3,
    "b-": 2.7,
    "c+": 2.3,
    c: 2,
    "c-": 1.7,
    "d+": 1.3,
    d: 1,
    f: 0,
};
export const gradeLabels = [...Object.keys(weights), "w", "p", "inc"];
export function numeric(value: unknown): number | null {
    if (value === null || value === undefined || String(value).trim() === "")
        return null;
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : null;
}
export function statistics(records: GradeRecord[]): Statistics {
    let points = 0,
        graded = 0,
        total = 0,
        withdrawals = 0,
        passed = 0;
    let hasTotal = records.length > 0,
        hasWithdrawals = records.length > 0,
        hasPassing = records.length > 0;
    for (const record of records) {
        total += record.total ?? 0;
        withdrawals += record.counts.w ?? 0;
        hasTotal &&= record.total !== null;
        hasWithdrawals &&= record.counts.w !== null;
        let count = 0,
            quality = 0;
        for (const [grade, weight] of Object.entries(weights)) {
            const value = record.counts[grade] ?? 0;
            count += value;
            quality += value * weight;
            if (weight >= 2) passed += value;
        }
        if (count > 0) {
            graded += count;
            points += quality;
        } else if (
            record.reportedGpa !== null &&
            record.reportedGpa > 0 &&
            record.reportedGpa <= 4 &&
            record.total !== null &&
            record.counts.w !== null
        ) {
            const finished = Math.max(0, record.total - record.counts.w);
            graded += finished;
            points += record.reportedGpa * finished;
        }
        hasPassing &&= count > 0;
    }
    const rate = (n: number, d: number) =>
        d > 0 ? Math.min(100, Math.max(0, (n / d) * 100)) : null;
    return {
        gpa: graded > 0 ? points / graded : null,
        withdrawal:
            hasTotal && hasWithdrawals ? rate(withdrawals, total) : null,
        passing:
            hasTotal && hasWithdrawals && hasPassing
                ? rate(passed, total - withdrawals)
                : null,
        students: hasTotal ? total : null,
    };
}
