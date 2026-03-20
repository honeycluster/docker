import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { generateXrpldConfig } from '../../src/generators/xrpld.js';
import { resolveXrpldConfig } from '../../src/defaults/xrpld.js';
import { parseTextFile } from '../../src/parsers/env-parser.js';
import { run } from '../../src/cli.js';
import { VALID_ROLES } from '../../src/defaults/roles.js';
import { VALID_SIZES } from '../../src/defaults/sizes.js';
import { VALID_LOG_LEVELS } from '../../src/defaults/verbosity.js';
import type { CliArgs } from '../../src/cli.js';
import type { NodeRole, NodeSize, LogLevel } from '../../src/types/xrpld-input.js';

// #region -- Role x Mainnet Integration -----------------------

describe('each role x mainnet produces valid cfg', () => {
  const roles: ReadonlyArray<NodeRole> = ['stock', 'validator', 'ephemeral', 'sentry', 'clio', 'feature', 'hub'];

  for (const role of roles) {
    it(`role=${role} generates valid config`, () => {
      const result = generateXrpldConfig({ presets: { network: 'mainnet', role } });
      expect(result.config).toContain('[server]');
      expect(result.config).toContain('[node_db]');
      expect(result.config).toContain('[network_id]\n0');
      expect(result.validatorsTxt).toContain('https://vl.ripple.com');
    });
  }

  it('validator role has 3 ports (no gRPC)', () => {
    const result = generateXrpldConfig({ presets: { network: 'mainnet', role: 'validator' } });
    expect(result.config).toContain('port_peer');
    expect(result.config).toContain('port_rpc_admin_local');
    expect(result.config).toContain('port_ws_admin_local');
    expect(result.config).not.toContain('port_grpc');
  });

  it('clio role has gRPC on 0.0.0.0', () => {
    const result = generateXrpldConfig({ presets: { network: 'mainnet', role: 'clio' } });
    expect(result.config).toContain('[port_grpc]');
    expect(result.config).toContain('ip = 0.0.0.0');
    expect(result.config).toContain('secure_gateway = 0.0.0.0');
  });
});

// #endregion -- Role x Mainnet Integration --------------------

// #region -- Size Integration ---------------------------------

describe('each size produces correct node_size and online_delete', () => {
  const sizeExpectations: ReadonlyArray<{ size: NodeSize; node_size: string; online_delete: number }> = [
    { size: 'tiny', node_size: 'tiny', online_delete: 256 },
    { size: 'small', node_size: 'small', online_delete: 256 },  // ledger_history=256
    { size: 'medium', node_size: 'medium', online_delete: 512 },
    { size: 'large', node_size: 'large', online_delete: 2048 },  // ledger_history=2048
    { size: 'huge', node_size: 'huge', online_delete: 8192 },
  ];

  for (const { size, node_size, online_delete } of sizeExpectations) {
    it(`size=${size} has node_size=${node_size} and online_delete=${online_delete}`, () => {
      const result = generateXrpldConfig({ presets: { size } });
      expect(result.config).toContain(`[node_size]\n${node_size}`);
      expect(result.config).toContain(`online_delete=${online_delete}`);
    });
  }
});

// #endregion -- Size Integration ------------------------------

// #region -- Verbosity Integration ----------------------------

describe('each verbosity level produces correct log_level in rpc_startup', () => {
  const verbosityExpectations: ReadonlyArray<{ level: LogLevel; severity: string }> = [
    { level: 'silent', severity: 'fatal' },
    { level: 'fatal', severity: 'fatal' },
    { level: 'error', severity: 'error' },
    { level: 'warning', severity: 'warning' },
    { level: 'info', severity: 'info' },
    { level: 'debug', severity: 'debug' },
    { level: 'trace', severity: 'trace' },
  ];

  for (const { level, severity } of verbosityExpectations) {
    it(`verbosity=${level} produces severity=${severity}`, () => {
      const result = generateXrpldConfig({ presets: { verbosity: level } });
      expect(result.config).toContain(`[rpc_startup]`);
      expect(result.config).toContain(`"severity":"${severity}"`);
    });
  }
});

// #endregion -- Verbosity Integration -------------------------

// #region -- Combined Presets ---------------------------------

