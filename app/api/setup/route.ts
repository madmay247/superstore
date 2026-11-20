import { NextResponse } from "next/server";

/* High-ticket price by niche. The model only classifies the niche; the price
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

/* A community product is only offered when the creator's own words clearly mention one */
const COMMUNITY_RE = /\b(communit(y|ies)|membership|members|member-only|discord|telegram|whatsapp (group|community)|facebook group|slack|circle|club|tribe|cohort|mastermind|forum|group chat)\b/i;

const DISCOVERY_PRICE = 499;
const ABOUT_MAX = 500;

/* Shared rules so every product description reads like conversion copy, not filler */
const COPY_RULES =
  "Conversion copy in first person, plain words. Be specific: name the concrete deliverables, steps, topics and the exact kind of buyer. Lead with the buyer's result, not the creator's background. Cut filler like guidance, support, journey, unlock, take your X to the next level. Details must follow from the creator's own description or from what the offer plainly includes; never invent numbers, credentials, testimonials, guarantees or results.";

const session = (durations: number[]) => ({
  type: "object",
  additionalProperties: false,
  required: ["emoji", "title", "duration", "description"],
  properties: {
    emoji: { type: "string", description: "One emoji that fits the session" },
    title: { type: "string", description: "Max 60 characters. No emoji, no duration or price (shown separately)." },
    duration: { type: "integer", enum: durations, description: "Minutes" },
    description: { type: "string", description: COPY_RULES + " For a session: open with the result the buyer walks away with, then 3 short lines starting with \"• \" naming exactly what happens on the call (what you'll review, map out or decide), then one line on who it's for. Max 450 characters." },
  },
});

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["display_name", "store_handle", "bio", "niche", "digital_file", "discovery_session", "high_ticket_session", "community"],
  properties: {
    display_name: { type: "string", description: "The creator's name as they'd show it publicly. Only use a name the creator actually gave in the input; it may be combined with their niche or brand (e.g. 'Mayank | Finance'). If they gave no name, return an empty string. Never invent a name or a brand name." },
    store_handle: { type: "string", description: "A short URL handle for their store link: lowercase letters, digits, hyphen or underscore only, max 30 characters, built from the creator's own name and/or niche (e.g. mayank-finance). Return an empty string if they gave no name." },
    bio: { type: "string", description: "Max 110 characters. Outcome-first, first person: who they help, the concrete result those people get, and how (e.g. \"I help CFA Level 1 candidates build a 90-day study plan and pass first time\"). No vague words like guidance, support, journey or passionate. No hashtags. Only outcomes the creator's own words support." },
    niche: { type: "string", enum: Object.keys(NICHE_PRICE) },
    digital_file: {
      type: "object",
      additionalProperties: false,
      required: ["title", "description", "button_text"],
      properties: {
        title: { type: "string", description: "Max 60 characters. A free lead-magnet download (guide, checklist, template, plan) in their niche." },
        description: { type: "string", description: COPY_RULES + " For the free file: open with the problem it solves or what the reader can do after using it, then 3 short lines starting with \"• \" listing exactly what's inside (the real sections, templates or steps), then one line on who it's for. Max 450 characters." },
        button_text: { type: "string", description: "Max 20 characters, e.g. 'Get the free guide'" },
      },
    },
    discovery_session: { ...session([15, 30]), description: "A short, low-cost intro call to understand the buyer's needs." },
    high_ticket_session: { ...session([45, 60, 90]), description: "The creator's premium deep-dive 1:1 offer with a concrete outcome." },
    community: {
      anyOf: [
        {
          type: "object",
          additionalProperties: false,
          required: ["emoji", "title", "description"],
          properties: {
            emoji: { type: "string", description: "One emoji that fits the community" },
            title: { type: "string", description: "Max 60 characters. A community name their audience would want to join. No emoji." },
            description: { type: "string", description: COPY_RULES + " For the community: open with what members get out of being in it, then 3 short lines starting with \"• \" on what actually happens inside (the kind of discussions, sessions or resources), then who it's for. Max 450 characters." },
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
  display_name: string;
  store_handle: string;
  bio: string;
  niche: Niche;
  digital_file: { title: string; description: string; button_text: string };
  discovery_session: Session;
  high_ticket_session: Session;
  community: { emoji: string; title: string; description: string } | null;
};

export async function POST(req: Request) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return NextResponse.json({ error: "OPENAI_API_KEY is not set" }, { status: 500 });

  const { about, part, field, current } = (await req.json().catch(() => ({}))) as { about?: string; part?: string; field?: string; current?: string };
  const text = (about ?? "").trim().slice(0, ABOUT_MAX);
  if (!text) return NextResponse.json({ error: "Tell us a little about you first" }, { status: 400 });

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.7,
      response_format: { type: "json_schema", json_schema: { name: "store_setup", strict: true, schema } },
      messages: [
        {
          role: "system",
          content:
            "You set up a creator's online store on an Indian creator platform. From their self-description, write their public profile and three products: a free digital file, a discovery 1:1 call, and a premium 1:1 session, plus a community only if their description explicitly mentions one. You are a direct-response copywriter helping a creator market themselves, so every line should make the right buyer say \"that's for me\" and book or download. Write the bio and every product description around the outcome the buyer gets and the concrete, specific things they receive, in plain, warm language in the creator's voice. Avoid vague, generic phrasing. Never invent credentials, numbers or results they didn't mention, and never invent a name for them: if they didn't give one, leave the display name empty.",
        },
        { role: "user", content: part && current ? `${text}\n\nThe creator is regenerating just the ${field ?? "text"} of their "${part}". Write a clearly different take from this current version, don't repeat it:\n${String(current).slice(0, 800)}` : text },
      ],
    }),
  });

  if (!res.ok) {
    console.error("OpenAI error", res.status, await res.text());
    return NextResponse.json({ error: "Couldn't reach the AI. Try again." }, { status: 502 });
  }

  const data = await res.json();
  const msg = data.choices?.[0]?.message;
  if (!msg?.content || msg.refusal) return NextResponse.json({ error: "Couldn't set up your store from that. Try rephrasing." }, { status: 422 });

  const d = JSON.parse(msg.content) as Draft;
  const toSession = (s: Session, kind: "discovery" | "premium", price: number) => ({
    kind,
    emoji: s.emoji,
    title: s.title,
    duration: s.duration,
    description: s.description,
    price,
  });

  const products = [
      { kind: "file", title: d.digital_file.title, description: d.digital_file.description, buttonText: d.digital_file.button_text, price: 0 },
      toSession(d.discovery_session, "discovery", DISCOVERY_PRICE),
      toSession(d.high_ticket_session, "premium", NICHE_PRICE[d.niche] ?? 2999),
      ...(d.community ? [{ kind: "community", emoji: d.community.emoji, title: d.community.title, description: d.community.description, link: "", price: 0 }] : []),
  ];

  /* Regenerating one piece: send back only that piece */
  if (part) {
    if (part === "link") return NextResponse.json({ link: (d.store_handle || "").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 30) });
    if (part === "name" || part === "bio") return NextResponse.json({ name: d.display_name, bio: d.bio });
    const one = products.find((x) => x.kind === part);
    if (!one) return NextResponse.json({ error: "Couldn't write a new version. Try again." }, { status: 422 });
    return NextResponse.json({ product: one });
  }

  return NextResponse.json({
    name: d.display_name,
    bio: d.bio,
    niche: d.niche,
    products: [
      { kind: "file", title: d.digital_file.title, description: d.digital_file.description, buttonText: d.digital_file.button_text, price: 0 },
      toSession(d.discovery_session, "discovery", DISCOVERY_PRICE),
      toSession(d.high_ticket_session, "premium", NICHE_PRICE[d.niche] ?? 2999),
      ...(d.community && COMMUNITY_RE.test(text) ? [{ kind: "community", emoji: d.community.emoji, title: d.community.title, description: d.community.description, link: "", price: 0 }] : []),
    ],
  });
}
