import DataRefresh from "@/components/layout/DataRefresh";
import { Suspense } from "react";
import type { Metadata } from "next";
import {
    getTerms,
    getScheduleSnapshot,
} from "@/features/schedule/data/queries";
import { defaultTerm } from "@/lib/terms";
import ScheduleView from "@/features/schedule/components/ScheduleView";
export const metadata: Metadata = {
    title: "Course Schedule Lookup",
    alternates: { canonical: "/schedule" },
};
export default async function Schedule({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const [terms, params] = await Promise.all([getTerms(), searchParams]);
    const requested = typeof params.sem === "string" ? params.sem : "";
    const term =
        terms.find((term) => term.id === requested || term.label === requested)
            ?.id || defaultTerm(terms);
    const snapshot = term ? await getScheduleSnapshot(term) : null;
    return (
        <>
            <DataRefresh />
            <h1 className="page-title">Course Schedule Lookup</h1>
            {!term ? (
                <p className="empty-state">
                    No published semesters are available.
                </p>
            ) : (
                <Suspense fallback={<p>Loading courses…</p>}>
                    <ScheduleView
                        courses={snapshot!.courses}
                        terms={terms}
                        term={term}
                        now={snapshot!.now}
                    />
                </Suspense>
            )}
        </>
    );
}
