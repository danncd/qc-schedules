"use client";

import { manrope } from "@/lib/fonts";
import { CourseRecord, InstructorCourseSummary } from "@/lib/types";
import {
	bgGPA,
	colorGPA,
	colorPassingRate,
	colorWithdrawalRate,
	letterGradeFromGPA,
} from "@/utils/client/utils";
import { IconExternalLink } from "@tabler/icons-react";
import Link from "next/link";
import { useState, useMemo } from "react";

type Props = {
	course: CourseRecord;
	instructor?: InstructorCourseSummary;
};

export default function CourseCard({ course, instructor }: Props) {
	const [isInstructorOpen, setIsInstructorOpen] = useState(false);

	const instrPage = useMemo(() => {
		if (!instructor || !course.Instructor || course.Instructor === ",")
			return "";

		const parts = course.Instructor.split(", ");
		if (parts.length >= 2 && parts[1]) {
			return `${parts[0]}-${parts[1][0]}`.replaceAll(" ", "+");
		}
		return parts[0];
	}, [instructor, course.Instructor]);

	const [courseSubj, courseNum] = course["Course (hr, crd)"]?.split(" ") || [
		"",
		"",
	];
	const isFull = Number(course.Limit) - Number(course.Enrolled) <= 0;
	const hasInstructor = Boolean(
		instructor && course.Instructor && course.Instructor !== ",",
	);

	const avgGpa = Number(instructor?.["avg gpa"] || 0);
	const passRate = Number(instructor?.["Pass_Rate_Effective (%)"] || 0);
	const withdrawalRate = Number(instructor?.["Withdrawal_Rate (%)"] || 0);

	const DAY_MS = 1000 * 60 * 60 * 24 * 2;

	const isNew = useMemo(() => {
		if (!course.created) return false;
		return Date.now() - new Date(course.created).getTime() <= DAY_MS;
	}, [course.created]);

	return (
		<div className="shadow-sm bg-gray-100/20 dark:bg-[#212121] border-gray-300 border rounded-lg p-4">
			<div className="flex flex-row justify-between items-start gap-4">
				<div>
					<span className={`${manrope.className} font-extrabold`}>
						{courseSubj} {courseNum}
					</span>{" "}
					<span className="text-gray-600 text-sm dark:text-gray-400">
						{course.Code} - {course.Sec}
					</span>
				</div>
				<span className="text-sm flex-1 text-end">
					{course.Day} {course.Time}
				</span>
			</div>

			<div className="text-sm flex flex-col">
				<div className="flex flex-row justify-between items-start gap-4">
					<span className="font-medium text-[15px]">
						{course.Description}
					</span>
					{isNew && 
						<span className="text-red-500 border border-dashed border-red-500 bg-red-200/20 px-2 py-0.5 rounded-md text-[11px] font-bold tracking-wide">
							NEW
						</span>
					}
				</div>
				<span>{course["Mode of Instruction"]}</span>
			</div>

			<div className="flex flex-row justify-start gap-2 mt-2">
				<div className="bg-gray-400/90 dark:bg-gray-300 w-1.5 stretch rounded-full my-0.5" />
				<div>
					<Description tag="Room" value={course.Location} />
					<Description
						tag="Seats"
						value={`${course.Enrolled}/${course.Limit}`}
						classes={isFull ? "text-red-700 dark:text-red-400" : ""}
					/>
				</div>
			</div>

			<div className="flex flex-row justify-start gap-2 mt-1.5">
				<div
					className={`${
						avgGpa
							? bgGPA(avgGpa)
							: "bg-gray-400/90 dark:bg-gray-300"
					} w-1.5 stretch rounded-full my-0.5`}
				/>
				<div className="w-full">
					<div className="flex flex-row justify-between w-full items-center">
						<Description
							tag="Instructor"
							value={
								hasInstructor || course?.Instructor
									? course.Instructor
									: "None"
							}
							classes="font-bold"
							font
						/>
						{hasInstructor && (
							<button
								aria-expanded={isInstructorOpen}
								className={`${manrope.className} text-[12px] font-bold cursor-pointer uppercase`}
								onClick={() =>
									setIsInstructorOpen(!isInstructorOpen)
								}
							>
								{!isInstructorOpen ? "Open" : "Close"}
							</button>
						)}
					</div>

					<div
						className={`grid transition-all duration-300 ease-in-out overflow-hidden ${
							isInstructorOpen
								? "grid-rows-[1fr] opacity-100 mt-2"
								: "grid-rows-[0fr] opacity-0 mt-0"
						}`}
					>
						<div className="min-h-0">
							<div className="text-sm text-gray-600 dark:text-gray-300 underline underline-offset-3 mb-2">
								Overall{" "}
								<span className="font-bold">
									{courseSubj} {courseNum}
								</span>{" "}
								Stats:
							</div>
							<div className="text-sm">
								<Description
									tag="Course Passing Rate (C and up)"
									value={`${passRate}%`}
									bold
									font
									classes={colorPassingRate(passRate)}
								/>
								<Description
									tag="Course Withdrawal Rate"
									value={`${withdrawalRate}%`}
									bold
									font
									classes={colorWithdrawalRate(
										withdrawalRate,
									)}
								/>
								<Description
									tag="Course Overall GPA"
									value={
										avgGpa
											? `${avgGpa.toFixed(2)} - ${letterGradeFromGPA(avgGpa)}`
											: "-"
									}
									bold
									font
									classes={colorGPA(avgGpa)}
								/>
							</div>

							{instrPage && (
								<Link href={`/instructor/${instrPage}`}>
									<div className="mt-2 text-gray-900 dark:text-gray-100 flex flex-row gap-2 items-center cursor-pointer w-fit text-sm hover:underline">
										<IconExternalLink size={18} />
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
				className={`${bold ? "font-extrabold" : ""} ${font ? manrope.className : ""} ${classes}`}
			>
				{value}
			</span>
		</div>
	);
}
