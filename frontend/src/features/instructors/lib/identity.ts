import type { Instructor } from "../types";
export function nameKey(name: string) {
    const [last, rest] = name.trim().toUpperCase().split(",");
    return rest?.trim() ? `${last.trim()}, ${rest.trim()[0]}` : last;
}
export function matchesInstructorName(historical: string, current: string) {
    if (nameKey(historical) !== nameKey(current)) return false;
    const given = (name: string) =>
        (name.split(",")[1] || "").toUpperCase().replace(/[^\p{L}\p{N}]/gu, "");
    const historicalGiven = given(historical);
    return historicalGiven.length === 1 || historicalGiven === given(current);
}
export function legacySlug(name: string) {
    return nameKey(name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}
export function displayName(name: string) {
    return name.toLowerCase().replace(/\b[a-z]/g, (char) => char.toUpperCase());
}
export function buildDirectory(
    records: { name: string; subject: string }[],
): Instructor[] {
    const entries = new Map<string, Set<string>>();
    for (const record of records) {
        if (!record.name || !/[a-z]/i.test(record.name)) continue;
        if (!entries.has(record.name)) entries.set(record.name, new Set());
        if (record.subject) entries.get(record.name)!.add(record.subject);
    }
    const collisions = new Map<string, number>();
    for (const name of entries.keys())
        collisions.set(
            legacySlug(name),
            (collisions.get(legacySlug(name)) || 0) + 1,
        );
    return [...entries]
        .map(([rawName, subjects]) => {
            const base = legacySlug(rawName);
            const ambiguous = collisions.get(base)! > 1 || !base;
            const suffix = Array.from(rawName)
                .map((c) => c.codePointAt(0)!.toString(16))
                .join("-");
            return {
                rawName,
                name: displayName(rawName),
                subjects: [...subjects].sort(),
                slug: ambiguous ? `${base || "instructor"}--${suffix}` : base,
                ambiguous,
            };
        })
        .sort((a, b) => a.name.localeCompare(b.name));
}
export function resolveInstructor(instructors: Instructor[], id: string) {
    const exact = instructors.find(
        (person) =>
            person.slug === id ||
            person.rawName.toLowerCase() === id.toLowerCase(),
    );
    if (exact) return exact;
    const matches = instructors.filter(
        (person) => legacySlug(person.rawName) === id,
    );
    return matches.length === 1 ? matches[0] : null;
}

export function resolveDisplayNames(
    instructors: Instructor[],
    schedules: { name: string; subject: string }[],
): Instructor[] {
    const candidates = new Map<string, Map<string, Set<string>>>();
    for (const row of schedules) {
        if (!row.name.includes(",")) continue;
        const key = nameKey(row.name);
        if (!candidates.has(key)) candidates.set(key, new Map());
        const names = candidates.get(key)!;
        if (!names.has(row.name)) names.set(row.name, new Set());
        names.get(row.name)!.add(row.subject);
    }
    return instructors
        .map((person) => {
            const names = [
                ...(candidates.get(nameKey(person.rawName)) ||
                    new Map<string, Set<string>>()),
            ];
            const matches = names.filter(
                ([name, subjects]) =>
                    matchesInstructorName(person.rawName, name) &&
                    person.subjects.some((subject) => subjects.has(subject)),
            );
            return {
                ...person,
                name: matches.length === 1 ? matches[0][0] : person.name,
                ambiguous: person.ambiguous || matches.length > 1,
            };
        })
        .sort((a, b) => a.name.localeCompare(b.name));
}
