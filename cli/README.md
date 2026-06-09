# @equipt/cli

Install curated [Equipt](https://github.com/Salah-XD/equipt) skills & agents into your project's `.claude/`.

```bash
npx @equipt/cli init                     # scaffold ./.claude + equipt.json (interactive in a terminal)
npx @equipt/cli add equipt-engineering   # install a whole plugin
npx @equipt/cli add code-reviewer        # install a single skill/agent
npx @equipt/cli list                     # browse the catalog (with Readiness + tier)
```

Run in a terminal, `init` opens an interactive plugin picker, and `add` asks before overwriting an existing file. In non-interactive contexts (CI, pipes) it stays quiet — `init` just scaffolds and `add` skips conflicts unless you pass `--force`.

Flags: `--global` (target `~/.claude`), `--force` (overwrite without asking), `--from <path>` (use a local Equipt checkout), `--plugin <name>` (scope `list`), `--yes` (non-interactive `init`).
