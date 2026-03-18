// Minimal Node.js type declarations for CLI usage in worktree environment
// (where @types/node is not installed)

declare module 'node:fs' {
  export function readFileSync(path: string, encoding: 'utf-8'): string;
  export function writeFileSync(
    path: string,
    data: string,
    encoding: 'utf-8',
  ): void;
}

declare var process: {
  argv: string[];
  env: Record<string, string | undefined>;
  stdout: { write(data: string): boolean };
  exit(code?: number): never;
};
