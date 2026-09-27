"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DATA_REFRESH_SECONDS } from "@/lib/data-refresh";

export default function DataRefresh() {
    const router = useRouter();
    useEffect(() => {
        let refreshed = Date.now();
        const interval = DATA_REFRESH_SECONDS * 1000;
        function refresh() {
            if (
                document.visibilityState !== "visible" ||
                Date.now() - refreshed < interval
            )
                return;
            refreshed = Date.now();
            router.refresh();
        }
        const timer = window.setInterval(refresh, interval);
        document.addEventListener("visibilitychange", refresh);
        return () => {
            window.clearInterval(timer);
            document.removeEventListener("visibilitychange", refresh);
        };
    }, [router]);
    return null;
}
