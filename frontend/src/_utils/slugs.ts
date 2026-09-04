/**
 * Converts any instructor name format into a clean, URL-safe slug.
 * Examples:
 * - "Kirschner, David" -> "kirschner-d"
 * - "KIRSCHNER, D" -> "kirschner-d"
 * - "Sun, Fang" -> "sun-f"
 * - "SUN, F" -> "sun-f"
 * - "Feeley III, Frank" -> "feeley-iii-f"
 * - "FEELEY III, F" -> "feeley-iii-f"
 * - "Castro-McGowan, Rosemarie" -> "castro-mcgowan-r"
 */
export function toInstructorSlug(name: string): string {
	if (!name || name.trim() === "" || name.trim() === ",") return "";

	const trimmed = name.trim();
	const parts = trimmed.split(",");

	const lastName = parts[0].trim().toLowerCase();
	let initial = "";

	if (parts.length > 1) {
		const firstPart = parts[1].trim().toLowerCase();
		// Get first alphabetic character
		const match = firstPart.match(/[a-z]/);
		if (match) {
			initial = match[0];
		}
	}

	const raw = initial ? `${lastName}-${initial}` : lastName;
	return raw
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

/**
 * Cleanly formats a raw uppercase LAST, INITIAL name for display
 * when no full first name is available in active schedules.
 * Examples:
 * - "KIRSCHNER, D" -> "Kirschner, D."
 * - "FEELEY III, F" -> "Feeley III, F."
 * - "O'BRIEN, P" -> "O'Brien, P."
 */
export function formatFallbackName(rawName: string): string {
	if (!rawName) return "";

	const parts = rawName.split(",");
	const toTitle = (s: string) => {
		return s
			.trim()
			.toLowerCase()
			.replace(/\b([a-z])/g, (c) => c.toUpperCase())
			.replace(/\b(i{2,4}|iv|vi{0,3}|ix)\b/gi, (r) => r.toUpperCase())
			.replace(/\b(jr|sr)\b/gi, (r) => `${r.charAt(0).toUpperCase()}${r.slice(1).toLowerCase()}.`);
	};

	if (parts.length >= 2) {
		const last = toTitle(parts[0]);
		const firstPart = parts[1].trim().toUpperCase();
		const init = firstPart.length === 1 ? `${firstPart}.` : toTitle(firstPart);
		return `${last}, ${init}`;
	}

	return toTitle(rawName);
}
