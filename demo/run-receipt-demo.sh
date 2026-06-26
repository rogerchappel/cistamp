#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
tmp_dir="${TMPDIR:-/tmp}/cistamp-demo-$$"

cleanup() {
  rm -rf "$tmp_dir"
}
trap cleanup EXIT

cd "$repo_root"
npm run build

mkdir -p "$tmp_dir"

node dist/src/cli.js run \
  --out "$tmp_dir/receipt.json" \
  --markdown "$tmp_dir/receipt.md" \
  --hash examples/fixtures/pass.mjs \
  -- node examples/fixtures/pass.mjs

node dist/src/cli.js render "$tmp_dir/receipt.json" --out "$tmp_dir/rendered.md"

test -s "$tmp_dir/receipt.json"
test -s "$tmp_dir/receipt.md"
test -s "$tmp_dir/rendered.md"
grep -q "CIStamp" "$tmp_dir/receipt.md"
grep -q "examples/fixtures/pass.mjs" "$tmp_dir/rendered.md"

printf 'CIStamp demo artifacts written under %s\n' "$tmp_dir"
