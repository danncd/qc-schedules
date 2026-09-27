"use client";
import { IconMoon, IconSun } from "@tabler/icons-react";
export default function ThemeToggle() {
    return (
        <button
            className="theme-toggle"
            aria-label="Toggle light or dark theme"
            onClick={() => {
                const dark = document.documentElement.classList.toggle("dark");
                try {
                    localStorage.setItem("theme", dark ? "dark" : "light");
                } catch {}
            }}
        >
            <IconMoon
                className="moon"
                size={19}
                stroke={1.6}
            />
            <IconSun
                className="sun"
                size={19}
                stroke={1.6}
            />
        </button>
    );
}
