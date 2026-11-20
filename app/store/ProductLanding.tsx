"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, ChevronDown, Clock, Repeat, FileText, ShieldCheck } from "lucide-react";
import { themeInk } from "../data";
import { Avatar, RichDesc, formatPrice, useProfile, type Product } from "./shared";

const KIND_LABEL: Record<Product["kind"], string> = { file: "Digital file", discovery: "1:1 session", premium: "1:1 session", community: "Community" };
const kb = (n: number) => (n > 1e6 ? `${(n / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1e3))} KB`);


/* Booking picker (sessions). There's no availability data yet, so slots are a fixed placeholder set (hourly, 9 AM to 5 PM) over the next two weeks. */
const TIMES = ["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"];
const PAGE = 4;
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
const offsetOf = (tz: string) => {
  try {
    return new Intl.DateTimeFormat("en", { timeZone: tz, timeZoneName: "shortOffset" }).formatToParts(new Date()).find((x) => x.type === "timeZoneName")?.value ?? "GMT";
  } catch {
    return "GMT";
  }
};
const offsetMins = (label: string) => {
  const m = label.match(/GMT([+-])(\d+)(?::(\d+))?/);
  return m ? (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] ?? 0)) : 0;
};
const buildZones = () => {
  let names: string[] = [];
  try {
    names = Intl.supportedValuesOf("timeZone");
  } catch {}
  const here = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (here && !names.includes(here)) names = [here, ...names];
  return names
    .map((tz) => ({ tz, off: offsetOf(tz) }))
    .sort((a, b) => offsetMins(a.off) - offsetMins(b.off) || a.tz.localeCompare(b.tz))
    .map(({ tz, off }) => ({ tz, label: `(${off}) ${tz.replace(/_/g, " ")}` }));
};

type Booking = { date: number | null; time: string | null; tz: string; email: string };

function BookingPanel({ b, set, meta }: { b: Booking; set: (p: Partial<Booking>) => void; meta?: React.ReactNode[] }) {
  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i + 1); return d; }), []);
  const zones = useMemo(buildZones, []);
  const [page, setPage] = useState(0);
  const shown = days.slice(page * PAGE, page * PAGE + PAGE);
  const last = Math.ceil(days.length / PAGE) - 1;
  return (
    <div className="pl-book">
      {meta && meta.length > 0 && <div className="pl-meta">{meta}</div>}
      <h3>When should we meet?</h3>
      <div className="pl-dates">
        <button type="button" className="pl-arrow" aria-label="Earlier dates" disabled={page === 0} onClick={() => setPage(page - 1)}><ArrowLeft size={16} /></button>
        <div className="pl-date-row">
          {shown.map((d) => (
            <button type="button" key={d.getTime()} className={`pl-date${b.date === d.getTime() ? " on" : ""}`} aria-pressed={b.date === d.getTime()} onClick={() => set({ date: d.getTime() })}>
              <span>{d.toLocaleDateString("en-GB", { weekday: "short" })}</span>
              <b>{d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</b>
            </button>
          ))}
        </div>
        <button type="button" className="pl-arrow" aria-label="Later dates" disabled={page === last} onClick={() => setPage(page + 1)}><ArrowRight size={16} /></button>
      </div>
      <h3>Select time of day</h3>
      <div className="pl-times">
        {TIMES.map((t) => (
          <button type="button" key={t} className={`pl-time${b.time === t ? " on" : ""}`} aria-pressed={b.time === t} onClick={() => set({ time: t })}>{t}</button>
        ))}
      </div>
      <h3>Timezone</h3>
      <label className="pl-select">
        <select value={b.tz} onChange={(e) => set({ tz: e.target.value })} aria-label="Timezone">
          {zones.map((z) => <option key={z.tz} value={z.tz}>{z.label}</option>)}
        </select>
        <ChevronDown size={16} />
      </label>
      <h3>Email</h3>
      <input className="pl-email" type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" value={b.email} onChange={(e) => set({ email: e.target.value })} />
    </div>
  );
}

/* The full-page view a visitor lands on after tapping a product: only what we actually have about it, plus the call to action.
   Rendered in a portal on the body so it sits above the whole app. The community invite link is deliberately not shown: it's what buyers get. */
