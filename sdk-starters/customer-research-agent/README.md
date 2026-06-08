# customer-research-agent

Give it a URL or company name, get back a research brief.

A small, self-contained agent built on the Anthropic SDK with the built-in
web search tool. Reads the company's public surface (site, press, reviews,
socials), then writes a structured brief you can drop into a Notion doc
or send before a meeting.

## What you get

A markdown brief with these sections:

- **Snapshot** — what they do, who they serve, where they're based, scale
- **Positioning** — the message they lead with
- **Product/Pricing** — public tiers, hidden costs, freemium dynamics
- **Distribution** — how they get customers
- **Traction signals** — recent moves, hiring, funding, news
- **Sentiment** — what customers love, what they complain about
- **What to ask in the meeting** — three sharp questions

## Install

```bash
cd customer-research-agent
cp .env.example .env
# fill in ANTHROPIC_API_KEY (get one from console.anthropic.com)
npm install
```

## Run

```bash
npm run start -- "stripe.com"
npm run start -- "Razorpay"
npm run start -- "https://linear.app"
```

Output streams to stdout. Pipe it to a file if you want:

```bash
npm run start -- "stripe.com" > stripe-brief.md
```

## Customize

The agent's brain lives in [`src/prompts.ts`](./src/prompts.ts). Edit the
system prompt to:

- Change the sections in the brief (add "Tech stack", remove "Sentiment")
- Add domain context ("We're a B2B SaaS, frame everything for that lens")
- Change the tone (executive summary vs analyst report)

To use a different model (Haiku for speed, Opus for depth), change the
`model:` line in [`src/index.ts`](./src/index.ts).

## Wiring this into a real workflow

A few patterns that work:

1. **Cron the agent** — wrap `npm run start` in a script that runs nightly
   against your prospect list, drops the briefs into a shared folder.
2. **Slack-trigger it** — wrap in a small Hono / Express server that
   listens for `/research <company>` and posts the brief back.
3. **Deploy on Vercel** — `npm i -g vercel`, then `vercel deploy`. The
   default settings just work; no `vercel.ts` config needed for this size.

## What this doesn't do

- It doesn't access non-public data (LinkedIn behind login, paywalled
  databases). For that, integrate a tool like Apollo / Crunchbase via
  their APIs.
- It doesn't verify facts beyond what the search results return. Treat
  the brief as a starting point, not a source of truth.

## License

MIT — see [`LICENSE`](../../LICENSE) at the repo root.
