import assert from 'node:assert/strict';
import test from 'node:test';
import { renderMarkdown } from '../src/render.js';
import type { Receipt } from '../src/types.js';

const receipt: Receipt = {
  schemaVersion: 1,
  tool: { name: 'cistamp', version: '0.1.0' },
  createdAt: '2026-05-10T00:00:00.000Z',
  cwd: '/tmp/project',
  platform: 'darwin',
  versions: { node: 'v20.0.0', npm: '10.0.0' },
  git: { available: true, branch: 'main', commit: 'abc', dirty: false },
  hashes: [{ path: 'package.json', sha256: 'abc123', bytes: 42 }],
  redaction: { enabled: true, replacements: 1 },
  commands: [{
    index: 0,
    command: 'node',
    args: ['--version'],
    exitCode: 0,
    signal: null,
    durationMs: 12,
    startedAt: '2026-05-10T00:00:00.000Z',
    finishedAt: '2026-05-10T00:00:00.012Z',
    stdout: 'v20.0.0\n',
    stderr: ''
  }],
  summary: { commandCount: 1, failedCount: 0, passed: true }
};

test('renderMarkdown includes receipt summary and command logs', () => {
  const markdown = renderMarkdown(receipt);
  assert.match(markdown, /# CIStamp Receipt/);
  assert.match(markdown, /Status:\*\* PASS/);
  assert.match(markdown, /node --version/);
  assert.match(markdown, /abc123/);
});
