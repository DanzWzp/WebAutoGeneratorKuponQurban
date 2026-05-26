import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase client untuk Server Components, Route Handlers, dan Server Actions.
 * Menggunakan cookie store dari next/headers agar session (httpOnly) terbaca.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // `setAll` dipanggil dari Server Component — bisa diabaikan jika
            // ada middleware yang me-refresh session user.
          }
        },
      },
    }
  );
}

/**
 * Ambil user yang sedang login dari session Supabase (server-side).
 * Mengembalikan null jika belum login.
 */
export async function getCurrentUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
