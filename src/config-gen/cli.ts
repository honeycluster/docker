#!/usr/bin/env node

// #region Imports

import { readFileSync, writeFileSync } from 'node:fs';
import { parseEnvFile } from './parsers/env-parser.js';
import { parseJsonFile } from './parsers/json-parser.js';
import { generateXrpldConfig } from './generators/xrpld.js';
import { validateXrpldInputs } from './validation.js';

// #endregion

// #region Types

export interface CliArgs {
  target: 'xrpld';
  envPath?: string;
  jsonPath?: string;
  outputPath?: string;
  validateOnly: boolean;
}

export interface CliResult {
  exitCode: number;
  stdout: string;
  stderr: string[];
}

// #endregion

// #region Argument Parsing

const USAGE = `Usage: config-gen <target> [options]

Targets:
  xrpld    Generate xrpld.cfg configuration

Options:
  --env <path>       Read overrides from a .env file
  --json <path>      Read overrides from a JSON file
  --output <path>    Write output to file (default: stdout)
  --validate-only    Run validation without generating output
  --help             Show this help message

When both --env and --json are provided, JSON values override .env values.
Environment variables from process.env are used as lowest-priority fallback.`;

export function parseArgs(argv: string[]): CliArgs | { error: string; showUsage?: boolean } {
  const args = argv.slice(2);

  if (args.length === 0) {
    return { error: '', showUsage: true };
  }

  if (args.includes('--help')) {
    return { error: '', showUsage: true };
  }

  const target = args[0];
  if (target !== 'xrpld') {
    return { error: `Unknown target "${target}". Must be "xrpld".` };
  }

  let envPath: string | undefined;
  let jsonPath: string | undefined;
  let outputPath: string | undefined;
  let validateOnly = false;

  for (let i = 1; i < args.length; i++) {
    switch (args[i]) {
      case '--env':
        envPath = args[++i];
        if (!envPath) {
          return { error: '--env requires a path argument.' };
        }
        break;
      case '--json':
        jsonPath = args[++i];
        if (!jsonPath) {
          return { error: '--json requires a path argument.' };
        }
        break;
      case '--output':
        outputPath = args[++i];
        if (!outputPath) {
          return { error: '--output requires a path argument.' };
        }
        break;
      case '--validate-only':
        validateOnly = true;
        break;
      default:
        return { error: `Unknown option "${args[i]}".` };
    }
  }

  return { target, envPath, jsonPath, outputPath, validateOnly };
}

// #endregion

// #region Override Resolution

export function resolveOverrides(
  args: CliArgs,
  env: Record<string, string | undefined> = {},
): Record<string, string> {
  // Lowest priority: process.env (only uppercase keys matching config var pattern)
  const envVars: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    if (/^[A-Z][A-Z0-9_]*$/.test(key) && value !== undefined) {
      envVars[key] = value;
    }
  }

  // Medium priority: .env file
  let envFileVars: Record<string, string> = {};
  if (args.envPath) {
    const content = readFileSync(args.envPath, 'utf-8');
    envFileVars = parseEnvFile(content);
  }

  // Highest priority: JSON file
  let jsonFileVars: Record<string, string> = {};
  if (args.jsonPath) {
    const content = readFileSync(args.jsonPath, 'utf-8');
    jsonFileVars = parseJsonFile(content);
  }

  return { ...envVars, ...envFileVars, ...jsonFileVars };
}

// #endregion

// #region Run

export function run(args: CliArgs, env: Record<string, string | undefined> = {}): CliResult {
  const stderr: string[] = [];
  let stdout = '';
  let exitCode = 0;

  try {
    const overrides = resolveOverrides(args, env);

    if (args.validateOnly) {
      const result = validateXrpldInputs(overrides as Record<string, string | undefined>);

      for (const warning of result.warnings) {
        stderr.push(`Warning: ${warning.field}: ${warning.message}`);
      }

      if (result.errors.length > 0) {
        for (const error of result.errors) {
          stderr.push(`Error: ${error.field}=${error.value ?? ''}: ${error.message}`);
        }
        return { exitCode: 1, stdout, stderr };
      }

      stderr.push('Validation passed.');
      return { exitCode: 0, stdout, stderr };
    }

    const { config, warnings } = generateXrpldConfig(overrides);

    for (const warning of warnings) {
      stderr.push(`Warning: ${warning}`);
    }

    if (args.outputPath) {
      writeFileSync(args.outputPath, config, 'utf-8');
      stderr.push(`Config written to ${args.outputPath}`);
    } else {
      stdout = config;
    }
  } catch (error) {
    if (error instanceof Error) {
      stderr.push(`Error: ${error.message}`);
    } else {
      stderr.push('Error: Unknown error occurred.');
    }
    exitCode = 1;
  }

  return { exitCode, stdout, stderr };
}

// #endregion

// #region Main

function isParseError(
  result: CliArgs | { error: string; showUsage?: boolean },
): result is { error: string; showUsage?: boolean } {
  return 'error' in result;
}

function main(): void {
  const parsed = parseArgs(process.argv);

  if (isParseError(parsed)) {
    if (parsed.showUsage) {
      console.error(USAGE);
      process.exit(parsed.error ? 1 : 0);
    }
    console.error(`Error: ${parsed.error}`);
    process.exit(1);
  }

  const result = run(parsed, process.env);

  for (const line of result.stderr) {
    console.error(line);
  }

  if (result.stdout) {
    process.stdout.write(result.stdout);
  }

  if (result.exitCode !== 0) {
    process.exit(result.exitCode);
  }
}

// Only run main when executed directly (not imported)
const isDirectExecution =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  (process.argv[1].endsWith('/cli.ts') || process.argv[1].endsWith('/cli.js'));

if (isDirectExecution) {
  main();
}

// #endregion
