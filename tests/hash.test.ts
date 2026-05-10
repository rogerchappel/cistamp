import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { hashFiles } from '../src/hash.js';

test('hashFiles returns stable sha256 metadata for existing files', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cistamp-hash-'));
  writeFileSync(join(dir, 'fixture.txt'), 'hello\n');
  const [hash] = hashFiles(dir, ['missing.txt', 'fixture.txt']);
  assert.equal(hash.path, 'fixture.txt');
  assert.equal(hash.bytes, 6);
  assert.equal(hash.sha256, '5891b5b522d5df086d0ff0b110fbd9d21bb4fc7163af34d08286a2e846f6be03');
});
