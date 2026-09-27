import Link from "next/link";
import type { Metadata } from "next";
export const metadata: Metadata = { alternates: { canonical: "/" } };
export default function Home() {
    return (
        <section className="home-intro">
            <h1>Explore Queens College courses.</h1>
            <p>
                Find current schedules, instructor history, and grade
                distributions in one place.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
                <Link
                    className="button"
                    href="/schedule"
                >
                    View Schedules →
                </Link>
                <Link
                    className="button"
                    href="/instructor"
                >
                    Search Instructors →
                </Link>
            </div>
        </section>
    );
}
