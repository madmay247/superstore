import { NextResponse } from "next/server";

export const maxDuration = 60;

/* Typical 60-minute 1:1 price by niche. The model only classifies the niche; the price
   comes from this table so it stays predictable and easy to tune. Niches whose
   buyers expect a direct money or career return sit at the top. */
const NICHE_PRICE = {
  hobbies_lifestyle: 1999,
  arts_creative: 1999,
  health_fitness: 2999,
  wellness_relationships: 2999,
  education_exams: 2999,
  content_creation: 2999,
  design_tech: 3999,
  career_jobs: 3999,
  marketing_sales: 3999,
  business_startups: 4999,
  finance_investing: 4999,
} as const;
type Niche = keyof typeof NICHE_PRICE;

const NICHE_LABEL: Record<Niche, string> = {
  hobbies_lifestyle: "hobbies & lifestyle",
  arts_creative: "arts & creative",
  health_fitness: "health & fitness",
  wellness_relationships: "wellness & relationships",
  education_exams: "education & exam prep",
  content_creation: "content creation",
  design_tech: "design & tech",
  career_jobs: "career & jobs",
  marketing_sales: "marketing & sales",
  business_startups: "business & startups",
  finance_investing: "finance & investing",
};

/* Audience size nudges the premium price: a bigger following signals more demand for the creator's time */
const AUDIENCE_TIERS = [
  { max: 5_000, factor: 0.75, note: "a smaller following, so it starts a little lower to win your first bookings" },
  { max: 50_000, factor: 1, note: "a mid-size following, so it sits in the middle of the range" },
  { max: 200_000, factor: 1.3, note: "a large following, so there's room to charge more for your time" },
  { max: Infinity, factor: 1.6, note: "a very large following, so your time is in high demand" },
];
const DURATION_FACTOR: Record<number, number> = { 45: 0.85, 60: 1, 90: 1.35 };
const PRICE_STEPS = [999, 1499, 1999, 2499, 2999, 3499, 3999, 4999, 5999, 7499, 9999];
const snap = (n: number) => PRICE_STEPS.reduce((a, b) => (Math.abs(b - n) < Math.abs(a - n) ? b : a));
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const followers = (n: number) => (n >= 100_000 ? `${+(n / 100_000).toFixed(1)} lakh` : n >= 1000 ? `${+(n / 1000).toFixed(1)}K` : String(n));

function premiumPrice(niche: Niche, duration: number, audience: number) {
  const base = NICHE_PRICE[niche] ?? 2999;
  const tier = audience > 0 ? AUDIENCE_TIERS.find((t) => audience < t.max)! : null;
  const price = snap(base * (DURATION_FACTOR[duration] ?? 1) * (tier?.factor ?? 1));
  const why =
    `${inr(base)} is typical for a 60-min 1:1 in ${NICHE_LABEL[niche] ?? "your niche"}` +
    (duration !== 60 ? `, adjusted for ${duration} minutes` : "") +
    (tier ? `. ${followers(audience)} followers is ${tier.note}.` : ".");
  return { price, why };
}

/* A community product is only offered when the creator's own words clearly mention one */
const COMMUNITY_RE = /\b(communit(y|ies)|membership|members|member-only|discord|telegram|whatsapp (group|community)|facebook group|slack|circle|club|tribe|cohort|mastermind|forum|group chat)\b/i;

const DISCOVERY_PRICE = 499;
/* The free file trades a download for a name and email: the creator's own list of warm buyers */
const FILE_WHY = "Free gets people to say yes today. In return you get their name and email, so you can tell them about your paid sessions later, without depending on Instagram's algorithm.";
/* The discovery call isn't priced to earn: it's the cheap first step that leads buyers to the premium session */
const discoveryWhy = (premium: number) =>
  `Most followers won't pay ${inr(premium)} to someone they haven't spoken to. A ₹499 call is an easy first yes, and once they've met you, they're far more likely to book your ${inr(premium)} session.`;
