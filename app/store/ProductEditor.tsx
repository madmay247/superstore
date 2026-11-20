"use client";

import { useEffect, useState } from "react";
import { X, Paperclip, Clock, Share2, ImagePlus } from "lucide-react";
import { useProfile, Avatar, formatPrice, type Product, type PricingMode, type Upload } from "./shared";
import { readImage } from "./persist";

const EMOJIS = ["😎", "👋", "🎯", "💡", "🚀", "📈", "🧠", "☕", "🎓", "💬", "🔥", "✨"];
const SECTIONS = ["Gallery", "Testimonials", "FAQ", "About Me", "Showcase Products"];
const MODES: { key: PricingMode; title: string; text: string }[] = [
  { key: "fixed", title: "Fixed Price", text: "Charge a one-time fixed pay" },
  { key: "pwyw", title: "Customer decides price", text: "Let customers pay what they want" },
  { key: "free", title: "Free", text: "Allow access for free" },
];
const kb = (n: number) => (n > 1e6 ? `${(n / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1e3))} KB`);

type Patch = (p: Partial<Product>) => void;

function Row({ label, count, max, children }: { label: string; count?: number; max?: number; children: React.ReactNode }) {
  return (
    <div className="pe-field">
      <span className="pe-label">
        {label}
        {max !== undefined && <em>{count}/{max}</em>}
      </span>
      {children}
    </div>
  );
}

function Cover({ p, onChange, required }: { p: Product; onChange: Patch; required?: boolean }) {
  return (
    <Row label={`Cover Image${required ? " *" : " (optional)"}`}>
      {p.cover ? (
        <div className="pe-cover">
          <img src={p.cover} alt="" />
          <button type="button" aria-label="Remove cover" onClick={() => onChange({ cover: undefined })}><X size={15} /></button>
        </div>
      ) : (
        <label className="pe-drop">
          <span className="pe-drop-ic"><ImagePlus size={20} /></span>
          <span><b>Upload</b> {required ? "or drag & drop" : "files from your system"}</span>
          <small>1280 x 720 (16:9) recommended, up to 10MB each</small>
          <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && readImage(e.target.files[0], (cover) => onChange({ cover }))} />
        </label>
      )}
    </Row>
  );
}

function PricingBlock({ p, onChange }: { p: Product; onChange: Patch }) {
  const mode = p.pricing ?? (p.price > 0 ? "fixed" : p.kind === "file" ? "free" : "fixed");
  return (
    <section className="pe-sec">
      <h3>Set Pricing</h3>
      <div className="pe-modes" role="radiogroup">
        {MODES.map((m) => (
          <button type="button" role="radio" aria-checked={mode === m.key} key={m.key} className={`pe-mode${mode === m.key ? " on" : ""}`} onClick={() => onChange({ pricing: m.key, ...(m.key === "free" ? { price: 0 } : {}) })}>
            <b>{m.title}</b>
            <span>{m.text}</span>
            <i />
          </button>
        ))}
      </div>
      {mode !== "free" && (
        <>
          <Row label={mode === "pwyw" ? "Minimum price" : "Price"}>
            <div className="pe-money">
              <span>₹</span>
              <input type="number" min={0} value={p.price || ""} onChange={(e) => onChange({ price: Number(e.target.value) || 0 })} />
            </div>
          </Row>
          {mode === "fixed" && (
            <label className="pe-check">
              <input type="checkbox" checked={p.discount !== undefined} onChange={(e) => onChange({ discount: e.target.checked ? 0 : undefined })} />
              Offer discounted price
            </label>
          )}
          {mode === "fixed" && p.discount !== undefined && (
            <Row label="Discounted price">
              <div className="pe-money">
                <span>₹</span>
                <input type="number" min={0} value={p.discount || ""} onChange={(e) => onChange({ discount: Number(e.target.value) || 0 })} />
              </div>
            </Row>
          )}
        </>
      )}
    </section>
  );
}

function Toggle({ label, hint, on, onChange }: { label: string; hint?: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="pe-toggle">
      <span>
        <b>{label}</b>
        {hint && <small>{hint}</small>}
      </span>
      <button type="button" role="switch" aria-checked={on} aria-label={label} className={on ? "on" : ""} onClick={() => onChange(!on)}><i /></button>
    </div>
  );
}

