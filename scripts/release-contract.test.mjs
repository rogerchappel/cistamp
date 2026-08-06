#!/usr/bin/env node

import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const workflow = await readFile(".github/workflows/release.yml", "utf8");
const packageJson = JSON.parse(await readFile("package.json", "utf8"));

function position(pattern, description) {
  const index = workflow.search(pattern);
  assert.notEqual(index, -1, `release workflow must ${description}`);
  return index;
}

test("release workflow satisfies the npm trusted-publishing contract", () => {
  assert.match(workflow, /permissions:[\s\S]*?id-token:\s*write/);
  assert.match(workflow, /registry-url:\s*https:\/\/registry\.npmjs\.org/);
  assert.match(workflow, /npm install --global npm@(?:\^|~)?(?:1[1-9]|[2-9]\d)\./);

  const pack = position(/npm pack --json/, "pack the release artifact");
  const publish = position(
    /npm publish\s+["']?\$\{?PACKAGE_FILE\}?["']?\s+--provenance --access public/,
    "publish that exact artifact with provenance",
  );
  const githubRelease = position(/gh release create/, "create the GitHub release");
  assert.ok(pack < publish, "npm pack must happen before npm publish");
  assert.ok(publish < githubRelease, "npm publish must happen before the GitHub release");
  assert.match(workflow, /gh release create[^\n]*["']?\$\{?PACKAGE_FILE\}?["']?/);
});

test("package metadata declares public provenance publication", () => {
  assert.equal(packageJson.name, "cistamp");
  assert.equal(packageJson.private, false);
  assert.deepEqual(packageJson.publishConfig, {
    access: "public",
    provenance: true,
  });
});
