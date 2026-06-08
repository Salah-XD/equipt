# @equipt/cli

Install curated [Equipt](https://github.com/Salah-XD/equipt) skills & agents into your project's `.claude/`.

```bash
npx @equipt/cli init                     # scaffold ./.claude + equipt.json
npx @equipt/cli add equipt-engineering   # install a whole plugin
npx @equipt/cli add code-reviewer        # install a single skill/agent
npx @equipt/cli list                     # browse the catalog (with Readiness)
```

Flags: `--global` (target `~/.claude`), `--force` (overwrite), `--from <path>` (use a local Equipt checkout), `--plugin <name>` (scope `list`).

> While the Equipt repo is private, the GitHub source is unavailable — pass `--from <path-to-equipt-checkout>` to install from a local clone.