describe('combined presets', () => {
  it('testnet + validator + large + info produces expected cfg', () => {
    const result = generateXrpldConfig({
      presets: { network: 'testnet', role: 'validator', size: 'large', verbosity: 'info' },
    });

    // Network: testnet
    expect(result.config).toContain('[network_id]\n1');
    expect(result.config).toContain('[ips]\ns.altnet.rippletest.net 51235');
    expect(result.validatorsTxt).toContain('https://vl.altnet.rippletest.net');

    // Role: validator (3 ports, no gRPC, peer_private=1)
    expect(result.config).not.toContain('port_grpc');
    expect(result.config).toContain('[peer_private]\n1');

    // Size: large
    expect(result.config).toContain('[node_size]\nlarge');
    expect(result.config).toContain('online_delete=2048');
    expect(result.config).toContain('[peers_max]\n50');
    expect(result.config).toContain('[ledger_history]\n2048');

    // Verbosity: info
    expect(result.config).toContain('"severity":"info"');
  });
});

// #endregion -- Combined Presets ------------------------------

// #region -- Backwards Compatibility --------------------------

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

// #endregion -- Backwards Compatibility -----------------------

// #region -- Presets Not in Rendered Output --------------------

describe('presets object does NOT appear in rendered cfg', () => {
  it('cfg output does not contain [presets] section', () => {
    const result = generateXrpldConfig({
      presets: { network: 'mainnet', role: 'validator', size: 'large', verbosity: 'debug' },
    });
    expect(result.config).not.toContain('[presets]');
    expect(result.config).not.toMatch(/\bpresets\b/);
  });
});

// #endregion -- Presets Not in Rendered Output -----------------

// #region -- Text File with Preset Keys -----------------------

describe('text file with PRESET_* keys', () => {
  it('PRESET_ROLE=validator + PRESET_SIZE=large produces correct cfg', () => {
    const text = [
      'PRESET_ROLE=validator',
      'PRESET_SIZE=large',
      'PRESET_NETWORK=mainnet',
      'PRESET_VERBOSITY=info',
    ].join('\n');

    const input = parseTextFile(text);
    const result = generateXrpldConfig(input);

    // Role: validator (no gRPC, peer_private=1)
    expect(result.config).not.toContain('port_grpc');
    expect(result.config).toContain('[peer_private]\n1');

    // Size: large
    expect(result.config).toContain('[node_size]\nlarge');
    expect(result.config).toContain('online_delete=2048');

    // Verbosity: info
    expect(result.config).toContain('"severity":"info"');

    // Network: mainnet
    expect(result.config).toContain('[network_id]\n0');
  });

  it('NETWORK=mainnet backwards compat maps to presets.network', () => {
    const text = 'NETWORK=mainnet\n';
    const input = parseTextFile(text);
    const result = generateXrpldConfig(input);
    expect(result.config).toContain('[network_id]\n0');
  });
});

// #endregion -- Text File with Preset Keys --------------------

// #region -- CLI with Preset Args -----------------------------

describe('CLI run() with preset args', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'presets-test-'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('role + size + network + verbose args produce correct cfg', () => {
    const args: CliArgs = {
      network: 'testnet',
      role: 'clio',
      size: 'huge',
      verbosity: 'debug',
      validateOnly: false,
    };

    const result = run(args);
    expect(result.exitCode).toBe(0);

    // Network: testnet
    expect(result.stdout).toContain('[network_id]\n1');

    // Role: clio (gRPC on 0.0.0.0, full ledger_history)
    expect(result.stdout).toContain('[port_grpc]');
    expect(result.stdout).toContain('ip = 0.0.0.0');

    // Size: huge
    expect(result.stdout).toContain('[node_size]\nhuge');
    expect(result.stdout).toContain('online_delete=8192');
    expect(result.stdout).toContain('[peers_max]\n300');

    // Verbosity: debug
    expect(result.stdout).toContain('"severity":"debug"');
  });

  it('writes preset cfg to output directory', () => {
    const args: CliArgs = {
      network: 'mainnet',
      role: 'stock',
      size: 'medium',
      verbosity: 'warning',
      outputPath: tmpDir,
      validateOnly: false,
    };

    const result = run(args);
    expect(result.exitCode).toBe(0);
    expect(result.stderr.some((s) => s.includes('Config written to'))).toBe(true);
  });
});

// #endregion -- CLI with Preset Args --------------------------
