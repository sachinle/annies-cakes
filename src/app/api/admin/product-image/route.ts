import { getSupabaseAdmin } from "@/lib/supabase/server";
import { AuthError, requireOwner } from "@/lib/auth/verify-owner";
import { corsHeaders, preflight } from "@/lib/cors";
import {
  MAX_UPLOAD_BYTES,
  detectImageType,
  extensionFor,
} from "@/lib/image-validation";

// Admin endpoint: upload / delete a product photo.
//
// Category: ADMIN (owner-only, cross-origin from Leo Billing).
//   auth      — Firebase ID token, verified against Google's public keys
//   authz     — UID must be in OWNER_FIREBASE_UIDS
//   input     — multipart/form-data, single `file` field
//   output    — { url, path } / { ok: true }
//   errors    — generic messages; details go to the server log only
//
// This exists because Supabase Storage currently rejects third-party
// (Firebase) auth tokens with an "invalid algorithm" error, so the
// browser cannot upload directly under the owner's identity. Here the
// server verifies that identity itself and then writes with the service
// role key, which never leaves this process.

const BUCKET = "product-images";

export const runtime = "nodejs";

export async function OPTIONS(request: Request) {
  return preflight(request);
}

export async function POST(request: Request) {
  const cors = corsHeaders(request);

  try {
    await requireOwner(request);

    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return json({ error: "No file received." }, 400, cors);
    }
    if (file.size === 0) {
      return json({ error: "That file is empty." }, 400, cors);
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return json({ error: "That image is too large (5 MB max)." }, 413, cors);
    }

    const bytes = new Uint8Array(await file.arrayBuffer());

    // Trust the bytes, not the declared Content-Type or the filename.
    const detected = detectImageType(bytes);
    if (!detected) {
      return json({ error: "That file is not a JPG, PNG, or WebP image." }, 415, cors);
    }

    // Random server-generated path — the client never influences where
    // the file lands, so a crafted filename cannot traverse or collide.
    const path = `${crypto.randomUUID()}.${extensionFor(detected)}`;

    const { error } = await getSupabaseAdmin()
      .storage.from(BUCKET)
      .upload(path, bytes, {
        contentType: detected,
        cacheControl: "31536000",
        upsert: false,
      });

    if (error) {
      console.error("[product-image] upload failed:", error);
      return json({ error: "Upload failed. Please try again." }, 502, cors);
    }

    const { data } = getSupabaseAdmin().storage.from(BUCKET).getPublicUrl(path);

    return json({ url: data.publicUrl, path }, 200, cors);
  } catch (err) {
    return handleError(err, cors);
  }
}

export async function DELETE(request: Request) {
  const cors = corsHeaders(request);

  try {
    await requireOwner(request);

    const { path } = (await request.json()) as { path?: unknown };

    // Only ever a bare filename produced by POST above. Reject anything
    // with a slash or traversal segment so this can't reach other keys.
    if (typeof path !== "string" || !/^[a-f0-9-]{36}\.(webp|jpg|png)$/i.test(path)) {
      return json({ error: "Invalid image reference." }, 400, cors);
    }

    const { error } = await getSupabaseAdmin().storage.from(BUCKET).remove([path]);

    if (error) {
      console.error("[product-image] delete failed:", error);
      return json({ error: "Could not remove that image." }, 502, cors);
    }

    return json({ ok: true }, 200, cors);
  } catch (err) {
    return handleError(err, cors);
  }
}

function json(body: unknown, status: number, cors: Record<string, string>) {
  return Response.json(body, { status, headers: cors });
}

function handleError(err: unknown, cors: Record<string, string>) {
  if (err instanceof AuthError) {
    return json({ error: err.message }, err.status, cors);
  }
  // Never surface internal details to the caller.
  console.error("[product-image] unexpected:", err);
  return json({ error: "Something went wrong. Please try again." }, 500, cors);
}
