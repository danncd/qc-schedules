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
        <div className="text-sm">
            <span>{description}</span> :{" "}
            <span className={`${manrope.className} font-extrabold ${color || ""}`}>
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
        <div className="mt-8 flex items-end justify-between gap-2 h-50 group/chart w-full cursor-pointer">
            {gradeData.map((grade) => {
                const barHeight = (grade.count / maxCount) * 100;

                return (
                    <div
                        key={grade.label}
                        className="flex-1 flex flex-col items-center h-full justify-end gap-2"
                    >
                        <div className="flex-1 w-full flex items-end justify-center min-h-0 pt-5">
                            <div
                                className={`relative w-full flex justify-center ${grade.color} opacity-90 rounded-t-sm transition-[height,opacity] duration-700 ease-out min-h-1 hover:opacity-100 shadow-sm`}
                                style={{ height: `${barHeight}%` }}
                            >
                                <span className="absolute -top-5 text-[12px] font-medium text-gray-600 dark:text-gray-300 transition-opacity duration-300">
                                    {grade.count}
                                </span>
                            </div>
                        </div>

                        <span className="text-[13px] font-medium text-gray-700 dark:text-gray-200 uppercase tracking-tighter">
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
        <div className="rounded-lg border border-gray-300 shadow-md dark:shadow-none p-4 flex flex-col gap-4">
            <div>
                <div className="flex flex-row gap-2 items-end">
                    <h3 className={`${manrope.className} font-extrabold text-md`}>
                        {course.Subject} {course["Course Number"]}
                    </h3>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        Section {course.Section}
                    </span>
                </div>
                <h4 className="font-medium text-sm">{course["Course Name"]}</h4>
            </div>
            
            <div>
                <GradeDistributionChart gradeData={gradeData} />
            </div>
            
            <div className="p-4 bg-gray-200/60 dark:bg-[#212121] rounded-lg">
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