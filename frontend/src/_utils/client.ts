export const normalizeInstructorName = (
	name: string | null | undefined,
): string => {
	if (!name) return "";

	const cleaned = name.trim().toUpperCase();

	if (
		cleaned === "0" ||
		cleaned === "" ||
		cleaned === "," ||
		cleaned === "0.0"
	) {
		return "";
	}

	if (cleaned.includes(",")) {
		const [last, rest] = cleaned.split(",");
		const initial = rest.trim().charAt(0);
		return initial ? `${last.trim()}, ${initial}` : last.trim();
	}

	return cleaned;
};

type GPAStyle = {
	text: string;
	border: string;
	bg: string;
};

export function colorGPA(gpa: number): GPAStyle {
	if (gpa >= 3.7) {
		return {
			text: "text-green-600",
			border: "border-green-600/50",
			bg: "bg-green-600",
		};
	}

	if (gpa >= 3.0) {
		return {
			text: "text-lime-600",
			border: "border-lime-600/50",
			bg: "bg-lime-600",
		};
	}

	if (gpa >= 2.0) {
		return {
			text: "text-yellow-600",
			border: "border-yellow-600/50",
			bg: "bg-yellow-600",
		};
	}

	if (gpa >= 1.0) {
		return {
			text: "text-orange-600",
			border: "border-orange-600/50",
			bg: "bg-orange-600",
		};
	}

	return {
		text: "text-red-600",
		border: "border-red-600/50",
		bg: "bg-red-600",
	};
}

export function letterGradeFromGPA(gpa: number): string {
	if (gpa >= 4.0) return "A+";
	if (gpa >= 3.93) return "A";
	if (gpa >= 3.7) return "A-";
	if (gpa >= 3.3) return "B+";
	if (gpa >= 3.0) return "B";
	if (gpa >= 2.7) return "B-";
	if (gpa >= 2.3) return "C+";
	if (gpa >= 2.0) return "C";
	if (gpa >= 1.7) return "C-";
	if (gpa >= 1.3) return "D+";
	if (gpa >= 1.0) return "D";
	return "F";
}

export function colorPassingRate(num: number): string {
	if (num >= 90) return "text-green-600";
	if (num >= 75) return "text-lime-600";
	if (num >= 60) return "text-yellow-600";
	if (num >= 40) return "text-orange-600";
	return "text-red-600";
}

export function colorWithdrawalRate(num: number): string {
	if (num > 50) return "text-red-600";
	if (num > 30) return "text-orange-600";
	if (num > 15) return "text-yellow-600";
	return "text-green-600";
}

import { GroupedInstructorHistory, InstructorSummary } from "@/_lib/types";

export type GradeBucket = {
    label: "A" | "B" | "C" | "D" | "F" | "W";
    value: number;
    percent: number;
};

export type GradeRecord = {
    label: string;
    count: number;
    color: string;
};

export function getGradeData(course: InstructorSummary): GradeRecord[] {
    return [
        { label: "A+", count: Number(course["a+"] || 0), color: "bg-green-700" },
        { label: "A", count: Number(course.a || 0), color: "bg-green-500" },
        { label: "A-", count: Number(course["a-"] || 0), color: "bg-green-300" },

        { label: "B+", count: Number(course["b+"] || 0), color: "bg-blue-600" },
        { label: "B", count: Number(course.b || 0), color: "bg-blue-500" },
        { label: "B-", count: Number(course["b-"] || 0), color: "bg-blue-300" },

        { label: "C+", count: Number(course["c+"] || 0), color: "bg-amber-500" },
        { label: "C", count: Number(course.c || 0), color: "bg-amber-400" },
        { label: "C-", count: Number(course["c-"] || 0), color: "bg-amber-200" },

        { label: "D+", count: Number(course["d+"] || 0), color: "bg-red-300" },
        { label: "D", count: Number(course.d || 0), color: "bg-red-400" },
        { label: "F", count: Number(course.f || 0), color: "bg-red-600" },

        { label: "W", count: Number(course.w || 0), color: "bg-gray-300" },
    ];
}

export function getCourseStats(course: InstructorSummary) {
    const total = Number(course.Total || 0);
    const gpa = Number(Number(course["avg gpa"] || 0).toFixed(2));
    const withdrawals = Number(course.w || 0);
    const withdrawalRate = total ? Number(((withdrawals / total) * 100).toFixed(2)) : 0;

    const passed =
        Number(course["a+"] || 0) +
        Number(course.a || 0) +
        Number(course["a-"] || 0) +
        Number(course["b+"] || 0) +
        Number(course.b || 0) +
        Number(course["b-"] || 0) +
        Number(course["c+"] || 0) +
        Number(course.c || 0);
        
    const passingRate = total ? Number(((passed / total) * 100).toFixed(2)) : 0;

    return { gpa, withdrawalRate, passingRate };
}

export function getSummary(data: GroupedInstructorHistory) {
    const allCourses = Object.values(data).flat();
    const subjects = Array.from(new Set(allCourses.map((c) => c.Subject)));

    const getGpa = (courses: InstructorSummary[]) => {
        const gpas = courses
            .filter((c) => c["avg gpa"] !== null)
            .map((c) => Number(c["avg gpa"]))
            .filter((g) => !Number.isNaN(g));

        return gpas.length
            ? Number((gpas.reduce((a, b) => a + b, 0) / gpas.length).toFixed(2))
            : 0;
    };

    const getWithdrawalRate = (courses: InstructorSummary[]) => {
        let total = 0;
        let withdrawn = 0;

        for (const c of courses) {
            total += Number(c.Total || 0);
            withdrawn += Number(c.w || 0);
        }

        return total ? Number(((withdrawn / total) * 100).toFixed(2)) : 0;
    };

    const overallGPA = getGpa(allCourses);
    const overallWithdrawalRate = getWithdrawalRate(allCourses);

    const subjectStats: Record<string, { gpa: number; withdrawalRate: number }> = {};

    for (const subject of subjects) {
        const courses = allCourses.filter((c) => c.Subject === subject);
        subjectStats[subject] = {
            gpa: getGpa(courses),
            withdrawalRate: getWithdrawalRate(courses),
        };
    }

    return {
        teaching: subjects,
        overall: {
            gpa: overallGPA,
            withdrawalRate: overallWithdrawalRate,
        },
        subjectStats,
    };
}

export function getGradeDistribution(data: GroupedInstructorHistory): GradeBucket[] {
    const allCourses = Object.values(data).flat();
    const totals = { A: 0, B: 0, C: 0, D: 0, F: 0, W: 0, P: 0, INC: 0 };

    for (const c of allCourses) {
        totals.A += Number(c["a+"] || 0) + Number(c.a || 0) + Number(c["a-"] || 0);
        totals.B += Number(c["b+"] || 0) + Number(c.b || 0) + Number(c["b-"] || 0);
        totals.C += Number(c["c+"] || 0) + Number(c.c || 0) + Number(c["c-"] || 0);
        totals.D += Number(c["d+"] || 0) + Number(c.d || 0);
        totals.F += Number(c.f || 0);
        totals.W += Number(c.w || 0);
        totals.P += Number(c.p || 0);
        totals.INC += Number(c.inc || 0);
    }
    
    const total = Object.values(totals).reduce((a, b) => a + b, 0) || 1;
    const visible = ["A", "B", "C", "D", "F", "W"] as const;

    return visible.map((label) => ({
        label,
        value: totals[label],
        percent: (totals[label] / total) * 100,
    }));
}