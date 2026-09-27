import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import "@/styles/globals.css";
export const metadata: Metadata = {
    metadataBase: new URL("https://qcs.danncd.com"),
    title: {
        default: "QC Schedules · Queens College",
        template: "%s | QC Schedules",
    },
    description:
        "Queens College course schedules and historical instructor grade distributions.",
    openGraph: { siteName: "QC Schedules", type: "website" },
    icons: { icon: "/favicon.ico", apple: "/apple-touch-icon.png" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <html
            lang="en"
            suppressHydrationWarning
        >
            <head>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `try{const t=localStorage.getItem('theme');document.documentElement.classList.toggle('dark',t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches))}catch{}`,
                    }}
                />
            </head>
            <body>
                <Header />
                <main className="shell main-content">{children}</main>
                <Footer />
                <Analytics />
            </body>
        </html>
    );
}
