import Link from "next/link";
import type { Instructor } from "../types";
export default function InstructorCard({ person }: { person: Instructor }) {
    return (
        <Link
            className="card instructor-card"
            href={`/instructor/${person.slug}`}
        >
            <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold text-sm">{person.name}</h2>
                <span className="small-button">Visit Page ↗</span>
            </div>
            <div className="flex gap-1.5 flex-wrap mt-3">
                {person.subjects.map((subject) => (
                    <span
                        className="badge"
                        key={subject}
                    >
                        {subject}
                    </span>
                ))}
            </div>
        </Link>
    );
}
