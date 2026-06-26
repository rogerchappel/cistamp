# CIStamp receipt demo brief

## Demo promise

Show how CIStamp turns a local verification command into portable evidence that
can be pasted into a pull request, release note, or agent handoff without a
hosted dashboard.

## Recording flow

1. Run `bash demo/run-receipt-demo.sh`.
2. Point out the command receipt JSON and Markdown paths printed by the CLI.
3. Open the rendered Markdown receipt and highlight the command, exit code,
   Node/npm/git version capture, and hashed fixture path.
4. Mention that redaction is on by default and that runtime writes are local.

## Grounded talking points

- `cistamp run` records sequential command results and writes JSON by default.
- `--markdown` creates a human-readable receipt in the same run.
- `cistamp render` converts an existing JSON receipt to Markdown later.
- `--hash` adds file integrity evidence for artifacts or fixtures used during
  verification.
- The README documents local-first behavior, bounded logs, and redaction limits.

## Short post hooks

- "Stop saying tests passed. Stamp the command, versions, logs, and file hashes."
- "A tiny local receipt for PR verification, release checks, and agent handoffs."
- "CIStamp makes verification evidence portable without adding a dashboard."
