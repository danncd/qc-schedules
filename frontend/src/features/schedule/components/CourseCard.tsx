import type { CourseSection } from "../types";
import { meetingDetails, meetingTimes } from "../lib/meeting-times";
import CourseInstructorStats from "./CourseInstructorStats";
export default function CourseCard({ course }: { course: CourseSection }) {
    const details = meetingDetails(course.meetings);
    const full =
        course.limit !== null &&
        course.enrolled !== null &&
        course.enrolled >= course.limit;
    return (
        <article className="card course-card">
            <div className="card-top">
                <div className="course-id">
                    <h2>
                        {course.subject} {course.number}
                    </h2>
                    <span className="badge">
                        {course.code} - {course.section}
                    </span>
                </div>
                <div className="meeting-times">
                    {meetingTimes(course.meetings).map((meeting, index) => (
                        <div key={index}>
                            {meeting.days || "-"}
                            <br />
                            {meeting.time || "Time TBA"}
                        </div>
                    ))}
                </div>
            </div>
            <h3 className="course-title">
                {course.title || "Untitled course"}
            </h3>
            <p className="muted text-xs mt-1">
                {course.mode || "Format unavailable"}
            </p>
            <div className="facts">
                {details.map((meeting, index) => (
                    <div key={index}>
                        <span className="muted">Room: </span>
                        {meeting.room || "TBA"}
                        {details.length > 1 && (
                            <span className="muted">
                                {" "}
                                · {meeting.days} {meeting.time}
                            </span>
                        )}
                        {course.instructor === "Multiple instructors" && (
                            <span> · {meeting.instructor || "Unassigned"}</span>
                        )}
                    </div>
                ))}
                <div>
                    <span className="muted">Seats: </span>
                    <strong className={full ? "full" : ""}>
                        {course.enrolled ?? "—"}/{course.limit ?? "—"}
                        {full ? " · Full" : ""}
                    </strong>
                </div>
            </div>
            <CourseInstructorStats course={course} />
        </article>
    );
}
