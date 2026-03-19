import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { parseArgs, resolveOverrides, run } from '../cli.js';
import type { CliArgs } from '../cli.js';

// #region Tests

describe('CLI', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'config-gen-'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  // #region parseArgs

  describe('parseArgs', () => {
    it('returns error with showUsage when no arguments', () => {
      const result = parseArgs(['node', 'cli.ts']);
      expect(result).toHaveProperty('error');
      expect(result).toHaveProperty('showUsage', true);
    });

    it('returns error with showUsage for --help', () => {
      const result = parseArgs(['node', 'cli.ts', '--help']);
      expect(result).toHaveProperty('error', '');
      expect(result).toHaveProperty('showUsage', true);
    });

    it('rejects unknown target', () => {
      const result = parseArgs(['node', 'cli.ts', 'unknown']);
      expect(result).toHaveProperty('error');
      expect((result as any).error).toContain('Unknown target');
    });

    it('rejects unknown option', () => {
      const result = parseArgs(['node', 'cli.ts', 'xrpld', '--bad']);
      expect(result).toHaveProperty('error');
      expect((result as any).error).toContain('Unknown option');
    });

    it('rejects --env without path', () => {
      const result = parseArgs(['node', 'cli.ts', 'xrpld', '--env']);
      expect(result).toHaveProperty('error');
      expect((result as any).error).toContain('--env requires a path');
    });

    it('rejects --json without path', () => {
      const result = parseArgs(['node', 'cli.ts', 'xrpld', '--json']);
      expect(result).toHaveProperty('error');
      expect((result as any).error).toContain('--json requires a path');
    });

    it('rejects --output without path', () => {
      const result = parseArgs(['node', 'cli.ts', 'xrpld', '--output']);
      expect(result).toHaveProperty('error');
      expect((result as any).error).toContain('--output requires a path');
    });

    it('parses xrpld target', () => {
      const result = parseArgs(['node', 'cli.ts', 'xrpld']) as CliArgs;
      expect(result.target).toBe('xrpld');
      expect(result.validateOnly).toBe(false);
    });

    it('parses all options', () => {
      const result = parseArgs([
        'node', 'cli.ts', 'xrpld',
        '--env', '/path/to/.env',
        '--json', '/path/to/config.json',
        '--output', '/path/to/output.cfg',
        '--validate-only',
      ]) as CliArgs;
      expect(result.target).toBe('xrpld');
      expect(result.envPath).toBe('/path/to/.env');
      expect(result.jsonPath).toBe('/path/to/config.json');
      expect(result.outputPath).toBe('/path/to/output.cfg');
      expect(result.validateOnly).toBe(true);
    });
  });

  // #endregion

  // #region resolveOverrides

  describe('resolveOverrides', () => {
    it('reads from process.env as lowest-priority fallback', () => {
      const args: CliArgs = { target: 'xrpld', validateOnly: false };
      const result = resolveOverrides(args, { PORT_PEER: '5555' });
      expect(result.PORT_PEER).toBe('5555');
    });

    it('filters out non-config env vars', () => {
      const args: CliArgs = { target: 'xrpld', validateOnly: false };
      const result = resolveOverrides(args, { lowercase: 'skip', HOME: 'keep', PORT_PEER: '1234' });
      expect(result).not.toHaveProperty('lowercase');
      expect(result.HOME).toBe('keep');
      expect(result.PORT_PEER).toBe('1234');
    });

    it('reads overrides from .env file', () => {
      const envPath = join(tmpDir, 'test.env');
      writeFileSync(envPath, 'PORT_PEER=9999\n', 'utf-8');
      const args: CliArgs = { target: 'xrpld', envPath, validateOnly: false };
      const result = resolveOverrides(args, {});
      expect(result.PORT_PEER).toBe('9999');
    });

    it('reads overrides from JSON file', () => {
      const jsonPath = join(tmpDir, 'test.json');
      writeFileSync(jsonPath, '{"PORT_PEER": "8888"}', 'utf-8');
      const args: CliArgs = { target: 'xrpld', jsonPath, validateOnly: false };
      const result = resolveOverrides(args, {});
      expect(result.PORT_PEER).toBe('8888');
    });

    it('JSON overrides .env values', () => {
      const envPath = join(tmpDir, 'test.env');
      writeFileSync(envPath, 'PORT_PEER=9999\n', 'utf-8');
      const jsonPath = join(tmpDir, 'test.json');
      writeFileSync(jsonPath, '{"PORT_PEER": "7777"}', 'utf-8');
      const args: CliArgs = { target: 'xrpld', envPath, jsonPath, validateOnly: false };
      const result = resolveOverrides(args, {});
      expect(result.PORT_PEER).toBe('7777');
    });

    it('.env overrides process.env', () => {
      const envPath = join(tmpDir, 'test.env');
      writeFileSync(envPath, 'PORT_PEER=6666\n', 'utf-8');
      const args: CliArgs = { target: 'xrpld', envPath, validateOnly: false };
      const result = resolveOverrides(args, { PORT_PEER: '5555' });
      expect(result.PORT_PEER).toBe('6666');
    });
  });

  // #endregion

  // #region run - xrpld

  describe('run - xrpld', () => {
    it('generates default xrpld config', () => {
      const result = run({ target: 'xrpld', validateOnly: false });
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('[server]');
      expect(result.stdout).toContain('port_peer');
    });

    it('generates xrpld config to output file', () => {
      const outputPath = join(tmpDir, 'xrpld.cfg');
      const result = run({ target: 'xrpld', outputPath, validateOnly: false });
      expect(result.exitCode).toBe(0);
      expect(result.stderr.join('\n')).toContain('Config written to');
      const content = readFileSync(outputPath, 'utf-8');
      expect(content).toContain('[server]');
    });

    it('applies .env overrides', () => {
      const envPath = join(tmpDir, 'test.env');
      writeFileSync(envPath, 'PORT_PEER=9999\n', 'utf-8');
      const result = run({ target: 'xrpld', envPath, validateOnly: false });
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('9999');
    });

    it('applies JSON overrides', () => {
      const jsonPath = join(tmpDir, 'test.json');
      writeFileSync(jsonPath, '{"PORT_PEER": "8888"}', 'utf-8');
      const result = run({ target: 'xrpld', jsonPath, validateOnly: false });
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('8888');
    });

    it('applies process.env overrides', () => {
      const result = run({ target: 'xrpld', validateOnly: false }, { PORT_PEER: '5555' });
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('5555');
    });
  });

  // #endregion

  // #region run - validate-only

  describe('run - validate-only', () => {
    it('passes validation for xrpld with defaults', () => {
      const result = run({ target: 'xrpld', validateOnly: true });
      expect(result.exitCode).toBe(0);
      expect(result.stderr.join('\n')).toContain('Validation passed');
    });

    it('exits 1 with errors on invalid port', () => {
      const envPath = join(tmpDir, 'bad.env');
      writeFileSync(envPath, 'PORT_PEER=99999\n', 'utf-8');
      const result = run({ target: 'xrpld', envPath, validateOnly: true });
      expect(result.exitCode).toBe(1);
      expect(result.stderr.join('\n')).toContain('Error:');
      expect(result.stderr.join('\n')).toContain('PORT_PEER');
    });

    it('does not produce stdout output', () => {
      const result = run({ target: 'xrpld', validateOnly: true });
      expect(result.stdout).toBe('');
    });
  });

  // #endregion

  // #region run - error handling

  describe('run - error handling', () => {
    it('returns exit 1 when .env file does not exist', () => {
      const result = run({ target: 'xrpld', envPath: '/nonexistent/file.env', validateOnly: false });
      expect(result.exitCode).toBe(1);
      expect(result.stderr.join('\n')).toContain('Error:');
    });

    it('returns exit 1 when JSON file does not exist', () => {
      const result = run({ target: 'xrpld', jsonPath: '/nonexistent/file.json', validateOnly: false });
      expect(result.exitCode).toBe(1);
      expect(result.stderr.join('\n')).toContain('Error:');
    });

    it('returns exit 1 on validation errors during generation', () => {
      const envPath = join(tmpDir, 'bad.env');
      writeFileSync(envPath, 'PORT_PEER=invalid\n', 'utf-8');
      const result = run({ target: 'xrpld', envPath, validateOnly: false });
      expect(result.exitCode).toBe(1);
      expect(result.stderr.join('\n')).toContain('Error:');
    });
  });

  // #endregion
});

// #endregion
