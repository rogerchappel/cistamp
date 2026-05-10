# CIStamp Tasks

## MVP delivery checklist

1. Scaffold a TypeScript CLI package with StackForge.
2. Copy the product PRD into `docs/PRD.md`.
3. Document orchestration boundaries and machine-readable work ownership.
4. Implement receipt types for commands, versions, hashes, git metadata, logs, and exit codes.
5. Implement deterministic local command execution with redaction enabled by default.
6. Implement Markdown and JSON rendering.
7. Expose `cistamp run` and `cistamp render` CLI commands.
8. Add fixtures and copy-paste examples.
9. Add tests for redaction, hashing, rendering, command execution, and CLI parsing.
10. Add smoke and validation scripts.
11. Publish a public GitHub repository with description, topics, and branch protection.

## Definition of done

- `npm test`, `npm run check`, `npm run build`, `npm run smoke`, and `bash scripts/validate.sh` pass.
- A real CLI smoke uses checked-in fixtures.
- README explains quick start, safety model, limitations, and contribution flow.
