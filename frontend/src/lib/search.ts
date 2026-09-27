export function matchesSearch(text: string, query: string) {
    const normalize = (value: string) =>
        value
            .normalize("NFKD")
            .replace(/\p{M}/gu, "")
            .toLowerCase()
            .replace(/[^\p{L}\p{N}]+/gu, " ")
            .trim();
    const haystack = normalize(text);
    return normalize(query)
        .split(/\s+/)
        .every((word) => haystack.includes(word));
}