export function ProductLanding({ product: p, theme, cta, onClose }: { product: Product; theme: string; cta: string; onClose: () => void }) {
  const { name, bio } = useProfile();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const mode = p.pricing ?? (p.price > 0 ? "fixed" : p.kind === "file" ? "free" : "fixed");
  const free = mode === "free" || !p.price;
  const discounted = mode === "fixed" && !free && p.discount !== undefined && p.discount > 0 && p.discount < p.price;
  const session = p.kind === "discovery" || p.kind === "premium";
  const [book, setBook] = useState<Booking>(() => ({ date: null, time: null, tz: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", email: "" }));
  const setBooking = (patch: Partial<Booking>) => setBook((b) => ({ ...b, ...patch }));
  const ready = !session || (book.date !== null && !!book.time && isEmail(book.email));

  const stats: React.ReactNode[] = [
    <span key="price" className="pl-price">
      {discounted && <s>{formatPrice(p.price)}</s>}
      {free ? "Free" : mode === "pwyw" ? `${formatPrice(p.price)}+` : formatPrice(discounted ? p.discount! : p.price)}
      {mode === "pwyw" && <small>pay what you want</small>}
    </span>,
  ].filter(Boolean);
  const meta: React.ReactNode[] = [
    session && p.recurring ? <span key="rec"><Repeat size={16} /> Recurring</span> : null,
    session && p.policy ? <span key="pol"><ShieldCheck size={16} /> Reschedule policy</span> : null,
  ].filter(Boolean);

  return createPortal(
    <div className="pl" style={{ background: theme }} role="dialog" aria-modal="true" aria-label={p.title || "Product"}>
      <div className="pl-scroll" style={themeInk(theme)}>
        <div className="pl-wrap">
          <div className="pl-main">
          <div className="pl-top">
          <div className="pl-bar">
            <button type="button" className="pl-back" aria-label="Back" onClick={onClose}><ArrowLeft size={22} /></button>
            <span className="pl-by"><Avatar size={32} /><span>{name}</span></span>
          </div>
          {p.cover && <img className="pl-cover" src={p.cover} alt="" />}
          </div>
          <div className="pl-body">
            <div className="pl-boxhead">
              <div className="pl-boxhead-copy">
                <h1>{p.emoji ? `${p.emoji} ` : ""}{p.title || "Untitled"}</h1>
                {session && p.duration ? <span className="pl-pill"><Clock size={14} /> {p.duration} mins</span> : null}
                {p.shortDescription && <p className="pl-short">{p.shortDescription}</p>}
              </div>
            </div>
            <div className="pl-stats">{stats.map((x, i) => <div key={i}>{x}</div>)}</div>
            {p.description.trim() && <RichDesc text={p.description} className="pl-desc pl-desc-body" />}
            {session && <div className="pl-book-inline"><BookingPanel b={book} set={setBooking} meta={meta} /></div>}
            {p.kind === "file" && p.file && (
              <div className="pl-incl">
                <FileText size={18} />
                <span><b>{p.file.name}</b>{kb(p.file.size)}</span>
              </div>
            )}
            {p.kind === "file" && p.collectLeads !== false && <p className="pl-note">Ask for name and email before buyers get the file</p>}
            {bio && (
              <div className="pl-creator">
                <Avatar size={44} />
                <span><b>{name}</b>{bio}</span>
              </div>
            )}
          </div>
          </div>
          <aside className="pl-aside">
            <div className="pl-aside-card">
              <div className="pl-aside-price">{stats[0]}</div>
              {session && <BookingPanel b={book} set={setBooking} meta={meta} />}
              <button type="button" className="pl-cta" disabled={!ready}>{session ? "Continue" : cta}</button>
              {p.kind === "file" && p.collectLeads !== false && <p className="pl-note">Ask for name and email before buyers get the file</p>}
            </div>
          </aside>
        </div>
      </div>
      <div className="pl-foot">
        <button type="button" className="pl-cta" disabled={!ready}>{session ? "Continue" : cta}</button>
      </div>
    </div>,
    document.body,
  );
}
