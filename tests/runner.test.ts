import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { BoundedLog, runReceipt } from '../src/runner.js';

test('runReceipt executes a local command and writes JSON', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'cistamp-runner-'));
  const out = join(dir, 'receipt.json');
  const receipt = await runReceipt([{ command: process.execPath, args: ['-e', 'console.log("token=supersecretvalue")'] }], {
    cwd: dir,
    out,
    redact: true,
    failOn: 'command-failure',
    hashPaths: [],
    maxLogBytes: 16_000
  });
  assert.equal(receipt.summary.passed, true);
  assert.equal(receipt.commands[0].exitCode, 0);
  assert.equal(receipt.commands[0].stdout.includes('supersecretvalue'), false);
  assert.equal(existsSync(out), true);
});

test('runReceipt emits one hash per normalized path across defaults and repeated --hash inputs', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'cistamp-runner-'));
  writeFileSync(join(dir, 'package.json'), '{}\n');
  writeFileSync(join(dir, 'custom.txt'), 'custom\n');

  const receipt = await runReceipt([], {
    cwd: dir,
    out: join(dir, 'receipt.json'),
    redact: false,
    failOn: 'command-failure',
    hashPaths: ['package.json', './package.json', 'custom.txt', 'custom.txt'],
    maxLogBytes: 16_000
  });

  assert.deepEqual(receipt.hashes.map((hash) => hash.path), ['custom.txt', 'package.json']);
});

test('runReceipt rejects an explicit missing hash path without writing a receipt', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'cistamp-runner-'));
  const out = join(dir, 'receipt.json');

  await assert.rejects(runReceipt([], {
    cwd: dir,
    out,
    redact: false,
    failOn: 'never',
    hashPaths: ['missing.txt'],
    maxLogBytes: 16_000
  }), /Cannot hash requested path "missing.txt"/);
  assert.equal(existsSync(out), false);
});

test('bounded logs keep a valid UTF-8 tail independent of chunk boundaries', () => {
  const input = `prefix-${'😀'.repeat(20)}-suffix`;
  const expectedBytes = 48;
  const chunkShapes = [
    [input],
    Array.from(input),
    ['prefix-', '😀'.repeat(7), '😀'.repeat(13), '-suffix']
  ];

  const values = chunkShapes.map((chunks) => {
    const log = new BoundedLog(expectedBytes);
    for (const chunk of chunks) log.append(chunk);
    assert.ok(Buffer.byteLength(log.value, 'utf8') <= expectedBytes);
    assert.equal(log.value.includes('\uFFFD'), false);
    assert.match(log.value, /^\[cistamp: log truncated\]\n/);
    return log.value;
  });

  assert.deepEqual(values, [values[0], values[0], values[0]]);
});

test('runReceipt bounds multibyte stdout and stderr in bytes', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'cistamp-runner-'));
  const maxLogBytes = 64;
  const script = [
    `process.stdout.write('${'😀'.repeat(40)}')`,
    `process.stderr.write('${'界'.repeat(40)}')`
  ].join(';');
  const receipt = await runReceipt([{ command: process.execPath, args: ['-e', script] }], {
    cwd: dir,
    out: join(dir, 'receipt.json'),
    redact: false,
    failOn: 'command-failure',
    hashPaths: [],
    maxLogBytes
  });

  for (const output of [receipt.commands[0].stdout, receipt.commands[0].stderr]) {
    assert.ok(Buffer.byteLength(output, 'utf8') <= maxLogBytes);
    assert.equal(output.includes('\uFFFD'), false);
    assert.match(output, /^\[cistamp: log truncated\]\n/);
  }
});

test('bounded logs retain existing ASCII behavior within the limit', () => {
  const log = new BoundedLog(16);
  log.append('plain ASCII\n');
  assert.equal(log.value, 'plain ASCII\n');
});

test('bounded logs omit an oversized marker without splitting a code point', () => {
  const log = new BoundedLog(3);
  log.append('a😀');
  assert.equal(log.value, '');
  assert.equal(Buffer.byteLength(log.value, 'utf8'), 0);
});
