import { homedir } from 'node:os';
import { join } from 'node:path';

export function resolveTargetDir({ global = false, cwd = process.cwd() } = {}) {
  return global ? join(homedir(), '.claude') : join(cwd, '.claude');
}
