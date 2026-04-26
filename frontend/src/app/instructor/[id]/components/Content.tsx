"use client";

import { useMemo, useState } from "react";
import SemesterCard from "./SemesterCard";
import { manrope } from "@/lib/fonts";
import { GroupedInstructorHistory } from "@/lib/types";
import {
	colorBgGPA,
	colorBorderGPA,
	colorGPA,
	colorWithdrawalRate,
	getGradeDistribution,
	getSummary,
	letterGradeFromGPA,
} from "@/utils/client/utils";
import GradeDistributionBar from "./GradeDistributionBar";

type Props = {
	instructorName: string;
	instructorData: GroupedInstructorHistory;
};

export default function InstructorContent({
	instructorName,
	instructorData,
}: Props) {
	const [isAllExpanded, setIsAllExpanded] = useState(true);

	const formatTerm = (code: string) => {
		const season = code.startsWith("f") ? "Fall" : "Spring";
		const year = code.match(/\d{4}/)?.[0] || "";
		return `${season} ${year}`;
	};

	const distribution = useMemo(
		() => getGradeDistribution(instructorData),
		[instructorData],
	);

	const { teaching, overall, subjectStats } = getSummary(instructorData);

	return (
		<main className="min-h-[calc(100vh-4rem)]">
			<div className="flex items-start justify-between mb-3 gap-4">
				<h1 className={`${manrope.className} font-bold text-xl`}>
					Historical Data For{" "}
					<span className="text-purple-800 underline">
						{instructorName}
					</span>
				</h1>

				<button
					onClick={() => setIsAllExpanded(!isAllExpanded)}
					className={`mt-1 ${manrope.className} cursor-pointer uppercase text-xs font-extrabold text-gray-600 dark:text-gray-200`}
				>
					{!isAllExpanded ? "Expand All" : "Collapse All"}
				</button>
			</div>

			<div
				className={`p-4 border ${colorBorderGPA(overall.gpa)} rounded-lg mb-4 shadow-md dark:shadow-none`}
			>
				<div
					className={`${manrope.className} flex flex-row justify-between items-center`}
				>
					<h2 className="font-bold text-md mb-2">Summary</h2>
					<span
						className={`font-extrabold text-lg bg-gray-300 px-2.5! py-0.5! rounded ${colorBgGPA(overall.gpa)} ${colorGPA(overall.gpa)}`}
					>
						{letterGradeFromGPA(overall.gpa)}
					</span>
				</div>
				<Description
					description="Teaching Areas"
					value1={teaching.join(", ")}
				/>
				<Description
					description="Overall GPA — Withdrawal Rate"
					value1={overall.gpa}
					color1={colorGPA(overall.gpa)}
					value2={overall.withdrawalRate}
					color2={colorWithdrawalRate(overall.withdrawalRate)}
				/>
				<div className="flex flex-row gap-2">
					<div
						className={`bg-gray-400/90 dark:bg-gray-300 w-1 stretch rounded-full my-0.5`}
					/>
					<div className="flex flex-col">
						{subjectStats &&
							Object.entries(subjectStats).map(
								([subject, stats]) => (
									<div key={subject}>
										<Description
											description={`${subject}`}
											value1={stats.gpa}
											color1={colorGPA(stats.gpa)}
											value2={stats.withdrawalRate}
											color2={colorWithdrawalRate(
												stats.withdrawalRate,
											)}
										/>
									</div>
								),
							)}
					</div>
				</div>
				<GradeDistributionBar distribution={distribution} />
			</div>

			{Object.entries(instructorData).map(([term, courses]) => (
				<SemesterCard
					key={term}
					term={formatTerm(term)}
					courses={courses}
					isAllExpanded={isAllExpanded}
				/>
			))}
		</main>
	);
}

type DescriptionProps = {
	description: string;
	value1: any;
	color1?: string;
	value2?: any;
	color2?: string;
};
function Description({
	description,
	value1,
	color1,
	value2,
	color2,
}: DescriptionProps) {
	return (
		<div className="text-sm">
			<span>{description}</span>:{" "}
			<span className={`${manrope.className} font-extrabold ${color1}`}>
				{value1}{" "}
				{color2 && (
					<span>
						<span className="text-gray-500 dark:text-gray-400">
							—
						</span>{" "}
						<span className={`${color2}`}>{value2}%</span>
					</span>
				)}
			</span>
		</div>
	);
}
