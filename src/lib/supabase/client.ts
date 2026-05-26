import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client untuk komponen browser ("use client").
 * Membaca env public yang aman diekspos ke browser.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
