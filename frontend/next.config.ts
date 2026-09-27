import type { NextConfig } from "next";
import { PAGE_CACHE_SECONDS } from "./src/lib/cache";

const config: NextConfig = {
    devIndicators: false,
    agentRules: false,
    experimental: {
        staleTimes: {
            dynamic: PAGE_CACHE_SECONDS,
            static: PAGE_CACHE_SECONDS,
        },
    },
};

export default config;
