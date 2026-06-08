import { parseArgs } from 'node:util';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { init } from './commands/init.mjs';
import { add } from './commands/add.mjs';
import { list } from './commands/list.mjs';
import { SourceError } from './lib/source.mjs';

const HELP = `equipt — install curated Equipt skills & agents

Usage:
  equipt init                 scaffold ./.claude + equipt.json
  equipt add <plugin|name>    install a plugin or a single asset
  equipt list                 list available assets (+ Readiness)

Options:
  --global      target ~/.claude instead of ./.claude
  --force       overwrite existing files (add)
  --from <p>    use a local Equipt checkout instead of GitHub
  --plugin <p>  scope list to a plugin
  --help, --version`;

async function pkgVersion() {
  const f = join(dirname(fileURLToPath(import.meta.url)), '..', 'package.json');
  return JSON.parse(await readFile(f, 'utf8')).version;
}

export async function run(argv = process.argv.slice(2)) {
  let parsed;
  try {
    parsed = parseArgs({
      args: argv, allowPositionals: true,
      options: {
        global: { type: 'boolean', default: false },
        force: { type: 'boolean', default: false },
        from: { type: 'string' },
        plugin: { type: 'string' },
        help: { type: 'boolean', default: false },
        version: { type: 'boolean', default: false },
      },
    });
  } catch (err) { console.error(err.message); return 1; }

  const { values, positionals } = parsed;
  if (values.version) { console.log(await pkgVersion()); return 0; }
  if (values.help) { console.log(HELP); return 0; }
  const cmd = positionals[0];
  if (!cmd) { console.log(HELP); return 1; }

  try {
    if (cmd === 'init') {
      const { targetDir } = await init({ global: values.global });
      console.log(`Initialized Equipt in ${targetDir}`);
      return 0;
    }
    if (cmd === 'add') {
      const out = await add(positionals[1], { global: values.global, force: values.force, from: values.from });
      if (out.error) { console.error(out.error); return 1; }
      for (const r of out.results) console.log(`  ${r.status.padEnd(11)} ${r.kind} ${r.name}`);
      console.log(`Done → ${out.targetDir}`);
      return 0;
    }
    if (cmd === 'list') {
      const out = await list({ plugin: values.plugin, from: values.from });
      for (const a of out.assets) {
        const score = a.readiness != null ? `  [R${a.readiness}${a.tier ? ' ' + a.tier : ''}]` : '';
        console.log(`  ${a.kind.padEnd(5)} ${a.plugin}/${a.name}${score}`);
      }
      return 0;
    }
    console.error(`unknown command: ${cmd}`);
    console.log(HELP);
    return 1;
  } catch (err) {
    if (err instanceof SourceError) { console.error(err.message); return 2; }
    console.error(err.stack || String(err));
    return 1;
  }
}
