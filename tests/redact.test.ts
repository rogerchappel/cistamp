import assert from 'node:assert/strict';
import test from 'node:test';
import { redactText } from '../src/redact.js';

test('redacts common key-value secrets', () => {
  const result = redactText('token=ghp_1234567890abcdefghijklmnop api_key=supersecretvalue');
  assert.equal(result.replacements >= 2, true);
  assert.equal(result.text.includes('supersecretvalue'), false);
  assert.equal(result.text.includes('ghp_1234567890'), false);
});
