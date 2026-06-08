// scoring/score.mjs
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAssetsForScoring } from './lib/load.mjs';
import { scoreCraft } from './analyzers/craft.mjs';
import { scoreGuardStatic } from './analyzers/guard-static.mjs';
import { scoreProofStatic } from './analyzers/proof-static.mjs';
import { scoreUpkeep } from './analyzers/upkeep.mjs';
import { lastCommitMs } from './lib/git.mjs';
import { computeReadiness } from './lib/composite.mjs';
import { mergeCuration } from './lib/curation.mjs';
import { validateScorecard, STANDARD_VERSION } from './lib/schema.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PLUGINS = join(ROOT, 'plugins');
const OUT = join(ROOT, 'scores');

async function readCuration() {
  let raw;
  try {
    raw = await readFile(join(ROOT, 'curation.json'), 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return {}; // no curation file yet is fine
    throw err;
  }
  return JSON.parse(raw); // a malformed curation.json must fail loudly, not be ignored
}

async function main() {
  const nowMs = Date.now();
  const assets = await loadAssetsForScoring(PLUGINS);
  const curation = await readCuration();
  const index = [];

  for (const a of assets) {
    const axes = {
      craft: scoreCraft(a),
      fit: null, // LLM eval — follow-on plan; null forces partial/provisional (spec §6)
      guard: scoreGuardStatic(a),
      proof: scoreProofStatic(a),
      upkeep: scoreUpkeep(a, { nowMs, lastCommitMs: await lastCommitMs(a.file) }),
    };
    const composite = computeReadiness(axes);

    let card = {
      asset: { plugin: a.plugin, name: a.name, kind: a.kind },
      standardVersion: STANDARD_VERSION,
      readiness: composite.readiness,
      tier: composite.tier,
      unsafe: composite.unsafe,
      partial: composite.partial,
      eligibleTier: composite.eligibleTier,
      axes,
    };
    card = mergeCuration(card, curation[`${a.plugin}/${a.name}`]);

    const { valid, errors } = validateScorecard(card);
    if (!valid) throw new Error(`Invalid scorecard for ${a.plugin}/${a.name}: ${errors.join('; ')}`);

    const dir = join(OUT, a.plugin);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, `${a.name}.json`), JSON.stringify(card, null, 2) + '\n');

    index.push({
      plugin: a.plugin, name: a.name, kind: a.kind,
      readiness: card.readiness, tier: card.tier, unsafe: card.unsafe, partial: card.partial,
    });
  }

  index.sort((x, y) => y.readiness - x.readiness);
  await mkdir(OUT, { recursive: true });
  await writeFile(
    join(OUT, 'index.json'),
    JSON.stringify({ standardVersion: STANDARD_VERSION, count: index.length, assets: index }, null, 2) + '\n',
  );

  const unsafe = index.filter((a) => a.unsafe).length;
  console.log(`Scored ${index.length} assets → scores/  (${unsafe} flagged unsafe)`);
}

main().catch((err) => { console.error(err); process.exit(1); });
