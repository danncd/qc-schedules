import {
	GroupedInstructorHistory,
	InstructorCourseSummary,
} from "@/lib/types";
import { createPublicClient } from "../supabase/server";
import { cache } from "react";

async function getRawSemesters() {
	const supabase = await createPublicClient();
	const year = new Date().getFullYear().toString();

	const { data, error } = await supabase.rpc("get_tables_by_year", {
		year_text: year,
	});

	if (error) {
		return [];
	}

	return (data || []).map((row: any) => row.table_name).filter(Boolean);
}

export async function getSemesters() {
	const rawSemesters = await getRawSemesters();
	return rawSemesters.map(
		(sem: string) =>
			sem.charAt(0).toUpperCase() + sem.replaceAll("_", " ").slice(1),
	);
}

export async function getCoursesBySemester() {
	const supabase = await createPublicClient();
	const tables = await getRawSemesters();

	const results = await Promise.all(
		tables.map(async (table: string) => {
			const { data, error } = await supabase.from(table).select("*");

			if (error || !data) return [];

			const semesterLabel = table
				.replaceAll("_", " ")
				.replace(/\b\w/g, (c) => c.toUpperCase());

			return data.map((row: any) => ({
				...row,
				semester: semesterLabel,
			}));
		}),
	);

	return results.flat();
}

export async function getInstructorSummaries() {
	const supabase = createPublicClient();

	const { data, error } = await supabase
		.from("instructor_course_summary")
		.select("*");

	if (error) {
		return [];
	}

	return data as InstructorCourseSummary[];
}

export const getInstructorHstory = cache(
	async (name: string): Promise<GroupedInstructorHistory> => {
		const supabase = createPublicClient();

		const { data, error } = await supabase.rpc(
			"get_instructor_history_grouped",
			{
				instructor_name: name,
			},
		);

		if (error) {
			console.error("RPC Error:", error);
			return {};
		}

		return data as GroupedInstructorHistory;
	},
);

export const getInstructorHistory = cache(
	async (name: string): Promise<GroupedInstructorHistory> => {
		const supabase = createPublicClient();

		const { data, error } = await supabase
			.from("instructor_summaries")
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

export async function getInstructorNames() {
	const supabase = createPublicClient();

	const { data, error } = await supabase
		.from("instructor_summaries")
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

	return Array.from(map.entries()).map(([instructor, subjects]) => ({
		instructor,
		subjects: Array.from(subjects),
	}));
}