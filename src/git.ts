import { captureCommand } from './process-utils.js';
import type { GitMetadata } from './types.js';

export async function collectGitMetadata(cwd: string): Promise<GitMetadata> {
  const inside = await captureCommand('git', ['rev-parse', '--is-inside-work-tree'], cwd);
  if (inside.exitCode !== 0 || inside.stdout.trim() !== 'true') return { available: false };

  const [commit, branch, status, remote] = await Promise.all([
    gitValue(cwd, ['rev-parse', 'HEAD']),
    gitValue(cwd, ['branch', '--show-current']),
    gitValue(cwd, ['status', '--porcelain']),
    gitValue(cwd, ['config', '--get', 'remote.origin.url'])
  ]);

  return {
    available: true,
    ...(commit ? { commit } : {}),
    ...(branch ? { branch } : {}),
    dirty: Boolean(status),
    ...(remote ? { remote } : {})
  };
}

async function gitValue(cwd: string, args: string[]): Promise<string | undefined> {
  const result = await captureCommand('git', args, cwd);
  if (result.exitCode !== 0) return undefined;
  return result.stdout.trim() || undefined;
}
