export type Term = { id: string; label: string; year: number; order: number };
const seasons = ["winter", "spring", "summer_1", "summer_2", "fall"];
export function termFromTable(id: string): Term | null {
    const match = /^(winter|spring|summer_[12]|fall)_(20\d{2})$/.exec(id);
    if (!match) return null;
    return {
        id,
        year: Number(match[2]),
        order: seasons.indexOf(match[1]),
        label: `${match[1].replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase())} ${match[2]}`,
    };
}
export function defaultTerm(terms: Term[], now = new Date()) {
    const month = now.getUTCMonth();
    const season =
        month === 0 ? 0 : month < 5 ? 1 : month < 6 ? 2 : month < 7 ? 3 : 4;
    const target = now.getUTCFullYear() * 10 + season;
    return (
        [...terms].sort(
            (a, b) =>
                Math.abs(a.year * 10 + a.order - target) -
                    Math.abs(b.year * 10 + b.order - target) ||
                b.year - a.year ||
                b.order - a.order,
        )[0]?.id || ""
    );
}
export function historyTerm(value: string) {
    const match =
        /^(spring|summer|winter|fall|sp|su|win|fa|s|f|w|u)[ _-]*(20\d{2}|\d{2})$/i.exec(
            value,
        );
    if (!match) return { label: value, rank: 0 };
    const prefix = match[1].toLowerCase();
    const season =
        prefix.startsWith("su") || prefix === "u"
            ? "Summer"
            : prefix.startsWith("f")
              ? "Fall"
              : prefix.startsWith("w")
                ? "Winter"
                : "Spring";
    const year = Number(match[2]) + (match[2].length === 2 ? 2000 : 0);
    return {
        label: `${season} ${year}`,
        rank:
            year * 10 + ["Winter", "Spring", "Summer", "Fall"].indexOf(season),
    };
}
