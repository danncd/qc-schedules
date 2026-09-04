export type ScheduleCourse = {
	Sec: string;
	Code: string;
	"Course (hr, crd)": string;
	Description: string;
	Day: string;
	Time: string;
	Instructor: string;
	Location: string;
	Enrolled: number;
	Limit: number;
	"Mode of Instruction": string;
	created: string;
	last_updated: string;
	semester: string;
};

export type InstructorCourseSummary = {
	Instructor: string;
	Subject: string;
	"Course Number": string;
	"avg gpa": number;
	Total_Students: number;
	Total_W: number;
	Above_F: number;
	Above_D: number;
	Above_C: number;
	"Withdrawal_Rate (%)": number;
	"Pass_Rate_Strict (%)": number;
	"Pass_Rate_Effective (%)": number;
	created: string;
	last_updated: string;
};

export type InstructorSummary = {
    Term: string;
    Subject: string;
    "Course Number": string;
    "Course Name": string;
    Section: string;
    Instructor: string;
    Total: string | number;

    "a+": string | number;
    "a": string | number;
    "a-": string | number;
    "b+": string | number;
    "b": string | number;
    "b-": string | number;
    "c+": string | number;
    "c": string | number;
    "c-": string | number;
    "d+": string | number;
    "d": string | number;
    "f": string | number;
    "w": string | number;
    inc: string | number;

    "avg gpa": string | number | null;
    p: string | number | null;

    created: string;
    last_updated: string;
};

export interface GroupedInstructorHistory {
    [term: string]: InstructorSummary[];
}

export type InstructorListing = {
    instructor: string;
    rawName: string;
    slug: string;
    subjects: string[];
};