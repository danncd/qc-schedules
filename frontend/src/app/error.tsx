"use client";
import Button from "@/components/ui/Button";
export default function ErrorPage({ reset }: { reset: () => void }) {
    return (
        <section className="empty-state">
            <h1 className="page-title">Data temporarily unavailable</h1>
            <p className="muted mb-4">
                We couldn’t load this page. Please try again.
            </p>
            <Button onClick={reset}>Try again</Button>
        </section>
    );
}
