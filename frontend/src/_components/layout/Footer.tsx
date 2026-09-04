import { manrope } from "@/_lib/fonts";

export default function Footer() {

    const currentYear = new Date().getFullYear();

    return (
        <footer className={`${manrope.className} pointer-events-none flex items-center justify-center w-full h-16 text-xs text-neutral-700 dark:text-neutral-400`}>© {currentYear} danncd.</footer>
    )
}