# Receipt schema notes

The V1 receipt schema is intentionally small and serializes with stable key
ordering.

Top-level fields:

- `schemaVersion`: currently `1`.
- `tool`: CIStamp name and version.
- `createdAt`: ISO timestamp when the receipt run started.
- `cwd`: working directory used for command execution.
- `platform`: Node platform string.
- `versions`: Node plus optional npm and git versions.
- `git`: repository availability, branch, commit, dirty state, and origin URL.
- `hashes`: SHA-256 hashes for default and caller-requested files.
- `redaction`: whether redaction ran and how many replacements occurred.
- `commands`: executed commands with exit status and bounded logs.
- `summary`: command count, failure count, and pass/fail boolean.

Receipts are evidence, not attestations. They are designed to be easy to review,
diff, and attach to human workflows.
