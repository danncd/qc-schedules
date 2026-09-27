import type { GradeRecord } from "@/features/grades/types";
import { historyTerm } from "@/lib/terms";
export function groupHistory(records: GradeRecord[]) {
    const groups = new Map<string, GradeRecord[]>();
    for (const record of records) {
        if (!groups.has(record.term)) groups.set(record.term, []);
        groups.get(record.term)!.push(record);
    }
    return [...groups].sort(
        ([a], [b]) => historyTerm(b).rank - historyTerm(a).rank,
    );
}
