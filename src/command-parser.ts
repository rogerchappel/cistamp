import type { CommandSpec, FailOn } from './types.js';

export interface ParsedRunArgs {
  commands: CommandSpec[];
  out: string;
  markdownOut?: string;
  redact: boolean;
  failOn: FailOn;
  hashPaths: string[];
  maxLogBytes: number;
}

export function parseRunArgs(args: string[]): ParsedRunArgs {
  const commandTokens: string[] = [];
  const hashPaths: string[] = [];
  let out = '.cistamp/latest.json';
  let markdownOut: string | undefined;
  let redact = true;
  let failOn: FailOn = 'command-failure';
  let maxLogBytes = 64_000;
  let parsingCommand = false;

  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (!parsingCommand && token === '--') {
      parsingCommand = true;
      continue;
    }
    if (parsingCommand) {
      commandTokens.push(token);
      continue;
    }

    switch (token) {
      case '--out':
      case '-o':
        out = requireValue(args, ++index, token);
        break;
      case '--markdown':
        markdownOut = requireValue(args, ++index, token);
        break;
      case '--hash':
        hashPaths.push(requireValue(args, ++index, token));
        break;
      case '--fail-on': {
        const value = requireValue(args, ++index, token);
        if (value !== 'never' && value !== 'command-failure') throw new Error('--fail-on must be "never" or "command-failure"');
        failOn = value;
        break;
      }
      case '--max-log-bytes': {
        const value = Number(requireValue(args, ++index, token));
        if (!Number.isInteger(value) || value < 1024) throw new Error('--max-log-bytes must be an integer >= 1024');
        maxLogBytes = value;
        break;
      }
      case '--no-redact':
        redact = false;
        break;
      case '--redact':
        redact = true;
        break;
      default:
        throw new Error(`Unknown run option: ${token}`);
    }
  }

  return { commands: splitCommands(commandTokens), out, markdownOut, redact, failOn, hashPaths, maxLogBytes };
}

function splitCommands(tokens: string[]): CommandSpec[] {
  const groups: string[][] = [];
  let current: string[] = [];
  for (const token of tokens) {
    if (token === '--') {
      if (current.length > 0) groups.push(current);
      current = [];
    } else if (token === '---') {
      current.push('--');
    } else {
      current.push(token);
    }
  }
  if (current.length > 0) groups.push(current);

  if (groups.length === 0) throw new Error('No command provided. Use: cistamp run -- <command> [-- <command>] (use --- to pass a literal --)');
  return groups.map(([command, ...commandArgs]) => ({ command, args: commandArgs }));
}

function requireValue(args: string[], index: number, option: string): string {
  const value = args[index];
  if (!value) throw new Error(`${option} requires a value`);
  return value;
}