function SessionForm({ p, onChange }: { p: Product; onChange: Patch }) {
  const [picker, setPicker] = useState(false);
  return (
    <>
      <h2>Set up your 1:1 session</h2>
      <Row label="Session title" count={[...p.title].length} max={75}>
        <div className="pe-title">
          <button type="button" className="pe-emoji" aria-label="Pick emoji" onClick={() => setPicker(!picker)}>{p.emoji || "😎"}</button>
          <input value={p.title} maxLength={75} onChange={(e) => onChange({ title: e.target.value })} />
        </div>
        {picker && (
          <div className="pe-picker">
            {EMOJIS.map((e) => (
              <button type="button" key={e} onClick={() => { onChange({ emoji: e }); setPicker(false); }}>{e}</button>
            ))}
          </div>
        )}
      </Row>
      <Row label="Duration">
        <div className="pe-money end">
          <input type="number" min={5} step={5} value={p.duration ?? ""} onChange={(e) => onChange({ duration: Number(e.target.value) || undefined })} />
          <span>mins</span>
        </div>
      </Row>
      <Cover p={p} onChange={onChange} />
      <Row label="Short description" count={[...(p.shortDescription ?? "")].length} max={120}>
        <input className="pe-input" value={p.shortDescription ?? ""} maxLength={120} onChange={(e) => onChange({ shortDescription: e.target.value })} />
      </Row>
      <Row label="Description">
        <textarea className="pe-ta" value={p.description} onChange={(e) => onChange({ description: e.target.value })} />
      </Row>
      <Row label="Schedule">
        <select className="pe-input" defaultValue="Default"><option>Default</option></select>
        <small className="pe-hint">You can create and manage schedules in Settings</small>
      </Row>
      <Toggle label="Make this a recurring session" hint="If enabled, people can register for recurring sessions" on={!!p.recurring} onChange={(v) => onChange({ recurring: v })} />
      <PricingBlock p={p} onChange={onChange} />
      <section className="pe-sec">
        <h3>Set Session Policy</h3>
        <Toggle label="Do you have a reschedule policy?" on={!!p.policy} onChange={(v) => onChange({ policy: v })} />
      </section>
    </>
  );
}

const STEPS = ["Page Details", "Pricing & File", "Review"];

function FileForm({ p, step, onChange }: { p: Product; step: number; onChange: Patch }) {
  const sections = p.sections ?? [];
  const upload = (f: File): Upload => ({ name: f.name, size: f.size });
  if (step === 0)
    return (
      <>
        <h2>Tell us about your Digital File</h2>
        <Row label="Title *" count={[...p.title].length} max={75}>
          <input className="pe-input" value={p.title} maxLength={75} onChange={(e) => onChange({ title: e.target.value })} />
        </Row>
        <Cover p={p} onChange={onChange} required />
        <Row label="Description *">
          <textarea className="pe-ta tall" value={p.description} onChange={(e) => onChange({ description: e.target.value })} />
        </Row>
        <Row label="Button Text *" count={[...(p.buttonText ?? "")].length} max={25}>
          <input className="pe-input" value={p.buttonText ?? ""} maxLength={25} onChange={(e) => onChange({ buttonText: e.target.value })} />
        </Row>
        <section className="pe-sec">
          <h3>Optional Sections</h3>
          {SECTIONS.map((x) => (
            <Toggle key={x} label={x} on={sections.includes(x)} onChange={(v) => onChange({ sections: v ? [...sections, x] : sections.filter((y) => y !== x) })} />
          ))}
        </section>
      </>
    );
  if (step === 1)
    return (
      <>
        <h2>Pricing and file</h2>
        <PricingBlock p={p} onChange={onChange} />
        <section className="pe-sec">
          <h3>File *</h3>
          {p.file ? (
            <div className="pe-file">
              <Paperclip size={16} />
              <span><b>{p.file.name}</b>{kb(p.file.size)}</span>
              <button type="button" aria-label="Remove file" onClick={() => onChange({ file: undefined })}><X size={15} /></button>
            </div>
          ) : (
            <label className="pe-drop">
              <span className="pe-drop-ic"><Paperclip size={20} /></span>
              <span><b>Upload</b> the file buyers will get</span>
              <small>Up to 10 MB</small>
              <input type="file" onChange={(e) => e.target.files?.[0] && onChange({ file: upload(e.target.files[0]) })} />
            </label>
          )}
        </section>
      </>
    );
  const rows: [string, string][] = [
    ["Title", p.title || "—"],
    ["Price", p.pricing === "pwyw" ? `Pay what you want (min ${formatPrice(p.price)})` : formatPrice(p.price)],
    ["Button", p.buttonText || "—"],
    ["File", p.file?.name ?? "—"],
    ["Sections", sections.join(", ") || "None"],
  ];
  return (
    <>
      <h2>Review and save</h2>
      <section className="pe-sec">
        {rows.map(([k, v]) => (
          <div className="pe-review" key={k}><span>{k}</span><b>{v}</b></div>
        ))}
      </section>
    </>
  );
}

