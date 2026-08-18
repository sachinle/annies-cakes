import { getSupabaseAdmin } from "@/lib/supabase/server";
import { AuthError, requireOwner } from "@/lib/auth/verify-owner";
import { corsHeaders, preflight } from "@/lib/cors";
import { setOrderStatus } from "@/lib/order-admin";

// Admin endpoint: everything the Website section of Leo Billing reads
// and writes.
//
// Category: ADMIN (owner-only, cross-origin from Leo Billing).
//   auth   — Firebase ID token, verified against Google's public keys
//   authz  — UID must be in OWNER_FIREBASE_UIDS
//   errors — generic messages; details go to the server log only
//
// Why this exists: the CMS tables have RLS enabled with no anon
// policies, so the browser cannot reach them directly. Leo Billing
// authenticates here instead, and the write happens with the service
// role key, which never leaves this server.
//
// Every operation is an entry in an explicit allow-list below. There is
// deliberately no generic "run this query on this table" path — that
// would hand an authenticated caller the whole database.

export const runtime = "nodejs";

const ok = (body: unknown, cors: Record<string, string>) =>
  Response.json(body, { status: 200, headers: cors });

const bad = (message: string, status: number, cors: Record<string, string>) =>
  Response.json({ error: message }, { status, headers: cors });

export async function OPTIONS(request: Request) {
  return preflight(request);
}

// ── Reads ──────────────────────────────────────────────────────
export async function GET(request: Request) {
  const cors = corsHeaders(request);

  try {
    await requireOwner(request);
    const db = getSupabaseAdmin();
    const resource = new URL(request.url).searchParams.get("resource");

    switch (resource) {
      case "content": {
        const { data, error } = await db
          .from("site_content")
          .select("*")
          .order("sort_order");
        if (error) throw error;
        return ok(data ?? [], cors);
      }

      case "offers": {
        const { data, error } = await db
          .from("offers")
          .select("*")
          .order("sort_order")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return ok(data ?? [], cors);
      }

      case "gallery": {
        const { data, error } = await db
          .from("gallery_images")
          .select("*")
          .order("sort_order")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return ok(data ?? [], cors);
      }

      case "reviews": {
        // Includes unapproved reviews — that is the whole point of the
        // moderation queue, and why the anon key must not see this.
        const { data, error } = await db
          .from("product_reviews")
          .select(
            "id, product_id, rating, review_text, display_name, is_published, created_at, products(name)"
          )
          .order("created_at", { ascending: false });
        if (error) throw error;
        return ok(data ?? [], cors);
      }

      case "orders": {
        // Line items come along so Leo Billing can show every cake in a
        // basket order and pre-fill an invoice with all of them.
        const { data, error } = await db
          .from("orders")
          .select("*, order_items(*)")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return ok(data ?? [], cors);
      }

      case "pincodes": {
        const { data, error } = await db
          .from("service_pincodes")
          .select("*")
          .order("pincode");
        if (error) throw error;
        return ok(data ?? [], cors);
      }

      case "store": {
        const { data, error } = await db
          .from("store_settings")
          .select("accepting_orders, offline_message")
          .eq("id", true)
          .maybeSingle();
        if (error) throw error;
        return ok(
          data ?? { accepting_orders: true, offline_message: null },
          cors
        );
      }

      case "stats": {
        const [products, orders, reviews, customers] = await Promise.all([
          db.from("products").select("id", { count: "exact", head: true }).eq("is_published", true),
          db.from("orders").select("id", { count: "exact", head: true }),
          db.from("product_reviews").select("id", { count: "exact", head: true }).eq("is_published", false),
          db.from("website_customers").select("id", { count: "exact", head: true }),
        ]);
        return ok(
          {
            publishedProducts: products.count ?? 0,
            totalOrders: orders.count ?? 0,
            pendingReviews: reviews.count ?? 0,
            registeredUsers: customers.count ?? 0,
          },
          cors
        );
      }

      default:
        return bad("Unknown resource.", 400, cors);
    }
  } catch (err) {
    return handleError(err, cors);
  }
}

