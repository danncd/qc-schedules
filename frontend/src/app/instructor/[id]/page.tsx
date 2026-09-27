import DataRefresh from "@/components/layout/DataRefresh";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
    getInstructors,
    getHistory,
} from "@/features/instructors/data/queries";
import { resolveInstructor } from "@/features/instructors/lib/identity";
import InstructorOverview from "@/features/instructors/components/InstructorOverview";
import InstructorHistory from "@/features/instructors/components/InstructorHistory";
export const revalidate = 14400;

export function generateStaticParams() {
    return [];
}

type Props = { params: Promise<{ id: string }> };
export async function generateMetadata({ params }: Props) {
    const { id } = await params;
    const person = resolveInstructor(await getInstructors(), id);
    return {
        title: person
            ? `${person.name} · Grade History`
            : "Instructor not found",
        alternates: { canonical: `/instructor/${person?.slug || id}` },
    };
}
export default async function InstructorPage({ params }: Props) {
    const { id } = await params;
    const person = resolveInstructor(await getInstructors(), id);
    if (!person) notFound();
    const records = await getHistory(person.rawName);
    return (
        <>
            <DataRefresh />
            <Link
                className="back-link"
                href="/instructor"
            >
                ← All instructors
            </Link>
            <h1 className="page-title">Historical Data for {person.name}</h1>
            {records.length ? (
                <>
                    <InstructorOverview records={records} />
                    <InstructorHistory records={records} />
                </>
            ) : (
                <p className="empty-state">
                    No historical grade records are available.
                </p>
            )}
        </>
    );
}
