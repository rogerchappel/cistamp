#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

rm -rf .cistamp/smoke
mkdir -p .cistamp/smoke

node dist/cli.js run \
  --out .cistamp/smoke/receipt.json \
  --markdown .cistamp/smoke/receipt.md \
  --hash examples/fixtures/pass.mjs \
  -- node examples/fixtures/pass.mjs

node dist/cli.js render .cistamp/smoke/receipt.json --out .cistamp/smoke/rendered.md

grep -q 'CIStamp Receipt' .cistamp/smoke/rendered.md
grep -q '\[REDACTED\]' .cistamp/smoke/receipt.json

printf 'Smoke receipt: %s\n' "$repo_root/.cistamp/smoke/receipt.json"
printf 'Smoke markdown: %s\n' "$repo_root/.cistamp/smoke/rendered.md"
