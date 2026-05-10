import { createHash } from 'node:crypto';
import { statSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
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
  return hashFiles(cwd, defaultHashPaths);
}

export function hashFiles(cwd: string, paths: string[]): FileHash[] {
  const unique = [...new Set(paths)].sort((a, b) => a.localeCompare(b));
  const hashes: FileHash[] = [];

  for (const path of unique) {
    const absolute = join(cwd, path);
    try {
      const stat = statSync(absolute);
      if (!stat.isFile()) continue;
      const bytes = readFileSync(absolute);
      hashes.push({
        path: relative(cwd, absolute).replaceAll('\\', '/'),
        sha256: createHash('sha256').update(bytes).digest('hex'),
        bytes: stat.size
      });
    } catch {
      // Missing requested hash inputs are skipped so receipts work across package managers.
    }
  }

  return hashes;
}
