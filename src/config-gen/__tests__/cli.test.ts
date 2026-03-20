import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { parseArgs, run } from '../cli.js';
import type { CliArgs } from '../cli.js';

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
    it('returns showUsage when no arguments', () => {
      const result = parseArgs(['node', 'cli.ts']);
      expect(result).toHaveProperty('error');
      expect(result).toHaveProperty('showUsage', true);
    });

    it('returns showUsage for --help', () => {
      const result = parseArgs(['node', 'cli.ts', '--help']);
      expect(result).toHaveProperty('error', '');
      expect(result).toHaveProperty('showUsage', true);
    });

    it('rejects unknown target', () => {
      const result = parseArgs(['node', 'cli.ts', 'unknown']);
      expect(result).toHaveProperty('error');
      expect((result as { error: string }).error).toContain('Unknown target');
    });

    it('rejects unknown option', () => {
      const result = parseArgs(['node', 'cli.ts', 'xrpld', '--bad']);
      expect(result).toHaveProperty('error');
      expect((result as { error: string }).error).toContain('Unknown option');
    });

    it('parses xrpld target with no options', () => {
      const result = parseArgs(['node', 'cli.ts', 'xrpld']) as CliArgs;
      expect(result.target).toBe('xrpld');
      expect(result.validateOnly).toBe(false);
    });

    // --input flag
    it('parses --input flag', () => {
      const result = parseArgs(['node', 'cli.ts', 'xrpld', '--input', '/path/to/config.txt']) as CliArgs;
      expect(result.inputPath).toBe('/path/to/config.txt');
    });

    it('rejects --input without path', () => {
      const result = parseArgs(['node', 'cli.ts', 'xrpld', '--input']);
      expect((result as { error: string }).error).toContain('--input requires a path');
    });

    // --json flag
    it('parses --json flag', () => {
      const result = parseArgs(['node', 'cli.ts', 'xrpld', '--json', '/path/to/config.json']) as CliArgs;
      expect(result.jsonPath).toBe('/path/to/config.json');
    });

    it('rejects --json without path', () => {
      const result = parseArgs(['node', 'cli.ts', 'xrpld', '--json']);
      expect((result as { error: string }).error).toContain('--json requires a path');
    });

    // --parse flag
    it('parses --parse flag', () => {
      const result = parseArgs(['node', 'cli.ts', 'xrpld', '--parse', '/path/to/xrpld.cfg']) as CliArgs;
      expect(result.parsePath).toBe('/path/to/xrpld.cfg');
    });

    it('rejects --parse without path', () => {
      const result = parseArgs(['node', 'cli.ts', 'xrpld', '--parse']);
      expect((result as { error: string }).error).toContain('--parse requires a path');
    });

    // --output flag
    it('parses --output flag', () => {
      const result = parseArgs(['node', 'cli.ts', 'xrpld', '--output', '/opt/xrpl/etc']) as CliArgs;
      expect(result.outputPath).toBe('/opt/xrpl/etc');
    });

    it('rejects --output without path', () => {
      const result = parseArgs(['node', 'cli.ts', 'xrpld', '--output']);
      expect((result as { error: string }).error).toContain('--output requires a path');
    });

    // --network flag
    it('parses --network mainnet', () => {
      const result = parseArgs(['node', 'cli.ts', 'xrpld', '--network', 'mainnet']) as CliArgs;
      expect(result.network).toBe('mainnet');
    });

    it('parses --network testnet', () => {
      const result = parseArgs(['node', 'cli.ts', 'xrpld', '--network', 'testnet']) as CliArgs;
      expect(result.network).toBe('testnet');
    });

    it('parses --network devnet', () => {
      const result = parseArgs(['node', 'cli.ts', 'xrpld', '--network', 'devnet']) as CliArgs;
      expect(result.network).toBe('devnet');
    });

    it('rejects --network without value', () => {
      const result = parseArgs(['node', 'cli.ts', 'xrpld', '--network']);
      expect((result as { error: string }).error).toContain('--network requires a value');
    });

    it('rejects invalid network name', () => {
      const result = parseArgs(['node', 'cli.ts', 'xrpld', '--network', 'badnet']);
      expect((result as { error: string }).error).toContain('Invalid network');
    });

    // --validate-only flag
    it('parses --validate-only flag', () => {
      const result = parseArgs(['node', 'cli.ts', 'xrpld', '--validate-only']) as CliArgs;
      expect(result.validateOnly).toBe(true);
    });

    // Combined flags
    it('parses all options together', () => {
      const result = parseArgs([
        'node', 'cli.ts', 'xrpld',
        '--input', '/path/to/config.txt',
        '--json', '/path/to/config.json',
        '--output', '/opt/xrpl/etc',
        '--network', 'testnet',
        '--validate-only',
      ]) as CliArgs;
      expect(result.target).toBe('xrpld');
      expect(result.inputPath).toBe('/path/to/config.txt');
      expect(result.jsonPath).toBe('/path/to/config.json');
      expect(result.outputPath).toBe('/opt/xrpl/etc');
      expect(result.network).toBe('testnet');
      expect(result.validateOnly).toBe(true);
    });

    // --env is removed
    it('rejects old --env flag', () => {
      const result = parseArgs(['node', 'cli.ts', 'xrpld', '--env', '/path']);
      expect((result as { error: string }).error).toContain('Unknown option');
    });
  });

  // #endregion

  // #region run - generate mode

  describe('run - generate mode', () => {
    it('generates default mainnet config to stdout', () => {
      const result = run({ target: 'xrpld', validateOnly: false });
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('[server]');
      expect(result.stdout).toContain('port_peer');
    });

    it('generates config with --network flag', () => {
      const result = run({ target: 'xrpld', network: 'testnet', validateOnly: false });
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('[server]');
      expect(result.stdout).toContain('[network_id]');
    });

    it('generates config from --json input', () => {
      const jsonPath = join(tmpDir, 'test.json');
      writeFileSync(jsonPath, JSON.stringify({ presets: { network: 'devnet' } }), 'utf-8');
      const result = run({ target: 'xrpld', jsonPath, validateOnly: false });
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('[server]');
    });

    it('generates config from --input text file', () => {
      const inputPath = join(tmpDir, 'test.txt');
      writeFileSync(inputPath, 'NETWORK=testnet\nNODE_SIZE=medium\n', 'utf-8');
      const result = run({ target: 'xrpld', inputPath, validateOnly: false });
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('[server]');
      expect(result.stdout).toContain('[node_size]');
      expect(result.stdout).toContain('medium');
    });

    it('writes xrpld.cfg and validators.txt to --output directory', () => {
      const outDir = join(tmpDir, 'output');
      const result = run({ target: 'xrpld', outputPath: outDir, network: 'mainnet', validateOnly: false });
      expect(result.exitCode).toBe(0);
      expect(result.stderr.some(l => l.includes('Config written to'))).toBe(true);
      expect(result.stderr.some(l => l.includes('Validators written to'))).toBe(true);

      const cfg = readFileSync(join(outDir, 'xrpld.cfg'), 'utf-8');
      expect(cfg).toContain('[server]');

      const validators = readFileSync(join(outDir, 'validators.txt'), 'utf-8');
      expect(validators).toContain('[validator_list_sites]');
    });

    it('--json overrides --input values', () => {
      const inputPath = join(tmpDir, 'test.txt');
      writeFileSync(inputPath, 'NODE_SIZE=tiny\n', 'utf-8');
      const jsonPath = join(tmpDir, 'test.json');
      writeFileSync(jsonPath, JSON.stringify({ node_size: 'medium' }), 'utf-8');
      const result = run({ target: 'xrpld', inputPath, jsonPath, validateOnly: false });
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('medium');
    });

    it('--network flag combines with --json input', () => {
      const jsonPath = join(tmpDir, 'test.json');
      writeFileSync(jsonPath, JSON.stringify({ node_size: 'large' }), 'utf-8');
      const result = run({ target: 'xrpld', jsonPath, network: 'testnet', validateOnly: false });
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('[node_size]');
      expect(result.stdout).toContain('large');
    });
  });

  // #endregion

  // #region run - parse mode

  describe('run - parse mode', () => {
    it('parses cfg file to JSON on stdout', () => {
      const cfgPath = join(tmpDir, 'test.cfg');
      writeFileSync(cfgPath, '[network_id]\n1\n\n[node_size]\nmedium\n', 'utf-8');
      const result = run({ target: 'xrpld', parsePath: cfgPath, validateOnly: false });
      expect(result.exitCode).toBe(0);
      const parsed = JSON.parse(result.stdout);
      expect(parsed.network_id).toBe(1);
      expect(parsed.node_size).toBe('medium');
    });

    it('parses cfg file and writes JSON to --output directory', () => {
      const cfgPath = join(tmpDir, 'test.cfg');
      writeFileSync(cfgPath, '[network_id]\n0\n', 'utf-8');
      const outDir = join(tmpDir, 'parsed');
      const result = run({ target: 'xrpld', parsePath: cfgPath, outputPath: outDir, validateOnly: false });
      expect(result.exitCode).toBe(0);
      expect(result.stderr.some(l => l.includes('Parsed config written to'))).toBe(true);
      const json = readFileSync(join(outDir, 'xrpld.json'), 'utf-8');
      const parsed = JSON.parse(json);
      expect(parsed.network_id).toBe(0);
    });
  });

  // #endregion

  // #region run - validate-only mode

  describe('run - validate-only mode', () => {
    it('reports validation passed for valid config', () => {
      const result = run({ target: 'xrpld', network: 'mainnet', validateOnly: true });
      expect(result.exitCode).toBe(0);
      expect(result.stderr.some(l => l.includes('Validation passed'))).toBe(true);
    });

    it('reports warnings on stderr', () => {
      const result = run({ target: 'xrpld', network: 'mainnet', validateOnly: true });
      // Default config generates warnings (no validator_token)
      expect(result.stderr.some(l => l.startsWith('Warning:'))).toBe(true);
    });

    it('reports errors and exits 1 for bad config', () => {
      const jsonPath = join(tmpDir, 'bad.json');
      writeFileSync(jsonPath, JSON.stringify({
        node_db: { type: 'BadDB', path: '/tmp/db' },
      }), 'utf-8');
      const result = run({ target: 'xrpld', jsonPath, validateOnly: true });
      expect(result.exitCode).toBe(1);
      expect(result.stderr.some(l => l.startsWith('Error:'))).toBe(true);
    });
  });

  // #endregion

  // #region run - error handling

  describe('run - error handling', () => {
    it('returns exit 1 when input file does not exist', () => {
      const result = run({ target: 'xrpld', inputPath: '/nonexistent/file.txt', validateOnly: false });
      expect(result.exitCode).toBe(1);
      expect(result.stderr.some(l => l.startsWith('Error:'))).toBe(true);
    });

    it('returns exit 1 when JSON file does not exist', () => {
      const result = run({ target: 'xrpld', jsonPath: '/nonexistent/file.json', validateOnly: false });
      expect(result.exitCode).toBe(1);
      expect(result.stderr.some(l => l.startsWith('Error:'))).toBe(true);
    });

    it('returns exit 1 when parse cfg file does not exist', () => {
      const result = run({ target: 'xrpld', parsePath: '/nonexistent/xrpld.cfg', validateOnly: false });
      expect(result.exitCode).toBe(1);
      expect(result.stderr.some(l => l.startsWith('Error:'))).toBe(true);
    });
  });

  // #endregion
});
