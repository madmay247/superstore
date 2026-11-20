"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, ChevronDown, Pencil, GripVertical, Trash2, Smartphone, X } from "lucide-react";
import { store, themes } from "./data";
import { ProductForm, WelcomeModal, AddProductModal, newProduct, EditLinkModal, EditHeaderModal, BrandWizard, productBlock, missing } from "./store/StoreModals";
import { Avatar, SocialRow, PhonePreview, ProfileContext, defaultProfile, backdropProfile, useProfile, type Block, type Profile } from "./store/shared";
import { baseSlug, loadStore, nextSlug, publishStore, regenProductField, saveStore, storeUrl, unpublishStore, useHost, type PublishResult } from "./store/persist";

const TABS = ["Store"] as const;

/* ---------------- Store ---------------- */
function StoreTab({ blocks, setBlocks, theme, onAdd, slug, onEditLink, onEditHeader, onShare, copied, openId, setOpenId, pv, setPv, published, onPublish, sync, onRetry }: {
  published: boolean; onPublish: () => void; sync: PublishResult; onRetry: () => void;
  pv: boolean; setPv: (v: boolean) => void;
  openId: number | null; setOpenId: (id: number | null) => void;
  blocks: Block[]; setBlocks: (b: Block[]) => void; theme: string; onAdd: () => void; slug: string; onEditLink: () => void; onEditHeader: () => void; onShare: () => void; copied: boolean;
}) {
  const profile = useProfile();
  const host = useHost();
  const [regen, setRegen] = useState<{ id: number; field: string } | null>(null);
  const [regenError, setRegenError] = useState("");
  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;
  /* Fresh AI take on one field of one product, patched into the latest blocks when it lands */
  const regenField = async (id: number, field: "title" | "description") => {
    const b = blocks.find((x) => x.id === id);
    if (!b?.data || regen) return;
    setRegen({ id, field });
    setRegenError("");
    try {
      const about = profile.about.trim() || `${profile.name}. ${profile.bio}`;
      const v = await regenProductField(about, b.data.kind, field, b.data[field]);
      setBlocks(blocksRef.current.map((x) => (x.id === id && x.data ? { ...x, ...productBlock({ ...x.data, [field]: v }) } : x)));
    } catch (e) {
      setRegenError(e instanceof Error && e.message ? e.message : "Couldn't write a new version right now. Your text is unchanged.");
    } finally {
      setRegen(null);
    }
  };

  useEffect(() => {
    if (!pv) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && setPv(false);
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [pv]);

  return (
    <div className="st-split">
      <div className="st-left">
        {published && (sync === "error" || sync === "too_big") && (
          <div className="sync-note" role="status">
            <span>{sync === "too_big" ? "Your latest changes aren’t live: the store is too big. Try a smaller picture." : "Your latest changes aren’t live yet. We couldn’t reach the server."}</span>
            {sync === "error" && <button type="button" onClick={onRetry}>Try again</button>}
          </div>
        )}
        <div className={`live${published ? "" : " off"}`}>
          {published ? (
            <>
              <span>🚀 Your Store is live: <a href={`/${slug}`} target="_blank" rel="noopener noreferrer">{host}/{slug}</a></span>
              <button className="live-edit" onClick={onEditLink}>Edit</button>
              <button className="live-share" onClick={onShare}>{copied ? "Copied!" : "Copy Link"}</button>
            </>
          ) : (
            <>
              <span>🔒 Your Store isn’t published yet.</span>
              <button className="live-edit" onClick={onEditLink}>Edit link</button>
              <button className="live-share" onClick={onPublish}>Publish</button>
            </>
          )}
        </div>

        <div className="st-card st-profile">
          <Avatar size={82} />
          <div className="st-prof-copy">
            <b>{profile.name}</b>
            <span>{profile.bio}</span>
            <SocialRow />
          </div>
          <button className="pill-grey" onClick={onEditHeader}>
            <Pencil size={13} /> Edit header
          </button>
        </div>

        {blocks.length > 0 && (
          <div className="blocks">
            {blocks.map((b) => (
              <div className={`st-card block${openId === b.id ? " open" : ""}`} key={b.id}>
                <GripVertical size={16} color="#aaa" className="grip" />
                <div
                  className={`block-copy${b.data ? " expandable" : ""}`}
                  onClick={b.data ? () => setOpenId(openId === b.id ? null : b.id) : undefined}
                >
                  <b>{b.emoji ? `${b.emoji} ` : ""}{b.title || "Untitled"}</b>
                  {(b.url || b.meta) && <span>{b.url ?? b.meta}</span>}
                </div>
                {b.data && (
                  <ChevronDown size={18} className="block-chev" onClick={() => setOpenId(openId === b.id ? null : b.id)} />
                )}
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={b.live !== false}
                    disabled={!!b.data && missing(b.data).length > 0}
                    onChange={(e) =>
                      setBlocks(blocks.map((x) => (x.id === b.id ? { ...x, live: e.target.checked, ...(x.data ? { data: { ...x.data, live: e.target.checked } } : {}) } : x)))
                    }
                  />
                  <i />
                </label>
                <button className="block-del" aria-label="Delete" onClick={() => setBlocks(blocks.filter((x) => x.id !== b.id))}>
                  <Trash2 size={15} color="#888" />
                </button>
                {b.data && openId === b.id && (
                  <div className="block-form">
                    <ProductForm
                      p={b.data}
                      bad={() => false}
                      onRegen={(f) => regenField(b.id, f)}
                      regenField={regen?.id === b.id ? regen.field : null}
                      onChange={(patch) =>
                        setBlocks(blocks.map((x) => (x.id === b.id ? { ...x, ...productBlock({ ...b.data!, ...patch }) } : x)))
                      }
                    />
                    {regenError && openId === b.id && <small className="pf-note">{regenError}</small>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="st-divider" />
        <button className="add-content" onClick={onAdd}>
          + Add Content
        </button>
      </div>
      <div className={`st-right${pv ? " open" : ""}`} role={pv ? "dialog" : undefined} aria-label="Store preview">
        <div className="pv-head">
          <b>Preview</b>
          <button aria-label="Close preview" onClick={() => setPv(false)}>
            <X size={22} />
          </button>
        </div>
        <PhonePreview theme={theme} blocks={blocks} slug={slug} />
      </div>
    </div>
  );
}

/* ---------------- Page ---------------- */
export default function Page() {
  const host = useHost();
  const [pv, setPv] = useState(false);
  const [published, setPublished] = useState(false);
  const [welcome, setWelcome] = useState(false);
  const [wizard, setWizard] = useState(false);
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [adding, setAdding] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);
  const [slug, setSlug] = useState(store.slug);
  const [editingLink, setEditingLink] = useState(false);
  const [editingHeader, setEditingHeader] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [theme, setTheme] = useState(themes[9]);
  /* Result of the last save to the server, so the creator is told when "live" isn't really up to date */
  const [sync, setSync] = useState<PublishResult>("ok");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const saved = loadStore();
    if (saved) {
      setSlug(saved.slug);
      setProfile(saved.profile);
      setBlocks(saved.blocks);
      setTheme(saved.theme);
      setPublished(saved.published ?? saved.slug !== store.slug);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const s = { slug, profile, blocks, theme, published };
    saveStore(s);
    // Saved-only stores stay on this device. The demo slug is a placeholder until setup finishes; never claim it on the server
    if (!published || slug === store.slug) return;
    // Debounced so typing doesn't hit the server on every keystroke.
    // If another creator already owns this link, move to a free one instead of failing silently.
    const t = setTimeout(async () => {
      const r = await publishStore(s);
      if (r === "taken") setSlug(nextSlug(slug, profile.name));
      else setSync(r);
    }, 600);
    return () => clearTimeout(t);
  }, [loaded, slug, profile, blocks, theme, published, retry]);

  /* Take the store offline on the server first; only then mark it unpublished here, so the two never disagree */
  const unpublish = async () => {
    if (!(await unpublishStore(slug))) return "Couldn't unpublish right now. Try again.";
    setPublished(false);
    setEditingLink(false);
  };


  const share = () => {
    navigator.clipboard?.writeText(storeUrl(slug)).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Setup opens only until it has been finished once; the reset button clears the flag
  useEffect(() => {
    try {
      if (!localStorage.getItem("store-welcome-seen")) setWelcome(true);
    } catch {
      setWelcome(true);
    }
  }, []);

  const setupOpen = welcome || wizard;
  const backdropBlocks: Block[] = [
    { id: -1, ...productBlock({ kind: "file", title: "30-Minute Home Workout Guide", description: "x", buttonText: "Get it now", price: 0, file: { name: "guide.pdf", size: 1 } }) },
    { id: -2, ...productBlock({ kind: "discovery", title: "Fitness Discovery Call", description: "x", duration: 30, price: 499 }) },
    { id: -3, ...productBlock({ kind: "premium", title: "1-on-1 Coaching Session", description: "x", duration: 60, price: 2999 }) },
  ];

  return (
    <ProfileContext.Provider value={profile}>
    <div className="st">
      <header className="st-top">
        <nav className="st-tabs">
          {TABS.map((t) => (
            <span key={t} className={t === "Store" ? "on" : ""}>{t}</span>
          ))}
        </nav>
        <button type="button" className="st-pv" onClick={() => setPv(true)}>
          <Smartphone size={16} /> Preview
        </button>
        {published && (
          <a className="st-share" href={`/${slug}`} target="_blank" rel="noopener noreferrer">
            <ExternalLink size={16} /> <span>View Store</span>
          </a>
        )}
      </header>

      <div className="st-content">
        <ProfileContext.Provider value={setupOpen ? backdropProfile : profile}>
        <StoreTab blocks={setupOpen ? backdropBlocks : blocks} setBlocks={setBlocks} theme={theme} onAdd={() => setAdding(true)} openId={openId} setOpenId={setOpenId} slug={slug} onEditLink={() => setEditingLink(true)} onEditHeader={() => setEditingHeader(true)} onShare={share} copied={copied} pv={pv} setPv={setPv} published={published} onPublish={() => setPublished(true)} sync={sync} onRetry={() => setRetry((n) => n + 1)} />
        </ProfileContext.Provider>
      </div>

      {welcome && (
        <WelcomeModal
          onClose={() => {
            setWelcome(false);
            setWizard(true);
          }}
        />
      )}
      {wizard && (
        <BrandWizard
          profile={profile}
          setProfile={setProfile}
          theme={theme}
          setTheme={setTheme}
          blocks={blocks}
          onFinish={(products, link, publish) => {
            try {
              localStorage.setItem("store-welcome-seen", "1");
            } catch {}
            setWizard(false);
            setPublished(publish);
            setSlug(link || baseSlug(profile.name));
            const now = Date.now();
            setBlocks([...blocks, ...products.map((p, i) => ({ id: now + i, ...productBlock(p) }))]);
          }}
        />
      )}
      {editingHeader && (
        <EditHeaderModal
          profile={profile}
          onClose={() => setEditingHeader(false)}
          onSave={(p) => {
            setProfile(p);
            setEditingHeader(false);
          }}
        />
      )}
      {editingLink && (
        <EditLinkModal
          domain={host}
          slug={slug}
          onClose={() => setEditingLink(false)}
          onUnpublish={published ? unpublish : undefined}
          onSave={async (v) => {
            if (v === slug) return setEditingLink(false);
            if (!published) {
              setSlug(v);
              return setEditingLink(false);
            }
            const r = await publishStore({ slug: v, profile, blocks, theme });
            if (r === "taken") return "That link is already taken";
            if (r === "too_big") return "Your store is too big to publish. Try a smaller picture.";
            if (r === "error") return "We couldn't reach the server. Try again in a moment.";
            unpublishStore(slug);
            setSlug(v);
            setEditingLink(false);
          }}
        />
      )}
      {adding && (
        <AddProductModal
          onClose={() => setAdding(false)}
          onAdd={(kind) => {
            const id = Date.now();
            setBlocks([...blocks, { id, ...productBlock(newProduct(kind)) }]);
            setOpenId(id);
            setAdding(false);
          }}
        />
      )}
    </div>
    </ProfileContext.Provider>
  );
}

