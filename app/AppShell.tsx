"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, RotateCcw } from "lucide-react";
import Sidebar, { Logo } from "./Sidebar";
import { resetEverything } from "./store/persist";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);
  const path = usePathname();

  useEffect(() => {
    if (!navOpen) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && setNavOpen(false);
    window.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", h);
      document.body.style.overflow = "";
    };
  }, [navOpen]);

  const [confirming, setConfirming] = useState(false);
  const [resetting, setResetting] = useState(false);

  if (path !== "/") return <>{children}</>;

  const reset = () => setConfirming(true);
  const doReset = async () => {
    setResetting(true);
    await resetEverything();
    window.location.href = "/";
  };

  return (
    <div className="shell">
      <div className={`sb-wrap${navOpen ? " open" : ""}`} onClick={() => setNavOpen(false)}>
        <Sidebar onClose={() => setNavOpen(false)} onReset={reset} />
      </div>

      <header className="mobile-bar">
        <button aria-label="Open menu" aria-expanded={navOpen} onClick={() => setNavOpen(true)}>
          <Menu size={22} />
        </button>
        <Logo />
      </header>

      <main className={`main${path === "/" ? " main-store" : ""}`}>
        {children}
        <button
          className="chat-fab"
          aria-label="Reset everything"
          title="Reset everything"
          onClick={reset}
        >
          <RotateCcw size={24} strokeWidth={2.4} />
        </button>
      </main>
      {confirming && (
        <div className="overlay rs-overlay" onClick={() => !resetting && setConfirming(false)}>
          <div className="rs-dialog" role="alertdialog" aria-labelledby="rs-title" onClick={(e) => e.stopPropagation()}>
            <h3 id="rs-title">Reset everything?</h3>
            <p>This deletes your store, products and profile, and takes your published link offline. It can&apos;t be undone.</p>
            <div className="rs-actions">
              <button type="button" className="rs-cancel" disabled={resetting} onClick={() => setConfirming(false)}>Cancel</button>
              <button type="button" className="rs-confirm" disabled={resetting} onClick={doReset}>{resetting ? "Resetting…" : "Reset everything"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
