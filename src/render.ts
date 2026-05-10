import { readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import type { Receipt } from './types.js';

export function readReceipt(path: string): Receipt {
  return JSON.parse(readFileSync(path, 'utf8')) as Receipt;
}

export function renderMarkdown(receipt: Receipt): string {
  const lines: string[] = [];
  lines.push('# CIStamp Receipt');
  lines.push('');
  lines.push(`- **Status:** ${receipt.summary.passed ? 'PASS' : 'FAIL'}`);
  lines.push(`- **Created:** ${receipt.createdAt}`);
  lines.push(`- **Working directory:** \`${receipt.cwd}\``);
  lines.push(`- **Tool:** ${receipt.tool.name}@${receipt.tool.version}`);
  lines.push(`- **Redaction:** ${receipt.redaction.enabled ? `enabled (${receipt.redaction.replacements} replacements)` : 'disabled'}`);
  lines.push('');
  lines.push('## Versions');
  lines.push('');
  lines.push(`- Node: \`${receipt.versions.node}\``);
  if (receipt.versions.npm) lines.push(`- npm: \`${receipt.versions.npm}\``);
  if (receipt.versions.git) lines.push(`- git: \`${receipt.versions.git}\``);
  lines.push('');
  lines.push('## Git');
  lines.push('');
  if (receipt.git.available) {
    if (receipt.git.branch) lines.push(`- Branch: \`${receipt.git.branch}\``);
    if (receipt.git.commit) lines.push(`- Commit: \`${receipt.git.commit}\``);
    lines.push(`- Dirty: \`${receipt.git.dirty ? 'yes' : 'no'}\``);
  } else {
    lines.push('- Git metadata unavailable.');
  }
  lines.push('');
  lines.push('## File hashes');
  lines.push('');
  if (receipt.hashes.length === 0) {
    lines.push('- No hash inputs found.');
  } else {
    lines.push('| Path | SHA-256 | Bytes |');
    lines.push('| --- | --- | ---: |');
    for (const hash of receipt.hashes) lines.push(`| \`${hash.path}\` | \`${hash.sha256}\` | ${hash.bytes} |`);
  }
  lines.push('');
  lines.push('## Commands');
  lines.push('');
  for (const command of receipt.commands) {
    lines.push(`### ${command.index + 1}. \`${[command.command, ...command.args].join(' ')}\``);
    lines.push('');
    lines.push(`- Exit code: \`${command.exitCode ?? 'null'}\``);
    lines.push(`- Duration: \`${command.durationMs}ms\``);
    if (command.signal) lines.push(`- Signal: \`${command.signal}\``);
    if (command.stdout.trim()) {
      lines.push('');
      lines.push('<details><summary>stdout</summary>');
      lines.push('');
      lines.push('```text');
      lines.push(command.stdout.trimEnd());
      lines.push('```');
      lines.push('');
      lines.push('</details>');
    }
    if (command.stderr.trim()) {
      lines.push('');
      lines.push('<details><summary>stderr</summary>');
      lines.push('');
      lines.push('```text');
      lines.push(command.stderr.trimEnd());
      lines.push('```');
      lines.push('');
      lines.push('</details>');
    }
    lines.push('');
  }
  return `${lines.join('\n').trimEnd()}\n`;
}

export async function renderReceiptFile(input: string, out?: string): Promise<string> {
  const markdown = renderMarkdown(readReceipt(input));
  if (out) {
    const absolute = resolve(out);
    await mkdir(dirname(absolute), { recursive: true });
    await writeFile(absolute, markdown, 'utf8');
  }
  return markdown;
}
