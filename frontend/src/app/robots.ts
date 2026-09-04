import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
	return {
		rules: {
			userAgent: "*",
			allow: "/",
		},
		sitemap: "https://qcs.danncd.com/sitemap.xml",
		host: "https://qcs.danncd.com",
	};
}
