"use client";
import { usePathname, useSearchParams } from "next/navigation";
export function useLocalQuery() {
    const params = useSearchParams();
    const path = usePathname();
    function update(
        values: Record<string, string | null>,
        mode: "replace" | "push" = "replace",
    ) {
        const next = new URLSearchParams(params.toString());
        for (const [key, value] of Object.entries(values)) {
            if (value) next.set(key, value);
            else next.delete(key);
        }
        window.history[mode === "push" ? "pushState" : "replaceState"](
            null,
            "",
            `${path}${next.size ? `?${next}` : ""}`,
        );
    }
    return { params, update };
}
