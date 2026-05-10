# Orchestration

CIStamp is built as a local-first CLI with reviewable slices. Agents and humans
should land work through small commits that keep the command surface runnable.

## Ownership slices

- **Core receipt model:** stable schema, deterministic ordering, and JSON output.
- **Command runner:** local process execution, exit-code capture, and bounded logs.
- **Evidence collectors:** git metadata, runtime versions, and file hashes.
- **Renderers:** Markdown receipts that are useful in issues, releases, and handoffs.
- **CLI UX:** memorable `run` and `render` commands with safe defaults.
- **Verification:** tests, smoke scripts, and examples that run offline.

## Rules

- No telemetry or network calls in the V1 execution path.
- Redaction stays on unless the caller explicitly opts out with `--no-redact`.
- Hidden writes are limited to `.cistamp/latest.json` unless an output path is provided.
- Failed commands remain visible in receipts; `--fail-on` controls process exit behavior.
- Every release candidate must include fresh command receipts from this repository.
