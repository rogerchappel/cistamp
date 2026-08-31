import { mkdir, realpath, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { collectGitMetadata } from './git.js';
import { defaultHashes, hashFiles } from './hash.js';
import { redactRecord } from './redact.js';
import { renderMarkdown } from './render.js';
import { stableStringify } from './stable-json.js';
import type { CommandResult, CommandSpec, Receipt, RunOptions } from './types.js';
import { getPackageVersion } from './version.js';
import { collectVersions } from './versions.js';

export async function runReceipt(commands: CommandSpec[], options: RunOptions): Promise<Receipt> {
  if (options.markdownOut && resolve(options.cwd, options.out) === resolve(options.cwd, options.markdownOut)) {
    throw new Error('JSON and Markdown output paths must be different');
  }
  await rejectHashOutputCollisions(options);
  const startedAt = new Date().toISOString();
  const [versions, git] = await Promise.all([collectVersions(options.cwd), collectGitMetadata(options.cwd)]);
  const results: CommandResult[] = [];

  for (let index = 0; index < commands.length; index += 1) {
    results.push(await runOne(commands[index], index, options.cwd, options.maxLogBytes));
  }

  const failedCount = results.filter((result) => result.exitCode !== 0).length;
  const receipt: Receipt = {
    schemaVersion: 1,
    tool: { name: 'cistamp', version: getPackageVersion() },
    createdAt: startedAt,
    cwd: options.cwd,
    platform: process.platform,
    versions,
    git,
    hashes: deduplicateHashes([...defaultHashes(options.cwd), ...hashFiles(options.cwd, options.hashPaths)]),
    redaction: { enabled: options.redact, replacements: 0 },
    commands: results,
    summary: {
      commandCount: results.length,
      failedCount,
      passed: failedCount === 0
    }
  };

  const finalReceipt = options.redact ? applyReceiptRedaction(receipt) : receipt;
  await writeReceipt(finalReceipt, resolve(options.cwd, options.out));
  if (options.markdownOut) await writeText(resolve(options.cwd, options.markdownOut), renderMarkdown(finalReceipt));
  return finalReceipt;
}

async function rejectHashOutputCollisions(options: RunOptions): Promise<void> {
  const outputs = [options.out, options.markdownOut].filter((path): path is string => Boolean(path));
  for (const hashPath of options.hashPaths) {
    const hashAbsolute = resolve(options.cwd, hashPath);
    const hashIdentity = await fileIdentity(hashAbsolute);
    for (const output of outputs) {
      const outputAbsolute = resolve(options.cwd, output);
      const outputIdentity = await fileIdentity(outputAbsolute);
      if (outputAbsolute === hashAbsolute || (hashIdentity && outputIdentity && hashIdentity === outputIdentity)) {
        throw new Error(`Receipt output ${JSON.stringify(output)} must not overwrite a requested hash input ${JSON.stringify(hashPath)}`);
      }
    }
  }
}

async function fileIdentity(path: string): Promise<string | undefined> {
  try {
    const [canonical, metadata] = await Promise.all([realpath(path), stat(path)]);
    return `${canonical}:${metadata.dev}:${metadata.ino}`;
  } catch {
    return undefined;
  }
}

function deduplicateHashes(hashes: Receipt['hashes']): Receipt['hashes'] {
  const byPath = new Map(hashes.map((hash) => [hash.path, hash]));
  return [...byPath.values()].sort((a, b) => a.path.localeCompare(b.path));
}

function applyReceiptRedaction(receipt: Receipt): Receipt {
  const { value, replacements } = redactRecord(receipt);
  return { ...value, redaction: { enabled: true, replacements } };
}

async function runOne(spec: CommandSpec, index: number, cwd: string, maxLogBytes: number): Promise<CommandResult> {
  const started = Date.now();
  const startedAt = new Date(started).toISOString();
  return new Promise((resolveResult) => {
    const child = spawn(spec.command, spec.args, { cwd, shell: false, env: process.env });
    const stdout = new BoundedLog(maxLogBytes);
    const stderr = new BoundedLog(maxLogBytes);

    child.stdout?.setEncoding('utf8');
    child.stderr?.setEncoding('utf8');
    child.stdout?.on('data', (chunk: string) => { stdout.append(chunk); });
    child.stderr?.on('data', (chunk: string) => { stderr.append(chunk); });
    child.on('error', (error) => {
      stderr.append(`${error.message}\n`);
      resolveResult(done(spec, index, started, startedAt, 127, null, stdout.value, stderr.value));
    });
    child.on('close', (exitCode, signal) => {
      resolveResult(done(spec, index, started, startedAt, exitCode, signal, stdout.value, stderr.value));
    });
  });
}

function done(
  spec: CommandSpec,
  index: number,
  started: number,
  startedAt: string,
  exitCode: number | null,
  signal: NodeJS.Signals | null,
  stdout: string,
  stderr: string
): CommandResult {
  return {
    ...spec,
    index,
    exitCode,
    signal,
    durationMs: Date.now() - started,
    startedAt,
    finishedAt: new Date().toISOString(),
    stdout,
    stderr
  };
}

export class BoundedLog {
  private readonly marker = '[cistamp: log truncated]\n';
  private tail = '';
  private truncated = false;

  constructor(private readonly maxBytes: number) {}

  append(chunk: string): void {
    const combined = this.tail + chunk;
    if (!this.truncated && Buffer.byteLength(combined, 'utf8') <= this.maxBytes) {
      this.tail = combined;
      return;
    }

    this.truncated = true;
    const markerBytes = Buffer.byteLength(this.marker, 'utf8');
    const contentBytes = markerBytes <= this.maxBytes ? this.maxBytes - markerBytes : this.maxBytes;
    this.tail = utf8Tail(combined, contentBytes);
  }

  get value(): string {
    const marker = this.truncated && Buffer.byteLength(this.marker, 'utf8') <= this.maxBytes
      ? this.marker
      : '';
    return marker + this.tail;
  }
}

function utf8Tail(value: string, maxBytes: number): string {
  const bytes = Buffer.from(value, 'utf8');
  if (bytes.length <= maxBytes) return value;
  let start = bytes.length - maxBytes;
  while (start < bytes.length && (bytes[start] & 0xc0) === 0x80) start += 1;
  return bytes.subarray(start).toString('utf8');
}

export async function writeReceipt(receipt: Receipt, outPath: string): Promise<void> {
  await writeText(outPath, stableStringify(receipt));
}

async function writeText(outPath: string, text: string): Promise<void> {
  const absolute = resolve(outPath);
  await mkdir(dirname(absolute), { recursive: true });
  await writeFile(absolute, text, 'utf8');
}
