import "server-only";
import { createRemoteJWKSet, jwtVerify } from "jose";

// Verifies a Firebase ID token and confirms it belongs to one of the
// business owner accounts.
//
// Verification is done against Google's published public keys rather
// than via firebase-admin, so no service-account credentials need to
// exist on this server at all. Fewer secrets to store is fewer secrets
// to leak.
//
// This is the authorisation gate for every admin endpoint. It must fail
// closed: any missing config, malformed token, wrong issuer/audience,
// expired token, or unrecognised UID results in rejection.

const FIREBASE_JWKS_URL =
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

// Cached across invocations — the key set is fetched once and refreshed
// by jose on its own schedule, not on every request.
const jwks = createRemoteJWKSet(new URL(FIREBASE_JWKS_URL));

export type OwnerIdentity = { uid: string; email?: string };

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

function ownerUids(): string[] {
  return (process.env.OWNER_FIREBASE_UIDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Verify the `Authorization: Bearer <firebase-id-token>` header.
 * Throws AuthError on any failure; returns the owner identity on success.
 */
export async function requireOwner(request: Request): Promise<OwnerIdentity> {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const allowed = ownerUids();

  // Fail closed on misconfiguration rather than silently allowing access.
  if (!projectId || allowed.length === 0) {
    throw new AuthError("Admin API is not configured.", 500);
  }

  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) throw new AuthError("Missing sign-in token.");

  let uid: string;
  let email: string | undefined;

  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
      algorithms: ["RS256"], // Firebase ID tokens are always RS256
    });

    uid = String(payload.sub ?? "");
    email = typeof payload.email === "string" ? payload.email : undefined;
  } catch {
    // Deliberately generic: don't tell an attacker which check failed.
    throw new AuthError("Your sign-in has expired. Please sign in again.");
  }

  if (!uid || !allowed.includes(uid)) {
    throw new AuthError("This account is not allowed to manage products.", 403);
  }

  return { uid, email };
}
