export const revalidate = 14400;

import Button from "@/components/ui/Button";
import { manrope } from "@/lib/fonts";
import { IconMoodSmileBeam, IconArrowRight } from "@tabler/icons-react";
import Link from "next/link";

export default function Home() {
    return (
        <main className="mb-16 relative min-h-[calc(100vh-8rem)] flex items-center justify-center overflow-hidden">
            <div
                className="absolute -z-10 inset-0 mx-auto max-w-5xl w-full opacity-50"
                style={{
                    backgroundImage: `radial-gradient(#c0c0c0 1px, transparent 2px)`,
                    backgroundSize: '15px 15px',
                    WebkitMaskImage: `linear-gradient(to bottom, transparent, black 60%, black 25%, transparent), 
                                      linear-gradient(to right, transparent, black 60%, black 25%, transparent)`,
                    maskImage: `linear-gradient(to bottom, transparent, black 60%, black 25%, transparent), 
                                linear-gradient(to right, transparent, black 60%, black 25%, transparent)`,
                    WebkitMaskComposite: "source-in",
                    maskComposite: "intersect",
                }}
                aria-hidden="true"
            />
            <section className="text-center p-4 max-w-4xl w-full flex flex-col gap-8 items-center justify-center">
                <h1 className={`${manrope.className} font-bold text-3xl md:text-4xl max-w-2xl leading-tight flex flex-wrap gap-2 items-end justify-center text-center`}>
                    Browse through{" "}
                    <span className="whitespace-nowrap underline underline-offset-6 decoration-4 text-red-600 dark:text-red-700">
                        Queens College
                    </span>{" "}
                    <span className="underline underline-offset-6 decoration-4 text-purple-800 dark:text-yellow-500">
                        Database
                    </span>{" "}
                    <IconMoodSmileBeam  size={35} aria-hidden="true" strokeWidth={2}/>
                </h1>

                <p className="max-w-md text-lg">
                    Find information about current and upcoming course schedules, as well as instructors' details.
                </p>

                <div className="flex flex-row items-center justify-center gap-4">
                    <Link href="/schedule" passHref replace>
                        <Button className="py-2 flex items-center gap-2">
                            <IconArrowRight size={16} aria-hidden="true" />
                            View Schedules
                        </Button>
                    </Link>
                    <Link href="/instructor" passHref>
                        <Button className="py-2 flex items-center gap-2">
                            <IconArrowRight size={16} aria-hidden="true" />
                            Search Instructors
                        </Button>
                    </Link>
                </div>
            </section>
        </main>
    );
}