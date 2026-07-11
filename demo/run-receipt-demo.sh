#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/.cistamp/demo"

cd "$ROOT"
npm run build >/dev/null

rm -rf "$OUT"
mkdir -p "$OUT"

node dist/src/cli.js run \
  --out "$OUT/pass-receipt.json" \
  --markdown "$OUT/pass-receipt.md" \
  --hash examples/fixtures/pass.mjs \
  -- node examples/fixtures/pass.mjs

node dist/src/cli.js render "$OUT/pass-receipt.json" --out "$OUT/pass-rendered.md"

grep -q 'CIStamp Receipt' "$OUT/pass-rendered.md"
grep -q 'examples/fixtures/pass.mjs' "$OUT/pass-receipt.json"
grep -q '"passed": true' "$OUT/pass-receipt.json"
test -s "$OUT/pass-receipt.md"
test -s "$OUT/pass-rendered.md"

echo "Demo receipt: $OUT/pass-receipt.json"
echo "Demo markdown: $OUT/pass-rendered.md"
sed -n '1,40p' "$OUT/pass-rendered.md"