// ── Writes ─────────────────────────────────────────────────────
export async function POST(request: Request) {
  const cors = corsHeaders(request);

  try {
    await requireOwner(request);
    const db = getSupabaseAdmin();
    const body = (await request.json()) as Record<string, unknown>;
    const action = String(body.action ?? "");

    switch (action) {
      case "save_content": {
        const key = str(body.key);
        if (!key) return bad("Missing key.", 400, cors);
        const { error } = await db
          .from("site_content")
          .update({ value: str(body.value), updated_at: new Date().toISOString() })
          .eq("key", key);
        if (error) throw error;
        return ok({ ok: true }, cors);
      }

      case "save_offer": {
        const title = str(body.title).trim();
        if (!title) return bad("An offer needs a title.", 400, cors);

        const payload = {
          title,
          description: str(body.description).trim() || null,
          code: str(body.code).trim() || null,
          starts_at: str(body.starts_at) || null,
          ends_at: str(body.ends_at) || null,
          is_active: Boolean(body.is_active),
          sort_order: num(body.sort_order),
        };

        if (body.id) {
          const { error } = await db.from("offers").update(payload).eq("id", num(body.id));
          if (error) throw error;
          return ok({ ok: true, id: num(body.id) }, cors);
        }
        const { data, error } = await db.from("offers").insert([payload]).select("id").single();
        if (error) throw error;
        return ok({ ok: true, id: data.id }, cors);
      }

      case "delete_offer": {
        const { error } = await db.from("offers").delete().eq("id", num(body.id));
        if (error) throw error;
        return ok({ ok: true }, cors);
      }

      case "add_gallery": {
        const imageUrl = str(body.image_url);
        if (!imageUrl) return bad("Missing image.", 400, cors);
        const { data, error } = await db
          .from("gallery_images")
          .insert([
            {
              image_url: imageUrl,
              image_path: str(body.image_path) || null,
              caption: str(body.caption).trim() || null,
              alt_text: str(body.alt_text).trim() || null,
            },
          ])
          .select()
          .single();
        if (error) throw error;
        return ok(data, cors);
      }

      case "update_gallery": {
        // Only these fields may be changed — never the id or the
        // storage path, which would let one row point at another's file.
        const fields: Record<string, unknown> = {};
        if ("caption" in body) fields.caption = str(body.caption).trim() || null;
        if ("alt_text" in body) fields.alt_text = str(body.alt_text).trim() || null;
        if ("is_published" in body) fields.is_published = Boolean(body.is_published);
        if ("sort_order" in body) fields.sort_order = num(body.sort_order);

        const { error } = await db.from("gallery_images").update(fields).eq("id", num(body.id));
        if (error) throw error;
        return ok({ ok: true }, cors);
      }

      case "delete_gallery": {
        const { error } = await db.from("gallery_images").delete().eq("id", num(body.id));
        if (error) throw error;
        return ok({ ok: true }, cors);
      }

      case "set_review_published": {
        const { error } = await db
          .from("product_reviews")
          .update({ is_published: Boolean(body.is_published) })
          .eq("id", num(body.id));
        if (error) throw error;
        return ok({ ok: true }, cors);
      }

      case "delete_review": {
        const { error } = await db.from("product_reviews").delete().eq("id", num(body.id));
        if (error) throw error;
        return ok({ ok: true }, cors);
      }

      case "set_store_open": {
        const { error } = await db
          .from("store_settings")
          .update({
            accepting_orders: Boolean(body.accepting_orders),
            offline_message: str(body.offline_message).trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", true);
        if (error) throw error;
        return ok({ ok: true }, cors);
      }

      case "add_pincode": {
        const pincode = str(body.pincode).trim();
        if (!/^\d{6}$/.test(pincode)) {
          return bad("Pincode must be 6 digits.", 400, cors);
        }
        const { error } = await db.from("service_pincodes").upsert(
          {
            pincode,
            area_name: str(body.area_name).trim() || null,
            delivery_fee: num(body.delivery_fee),
            is_active: true,
          },
          { onConflict: "pincode" }
        );
        if (error) throw error;
        return ok({ ok: true }, cors);
      }

      case "update_pincode": {
        const fields: Record<string, unknown> = {};
        if ("area_name" in body) fields.area_name = str(body.area_name).trim() || null;
        if ("delivery_fee" in body) fields.delivery_fee = num(body.delivery_fee);
        if ("is_active" in body) fields.is_active = Boolean(body.is_active);

        const { error } = await db
          .from("service_pincodes")
          .update(fields)
          .eq("id", num(body.id));
        if (error) throw error;
        return ok({ ok: true }, cors);
      }

      case "delete_pincode": {
        const { error } = await db
          .from("service_pincodes")
          .delete()
          .eq("id", num(body.id));
        if (error) throw error;
        return ok({ ok: true }, cors);
      }

      case "delete_order": {
        // order_status_history and order_items cascade from orders, so
        // the whole request disappears from the customer's account.
        //
        // Any invoice already raised is deliberately NOT deleted: it is
        // a financial record and belongs to Leo Billing's own books.
        // Deleting the bill too is a separate, explicit action on the
        // Invoices screen.
        const orderId = str(body.id);
        if (!orderId) return bad("Missing order.", 400, cors);

        const { error } = await db.from("orders").delete().eq("id", orderId);
        if (error) throw error;
        return ok({ ok: true }, cors);
      }

      case "link_order_invoice": {
        // Called after Leo Billing saves an invoice for a website order,
        // so the customer can view their bill. Only the link is written —
        // the invoice itself is created and owned entirely by Leo Billing.
        const orderId = str(body.order_id);
        const invoiceId = num(body.invoice_id);
        if (!orderId || !invoiceId) return bad("Missing order or invoice.", 400, cors);

        const { error } = await db
          .from("orders")
          .update({ invoice_id: invoiceId, updated_at: new Date().toISOString() })
          .eq("id", orderId);
        if (error) throw error;
        return ok({ ok: true }, cors);
      }

      case "set_order_status": {
        // Shared with the Telegram bot so both surfaces write the same
        // history row and send the same customer email.
        const result = await setOrderStatus(str(body.id), str(body.status));
        if (!result.ok) return bad(result.reason, 400, cors);
        return ok({ ok: true, emailed: result.emailed }, cors);
      }

      default:
        return bad("Unknown action.", 400, cors);
    }
  } catch (err) {
    return handleError(err, cors);
  }
}

function str(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function handleError(err: unknown, cors: Record<string, string>) {
  if (err instanceof AuthError) {
    return Response.json({ error: err.message }, { status: err.status, headers: cors });
  }
  console.error("[admin/cms]", err);
  return Response.json(
    { error: "Something went wrong. Please try again." },
    { status: 500, headers: cors }
  );
}
