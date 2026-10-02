import { attachStatistics } from "../../src/features/schedule/lib/statistics";
import assert from "node:assert/strict";
import test from "node:test";
import {
    statistics,
    numeric,
} from "../../src/features/grades/lib/calculations";
import { mapGrade } from "../../src/features/instructors/data/mapping";
import {
    buildDirectory,
    resolveInstructor,
    resolveDisplayNames,
} from "../../src/features/instructors/lib/identity";
import { groupSections } from "../../src/features/schedule/lib/sections";
import { mapSection } from "../../src/features/schedule/data/mapping";
import { filterSections } from "../../src/features/schedule/lib/filters";
import { pageNumber } from "../../src/lib/pagination";
import { defaultTerm, termFromTable, historyTerm } from "../../src/lib/terms";

test("weighted GPA uses student counts rather than section averages", () => {
    const rows = [
        mapGrade({ Total: 10, a: 10, w: 0 }),
        mapGrade({ Total: 30, b: 30, w: 0 }),
    ];
    assert.equal(statistics(rows).gpa, 3.25);
    assert.equal(statistics(rows).passing, 100);
});
test("missing and invalid values remain unavailable but zero is valid", () => {
    assert.equal(numeric("N/A"), null);
    assert.equal(numeric(""), null);
    assert.equal(numeric("0"), 0);
    const stats = statistics([mapGrade({ Total: 10, f: 10, w: 0 })]);
    assert.equal(stats.gpa, 0);
    assert.equal(stats.passing, 0);
    assert.equal(
        statistics([mapGrade({ Total: 10, "avg gpa": 3.4, w: 0 })]).passing,
        null,
    );
});
test("historical GPA fallback matches the pipeline's weighting", () => {
    const result = statistics([
        mapGrade({ Total: 10, "avg gpa": 3, w: 2 }),
        mapGrade({ Total: 2, a: 2, w: 0 }),
    ]);
    assert.equal(result.gpa, 3.2);
    assert.equal(result.students, 12);
});
test("section grouping keeps distinct meetings without mutating inputs", () => {
    const first = mapSection({
        Code: "123",
        Sec: "01",
        "Course (hr, crd)": "CSCI 381",
        Day: "M",
        Time: "10",
        Instructor: "Smith, John",
    });
    const second = mapSection({
        Code: "123",
        Sec: "01",
        "Course (hr, crd)": "CSCI 381",
        Day: "W",
        Time: "10",
        Instructor: "Smith, John",
    });
    const result = groupSections([first, second, first]);
    assert.equal(result.length, 1);
    assert.equal(result[0].meetings.length, 2);
    assert.equal(first.meetings.length, 1);
});
test("co-taught sections do not attach one instructor's statistics", () => {
    const make = (Instructor: string) =>
        mapSection({
            Code: "123",
            Sec: "01",
            "Course (hr, crd)": "CSCI 381",
            Instructor,
        });
    assert.equal(
        groupSections([make("Smith, John"), make("Jones, Ann")])[0].instructor,
        "Multiple instructors",
    );
});
test("colliding instructor URLs stay distinct and ambiguous old URLs do not resolve", () => {
    const people = buildDirectory([
        { name: "SMITH, JOHN", subject: "CSCI" },
        { name: "SMITH, JANE", subject: "CSCI" },
    ]);
    assert.notEqual(people[0].slug, people[1].slug);
    assert.equal(resolveInstructor(people, "smith-j"), null);
    assert.equal(
        resolveInstructor(people, people[0].slug)?.rawName,
        people[0].rawName,
    );
});
test("ambiguous full names remain abbreviated", () => {
    const people = buildDirectory([{ name: "SMITH, J", subject: "CSCI" }]);
    const result = resolveDisplayNames(people, [
        { name: "Smith, John", subject: "CSCI" },
        { name: "Smith, Jane", subject: "CSCI" },
    ]);
    assert.equal(result[0].name, "Smith, J");
    assert.equal(result[0].ambiguous, true);
});
test("invalid page numbers are bounded", () => {
    assert.equal(pageNumber("-2", 200), 1);
    assert.equal(pageNumber("1.2", 200), 1);
    assert.equal(pageNumber("900", 200), 4);
    assert.equal(pageNumber("3", 200), 3);
    assert.equal(pageNumber("3", 0), 1);
});
test("current semester is selected rather than first sorted term", () => {
    const terms = [termFromTable("winter_2026")!, termFromTable("fall_2026")!];
    assert.equal(defaultTerm(terms, new Date("2026-09-26")), "fall_2026");
    assert.equal(termFromTable("instructor_grades"), null);
    assert.equal(historyTerm("su2025").label, "Summer 2025");
});
test("new filter excludes future dates and missing timestamps", () => {
    const now = Date.parse("2026-09-26T00:00:00Z");
    const base = mapSection({
        Code: "123",
        "Course (hr, crd)": "CSCI 111",
        Instructor: "Doe, J",
    });
    const rows = [
        { ...base, created: "2026-09-25T00:00:00Z" },
        { ...base, created: "2026-09-27T00:00:00Z" },
        { ...base, created: null },
    ];
    assert.equal(filterSections(rows, "CSCI 111", true, now).length, 1);
    assert.equal(filterSections(rows, "doe", false, now).length, 3);
});

