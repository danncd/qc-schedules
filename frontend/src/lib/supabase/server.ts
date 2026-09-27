import "server-only";
import { createClient } from "@supabase/supabase-js";
import { DATA_REVALIDATE_SECONDS } from "@/lib/cache";

export type DatabaseRow = Record<string, unknown>;

export function database() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key =
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key)
        throw new Error("Supabase public credentials are not configured.");
    return createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: {
            fetch: (input, init) =>
                fetch(input, {
                    ...init,
                    next: { revalidate: DATA_REVALIDATE_SECONDS },
                    signal: init?.signal
                        ? AbortSignal.any([
                              init.signal,
                              AbortSignal.timeout(15000),
                          ])
                        : AbortSignal.timeout(15000),
                }),
        },
    });
}

export async function readRows(
    table: string,
    columns: string,
    order: string[],
    filter?: [string, string],
) {
    const client = database();
    const rows: DatabaseRow[] = [];
    const signal = AbortSignal.timeout(30000);
    for (let offset = 0; ; offset += 1000) {
        let query = client
            .from(table)
            .select(columns)
            .range(offset, offset + 999)
            .abortSignal(signal);
        for (const column of order)
            query = query.order(column, { ascending: true });
        if (filter) query = query.eq(filter[0], filter[1]);
        const { data, error } = await query;
        if (error) throw new Error(`Unable to load ${table}.`);
        rows.push(...(data as unknown as DatabaseRow[]));
        if (data.length < 1000) return rows;
    }
}
