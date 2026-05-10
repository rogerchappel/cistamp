import { captureCommand } from './process-utils.js';
import type { RuntimeVersions } from './types.js';

export async function collectVersions(cwd: string): Promise<RuntimeVersions> {
  const [npm, git] = await Promise.all([
    optionalVersion('npm', ['--version'], cwd),
    optionalVersion('git', ['--version'], cwd)
  ]);

  return {
    node: process.version,
    ...(npm ? { npm } : {}),
    ...(git ? { git } : {})
  };
}

async function optionalVersion(command: string, args: string[], cwd: string): Promise<string | undefined> {
  const result = await captureCommand(command, args, cwd);
  if (result.exitCode !== 0) return undefined;
  return result.stdout.trim().replace(/^git version\s+/, '') || undefined;
}
