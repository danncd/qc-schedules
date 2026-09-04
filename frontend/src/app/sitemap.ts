import type { MetadataRoute } from "next";
import { getInstructorNames } from "@/_utils/server";

export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const baseUrl = "https://qcs.danncd.com";
	const now = new Date();

	const staticRoutes: MetadataRoute.Sitemap = [
		{
			url: baseUrl,
			lastModified: now,
			changeFrequency: "daily",
			priority: 1.0,
		},
		{
			url: `${baseUrl}/schedule`,
			lastModified: now,
			changeFrequency: "daily",
			priority: 0.9,
		},
		{
			url: `${baseUrl}/instructor`,
			lastModified: now,
			changeFrequency: "daily",
			priority: 0.9,
		},
	];

	try {
		const instructors = await getInstructorNames();
		const instructorRoutes: MetadataRoute.Sitemap = instructors.map((inst) => ({
			url: `${baseUrl}/instructor/${inst.slug}`,
			lastModified: now,
			changeFrequency: "weekly",
			priority: 0.8,
		}));

		return [...staticRoutes, ...instructorRoutes];
	} catch (error) {
		console.error("Error generating dynamic sitemap:", error);
		return staticRoutes;
	}
}
