# PR Receipt Video Brief

## One-Line Story

CIStamp turns "tests passed locally" into a small JSON and Markdown receipt with command, version, hash, and redacted log evidence.

## Recording Plan

1. Show `examples/fixtures/pass.mjs` as the command under test.
2. Run `bash demo/run-receipt-demo.sh`.
3. Open `.cistamp/demo/pass-receipt.json` and point to `summary.passed`, command metadata, and the hashed fixture path.
4. Open `.cistamp/demo/pass-rendered.md` as the PR-ready version.
5. Mention that CIStamp records evidence; it does not prove a machine was uncompromised.

## Social Hooks

- Stop writing "works on my machine" as prose. CIStamp prints a receipt for the command you actually ran.
- `cistamp run -- node examples/fixtures/pass.mjs` records exit code, environment versions, git state, hashes, and redacted logs.
- The demo renders the same local evidence as JSON for tools and Markdown for PR reviewers.

## Guardrails

- Do not claim CIStamp is a security attestation system.
- Do not publish receipts without reviewing paths and logs.
- Keep claims grounded in local command evidence and Markdown rendering.
