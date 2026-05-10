export type FailOn = 'never' | 'command-failure';

export interface CommandSpec {
  command: string;
  args: string[];
  label?: string;
}

export interface CommandResult extends CommandSpec {
  index: number;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  durationMs: number;
  startedAt: string;
  finishedAt: string;
  stdout: string;
  stderr: string;
}

export interface RuntimeVersions {
  node: string;
  npm?: string;
  git?: string;
}

export interface GitMetadata {
  available: boolean;
  commit?: string;
  branch?: string;
  dirty?: boolean;
  remote?: string;
}

export interface FileHash {
  path: string;
  sha256: string;
  bytes: number;
}

export interface Receipt {
  schemaVersion: 1;
  tool: {
    name: 'cistamp';
    version: string;
  };
  createdAt: string;
  cwd: string;
  platform: NodeJS.Platform;
  versions: RuntimeVersions;
  git: GitMetadata;
  hashes: FileHash[];
  redaction: {
    enabled: boolean;
    replacements: number;
  };
  commands: CommandResult[];
  summary: {
    commandCount: number;
    failedCount: number;
    passed: boolean;
  };
}

export interface RunOptions {
  cwd: string;
  out: string;
  markdownOut?: string;
  redact: boolean;
  failOn: FailOn;
  hashPaths: string[];
  maxLogBytes: number;
}
