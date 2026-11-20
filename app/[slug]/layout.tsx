import type { Metadata } from "next";
import { db } from "../lib/db";

type Props = { params: Promise<{ slug: string }>; children: React.ReactNode };

/* Server-rendered title and description so a store link shared on WhatsApp or Instagram shows a real preview card */
export async function generateMetadata({ params }: Omit<Props, "children">): Promise<Metadata> {
  const { slug } = await params;
  try {
    const pool = await db();
    const { rows } = await pool.query("select data->'profile'->>'name' as name, data->'profile'->>'bio' as bio from stores where slug = $1", [slug]);
    if (!rows[0]) return { title: "Store not found" };
    const title = rows[0].name || slug;
    const description = rows[0].bio || `Shop ${title}'s store`;
    return { title, description, openGraph: { title, description, type: "website" }, twitter: { card: "summary", title, description } };
  } catch {
    return { title: slug };
  }
}

export default function StoreLayout({ children }: Props) {
  return children;
}
