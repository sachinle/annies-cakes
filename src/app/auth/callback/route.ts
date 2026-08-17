import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server-auth";

// Handles the redirect back from Supabase after email confirmation,
// a password-reset link, or Google OAuth. Exchanges the one-time code
// for a session cookie.

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/account";

  // Never redirect off-site based on a query parameter.
  const destination = next.startsWith("/") && !next.startsWith("//") ? next : "/account";

  if (!code) {
    return NextResponse.redirect(`${origin}/signin?error=link_invalid`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/signin?error=link_expired`);
  }

  return NextResponse.redirect(`${origin}${destination}`);
}
