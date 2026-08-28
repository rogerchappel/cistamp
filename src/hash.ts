import { createHash } from 'node:crypto';
import { statSync, readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import type { FileHash } from './types.js';

const defaultHashPaths = [
  'package.json',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'bun.lockb',
  'tsconfig.json'
];

export function defaultHashes(cwd: string): FileHash[] {
  return hashFiles(cwd, defaultHashPaths, { optional: true });
}

export function hashFiles(cwd: string, paths: string[], options: { optional?: boolean } = {}): FileHash[] {
  const unique = [...new Set(paths)].sort((a, b) => a.localeCompare(b));
  const hashes: FileHash[] = [];

  for (const path of unique) {
    const absolute = resolve(cwd, path);
    try {
      const stat = statSync(absolute);
      if (!stat.isFile()) throw new Error('not a regular file');
      const bytes = readFileSync(absolute);
      hashes.push({
        path: relative(cwd, absolute).replaceAll('\\', '/'),
        sha256: createHash('sha256').update(bytes).digest('hex'),
        bytes: stat.size
      });
    } catch (error) {
      if (options.optional) continue;
      const detail = error instanceof Error ? error.message : String(error);
      throw new Error(`Cannot hash requested path ${JSON.stringify(path)}: ${detail}`);
    }
  }

  return hashes;
}
