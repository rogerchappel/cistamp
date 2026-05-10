import { mkdir, writeFile } from 'node:fs/promises';
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
    hashes: [...defaultHashes(options.cwd), ...hashFiles(options.cwd, options.hashPaths)]
      .sort((a, b) => a.path.localeCompare(b.path)),
    redaction: { enabled: options.redact, replacements: 0 },
    commands: results,
    summary: {
      commandCount: results.length,
      failedCount,
      passed: failedCount === 0
    }
  };

  const finalReceipt = options.redact ? applyReceiptRedaction(receipt) : receipt;
  await writeReceipt(finalReceipt, options.out);
  if (options.markdownOut) await writeText(options.markdownOut, renderMarkdown(finalReceipt));
  return finalReceipt;
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
    let stdout = '';
    let stderr = '';

    child.stdout?.setEncoding('utf8');
    child.stderr?.setEncoding('utf8');
    child.stdout?.on('data', (chunk: string) => { stdout = appendBounded(stdout, chunk, maxLogBytes); });
    child.stderr?.on('data', (chunk: string) => { stderr = appendBounded(stderr, chunk, maxLogBytes); });
    child.on('error', (error) => {
      stderr = appendBounded(stderr, `${error.message}\n`, maxLogBytes);
      resolveResult(done(spec, index, started, startedAt, 127, null, stdout, stderr));
    });
    child.on('close', (exitCode, signal) => {
      resolveResult(done(spec, index, started, startedAt, exitCode, signal, stdout, stderr));
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

function appendBounded(existing: string, chunk: string, maxBytes: number): string {
  const combined = existing + chunk;
  if (Buffer.byteLength(combined, 'utf8') <= maxBytes) return combined;
  return `[cistamp: log truncated to last ${maxBytes} bytes]\n${combined.slice(-maxBytes)}`;
}

export async function writeReceipt(receipt: Receipt, outPath: string): Promise<void> {
  await writeText(outPath, stableStringify(receipt));
}

async function writeText(outPath: string, text: string): Promise<void> {
  const absolute = resolve(outPath);
  await mkdir(dirname(absolute), { recursive: true });
  await writeFile(absolute, text, 'utf8');
}
