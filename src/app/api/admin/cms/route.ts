import { updateTag } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { PRODUCTS_TAG } from "@/lib/products";
import { STORE_TAG } from "@/lib/store-status";
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
    const query = new URL(request.url).searchParams;
    const resource = query.get("resource");

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

      case "zones": {
        const { data, error } = await db
          .from("delivery_zones")
          .select("*")
          .order("id");
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

      // Website analytics for Leo Billing's Analytics screen.
      //
      // Aggregated here rather than in the app: the raw orders table
      // holds customer names, phones and addresses, and none of that
      // needs to cross the network to draw a chart. Only counts and
      // sums leave this function.
      case "website_analytics": {
        // Clamped: an unbounded window would let one request scan the whole
        // orders table.
        const days = Math.min(Math.max(num(query.get("days") ?? 30) || 30, 7), 365);
        const since = new Date(Date.now() - days * 86400_000).toISOString();

        const [ordersRes, customersRes, itemsRes] = await Promise.all([
          db
            .from("orders")
            .select("created_at, status, fulfillment_type, estimated_total, pincode")
            .gte("created_at", since)
            .order("created_at", { ascending: true }),
          db
            .from("website_customers")
            .select("created_at")
            .gte("created_at", since),
          db
            .from("order_items")
            .select("product_name, quantity, line_total, order_id")
            .gte("created_at", since),
        ]);

        if (ordersRes.error) throw ordersRes.error;

        const orders = ordersRes.data ?? [];
        const dayKey = (iso: string) => String(iso).slice(0, 10);

        // Dense series: every day in the window gets a point, so a quiet
        // day shows as zero instead of the chart silently skipping it.
        const series: Record<string, { orders: number; revenue: number; customers: number }> = {};
        for (let i = 0; i < days; i++) {
          const d = new Date(Date.now() - (days - 1 - i) * 86400_000);
          series[d.toISOString().slice(0, 10)] = { orders: 0, revenue: 0, customers: 0 };
        }

        const byStatus: Record<string, number> = {};
        const byFulfilment: Record<string, number> = {};
        const byPincode: Record<string, number> = {};
        let revenue = 0;
        let cancelled = 0;
        let completed = 0;

        for (const o of orders) {
          const k = dayKey(o.created_at);
          if (series[k]) {
            series[k].orders += 1;
            series[k].revenue += Number(o.estimated_total ?? 0);
          }
          byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;
          byFulfilment[o.fulfillment_type] = (byFulfilment[o.fulfillment_type] ?? 0) + 1;
          if (o.pincode) byPincode[o.pincode] = (byPincode[o.pincode] ?? 0) + 1;

          // Cancelled orders are excluded from revenue — counting money
          // that was never taken makes the number a fiction.
          if (o.status === "cancelled") cancelled += 1;
          else revenue += Number(o.estimated_total ?? 0);
          if (o.status === "completed") completed += 1;
        }

        for (const c of customersRes.data ?? []) {
          const k = dayKey(c.created_at);
          if (series[k]) series[k].customers += 1;
        }

        const productTotals: Record<string, { qty: number; revenue: number }> = {};
        for (const it of itemsRes.data ?? []) {
          const name = it.product_name ?? "Unknown";
          productTotals[name] = productTotals[name] ?? { qty: 0, revenue: 0 };
          productTotals[name].qty += Number(it.quantity ?? 0);
          productTotals[name].revenue += Number(it.line_total ?? 0);
        }

        const topProducts = Object.entries(productTotals)
          .map(([name, v]) => ({ name, ...v }))
          .sort((a, b) => b.qty - a.qty)
          .slice(0, 8);

        const paidOrders = orders.length - cancelled;

        return ok(
          {
            days,
            totals: {
              orders: orders.length,
              revenue: Math.round(revenue),
              cancelled,
              completed,
              newCustomers: (customersRes.data ?? []).length,
              averageOrderValue: paidOrders > 0 ? Math.round(revenue / paidOrders) : 0,
              cancellationRate:
                orders.length > 0 ? Math.round((cancelled / orders.length) * 100) : 0,
            },
            series: Object.entries(series).map(([date, v]) => ({ date, ...v })),
            byStatus,
            byFulfilment,
            topPincodes: Object.entries(byPincode)
              .map(([pincode, count]) => ({ pincode, count }))
              .sort((a, b) => b.count - a.count)
              .slice(0, 6),
            topProducts,
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
        // The storefront caches this; drop it so closing the shop takes
        // effect on the next request rather than up to a minute later.
        updateTag(STORE_TAG);
        return ok({ ok: true }, cors);
      }

      // Leo Billing writes products straight to Supabase rather than
      // through this API, so it has no other way to tell the website its
      // catalogue changed. Without this a newly published cake would sit
      // behind the cache until it expired on its own.
      case "revalidate_products": {
        updateTag(PRODUCTS_TAG);
        return ok({ ok: true }, cors);
      }

      // ── Delivery zones (map-drawn) ──
      //
      // Validated here as well as by the CHECK constraints in migration
      // 0016. The database is the real guard, but rejecting a bad shape
      // at the API gives the owner a readable message instead of a
      // constraint violation.
      case "save_zone": {
        const name = str(body.name).trim();
        const shape = str(body.shape);
        if (!name) return bad("Give the zone a name.", 400, cors);
        if (shape !== "circle" && shape !== "polygon") {
          return bad("Unknown zone shape.", 400, cors);
        }

        const row: Record<string, unknown> = {
          name,
          shape,
          delivery_fee: num(body.delivery_fee),
          is_active: body.is_active !== false,
          updated_at: new Date().toISOString(),
        };

        if (shape === "circle") {
          const lat = Number(body.center_lat);
          const lng = Number(body.center_lng);
          const radius = Math.round(Number(body.radius_m));
          if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
            return bad("Pick a valid point on the map.", 400, cors);
          }
          if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
            return bad("Pick a valid point on the map.", 400, cors);
          }
          if (!Number.isFinite(radius) || radius <= 0) {
            return bad("Radius must be greater than zero.", 400, cors);
          }
          row.center_lat = lat;
          row.center_lng = lng;
          row.radius_m = radius;
          row.polygon = null;
        } else {
          const raw = Array.isArray(body.polygon) ? body.polygon : [];
          const ring = raw
            .map((pt: unknown) => (Array.isArray(pt) ? [Number(pt[0]), Number(pt[1])] : null))
            .filter(
              (pt): pt is number[] =>
                pt !== null &&
                Number.isFinite(pt[0]) && pt[0] >= -90 && pt[0] <= 90 &&
                Number.isFinite(pt[1]) && pt[1] >= -180 && pt[1] <= 180
            );
          if (ring.length < 3) {
            return bad("A shape needs at least three points.", 400, cors);
          }
          row.polygon = ring;
          row.center_lat = null;
          row.center_lng = null;
          row.radius_m = null;
        }

        const id = body.id ? Number(body.id) : null;
        const query = id
          ? db.from("delivery_zones").update(row).eq("id", id)
          : db.from("delivery_zones").insert(row);

        const { error } = await query;
        if (error) throw error;

        return ok({ ok: true }, cors);
      }

      case "set_zone_active": {
        const { error } = await db
          .from("delivery_zones")
          .update({ is_active: Boolean(body.is_active), updated_at: new Date().toISOString() })
          .eq("id", Number(body.id));
        if (error) throw error;
        return ok({ ok: true }, cors);
      }

      case "delete_zone": {
        const { error } = await db
          .from("delivery_zones")
          .delete()
          .eq("id", Number(body.id));
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