const ABOUT_MAX = 500;
const ATTEMPT_MS = 15_000;
/* gpt-5.4-mini beat gpt-4o-mini, gpt-4.1(-mini) and gpt-5.5 on an 8-creator test: ~4 s median, <8 s worst,
   most specific copy, almost no rule breaks. OPENAI_MODEL overrides it. */
const MODEL = process.env.OPENAI_MODEL || "gpt-5.4-mini";
const REASONING = process.env.OPENAI_REASONING || "low";

/* Words that make copy sound generic. The prompt bans them; the server checks and retries once,
   then swaps any that survive for a plain word (see PLAIN below). */
const BANNED = /\b(journeys?|unlock(s|ed|ing)?|guidance|transformational|transformative|transform(s|ed|ing|ation)?|passionate|next level|empower(s|ed|ing|ment)?|elevate[sd]?|elevating|enhance[sd]?|enhancing|enhancements?|tailored|unique|well-being|wellbeing)\b/gi;
/* Durations live in their own field, so text must not repeat them (they'd go stale when the creator edits the duration) */
const DURATION_TXT = /\b\d+\s*-?\s*(min|mins|minute|minutes|hr|hour|hours)\b/i;

const COPY_RULES =
  "Conversion copy in first person, plain words, calm and confident. Be specific: name the concrete deliverables, steps, topics and the exact kind of buyer. Lead with the buyer's result, not the creator's background. No exclamation marks. Never use these words: journey, unlock, guidance, transform, transformational, passionate, empower, elevate, enhance, tailored, unique, well-being, next level. Never mention the session length or a number of minutes (it's shown separately). Details must follow from the creator's own description or from what the offer plainly includes; never invent numbers, credentials, testimonials, guarantees or results.";
const TITLE_RULES =
  "Name what the buyer gets in plain words, specific to this creator's niche (e.g. 'Portfolio Teardown for Your First Design Job', 'Your 12-Week CA Inter Study Plan'). Don't use the words Deep-Dive, In-Depth, Quick, Premium, Discovery, Session or Call, and never a duration or number of minutes. No emoji, no price.";
const BULLETS = "then a new line for each of 3 short points, each starting with \"- \"";

