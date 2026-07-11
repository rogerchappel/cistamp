# Create A PR Verification Receipt

This tutorial uses the checked-in passing fixture to create JSON and Markdown evidence for a command that succeeded locally.

## Run The Demo

```sh
bash demo/run-receipt-demo.sh
```

The script builds CIStamp, runs `examples/fixtures/pass.mjs`, hashes that fixture, writes `.cistamp/demo/pass-receipt.json`, and renders `.cistamp/demo/pass-rendered.md`.

## Manual Flow

```sh
npm run build
node dist/src/cli.js run \
  --out .cistamp/demo/pass-receipt.json \
  --markdown .cistamp/demo/pass-receipt.md \
  --hash examples/fixtures/pass.mjs \
  -- node examples/fixtures/pass.mjs
node dist/src/cli.js render .cistamp/demo/pass-receipt.json --out .cistamp/demo/pass-rendered.md
```

## What The Receipt Shows

- command arguments and exit code
- git, Node, and npm version context when available
- hash evidence for the fixture passed with `--hash`
- redacted stdout and stderr fields
- a Markdown rendering suitable for a PR comment or release note

## Verification

The demo checks that the rendered Markdown has a CIStamp heading, the JSON receipt includes the fixture path, and the summary records `"passed": true`.