function Preview({ p }: { p: Product }) {
  const { name, bio } = useProfile();
  const price = p.pricing === "free" || !p.price ? "Free" : p.pricing === "pwyw" ? `₹${p.price}+` : formatPrice(p.price);
  if (p.kind !== "file")
    return (
      <div className="pe-pv sess">
        <div className="pe-pv-head"><Avatar size={30} /><span><b>{name}</b><small>{bio}</small></span></div>
        <div className="pe-pv-card">
          <div className="pe-pv-body">
            <h4>{p.emoji} {p.title || "New Session"}</h4>
            <div className="pe-pv-meta"><Clock size={12} /> {p.duration ?? 15} mins</div>
            <div className="pe-pv-price">{price}</div>
            {p.shortDescription && <p><b>{p.shortDescription}</b></p>}
            <p>{p.description || "Describe your session…"}</p>
            <div className="pe-pv-share"><Share2 size={12} /> Share this session</div>
          </div>
          <div className="pe-pv-slots">
            <b>When should we connect?</b>
            <div>{["FRI 20", "SAT 21", "MON 23", "TUE 24"].map((d) => <span key={d}>{d}</span>)}</div>
            <div>{["02:15 PM", "02:30 PM", "02:45 PM", "03:00 PM"].map((t) => <span key={t}>{t}</span>)}</div>
            <button type="button">Confirm details</button>
          </div>
        </div>
      </div>
    );
  return (
    <div className="pe-pv file">
      <div className="pe-pv-card">
        <div className="pe-pv-body">
          {p.cover && <img className="pe-pv-cover" src={p.cover} alt="" />}
          <h4>{p.title || "Your Digital File Title Here"}</h4>
          <small className="pe-pv-k">ABOUT THE PAGE</small>
          <p>{p.description || "Describe your page to let buyers know what to expect."}</p>
        </div>
        <div className="pe-pv-pay">
          <div className="pe-pv-row"><span>Sub Total</span><span>{price}</span></div>
          <div className="pe-pv-row"><span>Total</span><span>{price}</span></div>
          <button type="button">{p.buttonText || "Get it now"}</button>
        </div>
      </div>
    </div>
  );
}

export function ProductEditor({ p, onChange, onClose }: { p: Product; onChange: Patch; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const session = p.kind !== "file";
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  const last = step === STEPS.length - 1;
  return (
    <div className="pe" role="dialog" aria-modal="true">
      <div className="pe-left">
        <header className="pe-top">
          <button type="button" aria-label="Close" onClick={onClose}><X size={20} /></button>
          <span className="pe-name">{p.title || (session ? "New 1:1 Session" : "New Digital File")}</span>
          {!session && (
            <span className="pe-steps">
              {STEPS.map((_, i) => <i key={i} className={i === step ? "on" : ""} />)}
              <em>Step {step + 1} - {STEPS[step]}</em>
            </span>
          )}
        </header>
        <div className="pe-form">
          {session ? <SessionForm p={p} onChange={onChange} /> : <FileForm p={p} step={step} onChange={onChange} />}
        </div>
        <footer className="pe-foot">
          {!session && step > 0 && <button type="button" className="pe-back" onClick={() => setStep(step - 1)}>Back</button>}
          <button type="button" className="pe-go" onClick={() => (session || last ? onClose() : setStep(step + 1))}>
            {session ? "Save Session" : last ? "Save Changes" : "Save and Continue"}
          </button>
        </footer>
      </div>
      <div className="pe-right">
        <h3>Preview</h3>
        <Preview p={p} />
      </div>
    </div>
  );
}
