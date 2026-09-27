import type { Statistics } from "@/features/grades/types";
export type Meeting = {
    days: string;
    time: string;
    room: string;
    instructor: string;
};
export type CourseSection = {
    code: string;
    section: string;
    subject: string;
    number: string;
    title: string;
    mode: string;
    enrolled: number | null;
    limit: number | null;
    created: string | null;
    meetings: Meeting[];
    instructor: string;
    instructorSlug: string | null;
    stats: Statistics | null;
};
