import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('documented Node support matches the CI test matrix and package engine floor', () => {
  const readme = readFileSync('README.md', 'utf8');
  const ci = readFileSync('.github/workflows/ci.yml', 'utf8');
  const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { engines: { node: string } };
  const documented = readme.match(/Use Node\.js ([^\n]+)\./)?.[1];
  const matrix = ci.match(/node-version:\s*\[([^\]]+)\]/)?.[1];

  assert.equal(documented, '20 or newer, matching the versions tested in CI');
  assert.equal(matrix, '20, 22, 24');
  assert.equal(pkg.engines.node, '>=20');
});
