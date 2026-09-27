import type { MetadataRoute } from "next";
import { getInstructors } from "@/features/instructors/data/queries";
export const revalidate = 86400;
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const people = await getInstructors();
    return [
        "",
        "/schedule",
        "/instructor",
        ...people.map((person) => `/instructor/${person.slug}`),
    ].map((path) => ({ url: `https://qcs.danncd.com${path}` }));
}
