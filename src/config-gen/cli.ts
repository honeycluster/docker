#!/usr/bin/env node

// #region Imports

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { parseTextFile } from './parsers/env-parser.js';
import { parseJsonFile } from './parsers/json-parser.js';
import { parseCfgFile } from './parsers/cfg-parser.js';
import { generateXrpldConfig } from './generators/xrpld.js';
import { resolveXrpldConfig } from './defaults/xrpld.js';
import { validateXrpldConfig } from './validation.js';

// #endregion

// #region Types

export interface CliArgs {
  target: 'xrpld';
  inputPath?: string;
  jsonPath?: string;
  parsePath?: string;
  outputPath?: string;
  network?: 'mainnet' | 'testnet' | 'devnet';
  validateOnly: boolean;
}

export interface CliResult {
  exitCode: number;
  stdout: string;
  stderr: string[];
}

// #endregion

// #region Argument Parsing

const USAGE = `Usage: config-gen xrpld [options]

Options:
  --json <path>        Read overrides from a nested JSON file
  --input <path>       Read overrides from a text file (SCREAMING_SNAKE_CASE keys)
  --parse <cfg-path>   Parse an existing xrpld.cfg to JSON (stdout or --output)
  --output <dir>       Write xrpld.cfg and validators.txt to directory
  --network <name>     Network preset: mainnet, testnet, devnet
  --validate-only      Run validation without generating output
  --help               Show this help message

Examples:
  config-gen xrpld --network mainnet --output /opt/xrpl/etc
  config-gen xrpld --json config.json --output /opt/xrpl/etc
  config-gen xrpld --input config.txt --network testnet
  config-gen xrpld --parse /opt/xrpl/etc/xrpld.cfg
  config-gen xrpld --json config.json --validate-only`;

const VALID_NETWORKS = new Set(['mainnet', 'testnet', 'devnet']);

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

  let inputPath: string | undefined;
  let jsonPath: string | undefined;
  let parsePath: string | undefined;
  let outputPath: string | undefined;
  let network: 'mainnet' | 'testnet' | 'devnet' | undefined;
  let validateOnly = false;

  for (let i = 1; i < args.length; i++) {
    switch (args[i]) {
      case '--input':
        inputPath = args[++i];
        if (!inputPath) {
          return { error: '--input requires a path argument.' };
        }
        break;
      case '--json':
        jsonPath = args[++i];
        if (!jsonPath) {
          return { error: '--json requires a path argument.' };
        }
        break;
      case '--parse':
        parsePath = args[++i];
        if (!parsePath) {
          return { error: '--parse requires a path argument.' };
        }
        break;
      case '--output':
        outputPath = args[++i];
        if (!outputPath) {
          return { error: '--output requires a path argument.' };
        }
        break;
      case '--network': {
        const val = args[++i];
        if (!val) {
          return { error: '--network requires a value (mainnet, testnet, devnet).' };
        }
        if (!VALID_NETWORKS.has(val)) {
          return { error: `Invalid network "${val}". Must be mainnet, testnet, or devnet.` };
        }
        network = val as 'mainnet' | 'testnet' | 'devnet';
        break;
      }
      case '--validate-only':
        validateOnly = true;
        break;
      default:
        return { error: `Unknown option "${args[i]}".` };
    }
  }

  return { target, inputPath, jsonPath, parsePath, outputPath, network, validateOnly };
}

// #endregion

// #region Run

export function run(args: CliArgs): CliResult {
  const stderr: string[] = [];
  let stdout = '';
  let exitCode = 0;

  try {
    // Parse mode: read cfg file and output JSON
    if (args.parsePath) {
      const content = readFileSync(args.parsePath, 'utf-8');
      const parsed = parseCfgFile(content);
      const json = JSON.stringify(parsed, null, 2);

      if (args.outputPath) {
        const outFile = join(args.outputPath, 'xrpld.json');
        mkdirSync(args.outputPath, { recursive: true });
        writeFileSync(outFile, json, 'utf-8');
        stderr.push(`Parsed config written to ${outFile}`);
      } else {
        stdout = json;
      }
      return { exitCode, stdout, stderr };
    }

    // Build input from sources
    let input: Partial<import('./types/xrpld-input.js').XrpldInput> = {};

    if (args.inputPath) {
      const content = readFileSync(args.inputPath, 'utf-8');
      input = { ...input, ...parseTextFile(content) };
    }

    if (args.jsonPath) {
      const content = readFileSync(args.jsonPath, 'utf-8');
      const jsonInput = parseJsonFile(content);
      input = { ...input, ...jsonInput };
    }

    if (args.network) {
      input = { ...input, presets: { ...input.presets, network: args.network } };
    }

    // Validate-only mode
    if (args.validateOnly) {
      const resolved = resolveXrpldConfig(input);
      const result = validateXrpldConfig(resolved);

      for (const warning of result.warnings) {
        stderr.push(`Warning: ${warning.section}.${warning.field}: ${warning.message}`);
      }

      if (result.errors.length > 0) {
        for (const error of result.errors) {
          stderr.push(`Error: ${error.section}.${error.field}: ${error.message}`);
        }
        return { exitCode: 1, stdout, stderr };
      }

      stderr.push('Validation passed.');
      return { exitCode: 0, stdout, stderr };
    }

    // Generate mode
    const result = generateXrpldConfig(input);

    for (const warning of result.warnings) {
      stderr.push(`Warning: ${warning}`);
    }

    if (args.outputPath) {
      mkdirSync(args.outputPath, { recursive: true });
      const cfgPath = join(args.outputPath, 'xrpld.cfg');
      const valPath = join(args.outputPath, 'validators.txt');
      writeFileSync(cfgPath, result.config, 'utf-8');
      writeFileSync(valPath, result.validatorsTxt, 'utf-8');
      stderr.push(`Config written to ${cfgPath}`);
      stderr.push(`Validators written to ${valPath}`);
    } else {
      stdout = result.config;
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

  const result = run(parsed);

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
