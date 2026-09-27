"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
export default function Header() {
    const path = usePathname();
    return (
        <header className="site-header">
            <div className="shell header-inner">
                <Link
                    href="/"
                    className="brand"
                >
                    QC Schedules <span>Unofficial Listings</span>
                </Link>
                <nav
                    className="main-nav"
                    aria-label="Main navigation"
                >
                    <Link
                        href="/schedule"
                        aria-current={
                            path.startsWith("/schedule") ? "page" : undefined
                        }
                    >
                        Courses
                    </Link>
                    <Link
                        href="/instructor"
                        aria-current={
                            path.startsWith("/instructor") ? "page" : undefined
                        }
                    >
                        Instructors
                    </Link>
                </nav>
                <ThemeToggle />
            </div>
        </header>
    );
}
