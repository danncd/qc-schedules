"use client";

import { memo, useMemo } from "react";
import { manrope } from "@/_lib/fonts";
import { InstructorSummary } from "@/_lib/types";
import { colorGPA, colorPassingRate, colorWithdrawalRate, getCourseStats, getGradeData, GradeRecord } from "@/_utils/client";

type Props = {
    course: InstructorSummary;
};

type DescriptionProps = {
    description: string;
    value: string | number;
    color?: string;
};

function Description({ description, value, color }: DescriptionProps) {
    return (
        <div className="text-xs leading-relaxed">
            <span className="text-neutral-700 dark:text-neutral-300 font-medium">{description}:</span>{" "}
            <span className={`${manrope.className} font-bold ${color || "text-neutral-800 dark:text-neutral-200"}`}>
                {value}
            </span>
        </div>
    );
}

export const GradeDistributionChart = memo(({ gradeData }: { gradeData: GradeRecord[] }) => {
    const maxCount = useMemo(
        () => gradeData.reduce((max, g) => Math.max(max, g.count), 1),
        [gradeData]
    );

    return (
        <div className="mt-6 flex items-end justify-between gap-2.5 h-44 group/chart w-full">
            {gradeData.map((grade) => {
                const barHeight = (grade.count / maxCount) * 100;

                return (
                    <div
                        key={grade.label}
                        className="flex-1 flex flex-col items-center h-full justify-end gap-2"
                    >
                        <div className="flex-1 w-full flex items-end justify-center min-h-0 pt-6">
                            <div
                                className={`relative w-full flex justify-center ${grade.color} opacity-85 hover:opacity-100 rounded-t-md min-h-1.5 shadow-2xs`}
                                style={{ height: `${barHeight}%` }}
                            >
                                <span className="absolute -top-5 text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
                                    {grade.count}
                                </span>
                            </div>
                        </div>

                        <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 uppercase tracking-tight">
                            {grade.label}
                        </span>
                    </div>
                );
            })}
        </div>
    );
});

GradeDistributionChart.displayName = "GradeDistributionChart";

export const InstructorCourseCard = memo(function CourseCard({ course }: Props) {
    const gradeData = useMemo(() => getGradeData(course), [course]);
    const { gpa, withdrawalRate, passingRate } = useMemo(() => getCourseStats(course), [course]);

    return (
        <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white/80 dark:bg-[#181818]/80 backdrop-blur-xs p-5 shadow-2xs hover:border-neutral-300 dark:hover:border-neutral-700 flex flex-col gap-4">
            <div>
                <div className="flex flex-wrap items-center gap-2">
                    <h3 className={`${manrope.className} font-bold text-base tracking-tight text-neutral-900 dark:text-neutral-100`}>
                        {course.Subject} {course["Course Number"]}
                    </h3>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200/60 dark:border-neutral-700/60">
                        Section {course.Section}
                    </span>
                </div>
                <h4 className="font-medium text-xs text-neutral-700 dark:text-neutral-300 mt-1">{course["Course Name"]}</h4>
            </div>
            
            <div>
                <GradeDistributionChart gradeData={gradeData} />
            </div>
            
            <div className="p-3.5 bg-neutral-50/90 dark:bg-neutral-900/90 border border-neutral-200/70 dark:border-neutral-800 rounded-xl space-y-1">
                <Description description="Total Students" value={course.Total} />
                <Description description="Average GPA" value={gpa} color={colorGPA(gpa).text} />
                <Description 
                    description="Passing Rate (Above C)" 
                    value={`${passingRate}%`} 
                    color={colorPassingRate(passingRate)} 
                />
                <Description 
                    description="Withdrawal Rate" 
                    value={`${withdrawalRate}%`} 
                    color={colorWithdrawalRate(withdrawalRate)} 
                />
            </div>
        </div>
    );
});