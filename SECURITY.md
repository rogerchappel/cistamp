# Security Policy

CIStamp is local-first and does not make network calls in the V1 runtime path.
It may still record sensitive local context such as command output, file paths,
repository remotes, or environment-derived tool output.

## Reporting vulnerabilities

Please report security issues privately through GitHub security advisories when
the repository is available, or contact the maintainer directly. Do not publish
proof-of-concept secrets or exploit details before a fix is available.

## Secret handling

Redaction is enabled by default, but it is best-effort. Review receipts before
sharing them publicly, especially when commands print environment variables,
configuration files, or verbose debug logs.

## Supported versions

The initial public line is `0.1.x`. Security fixes will target the latest minor
release unless the project documents an expanded support window later.
