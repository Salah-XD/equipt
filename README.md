# Equipt

> Equip your AI with 600+ verified skills & agents.

[![npm](https://img.shields.io/npm/v/@equipt/cli?color=cf4a1e&label=%40equipt%2Fcli)](https://www.npmjs.com/package/@equipt/cli)
[![CI](https://github.com/Salah-XD/equipt/actions/workflows/ci.yml/badge.svg)](https://github.com/Salah-XD/equipt/actions/workflows/ci.yml)
[![code: MIT](https://img.shields.io/badge/code-MIT-3b82f6)](LICENSE)
[![content: CC-BY-4.0](https://img.shields.io/badge/content-CC--BY--4.0-3b82f6)](LICENSE-CONTENT)

**Equipt** is an open-source, **curated & verified marketplace** of skills and subagents for [Claude Code](https://claude.com/claude-code) and other AI assistants — **501 skills + 106 agents** across **5 installable plugins**. Every asset is machine-scored on **the Equipt Standard** before it ships, so you install vetted tools instead of a dump of prompts.

### → Browse the catalog: **[equipt-agent.vercel.app](https://equipt-agent.vercel.app)**

## Install

**With the Equipt CLI** — drops skills & agents into your project's `.claude/`:

```bash
npx @equipt/cli init                     # scaffold .claude/ + a manifest
npx @equipt/cli add equipt-engineering   # install a whole plugin
npx @equipt/cli add code-reviewer        # install a single skill or agent
npx @equipt/cli list                     # browse the catalog (with Readiness)
```

**In Claude Code** — via the plugin marketplace:

```
/plugin marketplace add Salah-XD/equipt
/plugin install equipt-engineering
```

**On claude.ai / desktop** — download a per-category bundle from the latest
[Release](https://github.com/Salah-XD/equipt/releases) and upload the skill folder
in your Claude settings. (Subagents are Claude Code only.)

## The five plugins

<!-- PLUGINS:START -->
- `equipt-business` — Operator skills and agents: finance, operations, HR, legal, client work, e-commerce, events.
- `equipt-content` — Writing skills and agents: blog posts, copywriting, email, scripts, courses.
- `equipt-data` — Data & analytics skills and agents: SQL, dashboards, analytics narrative.
- `equipt-engineering` — Subagents for developers: code review, debugging, testing, refactoring, security audits, API & schema design.
- `equipt-marketing` — Marketing skills and agents: ads, SEO, social, email, sales funnels, growth, branding.
<!-- PLUGINS:END -->

Browse everything in the [live catalog](https://equipt-agent.vercel.app/catalog) or [`docs/directory.md`](docs/directory.md).

## The Equipt Standard

Every skill & agent earns a **Readiness** score (0–100) across five axes — **Craft · Fit · Guard · Proof · Upkeep** — capped by a safety gate, and falls into one of three tiers:

| Tier | Meaning |
|---|---|
| **Provisional** | Machine-scored — not yet human-reviewed |
| **Certified** | Human-reviewed · Readiness ≥ 70 |
| **Field-Ready** | Top tier · Readiness ≥ 85 with strong Guard & Proof |

Read the methodology at **[equipt-agent.vercel.app/standard](https://equipt-agent.vercel.app/standard)**.

## Develop

```bash
npm install
npm test            # marketplace + scorer unit tests
npm run lint        # validate skill/agent frontmatter
npm run build       # regenerate manifests, directory, and this README's plugin list
npm run score       # score every asset on the Equipt Standard → scores/
npm run new-skill -- --plugin equipt-marketing --name my-skill --description "..."
```

Folders under `plugins/` are the **single source of truth**; `marketplace.json`, each
`plugin.json`, and `docs/directory.md` are generated — never edit them by hand. The
CLI lives in [`cli/`](cli/), the scorer in [`scoring/`](scoring/), the site in
[`site/`](site/).

## Contributing

Open a [pull request](https://github.com/Salah-XD/equipt/pulls) to add or improve a
skill/agent, or [an issue](https://github.com/Salah-XD/equipt/issues) to propose one —
see [Publish to Equipt](https://equipt-agent.vercel.app/publish).

## License

Code: [MIT](LICENSE) · Skill & agent content: [CC-BY-4.0](LICENSE-CONTENT).
