// Pure. Static safety scan. Returns { score, signals, gated }.
//
// Risk/exfil patterns are matched only against the asset's CODE (fenced + inline)
// — prose that merely *mentions* a command (documentation) doesn't count, which
// removes the false-positives that penalized legitimate docs. The pattern set
// covers modern JS/Python/Ruby/PowerShell network + exec verbs (not just
// curl/wget), so a malicious skill can no longer bypass the scan.

function codeOf(body) {
  let code = '';
  for (const f of body.match(/```[\s\S]*?```/g) || []) code += '\n' + f;
  for (const i of body.match(/`[^`\n]+`/g) || []) code += '\n' + i;
  return code;
}

const SECRET = 'ANTHROPIC_API_KEY|api[_-]?key|secret|token|password|credential|process\\.env|printenv|os\\.environ|\\$env:|\\.env\\b|~/\\.ssh|id_rsa|\\.aws/credentials';
const NETVERB = 'curl\\s|wget\\s|fetch\\s*\\(|XMLHttpRequest|\\baxios\\b|requests\\.(get|post|put)|urllib|httpx|Invoke-WebRequest|Invoke-RestMethod|Net::HTTP|https?\\.(get|request)\\s*\\(';

const HARD_FAIL = [
  { re: /rm\s+-rf\s+[~/](?!\w)/, msg: 'destructive rm -rf on / or ~' },
  { re: /https?:\/\/[^\s`"']+[?&](token|key|secret|password|api[_-]?key)=/i, msg: 'leaks a credential in a URL' },
];

const RISK = [
  { re: new RegExp(`(${NETVERB})[\\s\\S]{0,80}(${SECRET})|(${SECRET})[\\s\\S]{0,80}(${NETVERB})`, 'i'), msg: 'sends secrets/credentials over the network', penalty: 50 },
  { re: /\|\s*(sh|bash|zsh)\b/, msg: 'pipes content straight into a shell', penalty: 22 },
  { re: /Invoke-Expression|\bIEX\b|\beval\s*\(|\bnew\s+Function\s*\(/, msg: 'evaluates dynamic code', penalty: 20 },
  { re: /child_process|\bexecSync?\s*\(|\bspawnSync?\s*\(|os\.system|subprocess\.(run|call|Popen)/i, msg: 'spawns shells / processes', penalty: 12 },
  { re: /\b(~\/\.ssh|id_rsa|\.aws\/credentials)\b/, msg: 'reads credential files', penalty: 16 },
  { re: /base64\s+-d|atob\s*\(|Buffer\.from\([^)]*['"]base64/i, msg: 'decodes obfuscated content', penalty: 10 },
  { re: /\b(process\.env|printenv|os\.environ)\b/, msg: 'reads environment variables', penalty: 6 },
];

const BROAD_TOOLS = ['Bash', 'Write', 'Edit', 'NotebookEdit'];

export function scoreGuardStatic(asset) {
  const code = codeOf(asset.body || '');

  for (const hf of HARD_FAIL) {
    if (hf.re.test(code)) return { score: 0, signals: [`HARD FAIL: ${hf.msg}`], gated: true };
  }

  const signals = [];
  let score = 100;
  for (const r of RISK) {
    if (r.re.test(code)) { score -= r.penalty; signals.push(r.msg); }
  }

  const tools = asset.tools;
  if (typeof tools === 'string' && (tools.trim() === '*' || tools.trim() === '')) {
    score -= 20; signals.push('grants all tools (no least-privilege)');
  } else if (tools != null) {
    const list = Array.isArray(tools) ? tools : String(tools).split(/[,\s]+/).filter(Boolean);
    const broad = list.filter((t) => BROAD_TOOLS.includes(t));
    if (broad.length) { score -= Math.min(15, broad.length * 5); signals.push(`broad tool access: ${broad.join(', ')}`); }
  }

  score = Math.max(0, Math.min(100, score));
  if (!signals.length) signals.push('no static risk patterns detected');
  return { score, signals, gated: false };
}
