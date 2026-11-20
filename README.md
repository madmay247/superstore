# SuperStore

A creator writes two or three lines about themselves. The AI drafts their store: bio, store link, a free lead magnet, a ₹499 discovery call, a premium 1:1 session priced for their niche, and a community if they mention one. They review and edit it, regenerate any single field, and publish it to a public link they can share on their phone.

- **Live:** https://sppm-three.vercel.app
- **Decision doc:** [docs/superstore.pdf](docs/superstore.pdf)

## Stack

- Next.js 15 (App Router), React 19, TypeScript; no UI kit
- OpenAI `gpt-5.4-mini` with strict JSON-schema structured output (set `OPENAI_MODEL` to use another model)
- Postgres (one `stores` table, created automatically on first request)

## Run locally

```bash
npm install
```

Create `.env` in the project root:

```bash
OPENAI_API_KEY=sk-...
DATABASE_URL=postgres://user:pass@host:5432/db
```

```bash
npm run dev
```

Open http://localhost:3000. Use the reset button in the sidebar to clear the saved store and run setup again.

## How it fits together

| Path | What it does |
|---|---|
| `app/api/setup/route.ts` | The single AI endpoint. It drafts the whole store, or regenerates one part (name, bio, link, or one product's title or description). It asks a follow-up question when the answer is too thin, retries slow or rule-breaking drafts once, and cleans the copy before returning it. The model picks a niche and reads the follower count; the price and its "Why ₹X?" reason come from rules in code. |
| `app/api/stores/[slug]/route.ts` | Publish (PUT), read (GET) and unpublish (DELETE). The first browser to publish a link claims it with a random edit token; only that token can change it afterwards. |
| `app/page.tsx`, `app/store/StoreModals.tsx` | The editor: the setup wizard, review screen with live phone preview, product editing and per-field regenerate. |
| `app/store/shared.tsx` | `StoreBlocks`, the product list used by both the editor preview and the public page, so they always match. |
| `app/[slug]/page.tsx` | The public store a buyer opens. `layout.tsx` next to it adds link-preview tags for WhatsApp and Instagram. |

## Notes

- No payments: "Book now" and "Get it" open the product page but don't take money.
- API keys are read from environment variables only; `.env` is gitignored.
- Built with Claude Code as the main coding tool (see the decision doc).
