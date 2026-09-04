'use client';

import Searchbar from "@/_components/ui/Searchbar";
import { manrope } from "@/_lib/fonts";
import { InstructorListing } from "@/_lib/types";
import { IconExternalLink } from "@tabler/icons-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Props = {
    instructorData: InstructorListing[];
};

export default function InstructorClient({ instructorData }: Props) {
    const [searchQuery, setSearchQuery] = useState("");
	const [debouncedQuery, setDebouncedQuery] = useState("");

    useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedQuery(searchQuery);
		}, 300);
		return () => clearTimeout(timer);
	}, [searchQuery]);

	const filtered = useMemo(() => {
		const q = debouncedQuery.toLowerCase().trim();

		if (!/[a-z0-9]{2,}/i.test(q)) return [];

		return instructorData.filter(
			(i) =>
				i.instructor.toLowerCase().includes(q) ||
				i.rawName.toLowerCase().includes(q) ||
				i.slug.includes(q),
		);
	}, [debouncedQuery, instructorData]);

    return (
        <>
            <header>
                <Searchbar 
                    instructorSearchbar
                    value={searchQuery}
                    onChange={(val) => setSearchQuery(val)}
                />
            </header>
            <h2 className={`${manrope.className} mt-6 text-xs font-semibold text-neutral-700 dark:text-neutral-300`}>
				Found {filtered.length} result
				{(filtered.length > 1 || filtered.length == 0) && "s"}.
			</h2>
            <div className="flex flex-col mt-3 gap-3">
				{filtered.map((inst) => (
					<Link
						key={inst.slug}
						href={`/instructor/${inst.slug}`}
					>
						<div
							className={`${manrope.className} group cursor-pointer rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white/80 dark:bg-[#181818]/80 hover:bg-neutral-50/80 dark:hover:bg-neutral-800/50 backdrop-blur-xs p-4 shadow-2xs hover:border-neutral-300 dark:hover:border-neutral-700`}
						>
							<div className="flex flex-row items-center gap-3 justify-between">
								<span className="text-sm font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
									{inst.instructor}
								</span>
								<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-neutral-800 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-700/60 group-hover:border-neutral-300 dark:group-hover:border-neutral-600 group-hover:bg-neutral-200/70 dark:group-hover:bg-neutral-700 dark:group-hover:text-white shrink-0">
									<IconExternalLink size={14} />
									<span>Visit Page</span>
								</div>
							</div>
							<div className="flex flex-wrap gap-1.5 mt-2.5">
								{inst.subjects.map((sub) => (
									<span
										key={sub}
										className="px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[11px] font-medium text-neutral-700 dark:text-neutral-300 border border-neutral-200/60 dark:border-neutral-700/60"
									>
										{sub}
									</span>
								))}
							</div>
						</div>
					</Link>
				))}
			</div>
        </>
    );
}