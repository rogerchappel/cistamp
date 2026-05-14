import assert from 'node:assert/strict';
import test from 'node:test';
import { redactText } from '../src/redact.js';

test('redacts common key-value secrets', () => {
  const result = redactText('token=ghp_1234567890abcdefghijklmnop api_key=supersecretvalue');
  assert.equal(result.replacements >= 2, true);
  assert.equal(result.text.includes('supersecretvalue'), false);
  assert.equal(result.text.includes('ghp_1234567890'), false);
});


test('redacts Slack-style chat tokens from command logs', () => {
  const result = redactText('SLACK_BOT_TOKEN=xoxb-123456789012-ABCDEFGHIJKL-secretvalue');
  assert.equal(result.replacements, 1);
  assert.equal(result.text.includes('xoxb-'), false);
});