const session = (durations: number[]) => ({
  type: "object",
  additionalProperties: false,
  required: ["emoji", "title", "duration", "description"],
  properties: {
    emoji: { type: "string", description: "One emoji that fits the session" },
    title: { type: "string", description: `Max 60 characters. ${TITLE_RULES}` },
    duration: { type: "integer", enum: durations, description: "Minutes" },
    description: { type: "string", description: `${COPY_RULES} For a session: open with the result the buyer walks away with, ${BULLETS} naming exactly what happens on the call (what you'll review, map out or decide), then one line on who it's for. Max 450 characters.` },
  },
});

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["input_quality", "follow_up", "display_name", "store_handle", "bio", "niche", "audience_size", "digital_file", "discovery_session", "high_ticket_session", "community"],
  properties: {
    input_quality: {
      type: "string",
      enum: ["ok", "gibberish"],
      description: "Judge the creator's input first. 'gibberish' only for random keys or nonsense that names no skill, topic or person at all (e.g. 'asdf', 'hello', 'test 123', 'jjjj'). Anything with a real topic is 'ok', even one word like 'yoga' or 'CFA': draft the best store you can from it.",
    },
    follow_up: { type: "string", description: "If input_quality is 'gibberish': one short, friendly question (max 140 characters) asking what they do and who they help. Empty string when 'ok'." },
    display_name: { type: "string", description: "The creator's name as they'd show it publicly. Only use a name the creator actually gave in the input, however casually ('Rahul here', 'main Neha hoon', 'this is Arjun' all give a name); it may be combined with their niche or brand (e.g. 'Mayank | Finance'). If they gave no name, return an empty string. Never invent a name or a brand name." },
    store_handle: { type: "string", description: "Always return a short, memorable link for their store: lowercase letters, digits and hyphens only, 4 to 25 characters. If they gave a name, use it with their topic (e.g. 'priya-fitness', 'rahul-ca'). If not, build it from what they teach or offer (e.g. 'cfa-prep', 'eggless-baking', 'yoga-with-me'). Never empty." },
    bio: { type: "string", description: "Max 110 characters. Outcome-first, first person: who they help, the concrete result those people get, and how (e.g. \"I help CFA Level 1 candidates build a 90-day study plan and pass first time\"). No vague words. No hashtags. Only outcomes the creator's own words support." },
    niche: { type: "string", enum: Object.keys(NICHE_PRICE) },
    audience_size: { type: "integer", description: "Total followers or subscribers the creator states in the input, as a plain number (20K = 20000, 1.2 lakh = 120000). 0 if they didn't state a number. Never guess." },
    digital_file: {
      type: "object",
      additionalProperties: false,
      required: ["title", "description", "button_text"],
      properties: {
        title: { type: "string", description: "Max 60 characters. A free lead-magnet download (guide, checklist, template, plan) in their niche, named for what the reader gets. No duration, no exclamation marks." },
        description: { type: "string", description: `${COPY_RULES} For the free file: open with the problem it solves or what the reader can do after using it, ${BULLETS} listing exactly what's inside (the real sections, templates or steps), then one line on who it's for. Max 450 characters.` },
        button_text: { type: "string", description: "Max 20 characters, e.g. 'Get the free guide'" },
      },
    },
    discovery_session: { ...session([15, 30]), description: "A short, low-cost intro call to understand the buyer's needs." },
    high_ticket_session: { ...session([45, 60, 90]), description: "The creator's main paid 1:1 offer: a longer session with a concrete outcome." },
    community: {
      anyOf: [
        {
          type: "object",
          additionalProperties: false,
          required: ["emoji", "title", "description"],
          properties: {
            emoji: { type: "string", description: "One emoji that fits the community" },
            title: { type: "string", description: "Max 60 characters. A community name their audience would want to join. No emoji." },
            description: { type: "string", description: `${COPY_RULES} For the community: open with what members get out of being in it, ${BULLETS} on what actually happens inside (the kind of discussions, sessions or resources), then who it's for. Max 450 characters.` },
          },
        },
        { type: "null" },
      ],
      description: "A community the creator could run for their audience (e.g. a group for exam aspirants, learners, or fellow practitioners). Return null unless the creator's own words explicitly mention a community, group, membership, club, Discord/Telegram/WhatsApp group or similar. Teaching or coaching alone is NOT enough. null when unclear.",
    },
  },
};

type Session = { emoji: string; title: string; duration: number; description: string };
type Draft = {
  input_quality: "ok" | "gibberish";
  follow_up: string;
  display_name: string;
  store_handle: string;
  bio: string;
  niche: Niche;
  audience_size: number;
  digital_file: { title: string; description: string; button_text: string };
  discovery_session: Session;
  high_ticket_session: Session;
  community: { emoji: string; title: string; description: string } | null;
};

const SYSTEM =
  "You set up a creator's online store on an Indian creator platform. First judge whether their self-description is enough to work with. Then, from it, write their public profile and three products: a free digital file, a discovery 1:1 call, and a premium 1:1 session, plus a community only if their description explicitly mentions one. You are a direct-response copywriter helping a creator market themselves, so every line should make the right buyer say \"that's for me\" and book or download. Write the bio and every product description around the outcome the buyer gets and the concrete, specific things they receive, in plain, warm language in the creator's voice. Avoid vague, generic phrasing. Never invent credentials, numbers or results they didn't mention, and never invent a name for them: if they didn't give one, leave the display name empty. Even when the input isn't good enough, still fill every field with your best attempt.";

/* ---------- output clean-up ---------- */

/* Strip control characters (the model sometimes emits them where bullets should be), put each bullet
   on its own line as "• ", and cap the length at a line or sentence boundary. */
function cleanText(s: string, max: number) {
  let t = (s ?? "")
    .replace(/\r/g, "")
    .replace(/[ \t]*[\u0000-\u0009\u000B-\u001F\u007F•●▪]+[ \t\u0000-\u0009\u000B-\u001F\u007F•]*/g, "\n• ")
    .replace(/(^|\n)[ \t]*[-*–][ \t]+/g, "$1• ")
    .replace(/,?[ \t]*\n•/g, "\n•")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim()
    .replace(/^•\s*/, "");
  if ([...t].length > max) {
    const cut = [...t].slice(0, max).join("");
    const end = Math.max(cut.lastIndexOf("\n"), cut.lastIndexOf(". "), cut.lastIndexOf("! "));
    t = (end > max * 0.6 ? cut.slice(0, end + 1) : cut.replace(/\s+\S*$/, "") + "…").trim();
  }
  return t;
}

