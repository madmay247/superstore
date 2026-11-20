import { createHash, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { db } from "../../../lib/db";

const RESERVED = new Set(["api", "store", "_next", "favicon.ico"]);
const MAX_BYTES = 4_000_000; // blocks can carry data-URL images
const valid = (slug: string) => /^[a-z0-9_-]{1,40}$/.test(slug) && !RESERVED.has(slug);
const hash = (token: string) => createHash("sha256").update(token).digest("hex");

function isOwner(stored: string, token: string | null) {
  if (!token) return false;
  const a = Buffer.from(stored);
  const b = Buffer.from(hash(token));
  return a.length === b.length && timingSafeEqual(a, b);
}

type Ctx = { params: Promise<{ slug: string }> };

async function getStore(_: Request, { params }: Ctx): Promise<Response> {
  const { slug } = await params;
  const pool = await db();
  const { rows } = await pool.query("select data from stores where slug = $1", [slug]);
  if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(rows[0].data, { headers: { "Cache-Control": "no-store" } });
}

/* Publish or update. The first write to a slug claims it; the claimant's edit token
   (kept in their browser) is the only thing that can change it afterwards. */
async function putStore(req: Request, { params }: Ctx) {
  const { slug } = await params;
  const token = req.headers.get("x-edit-token");
  if (!valid(slug)) return NextResponse.json({ error: "Invalid link" }, { status: 400 });
  if (!token || token.length < 16) return NextResponse.json({ error: "Missing edit token" }, { status: 401 });

  const body = await req.text();
  if (body.length > MAX_BYTES) return NextResponse.json({ error: "Store is too large" }, { status: 413 });
  let data: { slug?: string; profile?: unknown; blocks?: unknown; theme?: unknown };
  try {
    data = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (data.slug !== slug || !data.profile || !Array.isArray(data.blocks) || typeof data.theme !== "string") {
    return NextResponse.json({ error: "Invalid store" }, { status: 400 });
  }

  const pool = await db();
  // Insert-or-update in one statement so two people can't both claim a new slug
  const { rowCount } = await pool.query(
    `insert into stores (slug, data, token_hash) values ($1, $2, $3)
     on conflict (slug) do update set data = excluded.data, updated_at = now()
     where stores.token_hash = excluded.token_hash`,
    [slug, body, hash(token)]
  );
  if (!rowCount) return NextResponse.json({ error: "That link is taken" }, { status: 409 });
  return NextResponse.json({ ok: true });
}

async function deleteStore(req: Request, { params }: Ctx) {
  const { slug } = await params;
  const pool = await db();
  const { rows } = await pool.query("select token_hash from stores where slug = $1", [slug]);
  if (!rows[0]) return NextResponse.json({ ok: true });
  if (!isOwner(rows[0].token_hash, req.headers.get("x-edit-token"))) {
    return NextResponse.json({ error: "Not your store" }, { status: 403 });
  }
  await pool.query("delete from stores where slug = $1", [slug]);
  return NextResponse.json({ ok: true });
}

/* If the database is unreachable, answer with a plain JSON error instead of an HTML crash page */
const safe = (fn: (req: Request, ctx: Ctx) => Promise<Response>) => async (req: Request, ctx: Ctx) => {
  try {
    return await fn(req, ctx);
  } catch (e) {
    console.error("stores route failed", e);
    return NextResponse.json({ error: "We couldn't reach the server. Try again in a moment." }, { status: 503 });
  }
};
export const GET = safe(getStore);
export const PUT = safe(putStore);
export const DELETE = safe(deleteStore);
