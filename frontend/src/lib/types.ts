export interface CourseRecord {
	Sec: string;
	Code: string;
	"Course (hr, crd)": string;
	Description: string;
	Day: string;
	Time: string;
	Instructor: string;
	Location: string;
	Enrolled: string;
	Limit: string;
	"Mode of Instruction": string;
    semester: string;
    created: string;
}

export interface InstructorCourseSummary {
	Instructor: string;
	Subject: string;
	"Course Number": string;
	"avg gpa": string | null;
	Total_Students: string;
	Total_W: string;
	Above_F: string;
	Above_D: string;
	Above_C: string;
	"Withdrawal_Rate (%)": string;
	"Pass_Rate_Strict (%)": string;
	"Pass_Rate_Effective (%)": string;
}

export interface InstructorSummary {
    "Term": string;
    "Subject": string;
    "Course Number": string;
    "Course Name": string;
    "Section": string;
    "Instructor": string;
    "Total": number;

    "a+": number;
    "a": number;
    "a-": number;
    "b+": number;
    "b": number;
    "b-": number;
    "c+": number;
    "c": number;
    "c-": number;
    "d+": number;
    "d": number;
    "f": number;

    "w": number;
    "inc/na": number;
    "p": number;
    "withdrawal": number;
    "inc/no grade": number;
    "fail": number;
    "withdraw": number;
    "incomplete": number;

    "avg gpa": number;
    "average gpa": number; 
}

export interface GroupedInstructorHistory {
    [term: string]: InstructorSummary[];
}