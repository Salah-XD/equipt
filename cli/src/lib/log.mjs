import pc from 'picocolors';

// picocolors auto-disables when stdout is not a TTY or NO_COLOR is set,
// so these are safe to use unconditionally (no manual stripping needed).
export { pc };

export function tierColor(tier) {
  if (tier === 'field-ready') return pc.green('field-ready');
  if (tier === 'certified') return pc.yellow('certified');
  return pc.dim(tier || 'provisional');
}

export function statusColor(status) {
  const label = status.padEnd(11);
  if (status === 'installed') return pc.green(label);
  if (status === 'overwritten') return pc.yellow(label);
  return pc.dim(label);
}

export function kindLabel(kind) {
  return kind === 'skill' ? pc.cyan('skill') : pc.magenta('agent');
}
