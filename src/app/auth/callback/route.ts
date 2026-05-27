import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Tujuan link konfirmasi email Supabase.
 * Mendukung dua alur:
 *  - PKCE: parameter `code` -> exchangeCodeForSession
 *  - OTP : parameter `token_hash` + `type` -> verifyOtp
 * Setelah session aktif, arahkan ke `next` (default /dashboard).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") || "/dashboard";

  const supabase = createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Gagal verifikasi -> kembali ke login dengan pesan.
  return NextResponse.redirect(
    `${origin}/login?error=Konfirmasi%20email%20gagal%20atau%20link%20kedaluwarsa`
  );
}
