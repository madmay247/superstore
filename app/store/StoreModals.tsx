"use client";

import { useEffect, useRef, useState } from "react";
import { Briefcase, Magnet, Banknote, ChevronDown, Link2, CornerDownLeft, Check, Pencil, Paperclip, X, Loader2, RefreshCw, Plus, Trash2, Eye } from "lucide-react";
import { BRAND, quickAdds, createAndSell, themes } from "../data";
import { ProductEditor } from "./ProductEditor";
import { readImage, baseSlug, useHost } from "./persist";
import { Avatar, PhonePreview, socialsMeta, formatPrice, type Block, type Profile, type Product, type Upload } from "./shared";

function useEscape(onClose: () => void) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
}

/* Hero art for the welcome modal: phone with floating store links */
function WelcomeArt() {
  return (
    <div className="wm-art">
      <div className="wm-phone">
        <div className="wm-avatar">PP</div>
        <div className="wm-name">Pranav Pradeep</div>
        <div className="wm-bio">Welcome to my {BRAND.first}{BRAND.second}!🚀</div>
        <div className="wm-cta">Book a session with me</div>
      </div>
      <div className="wm-pill" style={{ top: 116, left: "calc(50% - 91px)" }}>
        <span className="wm-thumb" style={{ background: "linear-gradient(135deg,#2f6fd8,#e8463c)" }} />
        <b>Free Photoshop course!</b>
        <ChevronDown size={14} />
      </div>
      <div className="wm-pill sm" style={{ top: 170, left: "calc(50% - 169px)" }}>
        <span className="wm-thumb" style={{ background: "linear-gradient(160deg,#9db7d8,#6b5a3c)" }} />
        <b>Journeying across the Himalayas</b>
        <ChevronDown size={12} />
      </div>
      <div className="wm-pill" style={{ top: 229, left: "calc(50% - 91px)" }}>
        <span className="wm-thumb freebie">FREEBIE</span>
        <b>Click here for freebie</b>
        <ChevronDown size={14} />
      </div>
    </div>
  );
}

const features = [
  { Icon: Briefcase, title: "Showcase your work", text: "Your store is your website to showcase everything you want to your followers or consumers." },
  { Icon: Magnet, title: "Collect leads", text: "Build your audience with lead magnets, forms, free bookings, follow button and more." },
  { Icon: Banknote, title: "Monetize", text: "Sell digital products, launch courses, host events, sell Telegram and Discord subscriptions, and more." },
];

