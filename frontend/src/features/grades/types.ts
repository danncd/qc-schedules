export type GradeRecord = {
    term: string;
    subject: string;
    number: string;
    section: string;
    title: string;
    total: number | null;
    reportedGpa: number | null;
    counts: Record<string, number | null>;
};
export type Statistics = {
    gpa: number | null;
    withdrawal: number | null;
    passing: number | null;
    students: number | null;
};
