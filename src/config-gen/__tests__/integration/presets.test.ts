import { describe, it, expect } from 'vitest';
import { generateXrpldConfig } from '../../generators/xrpld.js';
import { parseTextFile } from '../../parsers/env-parser.js';
import { run, parseArgs } from '../../cli.js';
import type { CliArgs } from '../../cli.js';
import type { NodeRole, NodeSize, LogLevel } from '../../types/xrpld-input.js';

// #region Role x Mainnet

const ALL_ROLES: NodeRole[] = ['stock', 'validator', 'ephemeral', 'sentry', 'clio', 'feature', 'hub'];

describe('each role x mainnet produces valid cfg', () => {
  for (const role of ALL_ROLES) {
    it(`role=${role} generates valid config`, () => {
      const input = role === 'validator'
        ? { presets: { network: 'mainnet' as const, role }, validator_token: 'test-token' }
        : { presets: { network: 'mainnet' as const, role } };
      const result = generateXrpldConfig(input);
      expect(result.config).toContain('[server]');
      expect(result.config).toContain('[node_db]');
      expect(result.config).toContain('[network_id]\n0');
      expect(result.validatorsTxt).toContain('https://vl.ripple.com');
    });
  }
});

// #endregion

// #region Size Presets

const ALL_SIZES: NodeSize[] = ['tiny', 'small', 'medium', 'large', 'huge'];

const SIZE_EXPECTATIONS: Record<NodeSize, { node_size: string; online_delete: number }> = {
  tiny: { node_size: 'tiny', online_delete: 256 },
  small: { node_size: 'small', online_delete: 256 },
  medium: { node_size: 'medium', online_delete: 512 },
  large: { node_size: 'large', online_delete: 2048 },
  huge: { node_size: 'huge', online_delete: 8192 },
};

describe('each size produces correct node_size + online_delete', () => {
  for (const size of ALL_SIZES) {
    it(`size=${size} has correct node_size and online_delete`, () => {
      const result = generateXrpldConfig({ presets: { size } });
      const expected = SIZE_EXPECTATIONS[size];
      expect(result.config).toContain(`[node_size]\n${expected.node_size}`);
      expect(result.config).toContain(`online_delete=${expected.online_delete}`);
    });
  }
});

// #endregion

// #region Verbosity Presets

const ALL_LEVELS: LogLevel[] = ['silent', 'fatal', 'error', 'warning', 'info', 'debug', 'trace'];

const SEVERITY_MAP: Record<LogLevel, string> = {
  silent: 'fatal',
  fatal: 'fatal',
  error: 'error',
  warning: 'warning',
  info: 'info',
  debug: 'debug',
  trace: 'trace',
};

describe('each verbosity level produces correct log_level in rpc_startup', () => {
  for (const level of ALL_LEVELS) {
    it(`verbosity=${level} produces severity=${SEVERITY_MAP[level]}`, () => {
      const result = generateXrpldConfig({ presets: { verbosity: level } });
      expect(result.config).toContain(`{"command":"log_level","severity":"${SEVERITY_MAP[level]}"}`);
    });
  }
});

// #endregion

// #region Combined Presets

describe('combined presets', () => {
  it('testnet + validator + large + info produces expected cfg', () => {
    const result = generateXrpldConfig({
      presets: {
        network: 'testnet',
        role: 'validator',
        size: 'large',
        verbosity: 'info',
      },
      validator_token: 'test-token',
    });

    // Network: testnet
    expect(result.config).toContain('[network_id]\n1');
    expect(result.config).toContain('[ips]\ns.altnet.rippletest.net 51235');
    expect(result.validatorsTxt).toContain('https://vl.altnet.rippletest.net');

    // Size: large
    expect(result.config).toContain('[node_size]\nlarge');
    expect(result.config).toContain('online_delete=2048');
    expect(result.config).toContain('[peers_max]\n50');

    // Role: validator — peer_private=1, 3 ports (no gRPC)
    expect(result.config).toContain('[peer_private]\n1');
    expect(result.config).not.toContain('port_grpc');

    // Verbosity: info
    expect(result.config).toContain('{"command":"log_level","severity":"info"}');
  });
});

// #endregion

// #region Backwards Compatibility

describe('backwards compatibility', () => {
  it('empty input produces identical cfg to stock + medium + warning + mainnet', () => {
    const defaultResult = generateXrpldConfig({});
    const explicitResult = generateXrpldConfig({
      presets: { network: 'mainnet', role: 'stock', size: 'medium', verbosity: 'warning' },
    });
    expect(defaultResult.config).toBe(explicitResult.config);
    expect(defaultResult.validatorsTxt).toBe(explicitResult.validatorsTxt);
  });
});

// #endregion

// #region Presets Not In Rendered Output

describe('presets object not in rendered cfg', () => {
  it('presets field does not appear in cfg output', () => {
    const result = generateXrpldConfig({
      presets: { network: 'mainnet', role: 'stock', size: 'medium', verbosity: 'warning' },
    });
    expect(result.config).not.toContain('[presets]');
    expect(result.config).not.toContain('presets');
  });
});

// #endregion

// #region Text File with PRESET_* Keys

describe('text file with PRESET_* keys', () => {
  it('PRESET_ROLE=validator + PRESET_SIZE=large produces correct cfg', () => {
    const textContent = [
      'PRESET_ROLE=validator',
      'PRESET_SIZE=large',
      'VALIDATOR_TOKEN=test-token',
    ].join('\n');
    const input = parseTextFile(textContent);
    const result = generateXrpldConfig(input);

    // Role: validator — peer_private=1, no gRPC
    expect(result.config).toContain('[peer_private]\n1');
    expect(result.config).not.toContain('port_grpc');

    // Size: large
    expect(result.config).toContain('[node_size]\nlarge');
    expect(result.config).toContain('online_delete=2048');
  });
});

// #endregion

// #region CLI with Preset Args

describe('CLI run() with preset args', () => {
  it('role + size + network + verbose args produces correct cfg', () => {
    const parsed = parseArgs(['node', 'cli.ts', 'xrpld', '--network', 'testnet', '--role', 'sentry', '--size', 'small', '--verbose', 'debug']);
    expect('error' in parsed).toBe(false);

    const args = parsed as CliArgs;
    const cliResult = run(args);
    expect(cliResult.exitCode).toBe(0);
    expect(cliResult.stdout).toContain('[network_id]\n1');
    expect(cliResult.stdout).toContain('[node_size]\nsmall');
    expect(cliResult.stdout).toContain('online_delete=256');
    expect(cliResult.stdout).toContain('{"command":"log_level","severity":"debug"}');
    expect(cliResult.stdout).toContain('[peer_private]\n0');
  });
});

// #endregion
