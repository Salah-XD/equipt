const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const MAX_DESC = 1024;

export function validateAssets(assets) {
  const problems = [];
  const perPlugin = new Map(); // `${plugin}:${kind}` -> Map(name -> file)
  const globalNames = new Map(); // `${kind}:${name}` -> first plugin

  for (const a of assets) {
    const where = a.file;

    if (!a.name) {
      problems.push({ level: 'error', where, msg: 'missing name' });
    } else if (!KEBAB.test(a.name)) {
      problems.push({ level: 'error', where, msg: `name not kebab-case: ${a.name}` });
    }

    if (!a.description) {
      problems.push({ level: 'error', where, msg: 'missing description' });
    } else if (a.description.length > MAX_DESC) {
      problems.push({ level: 'error', where, msg: `description too long (${a.description.length} > ${MAX_DESC})` });
    }

    if (!a.name) continue;

    const key = `${a.plugin}:${a.kind}`;
    if (!perPlugin.has(key)) perPlugin.set(key, new Map());
    const seen = perPlugin.get(key);
    if (seen.has(a.name)) {
      problems.push({ level: 'error', where, msg: `duplicate ${a.kind} name in ${a.plugin}: ${a.name} (also ${seen.get(a.name)})` });
    } else {
      seen.set(a.name, where);
    }

    const gkey = `${a.kind}:${a.name}`;
    if (globalNames.has(gkey) && globalNames.get(gkey) !== a.plugin) {
      problems.push({ level: 'warning', where, msg: `cross-plugin duplicate ${a.kind} name: ${a.name} (also in ${globalNames.get(gkey)})` });
    } else if (!globalNames.has(gkey)) {
      globalNames.set(gkey, a.plugin);
    }
  }
  return problems;
}