export function WelcomeModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="overlay">
      <div className="wm" role="dialog" aria-modal="true" aria-labelledby="wm-title">
        <WelcomeArt />
        <div className="wm-body">
          <h2 id="wm-title">
            Welcome to your <span>Store</span>
          </h2>
          <p className="wm-sub">
            Your very own website to list all your products and services under one roof. Here’s all the things you can do.
          </p>
          {features.map(({ Icon, title, text }) => (
            <div className="wm-feat" key={title}>
              <span className="wm-ic">
                <Icon size={20} strokeWidth={1.7} />
              </span>
              <div>
                <b>{title}</b>
                <p>{text}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="wm-foot">
          <button className="wm-btn" onClick={onClose}>
            Set up
          </button>
        </div>
      </div>
    </div>
  );
}

function QuickIcon({ q }: { q: (typeof quickAdds)[number] }) {
  if ("kind" in q) {
    return (
      <div className="qa-carousel">
        {["#3aa6a6", "#d9a37a", "#3b2a1a"].map((c) => (
          <span key={c}>
            <i style={{ background: c }} />
            <em />
            <em />
          </span>
        ))}
      </div>
    );
  }
  if ("emoji" in q) return <span className="qa-ic">{q.emoji}</span>;
  return (
    <span className="qa-ic">
      <span className="qa-glyph" style={{ background: q.color }}>
        {q.glyph === "wa" ? "✆" : q.glyph === "bolt" ? "⚡" : "Ç"}
      </span>
    </span>
  );
}

export function AddContentModal({ onClose, onAdd }: { onClose: () => void; onAdd: (title: string, url?: string) => void }) {
  const [url, setUrl] = useState("");
  useEscape(onClose);

  const submit = () => {
    const v = url.trim();
    if (!v) return;
    let title = v;
    try {
      title = new URL(v.startsWith("http") ? v : `https://${v}`).hostname.replace(/^www\./, "");
    } catch {}
    onAdd(title, v);
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="ac" onClick={(e) => e.stopPropagation()}>
        <form
          className="ac-link"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <Link2 size={20} color="#3a7bd5" />
          <input autoFocus placeholder="Add a link to your store" value={url} onChange={(e) => setUrl(e.target.value)} />
          <button type="submit" className={url ? "on" : ""}>
            <CornerDownLeft size={14} /> Enter
          </button>
        </form>
        <div className="ac-panel">
          <h4>Quick adds</h4>
          <div className="qa-row">
            {quickAdds.map((q) => (
              <button className="qa" key={q.name} onClick={() => onAdd(q.name)}>
                <div className="qa-tile">
                  <QuickIcon q={q} />
                </div>
                <span>{q.name}</span>
              </button>
            ))}
          </div>
          <h4 className="ac-h2">Create and sell</h4>
          <p className="ac-sub">Make money by selling products and services</p>
          <div className="cs-grid">
            {createAndSell.map((c) => (
              <button className="cs" key={c.title} onClick={() => onAdd(c.title)}>
                <span className="cs-ic" style={{ background: c.bg }}>
                  {c.emoji}
                </span>
                <span className="cs-copy">
                  <b>{c.title}</b>
                  <span>{c.text}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AddProductModal({ onClose, onAdd }: { onClose: () => void; onAdd: (kind: Product["kind"]) => void }) {
  useEscape(onClose);
  return (
    <div className="overlay" onClick={onClose}>
      <div className="ac" onClick={(e) => e.stopPropagation()}>
        <div className="ac-panel">
          <h4 className="ac-h2">Add a product</h4>
          <p className="ac-sub">Choose what you want to sell</p>
          <div className="cs-grid">
            {(["file", "premium", "community"] as Product["kind"][]).map((k) => (
              <button className="cs" key={k} onClick={() => onAdd(k)}>
                <span className="cs-ic" style={{ background: kindMeta[k].bg }}>{kindMeta[k].emoji}</span>
                <span className="cs-copy">
                  <b>{kindMeta[k].label}</b>
                  <span>{kindBlurb[k]}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function EditLinkModal({ domain, slug, onClose, onSave, onUnpublish }: { domain: string; slug: string; onClose: () => void; onSave: (slug: string) => Promise<string | void>; onUnpublish?: () => Promise<string | void> }) {
  const [value, setValue] = useState(slug);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  useEscape(onClose);
  const clean = value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");

  return (
    <div className="overlay" onClick={onClose}>
      <div className="ac el" onClick={(e) => e.stopPropagation()}>
        <form
          className="ac-link"
          onSubmit={async (e) => {
            e.preventDefault();
            if (clean) setError((await onSave(clean)) || "");
          }}
        >
          <Link2 size={20} color="#3a7bd5" />
          <span className="el-domain">{domain}/</span>
          <input autoFocus value={value} onChange={(e) => setValue(e.target.value)} aria-label="Store link" />
          <button type="submit" className={clean ? "on" : ""}>
            <CornerDownLeft size={14} /> Save
          </button>
        </form>
        {error && <p className="el-error" role="alert">{error}</p>}
        {onUnpublish && !confirming && <button type="button" className="el-unpub" onClick={() => setConfirming(true)}>Unpublish store</button>}
        {onUnpublish && confirming && (
          <div className="el-confirm" role="alertdialog" aria-label="Unpublish store">
            <p>Take your store offline? Your link stops working until you publish again.</p>
            <div>
              <button type="button" disabled={busy} onClick={() => setConfirming(false)}>Cancel</button>
              <button type="button" className="danger" disabled={busy} onClick={async () => { setBusy(true); const e = await onUnpublish(); if (e) { setError(e); setConfirming(false); } setBusy(false); }}>
                {busy ? "Unpublishing…" : "Unpublish"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const ABOUT_MAX = 500;
const BIO_MAX = 116;

const PRIMARY_SOCIALS = ["instagram", "linkedin"];

function SocialsFields({ socials, onChange }: { socials: Profile["socials"]; onChange: (s: Profile["socials"]) => void }) {
  const primary = PRIMARY_SOCIALS.map((k) => socialsMeta.find((m) => m.key === k)!);
  const rest = socialsMeta.filter((m) => !PRIMARY_SOCIALS.includes(m.key));
  const [open, setOpen] = useState(false);
  const shown = open || rest.some((m) => socials[m.key].trim()) ? [...primary, ...rest] : primary;

  return (
    <div className="bw-socials">
      {shown.map(({ key, Icon, color, bg }) => (
        <div className="bw-social" key={key}>
          <span className="bw-social-ic">
            <span style={{ background: bg }}>
              <Icon size={bg ? 15 : 22} color={color} strokeWidth={2.2} />
            </span>
          </span>
          <input className="bw-input" placeholder="@" aria-label={key} value={socials[key]} onChange={(e) => onChange({ ...socials, [key]: e.target.value })} />
        </div>
      ))}
      {shown.length < socialsMeta.length && (
        <button type="button" className="bw-more" onClick={() => setOpen(true)}>+ {socialsMeta.length - shown.length} more</button>
      )}
    </div>
  );
}

export function EditHeaderModal({ profile, onClose, onSave }: { profile: Profile; onClose: () => void; onSave: (p: Profile) => void }) {
  const [draft, setDraft] = useState(profile);
  const set = (patch: Partial<Profile>) => setDraft({ ...draft, ...patch });
  useEscape(onClose);

  return (
    <div className="overlay" onClick={onClose}>
      <div className="bw eh" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="bw-left">
          <h2>Edit header</h2>
          <div className="bw-body bw-review">
            <section className="bw-brand">
              <div className="bw-avatar">
                <span className="st-avatar" style={{ width: 118, height: 118 }}>
                  {draft.avatar ? <img src={draft.avatar} alt="" width={118} height={118} /> : <Avatar size={118} />}
                </span>
                <label className="bw-edit">
                  <Pencil size={14} /> Edit
                  <input type="file" accept="image/*" aria-label="Upload profile picture" onChange={(e) => e.target.files?.[0] && readImage(e.target.files[0], (avatar) => set({ avatar }))} />
                </label>
              </div>
              <div className="bw-fields">
                <label htmlFor="eh-name">Display Name</label>
                <input id="eh-name" className="bw-input" autoFocus value={draft.name} maxLength={50} onChange={(e) => set({ name: e.target.value })} />
                <label htmlFor="eh-bio">Bio</label>
                <div className="bw-ta">
                  <textarea id="eh-bio" value={draft.bio} maxLength={BIO_MAX} onChange={(e) => set({ bio: e.target.value })} />
                  <span>{[...draft.bio].length}/{BIO_MAX}</span>
                </div>
              </div>
            </section>
            <section className="bw-section">
              <span className="pf-label">Socials</span>
              <SocialsFields socials={draft.socials} onChange={(socials) => set({ socials })} />
            </section>
          </div>
          <div className="bw-foot">
            <span />
            <div className="bw-actions">
              <button className="bw-skip" onClick={onClose}>Cancel</button>
              <button className="bw-next" disabled={!draft.name.trim()} onClick={() => onSave({ ...draft, name: draft.name.trim() })}>Save</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const kindMeta = {
  file: { label: "Digital file", emoji: "📂", bg: "#fbeadf", ring: "#f4cdb3" },
  discovery: { label: "1:1 session", emoji: "👋", bg: "#e6f0ff", ring: "#b9d3fb" },
  premium: { label: "1:1 session", emoji: "🎯", bg: "#f3f4df", ring: "#dfe29a" },
  community: { label: "Community", emoji: "👥", bg: "#efe6ff", ring: "#cdb8f5" },
} as const;

const kindBlurb = {
  file: "Sell E-books, PDFs, templates, videos and more.",
  discovery: "Paid 1-on-1 calls, coaching or consulting.",
  premium: "Paid 1-on-1 calls, coaching or consulting.",
  community: "Invite buyers to your Telegram or Discord.",
} as const;

const missingLabel: Record<string, string> = { title: "Title", description: "Description", file: "File", link: "Community link", duration: "Duration", price: "Price" };

export const newProduct = (kind: Product["kind"]): Product => ({
  file: { kind, title: "", description: "", buttonText: "Get it now", price: 0 },
  discovery: { kind, title: "", description: "", duration: 30, price: 499 },
  premium: { kind, title: "", description: "", duration: 60, price: 2999 },
  community: { kind, title: "", description: "", link: "", price: 0 },
})[kind];

const blankProducts: Product[] = [
  { kind: "file", title: "", description: "", buttonText: "Get it now", price: 0 },
  { kind: "discovery", title: "", description: "", duration: 30, price: 499 },
  { kind: "premium", title: "", description: "", duration: 60, price: 2999 },
];

/* Mandatory fields per product, mirroring the platform's own create forms */
const isUrl = (v?: string) => /^(https?:\/\/)?[^\s/]+\.[^\s/]{2,}\S*$/i.test((v ?? "").trim());

export function missing(p: Product) {
  const need: [string, unknown][] =
    p.kind === "file"
      ? [["title", p.title], ["description", p.description], ["file", p.file]]
      : p.kind === "community"
      ? [["title", p.title], ["description", p.description], ["link", isUrl(p.link)]]
      : [["title", p.title], ["duration", p.duration], ["description", p.description], ["price", p.price > 0]];
  return need.filter(([, v]) => (typeof v === "string" ? !v.trim() : !v)).map(([k]) => k);
}

/* What stops the store from publishing. An incomplete product just stays offline (its card says what's
   left to fill), so it never blocks the store. Only a product the creator switched on and then emptied
   blocks, and never for the download file or community link, which the AI can't create. */
export const publishBlockers = (p: Product) =>
  p.live === true ? missing(p).filter((k) => !(p.kind === "file" && k === "file") && !(p.kind === "community" && k === "link")) : [];

/* Live unless switched off; incomplete products can never be live */
export const isLive = (p: Product) => p.live !== false && missing(p).length === 0;

export const productBlock = (p: Product): Omit<Block, "id"> => ({
  data: p,
  title: p.title,
  emoji: p.emoji || kindMeta[p.kind].emoji,
  emojiBg: kindMeta[p.kind].ring,
  meta: p.kind === "file" ? (p.price > 0 ? formatPrice(p.price) : "Free") : p.kind === "community" ? `Community · ${formatPrice(p.price)}` : `${p.duration} mins · ${formatPrice(p.price)}`,
  product: true,
  live: isLive(p),
});

const toUpload = (f: File): Upload => ({ name: f.name, size: f.size });
const kb = (n: number) => (n > 1e6 ? `${(n / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1e3))} KB`);

function Field({ label, count, max, bad, regen, children }: { label: string; count?: number; max?: number; bad?: boolean; regen?: { busy: boolean; onClick: () => void }; children: React.ReactNode }) {
  return (
    <label className={`pf-field${bad ? " err" : ""}`} data-invalid={bad || undefined}>
      <span className="pf-label">
        {label}
        {max !== undefined && <em>{count}/{max}</em>}
        {regen && (
          <button type="button" className="bw-ri" aria-label={`Regenerate ${label.toLowerCase()}`} data-tip="Regenerate" disabled={regen.busy} onClick={(e) => { e.preventDefault(); regen.onClick(); }}>
            <RefreshCw size={14} className={regen.busy ? "spin" : undefined} />
          </button>
        )}
      </span>
      {children}
      {bad && <small className="pf-err">Complete this step</small>}
    </label>
  );
}

function UploadField({ label, value, bad, onChange }: { label: string; value?: Upload; bad?: boolean; onChange: (u?: Upload) => void }) {
  return (
    <div className={`pf-field${bad ? " err" : ""}`} data-invalid={bad || undefined}>
      <span className="pf-label">{label}</span>
      {value ? (
        <div className="pf-file">
          <Paperclip size={16} color="#666" />
          <span>
            <b>{value.name}</b>
            {kb(value.size)}
          </span>
          <button type="button" aria-label={`Remove ${label.toLowerCase()}`} onClick={() => onChange(undefined)}>
            <X size={15} />
          </button>
        </div>
      ) : (
        <label className="pf-drop">
          <Paperclip size={18} />
          <span>
            <b>Upload</b> the file buyers will get · up to 10 MB
          </span>
          <input type="file" onChange={(e) => e.target.files?.[0] && onChange(toUpload(e.target.files[0]))} />
        </label>
      )}
      {bad && <small className="pf-err">Complete this step</small>}
    </div>
  );
}

const EMOJIS = ["😎", "👋", "🎯", "💡", "🚀", "📈", "🧠", "☕", "🎓", "💬", "🔥", "✨", "💼", "🤝", "📚", "🏆", "🎧", "🌱", "💰", "🗓️"];

function EmojiPicker({ value, fallback, onPick }: { value?: string; fallback: string; onPick: (e: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="pf-ep">
      <button type="button" aria-label="Choose emoji" aria-expanded={open} onClick={() => setOpen(!open)}>{value || fallback}</button>
      {open && (
        <div className="pf-ep-grid" role="listbox">
          {EMOJIS.map((e) => (
            <button type="button" key={e} role="option" aria-selected={e === value} onClick={() => { onPick(e); setOpen(false); }}>{e}</button>
          ))}
        </div>
      )}
    </div>
  );
}

/* showWhy: the "Why ₹X?" price notes, shown only while the creator is first setting up their store */
export function ProductForm({ p, bad, onChange, onDelete, onRegen, regenField, showWhy }: { p: Product; bad: (k: string) => boolean; onChange: (patch: Partial<Product>) => void; onDelete?: () => void; onRegen?: (field: "title" | "description") => void; regenField?: string | null; showWhy?: boolean }) {
  const m = kindMeta[p.kind];
  const rg = (f: "title" | "description") => (onRegen && (regenField === f || String(p[f] ?? "").trim()) ? { busy: regenField === f, onClick: () => onRegen(f) } : undefined);
  const session = p.kind === "discovery" || p.kind === "premium";
  return (
    <div className="pc-body">
      {p.kind === "community" ? (
        <>
          <Field label="Community name" regen={rg("title")} bad={bad("title")} count={[...p.title].length} max={75}>
            <div className="pf-emoji">
              <EmojiPicker value={p.emoji} fallback={m.emoji} onPick={(emoji) => onChange({ emoji })} />
              <input className="bw-input" value={p.title} maxLength={75} onChange={(e) => onChange({ title: e.target.value })} />
            </div>
          </Field>
          <Field label="Description" regen={rg("description")} bad={bad("description")}>
            <textarea className="pf-ta" value={p.description} onChange={(e) => onChange({ description: e.target.value })} />
          </Field>
          <Field label="Community link" bad={bad("link")}>
            <input className="bw-input" type="url" inputMode="url" placeholder="WhatsApp, Telegram, Discord or Slack invite link" value={p.link ?? ""} onChange={(e) => onChange({ link: e.target.value })} />
          </Field>
          <Field label="Price (₹)">
            <input className="bw-input" type="number" min={0} value={p.price} onChange={(e) => onChange({ price: Number(e.target.value) || 0 })} />
          </Field>
        </>
      ) : session ? (
        <>
          <Field label="Session title" regen={rg("title")} bad={bad("title")} count={[...p.title].length} max={75}>
            <div className="pf-emoji">
              <EmojiPicker value={p.emoji} fallback={m.emoji} onPick={(emoji) => onChange({ emoji })} />
              <input className="bw-input" value={p.title} maxLength={75} onChange={(e) => onChange({ title: e.target.value })} />
            </div>
          </Field>
          <div className="pf-row">
            <Field label="Duration (mins)" bad={bad("duration")}>
              <input className="bw-input" type="number" min={5} step={5} value={p.duration ?? ""} onChange={(e) => onChange({ duration: Number(e.target.value) || undefined })} />
            </Field>
            <Field label="Price (₹)" bad={bad("price")}>
              <input className="bw-input" type="number" min={1} value={p.price || ""} onChange={(e) => onChange({ price: Number(e.target.value) || 0 })} />
            </Field>
          </div>
          {showWhy && p.priceNote && p.priceNote.price === p.price && (
            <p className="pf-why">
              <b>Why {formatPrice(p.price)}?</b> {p.priceNote.why}
            </p>
          )}
          <Field label="Description" regen={rg("description")} bad={bad("description")}>
            <textarea className="pf-ta" value={p.description} onChange={(e) => onChange({ description: e.target.value })} />
          </Field>
        </>
      ) : (
        <>
          <Field label="Title" regen={rg("title")} bad={bad("title")} count={[...p.title].length} max={75}>
            <div className="pf-emoji">
              <EmojiPicker value={p.emoji} fallback={m.emoji} onPick={(emoji) => onChange({ emoji })} />
              <input className="bw-input" value={p.title} maxLength={75} onChange={(e) => onChange({ title: e.target.value })} />
            </div>
          </Field>
          <Field label="Description" regen={rg("description")} bad={bad("description")}>
            <textarea className="pf-ta" value={p.description} onChange={(e) => onChange({ description: e.target.value })} />
          </Field>
          <div className="pf-row">
            <Field label="Price (₹)">
              <input className="bw-input" type="number" min={0} value={p.price} onChange={(e) => onChange({ price: Number(e.target.value) || 0 })} />
            </Field>
          </div>
          {showWhy && p.priceNote && p.priceNote.price === p.price && (
            <p className="pf-why">
              <b>Why {p.price > 0 ? formatPrice(p.price) : "free"}?</b> {p.priceNote.why}
            </p>
          )}
          <UploadField label="File" bad={bad("file")} value={p.file} onChange={(file) => onChange({ file })} />
          <div className="pe-toggle pf-lead">
            <span>
              <b>Collect leads</b>
              <small>Ask for name and email before buyers get the file</small>
            </span>
            <button type="button" role="switch" aria-checked={p.collectLeads !== false} aria-label="Collect leads" className={p.collectLeads !== false ? "on" : ""} onClick={() => onChange({ collectLeads: p.collectLeads === false })}><i /></button>
          </div>
        </>
      )}
      {onDelete && (
        <button type="button" className="pf-delete" onClick={onDelete}>
          <Trash2 size={15} /> Delete product
        </button>
      )}
    </div>
  );
}

function ProductCard({ p, open, showErrors, regenField, onRegen, onToggle, onChange, onDelete }: { p: Product; open: boolean; showErrors: boolean; regenField: string | null; onRegen: (field: "title" | "description") => void; onToggle: () => void; onChange: (patch: Partial<Product>) => void; onDelete: () => void }) {
  const m = kindMeta[p.kind];
  const miss = missing(p);
  const left = miss.length;
  const blockers = publishBlockers(p);
  const tip = left ? `Missing: ${miss.map((k) => missingLabel[k] ?? k).join(", ")}` : undefined;
  const [flagged, setFlagged] = useState(false);
  const bad = (k: string) => (flagged ? miss.includes(k) : showErrors && blockers.includes(k));
  const cardRef = useRef<HTMLDivElement>(null);
  /* Clicking "N to fill" or the disabled Live toggle opens the card and marks what's missing */
  const flag = () => {
    setFlagged(true);
    if (!open) onToggle();
    setTimeout(() => {
      const el = cardRef.current?.querySelector<HTMLElement>("[data-invalid]");
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 60);
  };
  return (
    <div className={`pc${open ? " open" : ""}`} ref={cardRef}>
      <div className="pc-row">
      <button type="button" className="pc-head" onClick={(e) => (left && (e.target as HTMLElement).closest(".pc-status") ? flag() : onToggle())} aria-expanded={open}>
        <span className="pc-ic" style={{ background: m.bg }}>{p.emoji || m.emoji}</span>
        <span className="pc-copy">
          <span className="pc-kind">{m.label} · {p.price > 0 ? formatPrice(p.price) : "Free"}</span>
          <b>{p.title || "Untitled"}</b>
        </span>
        <span className={`pc-status${left ? " err" : " ok"}`} data-tip={tip}>{left ? `${left} to fill` : <><Check size={13} strokeWidth={3} /> Ready</>}</span>
      </button>
      <label className={`pc-live${left ? " off" : ""}`} data-tip={tip} onClick={(e) => { if (left) { e.preventDefault(); flag(); } }}>
        <span>Live</span>
        <span className="switch">
          <input type="checkbox" checked={isLive(p)} disabled={left > 0} onChange={(e) => onChange({ live: e.target.checked })} />
          <i />
        </span>
      </label>
      <button type="button" className="pc-chev-btn" onClick={onToggle} aria-label={open ? "Collapse" : "Expand"} aria-expanded={open}>
        <ChevronDown size={18} className="pc-chev" />
      </button>
      </div>
      {open && <ProductForm p={p} bad={bad} onChange={onChange} onDelete={onDelete} onRegen={onRegen} regenField={regenField} showWhy />}
    </div>
  );
}

const loadingLines = ["Reading your answer…", "Writing your bio…", "Picking your products…", "Pricing your sessions…"];

export function BrandWizard({ profile, setProfile, theme, setTheme, blocks, onFinish }: {
  profile: Profile;
  setProfile: (p: Profile) => void;
  theme: string;
  setTheme: (t: string) => void;
  blocks: Block[];
  onFinish: (products: Product[], link: string, publish: boolean) => void;
}) {
  const host = useHost();
  const [link, setLink] = useState<string | null>(null); /* set by the AI draft or the creator; follows the name only in manual setup */
  const [step, setStep] = useState(1);
  const [products, setProducts] = useState<Product[]>(blankProducts);
  const [openCard, setOpenCard] = useState(-1);
  const [editing, setEditing] = useState(-1);
  const [addMenu, setAddMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [line, setLine] = useState(0);
  const [error, setError] = useState("");
  const [draftedFrom, setDraftedFrom] = useState("");
  const set = (patch: Partial<Profile>) => setProfile({ ...profile, ...patch });

  useEffect(() => {
    if (!loading) return;
    setLine(0);
    const t = setInterval(() => setLine((l) => Math.min(l + 1, loadingLines.length - 1)), 1400);
    return () => clearInterval(t);
  }, [loading]);

  useEffect(() => {
    if (!addMenu) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !(e.target as HTMLElement).closest(".bw-add")) setAddMenu(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [addMenu]);

  const addProduct = (kind: Product["kind"]) => {
    setProducts([...products, newProduct(kind)]);
    setShowErrors(false);
    setOpenCard(products.length);
    setAddMenu(false);
    setTimeout(() => document.querySelectorAll(".bw-section .pc")[products.length]?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 60);
  };

  /* A question back from the AI when the answer is gibberish */
  const [ask, setAsk] = useState<string | null>(null);
  const draft = async (force = false) => {
    const about = profile.about.trim();
    if (!force && about === draftedFrom) return setStep(2);
    setLoading(true);
    setError("");
    setAsk(null);
    try {
      const res = await fetch("/api/setup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ about }) });
      const data = await res.json().catch(() => ({}));
      if (data.followUp) {
        setAsk(data.error);
        setTimeout(() => document.getElementById("bw-about")?.focus(), 30);
        return;
      }
      if (!res.ok) throw new Error(res.status === 422 ? data.error : "");
      setProfile({ ...profile, name: data.name, bio: data.bio });
      if (data.link) setLink(data.link); /* the AI's link sticks; editing the name no longer changes it */
      setProducts(data.products as Product[]);
      setDraftedFrom(about);
      setOpenCard(-1);
      setStep(2);
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Sorry, our AI hit a snag.");
    } finally {
      setLoading(false);
    }
  };

  const [regenKey, setRegenKey] = useState<string | null>(null);
  const [regenNote, setRegenNote] = useState("");
  /* Regenerate a single generated piece (name, bio or one product) without touching the rest */
  const regen = async (part: string, key: string, current: string, apply: (d: any) => void, field?: string) => {
    if (regenKey) return;
    setRegenKey(key);
    setRegenNote("");
    try {
      const res = await fetch("/api/setup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ about: profile.about, part, field, current }) });
      const data = await res.json();
      if (!res.ok) throw new Error();
      apply(data);
    } catch {
      setRegenNote("Couldn't write a new version right now. Your text is unchanged.");
    } finally {
      setRegenKey(null);
    }
  };

  const [previewOpen, setPreviewOpen] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const nameBad = showErrors && !profile.name.trim();
  const slugValue = link ?? baseSlug(profile.name);
  const linkBad = showErrors && !slugValue;

  const publish = () => {
    const firstBad = products.findIndex((p) => publishBlockers(p).length);
    if (profile.name.trim() && slugValue && firstBad < 0) return onFinish(products, slugValue, true);
    setShowErrors(true);
    if (profile.name.trim() && slugValue) setOpenCard(firstBad);
    setTimeout(() => {
      const el = document.querySelector<HTMLElement>(".bw-review input.err, .bw-review [data-invalid]");
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.querySelector<HTMLElement>("input, textarea")?.focus({ preventScroll: true });
      if (el?.tagName === "INPUT") el.focus({ preventScroll: true });
    }, 60);
  };
  const previewBlocks = step === 2 ? [...blocks, ...products.filter((p) => p.title.trim()).map((p, i) => ({ id: -1 - i, ...productBlock(p) }))] : blocks;

  return (
    <div className="overlay">
      {previewOpen && (
        <div className="bw-pv" role="dialog" aria-modal="true" aria-label="Store preview" onClick={() => setPreviewOpen(false)}>
          <div className="bw-pv-in" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="bw-pv-x" aria-label="Close preview" onClick={() => setPreviewOpen(false)}><X size={18} /></button>
            <PhonePreview theme={theme} blocks={previewBlocks} slug={slugValue} />
            <div className="bw-themes" role="radiogroup" aria-label="Theme">
              {themes.map((t, i) => (
                <button type="button" key={t} role="radio" aria-checked={t === theme} aria-label={`Theme ${i + 1}`} className={t === theme ? "on" : ""} style={{ background: t }} onClick={() => setTheme(t)} />
              ))}
            </div>
          </div>
        </div>
      )}
      {editing >= 0 && (
        <ProductEditor
          p={products[editing]}
          onChange={(patch) => setProducts(products.map((x, j) => (j === editing ? { ...x, ...patch } : x)))}
          onClose={() => setEditing(-1)}
        />
      )}
      <div className={`bw${step === 1 ? " solo" : " tall"}`} role="dialog" aria-modal="true">
        <div className="bw-left">
          {step === 1 && (
            <>
              <h2>Tell us a little about you</h2>
              <p className="bw-sub">We’ll use this to set up your store for you.</p>
              <div className="bw-body bw-about">
                <label htmlFor="bw-about">Who are you, who do you help, and what are you good at?</label>
                <div className="bw-ta">
                  <textarea
                    id="bw-about"
                    autoFocus
                    value={profile.about}
                    maxLength={ABOUT_MAX}
                    disabled={loading}
                    placeholder="e.g. I'm Priya, a fitness coach from Pune with 20K followers. I help working women get fit at home in 30 minutes a day, with simple desi meal plans."
                    onChange={(e) => set({ about: e.target.value })}
                  />
                  <span>
                    {[...profile.about].length}/{ABOUT_MAX}
                  </span>
                </div>
                {loading && (
                  <div className="bw-status" aria-live="polite">
                    <span className="bw-orb" aria-hidden="true" />
                    <span key={line} className="bw-status-text">{loadingLines[line]}</span>
                    <span className="bw-dots" aria-hidden="true">
                      {loadingLines.map((_, i) => <i key={i} className={i <= line ? "on" : ""} />)}
                    </span>
                  </div>
                )}
                {ask && !loading && (
                  <div className="bw-ask" role="status">
                    <p>{ask}</p>
                    <span>
                      Add it above and continue.
                      <button type="button" onClick={() => { setAsk(null); setStep(2); }}>Set up manually</button>
                    </span>
                  </div>
                )}
                {error && !loading && (
                  <div className="bw-ask bw-oops" role="status">
                    <p>{error}</p>
                    <span>
                      <button type="button" onClick={() => { setError(""); setStep(2); }}>Set up manually</button>
                    </span>
                  </div>
                )}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="bw-head">
                <h2>Your store is ready</h2>
                <button type="button" className="bw-preview-btn" onClick={() => setPreviewOpen(true)}>
                  <Eye size={15} /> Preview
                </button>
              </div>
              <p className="bw-sub muted">We drafted this from your answer. Fill in what’s left and it goes live.</p>
              {regenNote && <p className="pf-note" role="status">{regenNote}</p>}
              <div className="bw-body bw-review">
                <section className="bw-brand">
                  <div className="bw-avatar">
                    <Avatar size={118} />
                    <label className="bw-edit">
                      <Pencil size={14} /> Edit
                      <input type="file" accept="image/*" aria-label="Upload profile picture" onChange={(e) => e.target.files?.[0] && readImage(e.target.files[0], (avatar) => set({ avatar }))} />
                    </label>
                  </div>
                  <div className="bw-fields">
                    <div className="bw-lrow">
                      <label htmlFor="bw-name">Display Name</label>
                      {(regenKey === "name" || profile.name.trim()) && (
                      <button type="button" className="bw-ri" aria-label="Regenerate name" data-tip="Regenerate" disabled={regenKey === "name"} onClick={() => regen("name", "name", profile.name, (d) => { if (d.name) set({ name: d.name }); })}>
                        <RefreshCw size={14} className={regenKey === "name" ? "spin" : undefined} />
                      </button>
                      )}
                    </div>
                    <input id="bw-name" className={`bw-input${nameBad ? " err" : ""}`} value={profile.name} maxLength={50} onChange={(e) => set({ name: e.target.value })} />
                    <div className="bw-lrow">
                      <label htmlFor="bw-bio">Bio</label>
                      {(regenKey === "bio" || profile.bio.trim()) && (
                      <button type="button" className="bw-ri" aria-label="Regenerate bio" data-tip="Regenerate" disabled={regenKey === "bio"} onClick={() => regen("bio", "bio", profile.bio, (d) => set({ bio: d.bio }))}>
                        <RefreshCw size={14} className={regenKey === "bio" ? "spin" : undefined} />
                      </button>
                      )}
                    </div>
                    <div className="bw-ta">
                      <textarea id="bw-bio" value={profile.bio} maxLength={BIO_MAX} onChange={(e) => set({ bio: e.target.value })} />
                      <span>{[...profile.bio].length}/{BIO_MAX}</span>
                    </div>
                    <div className="bw-lrow">
                      <label htmlFor="bw-link">Store link</label>
                      {(regenKey === "link" || slugValue.trim()) && (
                      <button type="button" className="bw-ri" aria-label="Regenerate store link" data-tip="Regenerate" disabled={regenKey === "link"} onClick={() => regen("link", "link", slugValue, (d) => { if (d.link) setLink(d.link); })}>
                        <RefreshCw size={14} className={regenKey === "link" ? "spin" : undefined} />
                      </button>
                      )}
                    </div>
                    <div className={`bw-link${linkBad ? " err" : ""}`} data-invalid={linkBad || undefined}>
                      <span>{host}/</span>
                      <input id="bw-link" value={slugValue} maxLength={40} autoCapitalize="none" spellCheck={false} onChange={(e) => setLink(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))} />
                    </div>
                  </div>
                </section>
                <section className="bw-section">
                  <span className="pf-label">
                    Products
                    <span className="bw-add">
                      <button type="button" className="bw-plus" aria-label="Add product" aria-expanded={addMenu} onClick={() => setAddMenu(!addMenu)}><Plus size={16} /></button>
                      {addMenu && (
                        <div className="bw-add-menu" role="menu">
                          {(["file", "premium", "community"] as Product["kind"][]).map((k) => (
                            <button type="button" role="menuitem" key={k} onClick={() => addProduct(k)}>
                              <span className="bw-add-ic" style={{ background: kindMeta[k].bg }}>{kindMeta[k].emoji}</span>
                              <span className="bw-add-copy">
                                <b>{kindMeta[k].label}</b>
                                <small>{kindBlurb[k]}</small>
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </span>
                  </span>
                  {products.map((p, i) => (
                    <ProductCard
                      key={i}
                      p={p}
                      open={openCard === i}
                      showErrors={showErrors}
                      regenField={regenKey?.startsWith(`p${i}.`) ? regenKey.slice(String(i).length + 2) : null}
                      onRegen={(f) => regen(p.kind, `p${i}.${f}`, String(p[f] ?? ""), (d) => {
                        const v = (d.product as Partial<Product>)[f];
                        if (v) setProducts((all) => all.map((x, j) => (j === i ? { ...x, [f]: v } : x)));
                      }, f)}
                      onToggle={() => setOpenCard(openCard === i ? -1 : i)}
                      onChange={(patch) => setProducts(products.map((x, j) => (j === i ? { ...x, ...patch } : x)))}
                      onDelete={() => {
                        setProducts(products.filter((_, j) => j !== i));
                        setOpenCard(-1);
                      }}
                    />
                  ))}
                </section>
                <section className="bw-section">
                  <span className="pf-label">Socials</span>
                  <SocialsFields socials={profile.socials} onChange={(socials) => set({ socials })} />
                </section>
              </div>
            </>
          )}

          <div className="bw-foot">
            {step > 1 && (
              <button className="bw-regen" onClick={() => { setDraftedFrom(""); setError(""); setStep(1); }}>
                <RefreshCw size={14} /> Regenerate
              </button>
            )}
            <div className="bw-actions">
              {step === 2 && (
                <button className="bw-skip" onClick={() => onFinish(products, slugValue || baseSlug(profile.name), false)}>
                  Save
                </button>
              )}
              {step === 1 && (
                <button className="bw-next" disabled={!profile.about.trim() || loading} onClick={() => draft()}>
                  {loading ? <><Loader2 size={15} className="spin" /> Setting up</> : "Next"}
                </button>
              )}
              {step === 2 && (
                <button className="bw-next" onClick={publish}>
                  Publish
                </button>
              )}
            </div>
          </div>
        </div>
        {step > 1 && (
          <div className="bw-right">
            <PhonePreview theme={theme} blocks={previewBlocks} slug={slugValue} />
            <div className="bw-themes" role="radiogroup" aria-label="Theme">
              {themes.map((t, i) => (
                <button type="button" key={t} role="radio" aria-checked={t === theme} aria-label={`Theme ${i + 1}`} className={t === theme ? "on" : ""} style={{ background: t }} onClick={() => setTheme(t)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
