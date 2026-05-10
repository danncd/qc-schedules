export const revalidate = 14400;

import Link from "next/link";
import { IconMoodSmileBeam, IconArrowRight } from "@tabler/icons-react";
import { manrope } from "@/_lib/fonts";
import Button from "@/_components/ui/Button";


const BACKGROUND_PATTERN = {
    backgroundImage: `radial-gradient(#c0c0c0 1px, transparent 2px)`,
    backgroundSize: '15px 15px',
    WebkitMaskImage: `linear-gradient(to bottom, transparent, black 60%, black 25%, transparent), 
                      linear-gradient(to right, transparent, black 60%, black 25%, transparent)`,
    maskImage: `linear-gradient(to bottom, transparent, black 60%, black 25%, transparent), 
                linear-gradient(to right, transparent, black 60%, black 25%, transparent)`,
    WebkitMaskComposite: "source-in",
    maskComposite: "intersect",
} as const;

export default function Home() {
    return (
        <main className="relative mb-16 flex min-h-[calc(100vh-8rem)] items-center justify-center overflow-hidden">

            <div
                className="absolute inset-0 -z-10 mx-auto w-full max-w-5xl opacity-50"
                style={BACKGROUND_PATTERN}
                aria-hidden="true"
            />

            <section className="flex w-full max-w-4xl flex-col items-center justify-center gap-8 p-4 text-center">
                <h1 className={`${manrope.className} flex w-full max-w-2xl flex-wrap items-end justify-center gap-2 text-center text-3xl font-bold leading-tight md:text-4xl`}>
                    Browse through{" "}
                    <span className="whitespace-nowrap text-red-600 underline decoration-4 underline-offset-6 dark:text-red-700">
                        Queens College
                    </span>{" "}
                    <span className="text-purple-800 underline decoration-4 underline-offset-6 dark:text-yellow-500">
                        Database
                    </span>{" "}
                    <IconMoodSmileBeam size={35} aria-hidden="true" strokeWidth={2} />
                </h1>

                <p className="max-w-md text-lg">
                    Find information about current and upcoming course schedules, as well as instructors' details.
                </p>

                <div className="flex flex-row items-center justify-center gap-4">
                    <Link href="/schedule" replace>
                        <Button className="flex items-center gap-2 py-2">
                            <IconArrowRight size={16} aria-hidden="true" />
                            View Schedules
                        </Button>
                    </Link>
                    <Link href="/instructor">
                        <Button className="flex items-center gap-2 py-2">
                            <IconArrowRight size={16} aria-hidden="true" />
                            Search Instructors
                        </Button>
                    </Link>
                </div>
            </section>
        </main>
    );
}