const oneLine = (s: string, max: number) => cleanText(s, max).replace(/\n•?\s*/g, " ");

function cleanDraft(d: Draft): Draft {
  const sess = (s: Session): Session => ({ ...s, title: oneLine(s.title, 75), description: cleanText(s.description, 520) });
  return {
    ...d,
    display_name: oneLine(d.display_name, 60),
    bio: oneLine(d.bio, 140),
    audience_size: Math.max(0, Math.round(Number(d.audience_size) || 0)),
    digital_file: { title: oneLine(d.digital_file.title, 75), description: cleanText(d.digital_file.description, 520), button_text: oneLine(d.digital_file.button_text, 24) },
    discovery_session: sess(d.discovery_session),
    high_ticket_session: sess(d.high_ticket_session),
    community: d.community && { ...d.community, title: oneLine(d.community.title, 75), description: cleanText(d.community.description, 520) },
  };
}

const copyOf = (d: Draft) => [d.bio, d.digital_file.title, d.digital_file.description, d.discovery_session.title, d.discovery_session.description, d.high_ticket_session.title, d.high_ticket_session.description, d.community?.title, d.community?.description].join("\n");
/* Everything the model should have avoided, as feedback for the one retry */
function problemsIn(d: Draft) {
  const copy = copyOf(d);
  const out = [...new Set((copy.match(BANNED) ?? []).map((w) => `the word "${w.toLowerCase()}"`))];
  if (DURATION_TXT.test(copy)) out.push("a session length in minutes");
  return out;
}

/* ---------- last-resort polish ----------
   Whatever the model returns, the creator never sees an exclamation mark, a banned filler word,
   or a duration baked into the text. Swaps are plain words that read fine in context. */
