import type { Metadata, Viewport } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import Header from "@/_components/layout/Header";
import { Analytics } from "@vercel/analytics/next";
import Footer from "@/_components/layout/Footer";

const roboto = Roboto({
	subsets: ["latin"],
	weight: ["100", "300", "400", "500", "700"],
});

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
};

const SITE_URL = "https://qcs.danncd.com";

export const metadata: Metadata = {
	metadataBase: new URL(SITE_URL),
	title: {
		default: "QC Schedules | Queens College Course Schedules & Professor Grades",
		template: "%s | QC Schedules",
	},
	description:
		"The fastest course schedule search and professor grade distribution tool for Queens College (CUNY) students. Search courses, sections, and check instructor GPAs.",
	keywords: [
		"Queens College",
		"QC Schedules",
		"Queens College course schedule",
		"CUNY Queens College",
		"Queens College professor grades",
		"QC grade distribution",
		"Queens College class lookup",
		"CUNYFirst alternative",
		"Queens College GPA",
	],
	authors: [{ name: "QC Schedules" }],
	creator: "QC Schedules",
	publisher: "QC Schedules",
	alternates: {
		canonical: "/",
	},
	openGraph: {
		title: "QC Schedules | Queens College Course Schedules & Professor Grades",
		description:
			"Search Queens College course offerings, sections, instructors, and real historical grade distributions.",
		url: SITE_URL,
		siteName: "QC Schedules",
		locale: "en_US",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: "QC Schedules | Queens College Course Schedules & Professor Grades",
		description:
			"Search Queens College course offerings, sections, instructors, and real historical grade distributions.",
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-video-preview": -1,
			"max-image-preview": "large",
			"max-snippet": -1,
		},
	},
	icons: {
		icon: "/favicon.ico",
		apple: "/apple-touch-icon.png",
	},
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
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{
						__html: JSON.stringify({
							"@context": "https://schema.org",
							"@type": "WebSite",
							name: "QC Schedules",
							url: SITE_URL,
							potentialAction: {
								"@type": "SearchAction",
								target: `${SITE_URL}/schedule?search={search_term_string}`,
								"query-input": "required name=search_term_string",
							},
						}),
					}}
				/>
			</head>
			<body className="overflow-x-auto min-w-50 px-4 dark:bg-[#121212] dark:text-gray-100">
                <div className="max-w-255 w-full mx-auto">
                    <Header/>
					{children}
					<Footer/>
					<Analytics />
                </div>
            </body>
		</html>
	);
}
