import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function arg(flag) {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const plugin = arg('--plugin');
const name = arg('--name');
const description = arg('--description');
const kind = arg('--kind') ?? 'skill';
const author = arg('--author') ?? 'Salah-XD';

if (!plugin || !name || !description) {
  console.error('usage: node scripts/new-skill.mjs --plugin <p> --name <kebab> --description <text> [--kind skill|agent]');
  process.exit(2);
}
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
  console.error(`name must be kebab-case: ${name}`);
  process.exit(2);
}

const title = name.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');

if (kind === 'skill') {
  const dir = join(ROOT, 'plugins', plugin, 'skills', name);
  const file = join(dir, 'SKILL.md');
  await mkdir(dir, { recursive: true });
  await writeFile(file, [
    '---',
    `name: ${name}`,
    `description: "${description}"`,
    'allowed-tools: Read Write Glob',
    'metadata:',
    `  author: ${author}`,
    '  version: "1.0"',
    '---',
    '',
    `# ${title}`,
    '',
    '## When to Use This Skill',
    '',
    '## Core Principle',
    '',
    '## Steps',
    '',
    '## Anti-Patterns',
    '',
  ].join('\n'));
  console.log(`created ${file}`);
} else {
  const file = join(ROOT, 'plugins', plugin, 'agents', `${name}.md`);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, [
    '---',
    `name: ${name}`,
    `description: ${description}`,
    'tools: Read, Grep, Glob, Bash, Edit, Write',
    '---',
    '',
    `You are ${title}.`,
    '',
  ].join('\n'));
  console.log(`created ${file}`);
}
