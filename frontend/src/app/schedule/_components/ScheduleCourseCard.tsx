"use client";

import { manrope } from "@/_lib/fonts";
import { InstructorCourseSummary, ScheduleCourse } from "@/_lib/types";
import { colorGPA, colorPassingRate, colorWithdrawalRate, letterGradeFromGPA } from "@/_utils/client";
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
		const parts = courseInstructor.split(", ");
		if (parts.length >= 2 && parts[1]) {
			const name = `${parts[0]}, ${parts[1][0]}`;
			return encodeURIComponent(name);
		}
		return encodeURIComponent(parts[0]);
	}, [hasInstructor, courseInstructor]);

	return (
		<div className="shadow-sm bg-gray-100/20 dark:bg-[#212121] border-gray-300 border rounded-lg p-4">
			<div className="flex flex-row justify-between items-start gap-4">
				<div>
					<span
						className={`${manrope.className} font-extrabold text-base`}
					>
						{courseName}
					</span>{" "}
					<span className="text-gray-600 text-sm dark:text-gray-400">
						{courseCodeSection}
					</span>
				</div>
				<span className="text-sm flex-1 text-end">{courseDays}</span>
			</div>

			<div className="text-sm flex flex-col mt-1">
				<span className="font-medium text-[15px]">
					{courseDescription || "-"}
				</span>
				<span className="text-gray-700 dark:text-gray-300 mt-0.5">
					{courseMode}
				</span>
			</div>

			<div className="flex flex-row justify-start gap-2 mt-2">
				<div className="bg-gray-400/90 dark:bg-gray-300 w-1.5 stretch rounded-full my-0.5" />
				<div>
					<Description tag="Room" value={courseRoom} />
					<Description
						tag="Seats"
						value={courseEnrollment}
						classes={
							isFull
								? "text-red-700 dark:text-red-400 font-medium"
								: ""
						}
					/>
				</div>
			</div>

			<div
				className={`flex flex-row justify-start gap-2 mt-2 ${hasInstructor && instructorSummary && "cursor-pointer"}`}
				onClick={() =>
					hasInstructor &&
					instructorSummary &&
					setIsStatsOpen(!isStatsOpen)
				}
			>
				<div
					className={`${courseAvgGPA ? gpaStyle.bg : "bg-gray-400/90 dark:bg-gray-300"} w-1.5 stretch rounded-full my-0.5`}
				/>
				<div className="w-full">
					<div className="flex flex-row justify-between w-full items-center">
						<Description
							tag="Instructor"
							value={courseInstructor}
							classes="font-bold text-[14px]"
							font
						/>
						{hasInstructor && instructorSummary && (
							<button
								aria-expanded={isStatsOpen}
								className={`${manrope.className} text-[12px] font-bold cursor-pointer uppercase text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors`}
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
						className={`grid transition-all duration-300 ease-in-out overflow-hidden ${
							isStatsOpen
								? "grid-rows-[1fr] opacity-100 mt-2"
								: "grid-rows-[0fr] opacity-0 mt-0"
						}`}
					>
						<div className="min-h-0">
							<div className="text-sm text-gray-600 dark:text-gray-300 underline underline-offset-4 mb-2">
								Overall{" "}
								<span className="font-bold">{courseName}</span>{" "}
								Stats:
							</div>
							<div className="text-sm flex flex-col gap-0.5">
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
									<div className="mt-3 text-gray-700 dark:text-gray-300 flex flex-row gap-2 items-center cursor-pointer w-fit text-sm hover:text-gray-900 dark:hover:text-gray-100 transition-colors font-medium">
										<IconExternalLink size={16} />
										<span>
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
		<div className="text-sm">
			<span className="text-gray-600 dark:text-gray-300">{tag}:</span>{" "}
			<span
				className={`${bold ? "font-extrabold" : ""} ${
					font ? manrope.className : ""
				} ${classes}`}
			>
				{value}
			</span>
		</div>
	);
}
