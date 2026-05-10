import { GroupedInstructorHistory, ScheduleCourse } from "@/_lib/types";
import { createPublicClient } from "./supabase/server";
import { cache } from "react";

export async function getScheduleData(): Promise<{
	semesterData: ScheduleCourse[];
	semesterNames: string[];
}> {
	const supabase = createPublicClient();

	const year = new Date().getFullYear().toString();
	const { data: tableNames, error: tableError } = await supabase.rpc(
		"get_tables_by_year",
		{
			year_text: year,
		},
	);

	if (tableError || !tableNames) {
		return {
			semesterData: [],
			semesterNames: [],
		};
	}

	const results = await Promise.all(
		tableNames.map(async (row: { table_name: string }) => {
			const table = row.table_name;

			const { data, error } = await supabase.from(table).select("*");

			if (error) {
				console.error(`Error querying ${table}:`, error);
				return {
					results: [],
					semesterNames: [],
				};
			}

			const semesterLabel = table
				.replaceAll("_", " ")
				.replace(/\b\w/g, (c) => c.toUpperCase());

			return data.map((row: any) => ({
				...row,
				semester: semesterLabel,
			}));
		}),
	);

	const flatResults = results.flat();

	const seasonOrder = ["Winter", "Spring", "Summer 1", "Summer 2", "Fall"];
	const semesterNames = tableNames
		.map((row: any) =>
			row.table_name
				.replaceAll("_", " ")
				.replace(/\b\w/g, (c: string) => c.toUpperCase()),
		)
		.sort((a: string, b: string) => {
			const getSeasonIndex = (name: string) => {
				const season = seasonOrder.findIndex((s) => name.startsWith(s));
				return season === -1 ? 999 : season;
			};
			return getSeasonIndex(a) - getSeasonIndex(b);
		});
	return {
		semesterData: flatResults,
		semesterNames,
	};
}

export async function getInstructorCourseSummaries() {
	const supabase = createPublicClient();
	const { data, error } = await supabase
		.from("instructor_course_summary")
		.select("*");
	
	if (error || !data) return [];
	return data;
}

export async function getInstructorNames() {
	const supabase = createPublicClient();

	const { data, error } = await supabase
		.from("instructor_grades")
		.select("Instructor, Subject");

	if (error || !data) return [];

	const map = new Map<string, Set<string>>();

	for (const row of data) {
		const instructor = row.Instructor?.trim();
		const subject = row.Subject?.trim();

		if (!instructor || !subject) continue;
		if (!/[a-zA-Z]/.test(instructor)) continue;

		if (!map.has(instructor)) {
			map.set(instructor, new Set());
		}

		map.get(instructor)!.add(subject);
	}

	console.log(map);
	return Array.from(map.entries()).map(([instructor, subjects]) => ({
		instructor,
		subjects: Array.from(subjects),
	}));
}

export const getInstructorHistory = cache(
	async (name: string): Promise<GroupedInstructorHistory> => {
		const supabase = createPublicClient();

		const { data, error } = await supabase
			.from("instructor_grades")
			.select("*")
			.eq("Instructor", name.toUpperCase())
			.not("Term", "ilike", "COMBINED%")
			;

		if (error || !data) {
			console.error("Supabase error:", error);
			return {};
		}

		const grouped = data.reduce((acc, row) => {
			const term = row.Term ?? "Unknown";
			if (!acc[term]) {
				acc[term] = [];
			}
			acc[term].push(row);
			return acc;
		}, {} as GroupedInstructorHistory);

		return grouped;
	},
);