import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const pexec = promisify(execFile);

// Last commit time (ms) that touched `file`, or null if unknown / not tracked.
export async function lastCommitMs(file) {
  try {
    const { stdout } = await pexec('git', ['log', '-1', '--format=%ct', '--', file]);
    const sec = parseInt(stdout.trim(), 10);
    return Number.isFinite(sec) ? sec * 1000 : null;
  } catch {
    return null;
  }
}
