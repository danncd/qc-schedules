'use client';

import { manrope } from "@/_lib/fonts";
import { IconMoonFilled, IconSunHighFilled } from "@tabler/icons-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import Button from "../ui/Button";

export default function Header() {

    const [darkMode, setDarkMode] = useState(false);

	useEffect(() => {
		const savedTheme = localStorage.getItem("theme");
		if (savedTheme === "dark") setDarkMode(true);
	}, []);

	useEffect(() => {
		const root = document.documentElement;
		if (darkMode) {
			root.classList.add("dark");
			localStorage.setItem("theme", "dark");
		} else {
			root.classList.remove("dark");
			localStorage.setItem("theme", "light");
		}
	}, [darkMode]);
    
    return (
        <header className="h-16 top-0 z-40 flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
                <Link href="/" className="hover:opacity-85">
                    <span className={`${manrope.className} font-extrabold text-[22px] tracking-tight text-neutral-900 dark:text-neutral-100`}>QC Schedules</span>
                </Link>
                <span className="text-neutral-700 dark:text-neutral-400 text-[13px] hidden md:flex items-center gap-1.5 border-l border-neutral-200 dark:border-neutral-800 pl-3">
                    <span className="underline">Unofficial</span>
                    <span>Course Listings & Professor Data</span>
                </span>
            </div>
            <div className="flex flex-row items-center gap-2">
                <nav
					className="flex flex-row gap-1"
					aria-label="Main navigation"
				>
					<Link href="/">
						<Button variant="Ghost" className={`font-extrabold text-[14px] tracking-wide ${manrope.className}`}>Home</Button>
					</Link>
				</nav>
                <button
					type="button"
					onClick={() => setDarkMode(!darkMode)}
					className="w-8.5 h-8.5 flex items-center justify-center rounded-full border border-neutral-200/80 dark:border-neutral-700/80 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 shadow-xs text-neutral-800 dark:text-neutral-200 active:scale-95 cursor-pointer"
					aria-label={
						darkMode
							? "Switch to light mode"
							: "Switch to dark mode"
					}
				>
					{darkMode ? (
						<IconMoonFilled size={17} className="text-neutral-200" />
					) : (
						<IconSunHighFilled size={17} className="text-neutral-800" />
					)}
				</button>
            </div>
        </header>
    );
}