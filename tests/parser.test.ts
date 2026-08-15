import assert from 'node:assert/strict';
import test from 'node:test';
import { parseRunArgs } from '../src/command-parser.js';

test('parseRunArgs splits commands on double dash', () => {
  const parsed = parseRunArgs(['--out', 'receipt.json', '--hash', 'README.md', '--', 'npm', 'test', '--', 'npm', 'run', 'build']);
  assert.equal(parsed.out, 'receipt.json');
  assert.deepEqual(parsed.hashPaths, ['README.md']);
  assert.deepEqual(parsed.commands, [
    { command: 'npm', args: ['test'] },
    { command: 'npm', args: ['run', 'build'] }
  ]);
});

test('parseRunArgs converts triple dash to a literal double-dash argument', () => {
  const parsed = parseRunArgs(['--', 'node', 'script.mjs', '---', '--flag']);
  assert.deepEqual(parsed.commands, [
    { command: 'node', args: ['script.mjs', '--', '--flag'] }
  ]);
});

test('parseRunArgs preserves command separators after a literal double dash', () => {
  const parsed = parseRunArgs(['--', 'first', '---', 'value', '--', 'second', 'argument']);
  assert.deepEqual(parsed.commands, [
    { command: 'first', args: ['--', 'value'] },
    { command: 'second', args: ['argument'] }
  ]);
});

test('parseRunArgs rejects missing command', () => {
  assert.throws(() => parseRunArgs(['--out', 'receipt.json']), /No command provided/);
});
