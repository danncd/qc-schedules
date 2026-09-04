"use client";

import { manrope } from "@/_lib/fonts";
import { InstructorCourseSummary, ScheduleCourse } from "@/_lib/types";
import { colorGPA, colorPassingRate, colorWithdrawalRate, letterGradeFromGPA } from "@/_utils/client";
import { toInstructorSlug } from "@/_utils/slugs";
import { IconExternalLink } from "@tabler/icons-react";
import Link from "next/link";
import { useState, useMemo } from "react";

type Props = {
	course: ScheduleCourse;
	instructorSummary?: InstructorCourseSummary;
};

export default function ScheduleCourseCard({
	course,
	instructorSummary,
}: Props) {
	const [isStatsOpen, setIsStatsOpen] = useState(false);

	const courseName = course["Course (hr, crd)"]
		.split(" ")
		.slice(0, 2)
		.join(" ");
	const courseCodeSection =
		course.Code && course.Sec ? course.Code + " - " + course.Sec : "-";
	const courseDays =
		course.Day && course.Time ? course.Day + " " + course.Time : "-";
	const courseDescription = course.Description && course.Description;
	const courseMode =
		course["Mode of Instruction"] && course["Mode of Instruction"];
	const courseRoom = course.Location && course.Location;
	const courseEnrollment =
		course.Enrolled && course.Limit
			? course.Enrolled + "/" + course.Limit
			: "-";

	const courseInstructor =
		course.Instructor && course.Instructor != "," ? course.Instructor : "-";
	const courseAvgGPA = Number(instructorSummary?.["avg gpa"] || 0);
	const coursePassingRate = Number(
		instructorSummary?.["Pass_Rate_Effective (%)"] || 0,
	);
	const courseWithdrawalRate = Number(
		instructorSummary?.["Withdrawal_Rate (%)"] || 0,
	);

	const gpaStyle = colorGPA(courseAvgGPA);
    const wStyle = colorWithdrawalRate(courseWithdrawalRate);
    const pStyle = colorPassingRate(coursePassingRate);

	const isFull = Number(course.Limit) - Number(course.Enrolled) <= 0;
	const hasInstructor = courseInstructor !== "-";

	const instrPage = useMemo(() => {
		if (!hasInstructor) return "";
		return toInstructorSlug(courseInstructor);
	}, [hasInstructor, courseInstructor]);

	return (
		<div className="group rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white/80 dark:bg-[#181818]/80 backdrop-blur-xs p-4.5 shadow-2xs hover:border-neutral-300 dark:hover:border-neutral-700">
			<div className="flex flex-row justify-between items-start gap-4">
				<div className="flex flex-wrap items-center gap-2">
					<span
						className={`${manrope.className} font-extrabold text-base tracking-tight text-neutral-900 dark:text-neutral-100`}
					>
						{courseName}
					</span>
					<span className="text-xs font-medium px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200/60 dark:border-neutral-700/60">
						{courseCodeSection}
					</span>
				</div>
				<span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 text-end whitespace-nowrap">
					{courseDays}
				</span>
			</div>

			<div className="text-sm flex flex-col mt-1.5">
				<span className="font-medium text-[14px] text-neutral-800 dark:text-neutral-200 leading-snug">
					{courseDescription || "-"}
				</span>
				<span className="text-xs text-neutral-700 dark:text-neutral-300 mt-0.5">
					{courseMode}
				</span>
			</div>

			<div className="flex flex-row justify-start gap-2.5 mt-2.5">
				<div className="bg-neutral-200 dark:bg-neutral-700 w-1 self-stretch rounded-full my-0.5" />
				<div className="space-y-0.5">
					<Description tag="Room" value={courseRoom} />
					<Description
						tag="Seats"
						value={courseEnrollment}
						classes={
							isFull
								? "text-rose-600 dark:text-rose-400 font-semibold"
								: ""
						}
					/>
				</div>
			</div>

			<div
				className={`flex flex-row justify-start gap-2.5 pt-2.5 ${hasInstructor && instructorSummary ? "cursor-pointer" : ""}`}
				onClick={() =>
					hasInstructor &&
					instructorSummary &&
					setIsStatsOpen(!isStatsOpen)
				}
			>
				<div
					className={`${courseAvgGPA ? gpaStyle.bg : "bg-neutral-200 dark:bg-neutral-700"} w-1 self-stretch rounded-full my-0.5`}
				/>
				<div className="w-full min-w-0">
					<div className="flex flex-row justify-between w-full items-center gap-2">
						<Description
							tag="Instructor"
							value={courseInstructor}
							classes="font-black! text-[13px] text-neutral-900 dark:text-neutral-100"
							font
						/>
						{hasInstructor && instructorSummary && (
							<button
								type="button"
								aria-expanded={isStatsOpen}
								className={`${manrope.className} shrink-0 px-2.5 py-1 text-[11px] font-semibold rounded-full bg-neutral-100 hover:bg-neutral-200/80 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border border-neutral-200/60 dark:border-neutral-700/60 active:scale-95 cursor-pointer`}
								onClick={(e) => {
									e.stopPropagation();
									setIsStatsOpen(!isStatsOpen);
								}}
							>
								{!isStatsOpen ? "Open Stats" : "Close Stats"}
							</button>
						)}
					</div>

					<div
						className={`grid overflow-hidden ${
							isStatsOpen
								? "grid-rows-[1fr] opacity-100 mt-2.5"
								: "grid-rows-[0fr] opacity-0 mt-0"
						}`}
					>
						<div className="min-h-0">
							<div className="space-y-2">
								<div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
									Overall{" "}
									<span className="font-bold text-neutral-800 dark:text-neutral-200">
										{courseName}
									</span>{" "}
									Stats:
								</div>
								<div className="text-xs flex flex-col gap-1">
									<Description
										tag="Passing Rate (Above C)"
										classes={pStyle}
										value={`${coursePassingRate}%`}
										bold
										font
									/>
									<Description
										tag="Withdrawal Rate"
										classes={wStyle}
										value={`${courseWithdrawalRate}%`}
										bold
										font
									/>
									<Description
										tag="Overall GPA"
										classes={gpaStyle.text}
										value={
											courseAvgGPA
												? `${courseAvgGPA.toFixed(2)} - ${letterGradeFromGPA(courseAvgGPA)}`
												: "-"
										}
										bold
										font
									/>
								</div>

								{instrPage && (
									<Link href={`/instructor/${instrPage}`}>
										<div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-neutral-800 dark:text-neutral-200 dark:hover:text-white bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-200/80 dark:border-neutral-700 shadow-2xs active:scale-95 cursor-pointer">
											<IconExternalLink size={14} />
											<span className={`${manrope.className} font-medium`}>
												Visit Instructor&apos;s Page
											</span>
										</div>
									</Link>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

type DescriptionProps = {
	tag: string;
	value: React.ReactNode;
	font?: boolean;
	bold?: boolean;
	classes?: string;
};

function Description({
	tag,
	value,
	font,
	bold,
	classes = "",
}: DescriptionProps) {
	return (
		<div className="text-xs leading-relaxed">
			<span className="text-neutral-700 dark:text-neutral-300 font-medium">{tag}:</span>{" "}
			<span
				className={`${bold ? "font-bold" : "font-medium"} ${
					font ? manrope.className : ""
				} ${classes || "text-neutral-800 dark:text-neutral-200"}`}
			>
				{value}
			</span>
		</div>
	);
}
