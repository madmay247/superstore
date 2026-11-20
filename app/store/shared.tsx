"use client";

import { createContext, useContext, useState } from "react";
import { Instagram, Facebook, Youtube, Linkedin, ChevronDown } from "lucide-react";
import { user, store, themeInk } from "../data";
import { useHost } from "./persist";
import { ProductLanding } from "./ProductLanding";

export type Block = { id: number; title: string; url?: string; meta?: string; product?: boolean; data?: Product; emoji?: string; emojiBg?: string; live?: boolean };

export type ProductKind = "file" | "discovery" | "premium" | "community";
export type Upload = { name: string; size: number };
export type Product = {
  kind: ProductKind;
  live?: boolean;
  title: string;
  description: string;
  price: number;
  /* digital file */
  buttonText?: string;
  file?: Upload;
  /* community */
  link?: string;
  /* 1:1 session */
  emoji?: string;
  duration?: number;
  collectLeads?: boolean;
  shortDescription?: string;
  cover?: string;
  pricing?: PricingMode;
  discount?: number;
  recurring?: boolean;
  policy?: boolean;
  sections?: string[];
};
export type PricingMode = "fixed" | "pwyw" | "free";

export const formatPrice = (p: number) => (p ? `₹${p.toLocaleString("en-IN")}` : "Free");
export type SocialKey = "instagram" | "facebook" | "x" | "youtube" | "linkedin";
export type Profile = { name: string; bio: string; about: string; avatar?: string; socials: Record<SocialKey, string> };

type IconLike = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

function XLogo({ size = 16, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path fill={color} d="M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.46 21H2.39l7.17-8.2L2 3h6.33l4.37 5.77L17.75 3zm-1.08 16.17h1.7L7.4 4.74H5.58l11.09 14.43z" />
    </svg>
  );
}

export const socialsMeta: { key: SocialKey; Icon: IconLike; color: string; bg?: string }[] = [
  { key: "instagram", Icon: Instagram, color: "#d6249f" },
  { key: "facebook", Icon: Facebook, color: "#1877f2" },
  { key: "x", Icon: XLogo, color: "#fff", bg: "#000" },
  { key: "youtube", Icon: Youtube, color: "#ff0000" },
  { key: "linkedin", Icon: Linkedin, color: "#fff", bg: "#0a66c2" },
];

export const defaultProfile: Profile = {
  name: user.fullName,
  bio: store.bio,
  about: "",
  avatar: "/alex-avatar.svg",
  socials: { instagram: "", facebook: "", x: "", youtube: "", linkedin: "" },
};
/* Decorative only: shown blurred behind the setup popup, never in any form or saved store */
export const backdropProfile: Profile = {
  name: user.fullName,
  bio: "Fitness coach helping busy professionals get fit in 30 minutes a day. Home workouts, simple meal plans.",
  about: "",
  avatar: "/alex-avatar.svg",
  socials: { instagram: "x", facebook: "x", x: "x", youtube: "x", linkedin: "x" },
};
export const ProfileContext = createContext<Profile>(defaultProfile);
export const useProfile = () => useContext(ProfileContext);

export function Avatar({ size }: { size: number }) {
  // Stores saved before the default existed have no avatar; fall back so they never show the grey silhouette
  const avatar = useProfile().avatar || defaultProfile.avatar;
  return (
    <span className="st-avatar" style={{ width: size, height: size }}>
      {avatar ? (
        <img src={avatar} alt="" width={size} height={size} />
      ) : (
      <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
        <rect width="40" height="40" fill="#d9d9d9" />
        <circle cx="20" cy="15" r="7" fill="#111" />
        <path d="M5 40c1-9 7-14 15-14s14 5 15 14z" fill="#111" />
      </svg>
      )}
    </span>
  );
}

export function SocialBadge({ k, size = 26 }: { k: SocialKey; size?: number }) {
  const m = socialsMeta.find((s) => s.key === k)!;
  return (
    <span className="ig-badge" style={{ width: size, height: size }}>
      <span className="sb-inner" style={{ background: m.bg, width: size * 0.72, height: size * 0.72 }}>
        <m.Icon size={size * (m.bg ? 0.46 : 0.6)} color={m.color} strokeWidth={2.2} />
      </span>
    </span>
  );
}

/* Row of badges for every social the creator has filled in */
export function SocialRow({ size = 26 }: { size?: number }) {
  const { socials } = useProfile();
  const filled = socialsMeta.filter((s) => socials[s.key].trim());
  if (!filled.length) return null;
  return (
    <span className="social-row">
      {filled.map((s) => (
        <SocialBadge key={s.key} k={s.key} size={size} />
      ))}
    </span>
  );
}

const landingCta = (d: Product) => (d.kind === "file" ? d.buttonText?.trim() || "Get it now" : d.kind === "community" ? "Join community" : "Book now");

/* The product list a visitor sees: tap a product to expand its description, then open its landing page.
   Shared by the editor's phone preview and the public store page so the two never drift apart. */
export function StoreBlocks({ theme, blocks, small }: { theme: string; blocks: Block[]; small?: boolean }) {
  const [openId, setOpenId] = useState<number | null>(null);
  const [landing, setLanding] = useState<Block | null>(null); /* kept separate from openId so closing the page leaves the dropdown as it was */
  return (
    <>
      <div className="pp-blocks">
        {blocks.filter((b) => b.live !== false).map((b) => {
          const icon = b.emoji && <span className="pp-ic" style={b.emojiBg ? { background: b.emojiBg } : undefined}>{b.emoji}</span>;
          const copy = (
            <span className="pp-copy">
              {b.title}
              {b.meta && <small>{b.meta}</small>}
            </span>
          );
          if (!b.data) {
            const cls = `pp-block${b.emoji ? " has-ic" : ""}`;
            const href = b.url && (b.url.startsWith("http") ? b.url : `https://${b.url}`);
            return href ? (
              <a className={cls} key={b.id} href={href} target="_blank" rel="noopener noreferrer">{icon}{copy}</a>
            ) : (
              <div className={cls} key={b.id}>{icon}{copy}</div>
            );
          }
          const open = openId === b.id;
          const d = b.data;
          const cta = landingCta(d);
          return (
            <div className={`pp-block has-ic exp${open ? " open" : ""}`} key={b.id}>
              <button type="button" className="pp-head" aria-expanded={open} onClick={() => { setOpenId(open ? null : b.id); if (!open) setLanding(b); }}>
                {icon}
                {copy}
                <ChevronDown size={small ? 11 : 16} className="pp-chev" />
              </button>
              {open && (
                <div className="pp-more">
                  {d.description.trim() && <p>{d.description}</p>}
                  <button type="button" className="pp-cta" onClick={() => setLanding(b)}>{cta}</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {landing?.data && <ProductLanding product={landing.data} theme={theme} cta={landingCta(landing.data)} onClose={() => setLanding(null)} />}
    </>
  );
}

export function PhonePreview({ theme, blocks, small, slug }: { theme: string; blocks: Block[]; small?: boolean; slug?: string }) {
  const { name, bio } = useProfile();
  const host = useHost();
  return (
    <div className={`pp${small ? " sm" : ""}`} style={{ background: theme }}>
      <div className="pp-top" style={themeInk(theme)}>
        <Avatar size={small ? 88 : 120} />
        <b>{name}</b>
        <span className="pp-bio">{bio}</span>
        <SocialRow size={small ? 18 : 26} />
      </div>
      <StoreBlocks theme={theme} blocks={blocks} small={small} />
      {slug && host && <div className="pp-url" title={`${host}/${slug}`}>{host}/{slug}</div>}
    </div>
  );
}
