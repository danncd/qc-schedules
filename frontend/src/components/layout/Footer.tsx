import { manrope } from "@/lib/fonts";

export default function Footer() {

    const currentYear = new Date().getFullYear();

    return (
        <footer className={`${manrope.className} pointer-events-none flex items-center justify-center w-full h-16`}>© {currentYear} danncd.</footer>
    )
}