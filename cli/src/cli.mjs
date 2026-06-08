import { Command, CommanderError } from 'commander';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import * as clack from '@clack/prompts';
import { init } from './commands/init.mjs';
import { add } from './commands/add.mjs';
import { list } from './commands/list.mjs';
import { resolveSource, SourceError } from './lib/source.mjs';
import { loadCatalog } from './lib/catalog.mjs';
import { pc, tierColor, statusColor, kindLabel } from './lib/log.mjs';

const VERSION = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'package.json'), 'utf8'),
).version;

// Interactive only when attached to a real terminal and not explicitly opted out.
const isInteractive = (opts) => Boolean(process.stdout.isTTY) && !opts.yes;

async function runInit(opts) {
  const { targetDir } = await init({ global: opts.global });

  if (!isInteractive(opts)) {
    console.log(pc.green(`Initialized Equipt in ${targetDir}`));
    return 0;
  }

  clack.intro(pc.bold('equipt'));
  let catalog;
  try {
    const { dir } = await resolveSource({ from: opts.from });
    catalog = await loadCatalog(dir);
  } catch (err) {
    clack.note(err instanceof SourceError ? err.message : String(err), 'Source unavailable');
    clack.outro(`Initialized ${targetDir} (no plugins installed).`);
    return 0;
  }

  const counts = {};
  for (const a of catalog.assets) counts[a.plugin] = (counts[a.plugin] ?? 0) + 1;
  const picks = await clack.multiselect({
    message: 'Install which plugins? (space to toggle, enter to confirm)',
    options: catalog.plugins.map((p) => ({ value: p, label: p, hint: `${counts[p] ?? 0} assets` })),
    required: false,
  });
  if (clack.isCancel(picks)) {
    clack.cancel('Cancelled.');
    return 0;
  }
  for (const p of picks) {
    const out = await add(p, { global: opts.global, from: opts.from, force: true });
    clack.log.success(`${p} — ${out.results.length} assets`);
  }
  clack.outro(pc.green(`Equipt ready in ${targetDir}`));
  return 0;
}

async function runAdd(target, opts) {
  if (!target) {
    console.error('usage: equipt add <plugin|name>');
    return 1;
  }
  const shouldOverwrite =
    isInteractive(opts) && !opts.force
      ? async (asset) => {
          const r = await clack.confirm({ message: `Overwrite ${asset.name}?`, initialValue: false });
          return !clack.isCancel(r) && r === true;
        }
      : undefined;

  const out = await add(target, {
    global: opts.global,
    force: opts.force,
    from: opts.from,
    shouldOverwrite,
  });
  if (out.error) {
    console.error(pc.red(out.error));
    return 1;
  }
  for (const r of out.results) {
    console.log(`  ${statusColor(r.status)} ${kindLabel(r.kind)} ${r.name}`);
  }
  console.log(pc.dim(`Done → ${out.targetDir}`));
  return 0;
}

async function runList(opts) {
  const out = await list({ plugin: opts.plugin, from: opts.from });
  for (const a of out.assets) {
    const score =
      a.readiness != null ? `  ${pc.dim(`R${a.readiness}`)} ${tierColor(a.tier)}` : '';
    console.log(`  ${kindLabel(a.kind)}  ${pc.bold(`${a.plugin}/${a.name}`)}${score}`);
  }
  return 0;
}

function buildProgram(setCode) {
  const program = new Command();
  program
    .name('equipt')
    .description('Install curated Equipt skills & agents into your project.')
    .version(VERSION, '-v, --version');

  program
    .command('init')
    .description('scaffold ./.claude + equipt.json (interactive when run in a terminal)')
    .option('--global', 'target ~/.claude instead of ./.claude')
    .option('--from <path>', 'use a local Equipt checkout instead of GitHub')
    .option('--yes', 'non-interactive (just scaffold)')
    .action(async (opts) => {
      const code = await runInit(opts);
      if (code) setCode(code);
    });

  program
    .command('add')
    .description('install a plugin or a single asset')
    .argument('[target]', 'plugin name or asset name')
    .option('--global', 'target ~/.claude instead of ./.claude')
    .option('--force', 'overwrite existing files without asking')
    .option('--from <path>', 'use a local Equipt checkout instead of GitHub')
    .action(async (target, opts) => {
      const code = await runAdd(target, opts);
      if (code) setCode(code);
    });

  program
    .command('list')
    .description('list available assets with Readiness + tier')
    .option('--plugin <name>', 'scope to one plugin')
    .option('--from <path>', 'use a local Equipt checkout instead of GitHub')
    .action(async (opts) => {
      const code = await runList(opts);
      if (code) setCode(code);
    });

  return program;
}

export async function run(argv = process.argv.slice(2)) {
  let code = 0;
  const program = buildProgram((c) => {
    code = c;
  });
  program.exitOverride();
  program.configureOutput({ writeOut: (s) => process.stdout.write(s), writeErr: (s) => process.stderr.write(s) });

  if (argv.length === 0) {
    program.outputHelp();
    return 1;
  }

  try {
    await program.parseAsync(argv, { from: 'user' });
  } catch (err) {
    if (err instanceof SourceError) {
      console.error(pc.red(err.message));
      return 2;
    }
    if (err instanceof CommanderError) {
      if (['commander.helpDisplayed', 'commander.help', 'commander.version'].includes(err.code)) return 0;
      return err.exitCode ?? 1;
    }
    console.error(err?.stack || String(err));
    return 1;
  }
  return code;
}
