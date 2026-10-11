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

test("install guidance verifies registry availability before npm usage", () => {
  const install = section("## Install", "## Quick start");
  const registryCheck = install.indexOf("npm view cistamp version");
  const sourceCheckout = install.indexOf("git clone https://github.com/rogerchappel/cistamp.git");
  const tarball = install.indexOf("npm pack");
  const publishedInstall = install.indexOf("npm install --global cistamp@0.1.0");
  const publishedNpx = install.indexOf("npx --yes cistamp@0.1.0");

  assert.match(install, /not currently published on npm/i);
  assert.notEqual(registryCheck, -1, "registry availability must be checked");
  assert.match(install, /npm view cistamp@0\.1\.0 version/);
  assert.ok(registryCheck < sourceCheckout && sourceCheckout < tarball);
  assert.ok(tarball < publishedInstall && publishedInstall < publishedNpx);

  const sourceInstructions = install.slice(sourceCheckout, tarball);
  assert.match(sourceInstructions, /npm ci/);
  assert.match(sourceInstructions, /npm run build/);
  assert.match(sourceInstructions, /node dist\/src\/cli\.js --help/);
  assert.match(install, /E404|version differs/);
  assert.match(install, /cistamp-0\.1\.0\.tgz/);
  assert.match(install, /Once registry verification succeeds/);
});

test("publishing guidance remains consistent with unpublished status", () => {
  const publishing = section("## Publishing a release", "## License");

  assert.match(publishing, /package is currently unpublished/i);
  assert.match(publishing, /post-release install commands above/i);
  assert.match(publishing, /trusted publisher/);
});
