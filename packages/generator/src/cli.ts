#!/usr/bin/env node

// #region -- Imports ----------------------------------
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  parseTextFile,
  parseJsonFile,
  parseCfgFile,
  generateXrpldConfig,
  resolveXrpldConfig,
  validateXrpldConfig,
} from './index.js';
import { generateSslCerts } from './generators/ssl-cert.js';
import { VALID_ROLES } from './defaults/roles.js';
import { VALID_SIZES } from './defaults/sizes.js';
import { VALID_LOG_LEVELS } from './defaults/verbosity.js';
import type { XrpldInput, NodeRole, NodeSize, LogLevel } from './types/xrpld-input.js';
// #endregion -- Imports -------------------------------

// #region -- Types ------------------------------------
export interface CliArgs {
  inputPath?: string;
  jsonPath?: string;
  parsePath?: string;
  outputPath?: string;
  network?: 'mainnet' | 'testnet' | 'devnet';
  role?: NodeRole;
  size?: NodeSize;
  verbosity?: LogLevel;
  validateOnly: boolean;
}

export interface CliResult {
  exitCode: number;
  stdout: string;
  stderr: string[];
}
// #endregion -- Types ---------------------------------

// #region -- Argument Parsing -------------------------
const USAGE = `Usage: xrpl-cfg-gen [options]

Options:
  --json <path>        Read overrides from a nested JSON file (XrpldInput schema)
  --input <path>       Read overrides from a SCREAMING_SNAKE_CASE text file
  --parse <cfg-path>   Parse an existing xrpld.cfg to JSON (stdout or --output)
  --output <dir>       Write xrpld.cfg and validators.txt to directory
  --network <name>     Network preset: mainnet, testnet, devnet (default: mainnet)
  --role <role>        Node role: stock, validator, ephemeral, sentry, clio, feature, hub (default: stock)
  --size <size>        Node size: tiny, small, medium, large, huge (default: medium)
  --verbose <level>    Log verbosity: silent, fatal, error, warning, info, debug, trace (default: warning)
  --validate-only      Run validation without generating output
  --help               Show this help message

Input sources are merged in order: defaults < size < role < verbosity < network < --input < --json < CLI flags.
When no input is provided, mainnet defaults with stock role, medium size, and warning verbosity are used.

Examples:
  xrpl-cfg-gen --network mainnet --output /var/lib/xrpld/etc
  xrpl-cfg-gen --role validator --size large --network mainnet --output /var/lib/xrpld/etc
  xrpl-cfg-gen --role clio --network testnet --verbose info
  xrpl-cfg-gen --size huge --verbose debug --output /var/lib/xrpld/etc
  xrpl-cfg-gen --json overrides.json --output /var/lib/xrpld/etc
  xrpl-cfg-gen --input config.txt --network testnet
  xrpl-cfg-gen --parse /var/lib/xrpld/etc/xrpld.cfg
  xrpl-cfg-gen --json overrides.json --validate-only`;

const VALID_NETWORKS = new Set(['mainnet', 'testnet', 'devnet']);

export function parseArgs(argv: string[]): CliArgs | { error: string; showUsage?: boolean } {
  const args = argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    return { error: '', showUsage: true };
  }

  let inputPath: string | undefined;
  let jsonPath: string | undefined;
  let parsePath: string | undefined;
  let outputPath: string | undefined;
  let network: 'mainnet' | 'testnet' | 'devnet' | undefined;
  let role: NodeRole | undefined;
  let size: NodeSize | undefined;
  let verbosity: LogLevel | undefined;
  let validateOnly = false;

  for (let i = 0; i < args.length; i++) {
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
      case '--role': {
        const val = args[++i];
        if (!val) {
          return {
            error:
              '--role requires a value (stock, validator, ephemeral, sentry, clio, feature, hub).',
          };
        }
        if (!VALID_ROLES.has(val)) {
          return {
            error: `Invalid role "${val}". Must be one of: ${[...VALID_ROLES].join(', ')}.`,
          };
        }
        role = val as NodeRole;
        break;
      }
      case '--size': {
        const val = args[++i];
        if (!val) {
          return { error: '--size requires a value (tiny, small, medium, large, huge).' };
        }
        if (!VALID_SIZES.has(val)) {
          return {
            error: `Invalid size "${val}". Must be one of: ${[...VALID_SIZES].join(', ')}.`,
          };
        }
        size = val as NodeSize;
        break;
      }
      case '--verbose': {
        const val = args[++i];
        if (!val) {
          return {
            error:
              '--verbose requires a value (silent, fatal, error, warning, info, debug, trace).',
          };
        }
        if (!VALID_LOG_LEVELS.has(val)) {
          return {
            error: `Invalid verbosity "${val}". Must be one of: ${[...VALID_LOG_LEVELS].join(', ')}.`,
          };
        }
        verbosity = val as LogLevel;
        break;
      }
      case '--validate-only':
        validateOnly = true;
        break;
      default:
        return { error: `Unknown option "${args[i]}".` };
    }
  }

  return {
    inputPath,
    jsonPath,
    parsePath,
    outputPath,
    network,
    role,
    size,
    verbosity,
    validateOnly,
  };
}

// #endregion -- Argument Parsing ----------------------

// #region -- Run --------------------------------------

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
    let input: Partial<XrpldInput> = {};

    if (args.inputPath) {
      const content = readFileSync(args.inputPath, 'utf-8');
      input = { ...input, ...parseTextFile(content) };
    }

    if (args.jsonPath) {
      const content = readFileSync(args.jsonPath, 'utf-8');
      const jsonInput = parseJsonFile(content);
      input = { ...input, ...jsonInput };
    }

    // Build presets from CLI flags, merging over any presets from input sources
    const cliPresets = {
      ...input.presets,
      ...(args.network ? { network: args.network } : {}),
      ...(args.role ? { role: args.role } : {}),
      ...(args.size ? { size: args.size } : {}),
      ...(args.verbosity ? { verbosity: args.verbosity } : {}),
    };
    if (Object.keys(cliPresets).length > 0) {
      input = { ...input, presets: cliPresets };
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

      if (result.sslEnabled) {
        const certResult = generateSslCerts(args.outputPath, {
          email: input.ssl_cert_email,
          validityDays: input.ssl_cert_validity_days,
        });
        stderr.push(`SSL key written to ${certResult.keyPath}`);
        stderr.push(`SSL cert written to ${certResult.certPath}`);
      }
    } else {
      stdout = `# ── xrpld.cfg ────────────────────────────────────────\n\n${result.config}\n# ── validators.txt ───────────────────────────────────\n\n${result.validatorsTxt}`;
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

// #endregion -- Run -----------------------------------

// #region -- Main -------------------------------------

function isParseError(
  result: CliArgs | { error: string; showUsage?: boolean }
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

main();

// #endregion -- Main ----------------------------------
