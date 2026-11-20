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

export type PublishResult = "ok" | "taken" | "too_big" | "error";

/* Push the store to the server so its link works on any device */
export async function publishStore(s: SavedStore): Promise<PublishResult> {
  try {
    const res = await fetch(`/api/stores/${encodeURIComponent(s.slug)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-edit-token": editToken() },
      body: JSON.stringify(s),
    });
    return res.ok ? "ok" : res.status === 409 ? "taken" : res.status === 413 ? "too_big" : "error";
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

/* "missing" only when the server says there's no such store; anything else (offline, server down) is "error",
   so a buyer never sees "Store not found" for a store that exists */
export async function fetchStore(slug: string): Promise<SavedStore | "missing" | "error"> {
  try {
    const res = await fetch(`/api/stores/${encodeURIComponent(slug)}`, { cache: "no-store" });
    if (res.status === 404) return "missing";
    if (!res.ok) return "error";
    const data = (await res.json()) as SavedStore;
    return data?.profile && Array.isArray(data.blocks) ? data : "error";
  } catch {
    return "error";
  }
}

/* A store link built from the creator's name, e.g. "Priya Sharma" -> "priyasharma".
   Must pass the server's slug check: [a-z0-9_-], max 40 chars, not a reserved route. */
export function baseSlug(name: string) {
  const s = name.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 30) || "creator";
  return s === "api" || s === "store" ? `${s}shop` : s;
}

/* Called when the current link belongs to someone else: keep the same link and add 4 digits, e.g. cfa-prep -> cfa-prep-4821 */
export function nextSlug(current: string) {
  const base = current.replace(/-\d{4}$/, "").slice(0, 30) || "my-store";
  return `${base}-${Math.floor(1000 + Math.random() * 9000)}`;
}

/* The host the app is actually served from (localhost, the Vercel domain, or a custom domain), so the
   link shown to creators always matches the link that works. Empty during server render. */
export const useHost = () => useSyncExternalStore(() => () => {}, () => window.location.host, () => "");

export const storeUrl =(slug: string) => `${window.location.origin}/${slug}`;

/* Data URLs, unlike blob URLs, survive a reload and work on the public page. Photos are shrunk to
   at most 900 px so a phone picture doesn't make the store too big to publish. */
export function readImage(file: File, done: (url: string) => void, onError?: () => void) {
  if (!file.type.startsWith("image/")) return onError?.();
  const r = new FileReader();
  r.onerror = () => onError?.();
  r.onload = () => {
    if (typeof r.result !== "string") return onError?.();
    const src = r.result;
    if (file.type === "image/gif" || file.type === "image/svg+xml") return file.size < 1_500_000 ? done(src) : onError?.();
    const img = new Image();
    img.onerror = () => onError?.();
    img.onload = () => {
      const scale = Math.min(1, 900 / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      const ctx = c.getContext("2d");
      if (!ctx) return done(src);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      done(c.toDataURL(file.type === "image/png" ? "image/png" : "image/jpeg", 0.85));
    };
    img.src = src;
  };
  r.readAsDataURL(file);
}

/* Ask the AI for a fresh take on one field of one product. Throws a message fit to show the user. */
export async function regenProductField(about: string, kind: Product["kind"], field: "title" | "description", current: string): Promise<string> {
  const res = await fetch("/api/setup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ about, part: kind, field, current }) }).catch(() => null);
  if (!res) throw new Error("Couldn't write a new version right now. Your text is unchanged.");
  const data = await res.json().catch(() => ({}));
  const v = (data.product as Partial<Product> | undefined)?.[field];
  if (!res.ok || !v) throw new Error("Couldn't write a new version right now. Your text is unchanged.");
  return v;
}
