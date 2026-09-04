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

export default function GradeDistributionBar({ distribution }: Props) {
    return (
        <div className="mt-2 space-y-2">
            <div className="flex w-full h-5 rounded-full overflow-hidden bg-neutral-200/80 dark:bg-neutral-800">
                {distribution.map((g) => {
                    if (g.percent <= 0) return null;
                    return (
                        <div
                            key={g.label}
                            className={`relative ${getColor(g.label)} h-full flex items-center justify-center`}
                            style={{ width: `${g.percent}%` }}
                            title={`${g.label}: ${g.percent.toFixed(1)}%, Count: ${g.value}`}
                        >
                            {g.percent >= 8 && (
                                <div
                                    className={`hidden lg:block pointer-events-none bg-black/20 dark:bg-black/30 backdrop-blur-xs ${manrope.className} text-[10px] font-semibold text-white rounded-full whitespace-nowrap px-1.5`}
                                >
                                    {g.label} · <span>{g.percent.toFixed(1)}%</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            
            <div className={`${manrope.className} flex flex-wrap gap-x-4 gap-y-1 text-xs pt-1`}>
                {distribution.map((g) => (
                    <span key={g.label} className="inline-flex items-center gap-1.5 font-semibold text-neutral-800 dark:text-neutral-200 text-[11px]">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${getColor(g.label)}`} />
                        <span>{g.label}</span>
                        <span className="text-neutral-600 dark:text-neutral-400 font-normal">{g.percent.toFixed(1)}%</span>
                    </span>
                ))}
            </div>
        </div>
    );
}