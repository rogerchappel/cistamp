import { spawn } from 'node:child_process';

export async function captureCommand(command: string, args: string[], cwd: string): Promise<{ exitCode: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd, shell: false, env: process.env });
    let stdout = '';
    let stderr = '';

    child.stdout?.setEncoding('utf8');
    child.stderr?.setEncoding('utf8');
    child.stdout?.on('data', (chunk: string) => { stdout += chunk; });
    child.stderr?.on('data', (chunk: string) => { stderr += chunk; });
    child.on('error', (error) => {
      stderr += `${error.message}\n`;
      resolve({ exitCode: 127, stdout, stderr });
    });
    child.on('close', (exitCode) => resolve({ exitCode, stdout, stderr }));
  });
}
