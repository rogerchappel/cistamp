# CIStamp

CIStamp is a tiny receipt printer for local CI work. It runs the commands you
would otherwise summarize as “tests pass”, captures versions, git state,
lockfile hashes, exit codes, and redacted logs, then emits portable JSON and
Markdown evidence you can paste into a PR, release, or agent handoff.

It is deliberately boring: no dashboard, no telemetry, no accounts, no network
calls in the V1 runtime path. Just a crisp little stamp for the work you ran.

## Install

Install the published CLI from npm:

```sh
npm install --global cistamp
cistamp --help
```

Or run it without a global install:

```sh
npx cistamp run -- npm test
```

To work from a source checkout instead:

```sh
npm install
npm run build
```

For local development you can run the built CLI directly:

```sh
node dist/src/cli.js --help
```

## Quick start

```sh
npm run build
node dist/src/cli.js run -- npm test -- npm run build
node dist/src/cli.js render .cistamp/latest.json --out verification.md
```

`cistamp run` writes `.cistamp/latest.json` by default. `cistamp render` turns
that JSON into a Markdown receipt.

## Examples

Run the checked-in fixture and render evidence:

```sh
node dist/src/cli.js run \
  --out .cistamp/example.json \
  --markdown .cistamp/example.md \
  --hash examples/fixtures/pass.mjs \
  -- node examples/fixtures/pass.mjs

node dist/src/cli.js render .cistamp/example.json --out .cistamp/example-rendered.md
```

For a reproducible demo that builds the CLI, runs the passing fixture, renders
the receipt, and checks the expected output files:

```sh
bash demo/run-receipt-demo.sh
```

The companion walkthrough is
[docs/tutorials/pr-verification-receipt.md](docs/tutorials/pr-verification-receipt.md).
Recording outlines and short promotion hooks are in
[docs/promo/pr-receipt-video-brief.md](docs/promo/pr-receipt-video-brief.md) and
[docs/promo/receipt-demo-brief.md](docs/promo/receipt-demo-brief.md).

Run multiple commands by separating each command with `--`:

```sh
node dist/src/cli.js run -- npm test -- npm run build -- npm run smoke
```

Use CIStamp as a non-blocking evidence collector:

```sh
node dist/src/cli.js run --fail-on never -- node examples/fixtures/fail.mjs
```

## What gets recorded

- CLI version and receipt schema version
- Node/npm/git versions when available
- git branch, commit, dirty state, and origin URL when available
- default hashes for package and lock files
- caller-provided hashes via `--hash <path>`
- command, arguments, start/finish time, duration, exit code, signal, stdout, and stderr
- redaction status and replacement count

## Safety model

- Redaction is enabled by default for common token, password, private-key, and credential patterns.
- Disable redaction only when you really mean it: `--no-redact`.
- Runtime is local-first and offline by default.
- Hidden writes are limited to `.cistamp/latest.json` unless you pass `--out` or `--markdown`.
- CIStamp records evidence; it does not prove a machine was uncompromised.

## Limitations

- Command execution is local and sequential.
- Logs are bounded to 64,000 UTF-8 bytes per stream by default. When truncation
  occurs, the byte limit includes the `[cistamp: log truncated]` marker; the
  retained tail always begins at a complete Unicode code point. For limits too
  small to hold the marker, only the valid UTF-8 tail is retained.
- Redaction catches obvious secrets, not every possible secret format.
- Receipts include absolute working directories; review before publishing if path privacy matters.

## Verify

```sh
npm run check
npm test
npm run build
npm run smoke
bash scripts/validate.sh
```

## Contributing

Small, reviewable changes are best. Please include tests or a smoke receipt for
behavior changes, and keep the V1 path offline and deterministic.

See [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), and the
[PRD](docs/PRD.md) for more context.

## Development

Use Node.js 20 or newer. Run the same checks locally before opening a PR:

```sh
npm run build
npm run check
npm test
npm run smoke
npm run package:smoke
npm run release:check
```

## Publishing a release

Maintainers publish by pushing a `v*.*.*` tag. Before the first release, add a
trusted publisher for `cistamp` in the npm package settings with these values:

- provider: GitHub Actions
- organization or user: `rogerchappel`
- repository: `cistamp`
- workflow filename: `release.yml`
- environment: leave blank

The release workflow uses GitHub's short-lived OIDC identity; it does not need
an `NPM_TOKEN` secret. It runs `npm run release:check`, packs one tarball,
publishes that exact tarball publicly with provenance, and only then creates a
GitHub release containing the same artifact. The tag must match the version in
`package.json` (for example, version `0.1.0` uses tag `v0.1.0`).

## License

MIT
