import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import type { Receipt } from '../src/types.js';

test('CLI passes a literal double dash and keeps multi-command receipts', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cistamp-cli-'));
  const out = join(dir, 'receipt.json');
  const cli = join(process.cwd(), 'dist/src/cli.js');
  const argvFixture = join(process.cwd(), 'tests/fixtures/print-argv.mjs');
  const result = spawnSync(process.execPath, [
    cli,
    'run',
    '--out', out,
    '--',
    process.execPath, argvFixture, '---', '--child-option',
    '--',
    process.execPath, '-e', 'console.log("second command")'
  ], { cwd: dir, encoding: 'utf8' });

  assert.equal(result.status, 0, result.stderr);
  const receipt = JSON.parse(readFileSync(out, 'utf8')) as Receipt;
  assert.equal(receipt.commands.length, 2);
  assert.deepEqual(receipt.commands[0].args.slice(-2), ['--', '--child-option']);
  assert.match(receipt.commands[0].stdout, /\["--","--child-option"\]/);
  assert.match(receipt.commands[1].stdout, /second command/);
});

test('CLI help documents command separators and literal double-dash arguments', () => {
  const cli = join(process.cwd(), 'dist/src/cli.js');
  const result = spawnSync(process.execPath, [cli, '--help'], { encoding: 'utf8' });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /-- separates commands; use --- to pass a literal -- argument/);
  assert.match(result.stdout, /--hash <path>\s+Hash a required regular file/);
});

test('CLI fails clearly and writes no receipt for a missing explicit hash path', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cistamp-cli-'));
  const out = join(dir, 'receipt.json');
  const cli = join(process.cwd(), 'dist/src/cli.js');
  const result = spawnSync(process.execPath, [
    cli, 'run', '--out', out, '--hash', 'missing.txt', '--', process.execPath, '-e', ''
  ], {
    cwd: dir,
    encoding: 'utf8'
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Cannot hash requested path "missing.txt"/);
  assert.throws(() => readFileSync(out, 'utf8'));
});

test('CLI run rejects relative and absolute aliases before executing commands', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cistamp-cli-collision-'));
  const destination = join(dir, 'receipt.json');
  writeFileSync(destination, 'existing destination\n');
  const marker = join(dir, 'command-ran');
  const cli = join(process.cwd(), 'dist/src/cli.js');
  const result = spawnSync(process.execPath, [
    cli, 'run', '--out', 'receipt.json', '--markdown', destination, '--',
    process.execPath, '-e', `require('node:fs').writeFileSync(${JSON.stringify(marker)}, 'ran')`
  ], { cwd: dir, encoding: 'utf8' });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /JSON and Markdown output paths must be different/);
  assert.equal(readFileSync(destination, 'utf8'), 'existing destination\n');
  assert.throws(() => readFileSync(marker, 'utf8'));
});

test('CLI render rejects relative and absolute input aliases without changing the receipt', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cistamp-cli-render-collision-'));
  const input = join(dir, 'receipt.json');
  const source = '{"preserved":true}\n';
  writeFileSync(input, source);
  const cli = join(process.cwd(), 'dist/src/cli.js');
  const result = spawnSync(process.execPath, [
    cli, 'render', 'receipt.json', '--out', input
  ], { cwd: dir, encoding: 'utf8' });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Receipt input and Markdown output paths must be different/);
  assert.equal(readFileSync(input, 'utf8'), source);
});
