import Link from "next/link";
export default function NotFound() {
    return (
        <section className="empty-state">
            <h1 className="page-title">Page not found</h1>
            <p className="muted mb-4">
                This address could not be matched to a page.
            </p>
            <Link
                className="button"
                href="/schedule"
            >
                Browse courses
            </Link>
        </section>
    );
}
