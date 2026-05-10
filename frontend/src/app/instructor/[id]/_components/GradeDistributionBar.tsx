"use client";

import { manrope } from "@/_lib/fonts";
import { GradeBucket } from "@/_utils/client";

type Props = {
    distribution: GradeBucket[];
};

const getColor = (label: string) => {
    switch (label) {
        case "A": return "bg-green-500";
        case "B": return "bg-blue-500";
        case "C": return "bg-amber-400";
        case "D": return "bg-red-400";
        case "F": return "bg-red-500";
        default:  return "bg-gray-300";
    }
};

const MIN_WIDTH = 8;

export default function GradeDistributionBar({ distribution }: Props) {
    return (
        <div className="mt-3 space-y-1">
            <div className="flex w-full h-6 rounded overflow-hidden bg-gray-300 dark:bg-gray-700">
                {distribution.map((g) => {
                    const width = Math.max(g.percent, MIN_WIDTH);
                    return (
                        <div
                            key={g.label}
                            className={`relative ${getColor(g.label)} h-full flex items-center justify-center`}
                            style={{ width: `${width}%` }}
                            title={`${g.label}: ${g.percent.toFixed(1)}%, Count: ${g.value}`}
                        >
                            <div
                                className={`hidden lg:block pointer-events-none bg-white/50 ${manrope.className} text-[11px] font-extrabold text-black drop-shadow-sm rounded-md whitespace-nowrap px-1`}
                            >
                                {g.label} - <span className="font-bold">{g.percent.toFixed(1)}%</span>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            <div className={`${manrope.className} lg:hidden flex flex-warp gap-x-5 text-[12px] mt-2 flex-wrap`}>
                {distribution.map((g) => (
                    <span key={g.label} className="font-bold flex items-center gap-1">
                        <span className={`w-2 h-2 rounded ${getColor(g.label)}`} />
                        {g.label} - {g.percent.toFixed(1)}%
                    </span>
                ))}
            </div>
        </div>
    );
}