test("instructor searches match either name order and punctuation", () => {
    const section = mapSection({
        Code: "123",
        "Course (hr, crd)": "CSCI 111",
        Instructor: "Mitchell, Tim",
    });
    assert.equal(filterSections([section], "Tim Mitchell", false, 0).length, 1);
    assert.equal(
        filterSections([section], "Mitchell, Tim", false, 0).length,
        1,
    );
    assert.equal(
        filterSections([section], "Jane Mitchell", false, 0).length,
        0,
    );
});

test("room search includes every meeting location", () => {
    const course = mapSection({
        Code: "123",
        "Course (hr, crd)": "CSCI 111",
        Location: "SB A135B",
    });
    course.meetings.push({
        days: "W",
        time: "10",
        room: "KY 321",
        instructor: "Doe, J",
    });
    assert.equal(filterSections([course], "sb a135b", false, 0).length, 1);
    assert.equal(filterSections([course], "KY 321", false, 0).length, 1);
    assert.equal(filterSections([course], "KY 999", false, 0).length, 0);
});

test("database timestamps without a timezone are treated as UTC", () => {
    const created = "2026-09-25T00:00:00";
    const now = Date.parse("2026-09-27T00:00:01Z");
    const course = mapSection({ created });
    assert.equal(course.created, `${created}Z`);
    assert.equal(filterSections([course], "", true, now).length, 0);
    assert.equal(
        mapSection({ created: `${created}+02:00` }).created,
        `${created}+02:00`,
    );
});

test("ambiguous instructor identities cannot receive course statistics", () => {
    const courses = [
        mapSection({
            "Course (hr, crd)": "CSCI 111",
            Instructor: "Smith, John",
        }),
    ];
    const summaries = [
        {
            Instructor: "SMITH, J",
            Subject: "CSCI",
            "Course Number": "111",
            "avg gpa": 3.2,
        },
    ];
    const directory = buildDirectory([{ name: "SMITH, J", subject: "CSCI" }]);
    assert.equal(
        attachStatistics(courses, summaries, directory)[0].stats?.gpa,
        3.2,
    );
    const ambiguous = resolveDisplayNames(directory, [
        { name: "Smith, John", subject: "CSCI" },
        { name: "Smith, Jane", subject: "CSCI" },
    ]);
    assert.equal(
        attachStatistics(courses, summaries, ambiguous)[0].stats,
        null,
    );
    assert.equal(courses[0].stats, null);
});

test("a historical full name is not replaced by someone sharing the same initial", () => {
    const directory = buildDirectory([
        { name: "SMITH, JOHN", subject: "CSCI" },
    ]);
    const people = resolveDisplayNames(directory, [
        { name: "Smith, Jane", subject: "CSCI" },
    ]);
    assert.equal(people[0].name, "Smith, John");
    const courses = [
        mapSection({
            "Course (hr, crd)": "CSCI 111",
            Instructor: "Smith, Jane",
        }),
    ];
    const summaries = [
        {
            Instructor: "SMITH, JOHN",
            Subject: "CSCI",
            "Course Number": "111",
            "avg gpa": 4,
        },
    ];
    assert.equal(attachStatistics(courses, summaries, people)[0].stats, null);
});

test("time summary combines overlapping weekdays while preserving room records", async () => {
    const { meetingTimes } =
        await import("../../src/features/schedule/lib/meeting-times");
    const meetings = [
        {
            days: "F",
            time: "10:00 AM - 12:50 PM",
            room: "SB C201",
            instructor: "Waxman, Jerry",
        },
        {
            days: "M",
            time: "10:00 AM - 12:50 PM",
            room: "SB C201",
            instructor: "Waxman, Jerry",
        },
        {
            days: "M, T, W, TH, F",
            time: "10:00 AM - 12:50 PM",
            room: "OL 01",
            instructor: "Waxman, Jerry",
        },
        {
            days: "TH",
            time: "2:00 PM - 3:00 PM",
            room: "SB C201",
            instructor: "Waxman, Jerry",
        },
    ];
    assert.deepEqual(meetingTimes(meetings), [
        { days: "M, T, W, TH, F", time: "10:00 AM - 12:50 PM" },
        { days: "TH", time: "2:00 PM - 3:00 PM" },
    ]);
    assert.equal(meetings.length, 4);
    assert.equal(meetings[0].room, "SB C201");
});

test("room details combine weekdays without losing room or instructor distinctions", async () => {
    const { meetingDetails } =
        await import("../../src/features/schedule/lib/meeting-times");
    const meeting = {
        days: "F",
        time: "10",
        room: "SB C201",
        instructor: "Waxman, Jerry",
    };
    const rows = [
        meeting,
        { ...meeting, days: "M" },
        { ...meeting, days: "M, T, W, TH, F", room: "OL 01" },
        { ...meeting, instructor: "Other instructor" },
        { ...meeting, time: "11" },
    ];
    const details = meetingDetails(rows);
    assert.equal(details.length, 4);
    assert.equal(details[0].days, "M, F");
    assert.equal(details[1].room, "OL 01");
    assert.equal(details[1].days, "M, T, W, TH, F");
    assert.equal(details[2].instructor, "Other instructor");
    assert.equal(details[3].time, "11");
    assert.equal(rows[0].days, "F");
});
