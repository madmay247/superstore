import type { Block, Product, Profile } from "./shared";
import { useSyncExternalStore } from "react";
import { store } from "../data";

const KEY = "store-data";

/* `published` is absent on stores saved before it existed; page.tsx treats those as live */
export type SavedStore = { slug: string; profile: Profile; blocks: Block[]; theme: string; published?: boolean };

export function loadStore(): SavedStore | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SavedStore) : null;
  } catch {
    return null;
  }
}

export function saveStore(s: SavedStore) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
}

const TOKEN_KEY = "store-edit-token";

/* Proves ownership of the slug(s) this browser published; never leaves the browser except as a header */
function editToken() {
  try {
    let t = localStorage.getItem(TOKEN_KEY);
    if (!t) {
      t = crypto.randomUUID() + crypto.randomUUID();
      localStorage.setItem(TOKEN_KEY, t);
    }
    return t;
  } catch {
    return "";
  }
}

export type PublishResult = "ok" | "taken" | "error";

/* Push the store to the server so its link works on any device */
export async function publishStore(s: SavedStore): Promise<PublishResult> {
  try {
    const res = await fetch(`/api/stores/${encodeURIComponent(s.slug)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-edit-token": editToken() },
      body: JSON.stringify(s),
    });
    return res.ok ? "ok" : res.status === 409 ? "taken" : "error";
  } catch {
    return "error";
  }
}

/* Resolves true only when the server confirms the store is gone */
export function unpublishStore(slug: string) {
  return fetch(`/api/stores/${encodeURIComponent(slug)}`, { method: "DELETE", headers: { "x-edit-token": editToken() } })
    .then((r) => r.ok)
    .catch(() => false);
}

/* Wipe everything: take the published store offline, then forget the saved store and setup progress.
   The ownership token is kept so a freed link can still be reclaimed by this browser. */
export async function resetEverything() {
  const saved = loadStore();
  if (saved && saved.slug !== store.slug) await unpublishStore(saved.slug);
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem("store-welcome-seen");
  } catch {}
}

export async function fetchStore(slug: string): Promise<SavedStore | null> {
  try {
    const res = await fetch(`/api/stores/${encodeURIComponent(slug)}`, { cache: "no-store" });
    return res.ok ? ((await res.json()) as SavedStore) : null;
  } catch {
    return null;
  }
}

/* A store link built from the creator's name, e.g. "Priya Sharma" -> "priyasharma".
   Must pass the server's slug check: [a-z0-9_-], max 40 chars, not a reserved route. */
export function baseSlug(name: string) {
  const s = name.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 30) || "creator";
  return s === "api" || s === "store" ? `${s}shop` : s;
}

/* Called when the current link belongs to someone else: try the plain name first, then name + 4 digits */
export function nextSlug(current: string, name: string) {
  const base = baseSlug(name);
  return current === base ? `${base}${Math.floor(1000 + Math.random() * 9000)}` : base;
}

/* The host the app is actually served from (localhost, the Vercel domain, or a custom domain), so the
   link shown to creators always matches the link that works. Empty during server render. */
export const useHost = () => useSyncExternalStore(() => () => {}, () => window.location.host, () => "");

export const storeUrl =(slug: string) => `${window.location.origin}/${slug}`;

/* Data URLs, unlike blob URLs, survive a reload and work on the public page */
export function readImage(file: File, done: (url: string) => void) {
  const r = new FileReader();
  r.onload = () => typeof r.result === "string" && done(r.result);
  r.readAsDataURL(file);
}

/* Ask the AI for a fresh take on one field of one product. Throws a message fit to show the user. */
export async function regenProductField(about: string, kind: Product["kind"], field: "title" | "description", current: string): Promise<string> {
  const res = await fetch("/api/setup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ about, part: kind, field, current }) });
  const data = await res.json().catch(() => ({}));
  const v = (data.product as Partial<Product> | undefined)?.[field];
  if (!res.ok || !v) throw new Error(data.error || "Couldn't write a new version. Try again.");
  return v;
}
