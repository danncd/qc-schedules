import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const getSupabaseCredentials = () => {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
	const key =
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
		process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
		"";
	return { url, key };
};

export async function createClient() {
	const cookieStore = await cookies();
	const { url, key } = getSupabaseCredentials();

	return createServerClient(
		url,
		key,
		{
			cookies: {
				getAll() {
					return cookieStore.getAll();
				},
				setAll(cookiesToSet) {
					try {
						cookiesToSet.forEach(({ name, value, options }) =>
							cookieStore.set(name, value, options),
						);
					} catch {}
				},
			},
		},
	);
}

export const createPublicClient = () => {
	const { url, key } = getSupabaseCredentials();
	return createSupabaseClient(url, key);
};