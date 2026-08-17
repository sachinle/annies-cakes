import "server-only";

// CORS for the admin endpoints, which are called cross-origin by the
// Leo Billing app (a separate deployment).
//
// Origins come from config — never reflect an arbitrary Origin header
// back, which would let any website call these endpoints with a
// victim's credentials.

function allowedOrigins(): string[] {
  return (process.env.ADMIN_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

export function corsHeaders(request: Request): Record<string, string> {
  const origin = (request.headers.get("origin") ?? "").replace(/\/$/, "");
  if (!origin || !allowedOrigins().includes(origin)) return {};

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export function preflight(request: Request): Response {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}
