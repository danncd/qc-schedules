"use client";

import { useMemo, useState } from "react";
import { manrope } from "@/_lib/fonts";
import { GroupedInstructorHistory } from "@/_lib/types";
import { getGradeDistribution, getSummary, colorGPA, letterGradeFromGPA, colorWithdrawalRate } from "@/_utils/client";
import InstructorSemesterCard from "./InstructorSemesterCard";
import GradeDistributionBar from "./GradeDistributionBar";

type Props = {
    instructorName: string;
    instructorData: GroupedInstructorHistory;
};

type DescriptionProps = {
    description: string;
    value1: string | number;
    color1?: string;
    value2?: string | number;
    color2?: string;
};

function Description({ description, value1, color1, value2, color2 }: DescriptionProps) {
    return (
        <div className="text-xs leading-relaxed">
            <span className="text-neutral-600 dark:text-neutral-300 font-medium">{description}:</span>{" "}
            <span className={`${manrope.className} font-black ${color1 || "text-neutral-800 dark:text-neutral-200"}`}>
                {value1}{" "}
                {color2 && value2 !== undefined && (
                    <span>
                        <span className="text-neutral-600 dark:text-neutral-400"> — </span>{" "}
                        <span className={`${color2}`}>{value2}%</span>
                    </span>
                )}
            </span>
        </div>
    );
}

export default function InstructorIDClient({ instructorName, instructorData }: Props) {
    const [isAllExpanded, setIsAllExpanded] = useState(true);

    const formatTerm = (code: string) => {
        const season = code.startsWith("f") ? "Fall" : "Spring";
        const year = code.match(/\d{4}/)?.[0] || "";
        return `${season} ${year}`;
    };

    const distribution = useMemo(() => getGradeDistribution(instructorData), [instructorData]);
    const { teaching, overall, subjectStats } = useMemo(() => getSummary(instructorData), [instructorData]);

    const overallGpaStyles = colorGPA(overall.gpa);

    return (
        <main className="min-h-[calc(100vh-4rem)]">
            <div className="flex items-center justify-between mb-4 gap-4">
                <h1 className={`${manrope.className} font-bold text-xl tracking-tight text-neutral-900 dark:text-neutral-100`}>
                    Historical Data For{" "}
                    <span className="text-purple-700 dark:text-purple-400 font-extrabold whitespace-nowrap">
                        {instructorName}
                    </span>
                </h1>

                <button
                    type="button"
                    onClick={() => setIsAllExpanded(!isAllExpanded)}
                    className={`${manrope.className} shrink-0 px-3 py-1 text-xs font-semibold rounded-full bg-neutral-100 hover:bg-neutral-200/80 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 dark:hover:text-white border border-neutral-200/70 dark:border-neutral-700/70 active:scale-95 cursor-pointer`}
                >
                    {!isAllExpanded ? "Expand All" : "Collapse All"}
                </button>
            </div>

            <div className={`p-5 rounded-2xl border ${overallGpaStyles.border} bg-white/80 dark:bg-[#181818]/80 backdrop-blur-xs mb-6 shadow-2xs space-y-3`}>
                <div className={`${manrope.className} flex flex-row justify-between items-center`}>
                    <h2 className="font-bold text-sm tracking-tight text-neutral-900 dark:text-neutral-100">Summary</h2>
                    <span
                        className={`font-bold text-xs px-2.5 py-0.5 rounded-full ${overallGpaStyles.bg} text-white shadow-2xs tracking-wide`}
                    >
                        {letterGradeFromGPA(overall.gpa)}
                    </span>
                </div>
                
                <div className="space-y-1">
                    <Description description="Teaching Areas" value1={teaching.join(", ")} />
                    <Description
                        description="Overall GPA — Withdrawal Rate"
                        value1={overall.gpa}
                        color1={overallGpaStyles.text}
                        value2={overall.withdrawalRate}
                        color2={colorWithdrawalRate(overall.withdrawalRate)}
                    />
                </div>
                
                <div className="flex flex-row gap-2.5 pt-2">
                    <div className="bg-neutral-200 dark:bg-neutral-700 w-1 self-stretch rounded-full my-0.5" />
                    <div className="flex flex-col space-y-1">
                        {subjectStats &&
                            Object.entries(subjectStats).map(([subject, stats]) => {
                                const statsGpaStyles = colorGPA(stats.gpa);
                                return (
                                    <Description
                                        key={subject}
                                        description={subject}
                                        value1={stats.gpa}
                                        color1={statsGpaStyles.text}
                                        value2={stats.withdrawalRate}
                                        color2={colorWithdrawalRate(stats.withdrawalRate)}
                                    />
                                );
                            })}
                    </div>
                </div>
                <div className="pt-1">
                    <GradeDistributionBar distribution={distribution} />
                </div>
            </div>

            <div className="space-y-6">
                {Object.entries(instructorData).map(([term, courses]) => (
                    <InstructorSemesterCard
                        key={term}
                        term={formatTerm(term)}
                        courses={courses}
                        isAllExpanded={isAllExpanded}
                    />
                ))}
            </div>
        </main>
    );
}