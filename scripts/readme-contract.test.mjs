#!/usr/bin/env node

import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const readme = await readFile("README.md", "utf8");

function section(heading, nextHeading) {
  const start = readme.indexOf(heading);
  assert.notEqual(start, -1, `README must include ${heading}`);
  const end = readme.indexOf(nextHeading, start + heading.length);
  assert.notEqual(end, -1, `README must include ${nextHeading} after ${heading}`);
  return readme.slice(start, end);
}

test("unpublished install guidance leads with a runnable source checkout", () => {
  const install = section("## Install", "## Quick start");
  const postRelease = install.indexOf("After the first npm release");

  assert.match(install, /has not been published to npm yet/i);
  assert.notEqual(postRelease, -1, "npm commands must be labelled post-release");

  const currentInstructions = install.slice(0, postRelease);
  assert.match(currentInstructions, /git clone https:\/\/github\.com\/rogerchappel\/cistamp\.git/);
  assert.match(currentInstructions, /npm ci/);
  assert.match(currentInstructions, /npm run build/);
  assert.match(currentInstructions, /node dist\/src\/cli\.js --help/);
  assert.doesNotMatch(currentInstructions, /npm install --global cistamp/);
  assert.doesNotMatch(currentInstructions, /npx cistamp/);

  const futureInstructions = install.slice(postRelease);
  assert.match(futureInstructions, /npm install --global cistamp/);
  assert.match(futureInstructions, /npx cistamp/);
});

test("publishing guidance remains consistent with unpublished status", () => {
  const publishing = section("## Publishing a release", "## License");

  assert.match(publishing, /package is currently unpublished/i);
  assert.match(publishing, /post-release install commands above/i);
  assert.match(publishing, /trusted publisher/);
});
