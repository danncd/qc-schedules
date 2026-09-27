export function statisticTone(
    kind: "gpa" | "passing" | "withdrawal",
    value: number | null,
) {
    if (value === null) return "";
    if (kind === "withdrawal") {
        return value > 50
            ? "tone-red"
            : value > 30
              ? "tone-orange"
              : value > 15
                ? "tone-yellow"
                : "tone-green";
    }
    const limits = kind === "gpa" ? [3.7, 3, 2, 1] : [90, 75, 60, 40];
    return value >= limits[0]
        ? "tone-green"
        : value >= limits[1]
          ? "tone-lime"
          : value >= limits[2]
            ? "tone-yellow"
            : value >= limits[3]
              ? "tone-orange"
              : "tone-red";
}

export function gradeColor(grade: string) {
    const colors: Record<string, string> = {
        "A+": "#15803d",
        A: "#22c55e",
        "A-": "#86efac",
        "B+": "#2563eb",
        B: "#3b82f6",
        "B-": "#93c5fd",
        "C+": "#f59e0b",
        C: "#fbbf24",
        "C-": "#fde68a",
        "D+": "#fca5a5",
        D: "#f87171",
        F: "#dc2626",
        W: "#9ca3af",
        P: "#a78bfa",
        INC: "#cbd5e1",
    };
    return colors[grade] || "#737373";
}
