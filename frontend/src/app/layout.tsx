import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import { Analytics } from "@vercel/analytics/next"

const roboto = Roboto({
	subsets: ["latin"],
	weight: ["100", "300", "400", "500", "700"],
});

export const metadata: Metadata = {
	title: "QC Schedules | Complete Queens College Course Listings",
	description:
		"Browse the latest Queens College course offerings, including sections, instructors, and meeting times.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className={`${roboto.className} antialiased`} suppressHydrationWarning>
            <head>
				<script
					id="theme-checker"
					dangerouslySetInnerHTML={{
						__html: `
							(function() {
								try {
									const theme = localStorage.getItem('theme');
									if (theme === 'dark') {
										document.documentElement.classList.add('dark');
									}
								} catch (e) {}
							})();
						`,
					}}
				/>
			</head>
			<body className="overflow-x-auto min-w-100 px-4 dark:bg-[#121212] dark:text-gray-100">
				<Analytics/>
                <div className="max-w-255 w-full mx-auto">
                    <Navigation/>
                    {children}
					<Footer/>
                </div>
            </body>
		</html>
	);
}
