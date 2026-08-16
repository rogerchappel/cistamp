#!/usr/bin/env node
import { parseRunArgs } from './command-parser.js';
import { renderReceiptFile } from './render.js';
import { runReceipt } from './runner.js';

const help = `CIStamp - local CI receipts\n\nUsage:\n  cistamp run [options] -- <command> [-- <command>]\n  cistamp render <receipt.json> [--out verification.md]\n\nRun options:\n  -o, --out <path>          JSON receipt path (default: .cistamp/latest.json)\n      --markdown <path>     Also write a Markdown receipt\n      --hash <path>         Add a file path to hash (repeatable)\n      --fail-on <mode>      command-failure | never (default: command-failure)\n      --max-log-bytes <n>   Keep last n bytes for each stream (default: 64000)\n      --redact             Redact obvious secrets (default)\n      --no-redact          Disable redaction\n\nCommand syntax:\n  -- separates commands; use --- to pass a literal -- argument to a command.\n\nExamples:\n  cistamp run -- npm test -- npm run build\n  cistamp run -- node script.mjs --- --child-option\n  cistamp render .cistamp/latest.json --out verification.md\n`;

export async function main(argv = process.argv.slice(2)): Promise<number> {
  const [command, ...rest] = argv;

  try {
    if (!command || command === '--help' || command === '-h') {
      process.stdout.write(help);
      return 0;
    }
    if (command === '--version' || command === '-v') {
      const { getPackageVersion } = await import('./version.js');
      process.stdout.write(`${getPackageVersion()}\n`);
      return 0;
    }
    if (command === 'run') return await runCommand(rest);
    if (command === 'render') return await renderCommand(rest);
    throw new Error(`Unknown command: ${command}`);
  } catch (error) {
    process.stderr.write(`cistamp: ${error instanceof Error ? error.message : String(error)}\n`);
    return 1;
  }
}

async function runCommand(args: string[]): Promise<number> {
  const parsed = parseRunArgs(args);
  const receipt = await runReceipt(parsed.commands, {
    cwd: process.cwd(),
    out: parsed.out,
    markdownOut: parsed.markdownOut,
    redact: parsed.redact,
    failOn: parsed.failOn,
    hashPaths: parsed.hashPaths,
    maxLogBytes: parsed.maxLogBytes
  });
  process.stdout.write(`CIStamp wrote ${parsed.out}\n`);
  if (parsed.markdownOut) process.stdout.write(`CIStamp wrote ${parsed.markdownOut}\n`);
  if (!receipt.summary.passed && parsed.failOn === 'command-failure') return 1;
  return 0;
}

async function renderCommand(args: string[]): Promise<number> {
  const input = args[0];
  if (!input || input.startsWith('-')) throw new Error('render requires a receipt JSON path');

  let out: string | undefined;
  for (let index = 1; index < args.length; index += 1) {
    const token = args[index];
    if (token === '--out' || token === '-o') {
      out = args[++index];
      if (!out) throw new Error(`${token} requires a value`);
    } else {
      throw new Error(`Unknown render option: ${token}`);
    }
  }

  const markdown = await renderReceiptFile(input, out);
  if (out) process.stdout.write(`CIStamp wrote ${out}\n`);
  else process.stdout.write(markdown);
  return 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exitCode = await main();
}
