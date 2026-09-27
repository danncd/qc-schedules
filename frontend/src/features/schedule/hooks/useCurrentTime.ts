"use client";
import { useEffect, useState } from "react";

export function useCurrentTime() {
    const [now, setNow] = useState(Date.now);
    useEffect(() => {
        const update = () => setNow(Date.now());
        const onVisibility = () => {
            if (document.visibilityState === "visible") update();
        };
        const timer = window.setInterval(update, 60000);
        document.addEventListener("visibilitychange", onVisibility);
        return () => {
            window.clearInterval(timer);
            document.removeEventListener("visibilitychange", onVisibility);
        };
    }, []);
    return now;
}
