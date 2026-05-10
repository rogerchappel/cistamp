import assert from 'node:assert/strict';
import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { runReceipt } from '../src/runner.js';

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