const PLAIN: [RegExp, string][] = [
  [/\btake (your|their|my) ([\w' -]{1,30}?) to the next level\b/gi, "improve $1 $2"],
  [/\bnext level\b/gi, "better"],
  [/\b(your|their|my|the) ([\w-]+ )?journeys?\b/gi, "$1 $2progress"],
  [/\bjourneys?\b/gi, "progress"],
  [/\btailored (to|for)\b/gi, "made for"],
  [/\btailored\b/gi, "custom"],
  [/\bunlock(s|ed|ing)? (your|their|my) (full )?potential\b/gi, "reach$1 $2 potential"],
  [/\bunlock(s|ed|ing)?\b/gi, "get$1"],
  [/\benhancements?\b/gi, "improvements"],
  [/\benhanc(e|es|ed|ing)\b/gi, "improv$1"],
  [/\belevat(e|es|ed|ing)\b/gi, "improv$1"],
  [/\bempower(s|ed|ing)?\b/gi, "help$1"],
  [/\bempowerment\b/gi, "confidence"],
  [/\btransformational\b|\btransformative\b/gi, "real"],
  [/\btransformation\b/gi, "change"],
  [/\btransform(s|ed|ing)?\b/gi, "change$1"],
  [/\bguidance\b/gi, "advice"],
  [/\bwell-?being\b/gi, "health"],
  [/\bpassionate (about )?/gi, ""],
  [/\bunique /gi, ""],
];
const keepCase = (orig: string, rep: string) => (/^[A-Z]/.test(orig) && rep ? rep[0].toUpperCase() + rep.slice(1) : rep);

function polish(s: string, kind: "title" | "text", duration?: number) {
  let t = s;
  for (const [re, rep] of PLAIN) t = t.replace(re, (m, ...g) => keepCase(m, rep.replace(/\$(\d)/g, (_, i) => g[Number(i) - 1] ?? "")));
  t = t.replace(/\s*!+/g, ".").replace(/\.(\s*\.)+/g, ".").replace(/\?\./g, "?").replace(/:\./g, ":");
  if (kind === "title") {
    t = t.replace(/\(?\b\d+\s*-?\s*(min|mins|minute|minutes|hr|hour|hours)\b\)?/gi, "").replace(/^(in-depth|deep[- ]dive( into)?|quick|premium)\s+/i, "").replace(/\.$/, "");
  } else if (duration) {
    /* Only the session's own length, so a creator's real "30 minutes a day" is never touched */
    const n = String(duration);
    t = t
      .replace(new RegExp(`\\b(in|within) (just |only )?${n}\\s*(min|mins|minutes)\\b`, "gi"), (m, w) => keepCase(m, `${w.toLowerCase()} one call`))
      .replace(new RegExp(`\\b${n}\\s*-?\\s*(min|minute)\\s+(?=(call|session|chat|consult))`, "gi"), "");
  }
  return t.replace(/[ \t]{2,}/g, " ").replace(/^[\s\-–:|,]+|[\s\-–:|,]+$/gm, "").replace(/ ([,.])/g, "$1").trim();
}

function polishDraft(d: Draft): Draft {
  const sess = (s: Session): Session => ({ ...s, title: polish(s.title, "title"), description: polish(s.description, "text", s.duration) });
  return {
    ...d,
    bio: polish(d.bio, "text"),
    digital_file: { ...d.digital_file, title: polish(d.digital_file.title, "title"), description: polish(d.digital_file.description, "text"), button_text: polish(d.digital_file.button_text, "title") },
    discovery_session: sess(d.discovery_session),
    high_ticket_session: sess(d.high_ticket_session),
    community: d.community && { ...d.community, title: polish(d.community.title, "title"), description: polish(d.community.description, "text") },
  };
}

/* ---------- model call ---------- */

type Call = { ok: true; draft: Draft } | { ok: false; status: number; error: string };

async function callModel(key: string, model: string, user: string, extra?: string): Promise<Call> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ATTEMPT_MS);
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: ctrl.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        /* GPT-5 models reason before answering and only take the default temperature */
        ...(model.startsWith("gpt-5") ? { reasoning_effort: REASONING } : { temperature: 0.7 }),
        response_format: { type: "json_schema", json_schema: { name: "store_setup", strict: true, schema } },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: user },
          ...(extra ? [{ role: "user", content: extra }] : []),
        ],
      }),
    });
    if (!res.ok) {
      console.error("OpenAI error", res.status, await res.text());
      return { ok: false, status: 502, error: "Our AI is busy right now." };
    }
    const data = await res.json();
    const msg = data.choices?.[0]?.message;
    if (!msg?.content || msg.refusal) return { ok: false, status: 422, error: "We couldn't draft a store from that. Try rewording it." };
    return { ok: true, draft: cleanDraft(JSON.parse(msg.content) as Draft) };
  } catch (e) {
    const timedOut = e instanceof Error && e.name === "AbortError";
    console.error("OpenAI call failed", timedOut ? "timeout" : e);
    return { ok: false, status: timedOut ? 504 : 502, error: timedOut ? "The AI is taking longer than usual." : "Our AI is busy right now." };
  } finally {
    clearTimeout(timer);
  }
}

/* One retry on a failed or slow call. One retry, with feedback, if the copy breaks the rules and
   there's still time. Whichever draft wins is then polished, so leftovers never reach the creator. */
async function generate(key: string, model: string, user: string): Promise<Call> {
  const started = Date.now();
  let r = await callModel(key, model, user);
  if (!r.ok && r.status !== 422) r = await callModel(key, model, user);
  if (!r.ok) return r;
  const hits = problemsIn(r.draft);
  if (hits.length && Date.now() - started < 12_000) {
    const again = await callModel(key, model, user, `Your last draft used ${hits.join(", ")}. Rewrite every field without them, saying the concrete thing instead.`);
    if (again.ok && problemsIn(again.draft).length < hits.length) r = { ok: true, draft: { ...again.draft, input_quality: r.draft.input_quality, follow_up: r.draft.follow_up } };
  }
  return { ok: true, draft: polishDraft(r.draft) };
}

