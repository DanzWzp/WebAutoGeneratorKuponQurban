import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";

// Landing: arahkan ke dashboard jika sudah login, atau ke login jika belum.
export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }
  redirect("/login");
}
