# Equipt

> Equip Claude with 600+ ready-to-use skills & agents.

Equipt is an open-source [Claude Code](https://claude.com/claude-code) plugin
marketplace: 501 task skills and 106 subagents, organized into five installable
plugins.

## Install (Claude Code)

```
/plugin marketplace add Salah-XD/equipt
/plugin install equipt-engineering
```

Available plugins:

<!-- PLUGINS:START -->
- `equipt-business` — Operator skills and agents: finance, operations, HR, legal, client work, e-commerce, events.
- `equipt-content` — Writing skills and agents: blog posts, copywriting, email, scripts, courses.
- `equipt-data` — Data & analytics skills and agents: SQL, dashboards, analytics narrative.
- `equipt-engineering` — Subagents for developers: code review, debugging, testing, refactoring, security audits, API & schema design.
- `equipt-marketing` — Marketing skills and agents: ads, SEO, social, email, sales funnels, growth, branding.
<!-- PLUGINS:END -->

Browse the full catalog in [docs/directory.md](docs/directory.md).

## Use on claude.ai (web)

Download a per-category skill bundle from the latest
[Release](https://github.com/Salah-XD/equipt/releases) and upload the skill folder
in your Claude settings. (Subagents are Claude Code only.)

## Develop

```
npm install
npm test          # unit tests for the tooling
npm run lint      # validate all skill/agent frontmatter
npm run build     # regenerate manifests + directory from the folders
npm run new-skill -- --plugin equipt-marketing --name my-skill --description "..."
```

Folders under `plugins/` are the single source of truth; `marketplace.json`,
each `plugin.json`, and `docs/directory.md` are generated — never edit them by hand.

## License

Code: [MIT](LICENSE). Skill/agent content: [CC-BY-4.0](LICENSE-CONTENT).
