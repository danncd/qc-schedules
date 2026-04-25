'use client';

import { manrope } from "@/lib/fonts";
import Link from "next/link";
import Button from "../ui/Button";
import { useEffect, useState } from "react";
import { IconMoonFilled, IconSunHighFilled } from "@tabler/icons-react";

export default function Navigation() {
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
        <header className="h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Link href="/">
                    <span className={`${manrope.className} font-extrabold text-[24px]`}>QC Schedules</span>
                </Link>
                <span className="text-gray-500 dark:text-gray-300 text-sm pt-1 hidden md:block">
                    <span className="underline underline-offset-3">Unofficial</span>
                    {" "}
                    <span>Course Listings & Professor Data</span>
                </span>
            </div>
            <div className="flex flex-row items-center gap-1">
                <nav
					className="flex flex-row gap-2"
					aria-label="Main navigation"
				>
					<Link href="/">
						<Button variant="Ghost" className="font-medium">Home</Button>
					</Link>
				</nav>
                <div
					className="h-5 w-0.5 bg-gray-400 mx-2"
					aria-hidden="true"
				/>
                <Button
					onClick={() => setDarkMode(!darkMode)}
					className="p-1.5!"
					variant="Ghost"
					aria-label={
						darkMode
							? "Switch to light mode"
							: "Switch to dark mode"
					}
				>
					{darkMode ? (
						<IconMoonFilled size={24} />
					) : (
						<IconSunHighFilled size={24} />
					)}
				</Button>
            </div>
        </header>
    );
}