/* ---------- route ---------- */

/* The store link the AI suggested, made safe for a URL. Falls back to the niche so there's always one. */
const RESERVED_SLUGS = new Set(["api", "store", "_next", "favicon-ico"]);
function handleOf(d: Draft) {
  const clean = (s: string) => s.normalize("NFKD").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 30).replace(/-$/, "");
  const h = clean(d.store_handle || "");
  return h.length >= 3 && !RESERVED_SLUGS.has(h) ? h : clean(String(d.niche).replace(/_/g, "-")) || "my-store";
}

async function handle(req: Request): Promise<Response> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return NextResponse.json({ error: "OPENAI_API_KEY is not set" }, { status: 500 });

  const { about, part, field, current } = (await req.json().catch(() => ({}))) as { about?: string; part?: string; field?: string; current?: string };
  const text = (about ?? "").trim().slice(0, ABOUT_MAX);
  if (!text) return NextResponse.json({ error: "Tell us a little about you first" }, { status: 400 });
  /* No letters at all ("1234", "!!!") can't describe anyone; skip the model call */
  if (!part && !/\p{L}{2,}/u.test(text)) {
    return NextResponse.json({ error: "Tell us in a sentence what you do and who you help, e.g. “I teach Class 10 maths to CBSE students”.", followUp: true, quality: "gibberish" }, { status: 422 });
  }

  const user = part && current ? `${text}\n\nThe creator is regenerating just the ${field ?? "text"} of their "${part}". Write a clearly different take from this current version, don't repeat it:\n${String(current).slice(0, 800)}` : text;
  const r = await generate(key, MODEL, user);
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
  const d = r.draft;

  /* Nonsense input on a full draft: ask what they do instead of inventing a store. Any real topic gets drafted. */
  if (!part && d.input_quality === "gibberish") {
    return NextResponse.json({ error: d.follow_up || "We couldn't make sense of that. What do you do, and who do you help?", followUp: true, quality: "gibberish" }, { status: 422 });
  }

  /* Only trust a follower count if the creator actually typed a number */
  const audience = /\d/.test(text) ? d.audience_size : 0;
  const premium = premiumPrice(d.niche, d.high_ticket_session.duration, audience);
  const toSession = (s: Session, kind: "discovery" | "premium", price: number, why: string) => ({
    kind,
    emoji: s.emoji,
    title: s.title,
    duration: s.duration,
    description: s.description,
    price,
    priceNote: { price, why },
  });

  const products = [
    { kind: "file", title: d.digital_file.title, description: d.digital_file.description, buttonText: d.digital_file.button_text, price: 0, priceNote: { price: 0, why: FILE_WHY } },
    toSession(d.discovery_session, "discovery", DISCOVERY_PRICE, discoveryWhy(premium.price)),
    toSession(d.high_ticket_session, "premium", premium.price, premium.why),
    ...(d.community && COMMUNITY_RE.test(text) ? [{ kind: "community", emoji: d.community.emoji, title: d.community.title, description: d.community.description, link: "", price: 0 }] : []),
  ];

  /* Regenerating one piece: send back only that piece */
  if (part) {
    if (part === "link") return NextResponse.json({ link: handleOf(d) });
    if (part === "name" || part === "bio") return NextResponse.json({ name: d.display_name, bio: d.bio });
    const one = products.find((x) => x.kind === part) ?? (part === "community" && d.community ? { kind: "community", emoji: d.community.emoji, title: d.community.title, description: d.community.description, link: "", price: 0 } : undefined);
    if (!one) return NextResponse.json({ error: "Couldn't write a new version. Try again." }, { status: 422 });
    return NextResponse.json({ product: one });
  }

  return NextResponse.json({ name: d.display_name, bio: d.bio, niche: d.niche, audience, link: handleOf(d), products });
}

/* Anything unexpected still comes back as a calm JSON error the editor knows how to show */
export async function POST(req: Request) {
  try {
    return await handle(req);
  } catch (e) {
    console.error("setup route failed", e);
    return NextResponse.json({ error: "Our AI is busy right now." }, { status: 500 });
  }
}
