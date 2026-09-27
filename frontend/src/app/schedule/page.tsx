import DataRefresh from "@/components/layout/DataRefresh";
import { Suspense } from "react";
import type { Metadata } from "next";
import { getScheduleSnapshot } from "@/features/schedule/data/queries";
import ScheduleView from "@/features/schedule/components/ScheduleView";

export const revalidate = 14400;

export const metadata: Metadata = {
    title: "Course Schedule Lookup",
    alternates: { canonical: "/schedule" },
};

export default async function Schedule() {
    const { terms, schedules } = await getScheduleSnapshot();
    return (
        <>
            <DataRefresh />
            <h1 className="page-title">Course Schedule Lookup</h1>
            {!terms.length ? (
                <p className="empty-state">
                    No published semesters are available.
                </p>
            ) : (
                <Suspense fallback={null}>
                    <ScheduleView
                        schedules={schedules}
                        terms={terms}
                    />
                </Suspense>
            )}
        </>
    );
}
