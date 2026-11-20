"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store, ArrowUp, ChevronUp, X, RotateCcw } from "lucide-react";
import { BRAND, user } from "./data";

export function Logo() {
  return (
    <div className="logo">
      <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden>
        <defs>
          <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#38b6ff" />
            <stop offset="1" stopColor="#1264fe" />
          </linearGradient>
        </defs>
        <path d="M20 2 L6 18 h8 l-4 12 L26 13 h-8 z" fill="url(#lg)" />
      </svg>
      <span>
        <b>{BRAND.first}</b>
        {BRAND.second}
      </span>
    </div>
  );
}

export default function Sidebar({ onClose, onReset }: { onClose?: () => void; onReset?: () => void }) {
  const path = usePathname();
  return (
    <nav className="sidebar">
      <div className="sb-top">
        <Logo />
        <button className="sb-close" aria-label="Close menu" onClick={onClose}>
          <X size={22} />
        </button>
      </div>
      <div className="sb-scroll">
        <Link href="/" className={`sb-item app${path === "/" ? " active" : ""}`}>
          <span className="app-ic" style={{ background: "linear-gradient(135deg,#34c47c,#1f9d5c)" }}>
            <Store size={12} color="#fff" strokeWidth={2.4} />
          </span>
          <span>Store</span>
        </Link>
      </div>
      <div className="sb-bottom">
        {onReset && (
          <button className="sb-reset" onClick={onReset}>
            <RotateCcw size={17} strokeWidth={1.8} /> Reset everything
          </button>
        )}
        <div className="sb-plan-wrap">
          <button className="sb-plan">
            <span>You&apos;re on the Free plan</span>
            <span className="sb-plan-up">
              <ArrowUp size={12} strokeWidth={3} />
            </span>
          </button>
        </div>
        <div className="sb-user">
          <span className="avatar">{user.fullName.split(" ").map((s) => s[0]).join("")}</span>
          <span className="sb-user-name">{user.fullName}</span>
          <ChevronUp size={15} />
        </div>
      </div>
    </nav>
  );
}
