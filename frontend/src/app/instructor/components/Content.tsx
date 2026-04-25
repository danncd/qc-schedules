"use client";

import { useEffect, useMemo, useState } from "react";
import SearchBar from "./Searchbar";
import { manrope } from "@/lib/fonts";
import { IconExternalLink } from "@tabler/icons-react";
import Link from "next/link";

type Instructor = {
	instructor: string;
	subjects: string[];
};

type Props = {
	instructorData: Instructor[];
};

export default function InstructorContent({ instructorData }: Props) {
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

		if (!q) return [];

		return instructorData.filter((i) =>
			i.instructor.toLowerCase().includes(q),
		);
	}, [debouncedQuery, instructorData]);

	return (
		<div>
			<header className="flex flex-col gap-2 ">
				<h1 className={`${manrope.className} font-bold text-xl`}>
					Instructor Lookup
				</h1>
				<SearchBar
					value={searchQuery}
					onChange={(val) => setSearchQuery(val)}
				/>
			</header>
			<h2 className={`${manrope.className} mt-6 text-lg font-bold`}>
				Found {filtered.length} result
				{(filtered.length > 1 || filtered.length == 0) && "s"}.
			</h2>
			<div className="flex flex-col mt-4 gap-4">
				{filtered.map((inst) => (
					<Link key={inst.instructor} href={`instructor/${inst.instructor.replaceAll(", ", "-").replaceAll(" ", "+")}`}>
						<div
							className={`${manrope.className} cursor-pointer border border-gray-400 dark:bg-[#212121] p-3 rounded-lg shadow-md hover:scale-101 transition-scale duration-200`}
						>
							<div className="flex flex-row items-center gap-3 justify-between">
								<span className="text-sm font-bold">
									{inst.instructor}
								</span>
								<div className="text-gray-900 dark:text-gray-100 flex flex-row gap-2 items-center cursor-pointer w-fit text-sm hover:underline">
									<IconExternalLink size={18} />
									<span>Visit Instructor&apos;s Page</span>
								</div>
							</div>
							<span className="text-xs text-gray-500 dark:text-gray-300 font-extrabold">
								{inst.subjects.join(", ")}
							</span>
						</div>
					</Link>
				))}
			</div>
		</div>
	);
}
