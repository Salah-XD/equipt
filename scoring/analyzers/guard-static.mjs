// Pure. Static safety scan. Returns { score, signals, gated }.
const HARD_FAIL = [
  { re: /rm\s+-rf\s+\/(?!\w)/, msg: 'destructive rm -rf /' },
  { re: /(curl|wget)[^\n]*\b(env|ANTHROPIC_API_KEY|secret|token|password)\b/i, msg: 'exfiltrates secrets over the network' },
  { re: /https?:\/\/[^\s]+[?&](token|key|secret|password)=/i, msg: 'leaks a credential in a URL' },
];
const RISK = [
  { re: /\|\s*(sh|bash)\b/, msg: 'pipes downloaded content to a shell', penalty: 25 },
  { re: /\b(~\/\.ssh|id_rsa|\.aws\/credentials)\b/, msg: 'references sensitive credential files', penalty: 25 },
  { re: /\b(curl|wget)\b/i, msg: 'invokes the network (curl/wget)', penalty: 20 },
  { re: /\beval\s*\(/, msg: 'uses eval()', penalty: 20 },
  { re: /base64\s+-d|atob\(/i, msg: 'decodes obfuscated content', penalty: 15 },
  { re: /\b(process\.env|printenv)\b/, msg: 'reads environment variables', penalty: 10 },
];
const BROAD_TOOLS = ['Bash', 'Write', 'Edit', 'NotebookEdit'];

export function scoreGuardStatic(asset) {
  const body = asset.body || '';

  for (const hf of HARD_FAIL) {
    if (hf.re.test(body)) return { score: 0, signals: [`HARD FAIL: ${hf.msg}`], gated: true };
  }

  const signals = [];
  let score = 100;
  for (const r of RISK) {
    if (r.re.test(body)) { score -= r.penalty; signals.push(r.msg); }
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
