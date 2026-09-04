import { GroupedInstructorHistory, InstructorListing, ScheduleCourse } from "@/_lib/types";
import { createPublicClient } from "./supabase/server";
import { cache } from "react";
import { toInstructorSlug, formatFallbackName } from "./slugs";

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

interface InstructorDetails {
	rawName: string;
	displayName: string;
	slug: string;
	subjects: string[];
}

interface InstructorDirectory {
	instructors: InstructorListing[];
	slugToDetails: Map<string, InstructorDetails>;
	rawToDetails: Map<string, InstructorDetails>;
}

export const getInstructorDirectory = cache(async (): Promise<InstructorDirectory> => {
	const supabase = createPublicClient();
	const year = new Date().getFullYear().toString();

	const { data: tableNames } = await supabase.rpc("get_tables_by_year", {
		year_text: year,
	});

	const schedulePromises = (tableNames || []).map((row: { table_name: string }) =>
		supabase.from(row.table_name).select('Instructor, "Course (hr, crd)"'),
	);

	const gradesPromise = supabase
		.from("instructor_grades")
		.select("Instructor, Subject");

	const [scheduleResults, { data: gradeData }] = await Promise.all([
		Promise.all(schedulePromises),
		gradesPromise,
	]);

	// Key: "LAST, I" -> Array of { fullName, subjects: Set }
	const scheduleMap = new Map<string, { fullName: string; subjects: Set<string> }[]>();

	for (const res of scheduleResults) {
		if (!res.data) continue;
		for (const row of res.data as any[]) {
			const name = row.Instructor?.trim();
			const courseStr = row["Course (hr, crd)"]?.trim() || "";
			const subject = courseStr.split(" ")[0];

			if (name && name.includes(",")) {
				const parts = name.split(",");
				const last = parts[0].trim().toUpperCase();
				const firstPart = parts[1].trim();

				if (firstPart.length > 0 && /[a-zA-Z]/.test(firstPart[0])) {
					const init = firstPart[0].toUpperCase();
					const key = `${last}, ${init}`;

					if (!scheduleMap.has(key)) scheduleMap.set(key, []);
					const list = scheduleMap.get(key)!;
					let entry = list.find((e) => e.fullName === name);
					if (!entry) {
						entry = { fullName: name, subjects: new Set() };
						list.push(entry);
					}
					if (subject) entry.subjects.add(subject);
				}
			}
		}
	}

	const rawToDetails = new Map<string, { rawName: string; displayName: string; slug: string; subjects: Set<string> }>();
	const slugToDetails = new Map<string, InstructorDetails>();

	for (const row of (gradeData || []) as any[]) {
		const raw = row.Instructor?.trim();
		const subject = row.Subject?.trim();
		if (!raw || !/[a-zA-Z]/.test(raw)) continue;

		if (!rawToDetails.has(raw)) {
			rawToDetails.set(raw, {
				rawName: raw,
				displayName: "",
				slug: toInstructorSlug(raw),
				subjects: new Set(),
			});
		}
		if (subject) rawToDetails.get(raw)!.subjects.add(subject);
	}

	const instructors: InstructorListing[] = [];
	const rawLookupMap = new Map<string, InstructorDetails>();

	for (const details of rawToDetails.values()) {
		const rawKey = details.rawName.toUpperCase();
		const candidates = scheduleMap.get(rawKey);
		let resolvedName = "";

		if (candidates && candidates.length === 1) {
			resolvedName = candidates[0].fullName;
		} else if (candidates && candidates.length > 1) {
			const match = candidates.find((c) => {
				for (const s of details.subjects) {
					if (c.subjects.has(s)) return true;
				}
				return false;
			});
			resolvedName = match ? match.fullName : candidates[0].fullName;
		}

		if (!resolvedName) {
			resolvedName = formatFallbackName(details.rawName);
		}

		details.displayName = resolvedName;
		const finalEntry: InstructorDetails = {
			rawName: details.rawName,
			displayName: resolvedName,
			slug: details.slug,
			subjects: Array.from(details.subjects),
		};

		instructors.push({
			instructor: resolvedName,
			rawName: details.rawName,
			slug: details.slug,
			subjects: finalEntry.subjects,
		});

		rawLookupMap.set(details.rawName.toUpperCase(), finalEntry);
		slugToDetails.set(details.slug, finalEntry);
		slugToDetails.set(details.rawName.toLowerCase(), finalEntry);
		slugToDetails.set(resolvedName.toLowerCase(), finalEntry);

		const fullSlug = toInstructorSlug(resolvedName);
		if (fullSlug) {
			slugToDetails.set(fullSlug, finalEntry);
		}
	}

	instructors.sort((a, b) => a.instructor.localeCompare(b.instructor));

	return {
		instructors,
		slugToDetails,
		rawToDetails: rawLookupMap,
	};
});

export async function getInstructorNames(): Promise<InstructorListing[]> {
	const directory = await getInstructorDirectory();
	return directory.instructors;
}

export const getInstructorHistory = cache(
	async (
		idOrSlug: string,
	): Promise<{
		instructorData: GroupedInstructorHistory;
		displayName: string;
		rawName: string;
		slug: string;
	}> => {
		const supabase = createPublicClient();
		const directory = await getInstructorDirectory();

		const decoded = decodeURIComponent(idOrSlug).trim();
		const slugKey = toInstructorSlug(decoded);

		const match =
			directory.slugToDetails.get(decoded.toLowerCase()) ||
			directory.slugToDetails.get(slugKey) ||
			directory.rawToDetails.get(decoded.toUpperCase());

		const targetRawName = match ? match.rawName : decoded.toUpperCase();
		const displayName = match ? match.displayName : formatFallbackName(decoded);
		const canonicalSlug = match ? match.slug : slugKey;

		const { data, error } = await supabase
			.from("instructor_grades")
			.select("*")
			.eq("Instructor", targetRawName)
			.not("Term", "ilike", "COMBINED%");

		if (error || !data || data.length === 0) {
			const { data: fallbackData } = await supabase
				.from("instructor_grades")
				.select("*")
				.ilike("Instructor", targetRawName)
				.not("Term", "ilike", "COMBINED%");

			if (!fallbackData || fallbackData.length === 0) {
				return {
					instructorData: {},
					displayName,
					rawName: targetRawName,
					slug: canonicalSlug,
				};
			}

			const grouped = fallbackData.reduce((acc, row) => {
				const term = row.Term ?? "Unknown";
				if (!acc[term]) {
					acc[term] = [];
				}
				acc[term].push(row);
				return acc;
			}, {} as GroupedInstructorHistory);

			return {
				instructorData: grouped,
				displayName,
				rawName: targetRawName,
				slug: canonicalSlug,
			};
		}

		const grouped = data.reduce((acc, row) => {
			const term = row.Term ?? "Unknown";
			if (!acc[term]) {
				acc[term] = [];
			}
			acc[term].push(row);
			return acc;
		}, {} as GroupedInstructorHistory);

		return {
			instructorData: grouped,
			displayName,
			rawName: targetRawName,
			slug: canonicalSlug,
		};
	},
);