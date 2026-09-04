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
                className="absolute inset-0 -z-10 mx-auto w-full max-w-5xl opacity-50 -translate-y-6 md:-translate-y-10"
                style={BACKGROUND_PATTERN}
                aria-hidden="true"
            />

            <section className="flex w-full max-w-3xl flex-col items-center justify-center gap-7 p-4 text-center -translate-y-6 md:-translate-y-10">
                <h1 className={`${manrope.className} flex w-full max-w-2xl flex-wrap items-center justify-center gap-2 text-center text-3xl font-bold tracking-tight leading-snug md:text-4xl text-neutral-900 dark:text-neutral-100`}>
                    Browse through{" "}
                    <span className="whitespace-nowrap text-red-600 font-extrabold underline decoration-2 decoration-red-400/60 underline-offset-6 dark:text-red-500">
                        Queens College
                    </span>{" "}
                    <span className="text-purple-700 dark:text-yellow-400 font-extrabold underline decoration-2 decoration-purple-400/60 dark:decoration-yellow-400/60 underline-offset-6">
                        Database
                    </span>{" "}
                    <IconMoodSmileBeam size={36} aria-hidden="true" strokeWidth={1.75} className="inline text-neutral-700 dark:text-neutral-300" />
                </h1>

                <p className="max-w-md text-base text-neutral-700 dark:text-neutral-300 leading-relaxed font-normal">
                    Find information about current and upcoming course schedules, as well as instructors&apos; details and grade distributions.
                </p>

                <div className="flex flex-row items-center justify-center gap-3.5 pt-2">
                    <Link href="/schedule" replace>
                        <Button className={`flex items-center gap-2 px-5 py-2 text-sm font-semibold shadow-xs ${manrope.className}`}>
                            <IconArrowRight size={16} aria-hidden="true" />
                            View Schedules
                        </Button>
                    </Link>
                    <Link href="/instructor">
                        <Button className={`flex items-center gap-2 px-5 py-2 text-sm font-semibold shadow-xs ${manrope.className}`}>
                            <IconArrowRight size={16} aria-hidden="true" />
                            Search Instructors
                        </Button>
                    </Link>
                </div>
            </section>
        </main>
    );
}