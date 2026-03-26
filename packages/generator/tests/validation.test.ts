import { describe, it, expect } from 'vitest';
import { validateXrpldConfig } from '../src/validation.js';
import { resolveXrpldConfig } from '../src/defaults/xrpld.js';
import type { XrpldInput } from '../src/types/xrpld-input.js';

function makeConfig(overrides: Partial<XrpldInput> = {}): XrpldInput {
  return resolveXrpldConfig({ presets: { network: 'mainnet' }, ...overrides });
}

function hasError(config: XrpldInput, field: string): boolean {
  const result = validateXrpldConfig(config);
  return result.errors.some((e) => e.field === field);
}

function hasWarning(config: XrpldInput, field: string): boolean {
  const result = validateXrpldConfig(config);
  return result.warnings.some((w) => w.field === field);
}

// #region -- Port Validation --------------------------

describe('port validation', () => {
  it('returns no errors for valid default config', () => {
    const result = validateXrpldConfig(makeConfig());
    const portErrors = result.errors.filter((e) => e.section === 'server');
    expect(portErrors).toHaveLength(0);
  });

  it('errors on port number out of range', () => {
    const config = makeConfig({
      server: {
        ports: [
          { name: 'bad_port', port: 0, protocol: 'peer' },
        ],
      },
    });
    expect(hasError(config, 'port')).toBe(true);
  });

  it('errors on port > 65535', () => {
    const config = makeConfig({
      server: {
        ports: [
          { name: 'bad_port', port: 70000, protocol: 'peer' },
        ],
      },
    });
    expect(hasError(config, 'port')).toBe(true);
  });

  it('errors on duplicate port numbers', () => {
    const config = makeConfig({
      server: {
        ports: [
          { name: 'port_peer', port: 51235, protocol: 'peer' },
          { name: 'port_rpc', port: 51235, protocol: 'http' },
        ],
      },
    });
    const result = validateXrpldConfig(config);
    expect(result.errors.some((e) => e.message.includes('duplicate'))).toBe(true);
  });

  it('errors when no peer port defined', () => {
    const config = makeConfig({
      server: {
        ports: [
          { name: 'port_rpc', port: 5005, protocol: 'http' },
        ],
      },
    });
    const result = validateXrpldConfig(config);
    expect(result.errors.some((e) => e.message.includes('No peer port'))).toBe(true);
  });

  it('errors when multiple peer ports defined', () => {
    const config = makeConfig({
      server: {
        ports: [
          { name: 'port_peer1', port: 51235, protocol: 'peer' },
          { name: 'port_peer2', port: 51236, protocol: 'peer' },
        ],
      },
    });
    const result = validateXrpldConfig(config);
    expect(result.errors.some((e) => e.message.includes('Multiple peer ports'))).toBe(true);
  });

  it('errors on ws mixed with http/peer', () => {
    const config = makeConfig({
      server: {
        ports: [
          { name: 'port_mixed', port: 5005, protocol: 'ws,http' },
          { name: 'port_peer', port: 51235, protocol: 'peer' },
        ],
      },
    });
    const result = validateXrpldConfig(config);
    expect(result.errors.some((e) => e.message.includes('ws/wss cannot be mixed'))).toBe(true);
  });

  it('warns on port 80', () => {
    const config = makeConfig({
      server: {
        ports: [
          { name: 'port_peer', port: 51235, protocol: 'peer' },
          { name: 'port_http', port: 80, protocol: 'http' },
        ],
      },
    });
    const result = validateXrpldConfig(config);
    expect(result.warnings.some((w) => w.message.includes('well-known port 80'))).toBe(true);
  });

  it('warns on port 443', () => {
    const config = makeConfig({
      server: {
        ports: [
          { name: 'port_peer', port: 51235, protocol: 'peer' },
          { name: 'port_https', port: 443, protocol: 'https' },
        ],
      },
    });
    const result = validateXrpldConfig(config);
    expect(result.warnings.some((w) => w.message.includes('well-known port 443'))).toBe(true);
  });

  it('warns on admin IP 0.0.0.0', () => {
    const config = makeConfig({
      server: {
        ports: [
          { name: 'port_peer', port: 51235, protocol: 'peer' },
          { name: 'port_rpc', port: 5005, protocol: 'http', admin: '0.0.0.0' },
        ],
      },
    });
    expect(hasWarning(config, 'admin')).toBe(true);
  });

  it('warns on admin IP ::', () => {
    const config = makeConfig({
      server: {
        ports: [
          { name: 'port_peer', port: 51235, protocol: 'peer' },
          { name: 'port_rpc', port: 5005, protocol: 'http', admin: '::' },
        ],
      },
    });
    expect(hasWarning(config, 'admin')).toBe(true);
  });
});

// #endregion -- Port Validation -----------------------

// #region -- Network Validation -----------------------

describe('network validation', () => {
  it('accepts valid network_id numbers', () => {
    expect(hasError(makeConfig({ network_id: '0' }), 'network_id')).toBe(false);
    expect(hasError(makeConfig({ network_id: '4294967295' }), 'network_id')).toBe(false);
  });

  it('accepts network_id names', () => {
    expect(hasError(makeConfig({ network_id: 'main' }), 'network_id')).toBe(false);
    expect(hasError(makeConfig({ network_id: 'testnet' }), 'network_id')).toBe(false);
    expect(hasError(makeConfig({ network_id: 'devnet' }), 'network_id')).toBe(false);
  });

  it('errors on invalid network_id', () => {
    expect(hasError(makeConfig({ network_id: 'invalid' }), 'network_id')).toBe(true);
    expect(hasError(makeConfig({ network_id: '-1' }), 'network_id')).toBe(true);
    expect(hasError(makeConfig({ network_id: '4294967296' }), 'network_id')).toBe(true);
  });

  it('accepts valid node_size values', () => {
    for (const size of ['tiny', 'small', 'medium', 'large', 'huge']) {
      expect(hasError(makeConfig({ node_size: size }), 'node_size')).toBe(false);
    }
  });

  it('errors on invalid node_size', () => {
    expect(hasError(makeConfig({ node_size: 'invalid' }), 'node_size')).toBe(true);
  });
});

// #endregion -- Network Validation --------------------

// #region -- Database Validation ----------------------

describe('database validation', () => {
  it('errors on invalid node_db.type', () => {
    const config = makeConfig({ node_db: { type: 'BadDB', path: '/tmp/db' } });
    expect(hasError(config, 'type')).toBe(true);
  });

  it('accepts NuDB and RocksDB', () => {
    expect(hasError(makeConfig({ node_db: { type: 'NuDB', path: '/tmp' } }), 'type')).toBe(false);
    expect(hasError(makeConfig({ node_db: { type: 'RocksDB', path: '/tmp' } }), 'type')).toBe(false);
  });

  it('errors on missing node_db.path', () => {
    const config = makeConfig({ node_db: { type: 'NuDB', path: '' } });
    expect(hasError(config, 'path')).toBe(true);
  });

  it('errors on online_delete < 256', () => {
    const config = makeConfig({ node_db: { type: 'NuDB', path: '/tmp', online_delete: 100 } });
    expect(hasError(config, 'online_delete')).toBe(true);
  });

  it('accepts online_delete >= 256', () => {
    const config = makeConfig({ node_db: { type: 'NuDB', path: '/tmp', online_delete: 256 } });
    expect(hasError(config, 'online_delete')).toBe(false);
  });

  it('errors on nudb_block_size not power of 2', () => {
    const config = makeConfig({ node_db: { type: 'NuDB', path: '/tmp', nudb_block_size: 5000 } });
    expect(hasError(config, 'nudb_block_size')).toBe(true);
  });

  it('errors on nudb_block_size out of range', () => {
    const config = makeConfig({ node_db: { type: 'NuDB', path: '/tmp', nudb_block_size: 2048 } });
    expect(hasError(config, 'nudb_block_size')).toBe(true);
    const config2 = makeConfig({ node_db: { type: 'NuDB', path: '/tmp', nudb_block_size: 65536 } });
    expect(hasError(config2, 'nudb_block_size')).toBe(true);
  });

  it('accepts valid nudb_block_size', () => {
    for (const size of [4096, 8192, 16384, 32768]) {
      const config = makeConfig({ node_db: { type: 'NuDB', path: '/tmp', nudb_block_size: size } });
      expect(hasError(config, 'nudb_block_size')).toBe(false);
    }
  });

  it('errors on earliest_seq < 1', () => {
    const config = makeConfig({ node_db: { type: 'NuDB', path: '/tmp', earliest_seq: 0 } });
    expect(hasError(config, 'earliest_seq')).toBe(true);
  });

  it('errors on missing database_path', () => {
    const config = makeConfig({ database_path: '' });
    expect(hasError(config, 'database_path')).toBe(true);
  });

  it('errors on invalid ledger_history', () => {
    const config = makeConfig({ ledger_history: 'invalid' });
    expect(hasError(config, 'ledger_history')).toBe(true);
  });

  it('accepts valid ledger_history values', () => {
    expect(hasError(makeConfig({ ledger_history: 'full' }), 'ledger_history')).toBe(false);
    expect(hasError(makeConfig({ ledger_history: 'none' }), 'ledger_history')).toBe(false);
    expect(hasError(makeConfig({ ledger_history: '256' }), 'ledger_history')).toBe(false);
  });

  it('errors when ledger_history > online_delete', () => {
    const config = makeConfig({
      ledger_history: '1000',
      node_db: { type: 'NuDB', path: '/tmp', online_delete: 512 },
    });
    expect(hasError(config, 'ledger_history')).toBe(true);
  });

  it('warns on RocksDB without online_delete', () => {
    // Use raw config to avoid defaults adding online_delete
    const config: XrpldInput = {
      ...makeConfig(),
      node_db: { type: 'RocksDB', path: '/tmp' },
    };
    expect(hasWarning(config, 'online_delete')).toBe(true);
  });

  it('warns on fetch_depth < 128', () => {
    const config = makeConfig({ fetch_depth: '10' });
    expect(hasWarning(config, 'fetch_depth')).toBe(true);
  });

  it('warns on ledger_history > 10000000 with sqlite', () => {
    const config = makeConfig({
      ledger_history: '20000000',
      node_db: { type: 'NuDB', path: '/tmp', online_delete: 30000000 },
      sqlite: { ledger_page_size: 4096 },
    });
    expect(hasWarning(config, 'ledger_history')).toBe(true);
  });

  it('errors on sqlite page_size < 512', () => {
    const config = makeConfig({ sqlite: { ledger_page_size: 256 } });
    expect(hasError(config, 'ledger_page_size')).toBe(true);
  });
});

// #endregion -- Database Validation -------------------

// #region -- Protocol Validation ----------------------

describe('protocol validation', () => {
  it('errors on invalid ssl_verify', () => {
    expect(hasError(makeConfig({ ssl_verify: '2' }), 'ssl_verify')).toBe(true);
    expect(hasError(makeConfig({ ssl_verify: 'yes' }), 'ssl_verify')).toBe(true);
  });

  it('accepts ssl_verify 0 and 1', () => {
    expect(hasError(makeConfig({ ssl_verify: '0' }), 'ssl_verify')).toBe(false);
    expect(hasError(makeConfig({ ssl_verify: '1' }), 'ssl_verify')).toBe(false);
  });

  it('warns on ssl_verify=0', () => {
    expect(hasWarning(makeConfig({ ssl_verify: '0' }), 'ssl_verify')).toBe(true);
  });

  it('errors on invalid ssl_cert_email format', () => {
    expect(hasError(makeConfig({ ssl_cert_email: 'not-an-email' }), 'ssl_cert_email')).toBe(true);
    expect(hasError(makeConfig({ ssl_cert_email: '@missing.com' }), 'ssl_cert_email')).toBe(true);
    expect(hasError(makeConfig({ ssl_cert_email: 'foo@' }), 'ssl_cert_email')).toBe(true);
  });

  it('accepts valid ssl_cert_email', () => {
    expect(hasError(makeConfig({ ssl_cert_email: 'admin@example.com' }), 'ssl_cert_email')).toBe(false);
    expect(hasError(makeConfig({ ssl_cert_email: 'user@sub.domain.org' }), 'ssl_cert_email')).toBe(false);
  });

  it('errors on invalid ssl_cert_validity_days', () => {
    expect(hasError(makeConfig({ ssl_cert_validity_days: 0 }), 'ssl_cert_validity_days')).toBe(true);
    expect(hasError(makeConfig({ ssl_cert_validity_days: -1 }), 'ssl_cert_validity_days')).toBe(true);
    expect(hasError(makeConfig({ ssl_cert_validity_days: 1.5 }), 'ssl_cert_validity_days')).toBe(true);
  });

  it('accepts valid ssl_cert_validity_days', () => {
    expect(hasError(makeConfig({ ssl_cert_validity_days: 1 }), 'ssl_cert_validity_days')).toBe(false);
    expect(hasError(makeConfig({ ssl_cert_validity_days: 365 }), 'ssl_cert_validity_days')).toBe(false);
    expect(hasError(makeConfig({ ssl_cert_validity_days: 3650 }), 'ssl_cert_validity_days')).toBe(false);
  });

  it('errors on mutually exclusive validation_seed and validator_token', () => {
    const config = makeConfig({ validation_seed: 'seed', validator_token: 'token' });
    const result = validateXrpldConfig(config);
    expect(result.errors.some((e) => e.message.includes('mutually exclusive'))).toBe(true);
  });

  it('warns when no validator_token and no validation_seed', () => {
    const config = makeConfig();
    expect(hasWarning(config, 'validator_token')).toBe(true);
  });

  it('no warning when validator_token is set', () => {
    const config = makeConfig({ validator_token: 'some_token' });
    expect(hasWarning(config, 'validator_token')).toBe(false);
  });

  it('errors on invalid compression', () => {
    expect(hasError(makeConfig({ compression: 'yes' }), 'compression')).toBe(true);
  });

  it('accepts valid compression', () => {
    expect(hasError(makeConfig({ compression: 'true' }), 'compression')).toBe(false);
    expect(hasError(makeConfig({ compression: 'false' }), 'compression')).toBe(false);
  });

  it('errors on invalid signing_support', () => {
    expect(hasError(makeConfig({ signing_support: 'yes' }), 'signing_support')).toBe(true);
  });

  it('warns on signing_support=true', () => {
    expect(hasWarning(makeConfig({ signing_support: 'true' }), 'signing_support')).toBe(true);
  });

  it('errors on invalid peer_private', () => {
    expect(hasError(makeConfig({ peer_private: '2' }), 'peer_private')).toBe(true);
  });

  it('errors on invalid beta_rpc_api', () => {
    expect(hasError(makeConfig({ beta_rpc_api: 'yes' }), 'beta_rpc_api')).toBe(true);
  });

  it('errors on invalid ledger_replay', () => {
    expect(hasError(makeConfig({ ledger_replay: 'on' }), 'ledger_replay')).toBe(true);
  });

  it('errors on invalid relay_proposals', () => {
    expect(hasError(makeConfig({ relay_proposals: 'invalid' }), 'relay_proposals')).toBe(true);
  });

  it('accepts valid relay_proposals', () => {
    for (const v of ['all', 'trusted', 'drop_untrusted']) {
      expect(hasError(makeConfig({ relay_proposals: v }), 'relay_proposals')).toBe(false);
    }
  });

  it('errors on invalid relay_validations', () => {
    expect(hasError(makeConfig({ relay_validations: 'none' }), 'relay_validations')).toBe(true);
  });

  it('errors on max_transactions out of range', () => {
    expect(hasError(makeConfig({ max_transactions: 50 }), 'max_transactions')).toBe(true);
    expect(hasError(makeConfig({ max_transactions: 1001 }), 'max_transactions')).toBe(true);
  });

  it('accepts valid max_transactions', () => {
    expect(hasError(makeConfig({ max_transactions: 100 }), 'max_transactions')).toBe(false);
    expect(hasError(makeConfig({ max_transactions: 1000 }), 'max_transactions')).toBe(false);
  });

  it('errors on workers out of range', () => {
    expect(hasError(makeConfig({ workers: 0 }), 'workers')).toBe(true);
    expect(hasError(makeConfig({ workers: 1025 }), 'workers')).toBe(true);
  });

  it('errors on io_workers out of range', () => {
    expect(hasError(makeConfig({ io_workers: 0 }), 'io_workers')).toBe(true);
  });

  it('errors on prefetch_workers out of range', () => {
    expect(hasError(makeConfig({ prefetch_workers: 2000 }), 'prefetch_workers')).toBe(true);
  });

  it('errors on sweep_interval out of range', () => {
    expect(hasError(makeConfig({ sweep_interval: 5 }), 'sweep_interval')).toBe(true);
    expect(hasError(makeConfig({ sweep_interval: 700 }), 'sweep_interval')).toBe(true);
  });

  it('accepts valid sweep_interval', () => {
    expect(hasError(makeConfig({ sweep_interval: 10 }), 'sweep_interval')).toBe(false);
    expect(hasError(makeConfig({ sweep_interval: 600 }), 'sweep_interval')).toBe(false);
  });

  it('errors on negative path_search', () => {
    expect(hasError(makeConfig({ path_search: -1 }), 'path_search')).toBe(true);
  });

  it('errors on negative path_search_old', () => {
    expect(hasError(makeConfig({ path_search_old: -5 }), 'path_search_old')).toBe(true);
  });

  it('accepts non-negative path_search', () => {
    expect(hasError(makeConfig({ path_search: 0 }), 'path_search')).toBe(false);
    expect(hasError(makeConfig({ path_search: 7 }), 'path_search')).toBe(false);
  });

});

// #endregion -- Protocol Validation -------------------

// #region -- Overlay Validation -----------------------

describe('overlay validation', () => {
  it('errors on negative overlay values', () => {
    expect(hasError(makeConfig({ overlay: { ip_limit: -1 } }), 'ip_limit')).toBe(true);
    expect(hasError(makeConfig({ overlay: { max_unknown_time: -1 } }), 'max_unknown_time')).toBe(true);
    expect(hasError(makeConfig({ overlay: { max_peers_per_ip: -1 } }), 'max_peers_per_ip')).toBe(true);
  });

  it('accepts valid overlay values', () => {
    const config = makeConfig({ overlay: { ip_limit: 10, max_peers_per_ip: 3 } });
    const result = validateXrpldConfig(config);
    expect(result.errors.filter((e) => e.section === 'overlay')).toHaveLength(0);
  });
});

// #endregion -- Overlay Validation --------------------

// #region -- Reduce Relay Validation ------------------

describe('reduce_relay validation', () => {
  it('errors on invalid vp_enable', () => {
    expect(hasError(makeConfig({ reduce_relay: { vp_enable: 2 } }), 'vp_enable')).toBe(true);
  });

  it('errors on invalid tx_enable', () => {
    expect(hasError(makeConfig({ reduce_relay: { tx_enable: -1 } }), 'tx_enable')).toBe(true);
  });

  it('errors on negative vp_squelch', () => {
    expect(hasError(makeConfig({ reduce_relay: { vp_squelch: -1 } }), 'vp_squelch')).toBe(true);
  });

  it('errors on negative tx_limit', () => {
    expect(hasError(makeConfig({ reduce_relay: { tx_limit: -1 } }), 'tx_limit')).toBe(true);
  });

  it('accepts valid reduce_relay values', () => {
    const config = makeConfig({ reduce_relay: { vp_enable: 1, tx_enable: 0, vp_squelch: 100, tx_limit: 50 } });
    const result = validateXrpldConfig(config);
    expect(result.errors.filter((e) => e.section === 'reduce_relay')).toHaveLength(0);
  });
});

// #endregion -- Reduce Relay Validation ---------------

// #region -- Voting Validation ------------------------

describe('voting validation', () => {
  it('errors on non-positive reference_fee', () => {
    expect(hasError(makeConfig({ voting: { reference_fee: 0 } }), 'reference_fee')).toBe(true);
    expect(hasError(makeConfig({ voting: { reference_fee: -1 } }), 'reference_fee')).toBe(true);
  });

  it('errors on non-positive account_reserve', () => {
    expect(hasError(makeConfig({ voting: { account_reserve: 0 } }), 'account_reserve')).toBe(true);
  });

  it('errors on non-positive owner_reserve', () => {
    expect(hasError(makeConfig({ voting: { owner_reserve: -5 } }), 'owner_reserve')).toBe(true);
  });

  it('accepts valid voting values', () => {
    const config = makeConfig({ voting: { reference_fee: 10, account_reserve: 10000000, owner_reserve: 2000000 } });
    const result = validateXrpldConfig(config);
    expect(result.errors.filter((e) => e.section === 'voting')).toHaveLength(0);
  });
});

// #endregion -- Voting Validation ---------------------

// #region -- Crawl Validation -------------------------

describe('crawl validation', () => {
  it('errors on invalid crawl values', () => {
    expect(hasError(makeConfig({ crawl: { overlay: 2 } }), 'overlay')).toBe(true);
    expect(hasError(makeConfig({ crawl: { server: -1 } }), 'server')).toBe(true);
    expect(hasError(makeConfig({ crawl: { counts: 3 } }), 'counts')).toBe(true);
    expect(hasError(makeConfig({ crawl: { unl: 5 } }), 'unl')).toBe(true);
  });

  it('accepts valid crawl 0/1', () => {
    const config = makeConfig({ crawl: { overlay: 1, server: 0, counts: 1, unl: 0 } });
    const result = validateXrpldConfig(config);
    expect(result.errors.filter((e) => e.section === 'crawl')).toHaveLength(0);
  });
});

// #endregion -- Crawl Validation ----------------------

// #region -- Peer Warnings ----------------------------

describe('peer warnings', () => {
  it('warns when peer_private=1 but no ips_fixed', () => {
    const config = makeConfig({ peer_private: '1' });
    expect(hasWarning(config, 'ips_fixed')).toBe(true);
  });

  it('no warning when peer_private=1 and ips_fixed provided', () => {
    const config = makeConfig({ peer_private: '1', ips_fixed: ['1.2.3.4 51235'] });
    expect(hasWarning(config, 'ips_fixed')).toBe(false);
  });
});

// #endregion -- Peer Warnings -------------------------

// #region -- Preset Validation ------------------------

describe('preset validation', () => {
  it('returns no errors for valid presets', () => {
    const config = makeConfig();
    const result = validateXrpldConfig(config);
    const presetErrors = result.errors.filter((e) => e.section === 'presets');
    expect(presetErrors).toHaveLength(0);
  });

  it('errors on invalid role value', () => {
    const config: XrpldInput = {
      ...makeConfig(),
      presets: { network: 'mainnet', role: 'invalid' as never, size: 'medium', verbosity: 'warning' },
    };
    const result = validateXrpldConfig(config);
    expect(result.errors.some((e) => e.section === 'presets' && e.field === 'role')).toBe(true);
  });

  it('errors on invalid size value', () => {
    const config: XrpldInput = {
      ...makeConfig(),
      presets: { network: 'mainnet', role: 'stock', size: 'gigantic' as never, verbosity: 'warning' },
    };
    const result = validateXrpldConfig(config);
    expect(result.errors.some((e) => e.section === 'presets' && e.field === 'size')).toBe(true);
  });

  it('errors on invalid verbosity value', () => {
    const config: XrpldInput = {
      ...makeConfig(),
      presets: { network: 'mainnet', role: 'stock', size: 'medium', verbosity: 'verbose' as never },
    };
    const result = validateXrpldConfig(config);
    expect(result.errors.some((e) => e.section === 'presets' && e.field === 'verbosity')).toBe(true);
  });

  it('errors on invalid network value', () => {
    const config: XrpldInput = {
      ...makeConfig(),
      presets: { network: 'regtest' as never, role: 'stock', size: 'medium', verbosity: 'warning' },
    };
    const result = validateXrpldConfig(config);
    expect(result.errors.some((e) => e.section === 'presets' && e.field === 'network')).toBe(true);
  });

  it('warns when role=validator without validator_token or validation_seed', () => {
    const config = makeConfig({ presets: { network: 'mainnet', role: 'validator', size: 'medium', verbosity: 'warning' } });
    const result = validateXrpldConfig(config);
    expect(result.warnings.some((w) => w.section === 'presets' && w.value === 'validator' && w.message.includes('validator_token'))).toBe(true);
  });

  it('suppresses generic no-validator warning when role=validator warning fires', () => {
    const config = makeConfig({ presets: { network: 'mainnet', role: 'validator', size: 'medium', verbosity: 'warning' } });
    const result = validateXrpldConfig(config);
    expect(result.warnings.some((w) => w.section === 'validators' && w.message.includes('will not validate'))).toBe(false);
  });

  it('no validator warning when validator_token is set with role=validator', () => {
    const config = makeConfig({
      presets: { network: 'mainnet', role: 'validator', size: 'medium', verbosity: 'warning' },
      validator_token: 'some_token',
    });
    const result = validateXrpldConfig(config);
    expect(result.warnings.some((w) => w.section === 'presets' && w.value === 'validator')).toBe(false);
  });

  it('warns when role=sentry without ips_fixed', () => {
    const config = makeConfig({ presets: { network: 'mainnet', role: 'sentry', size: 'medium', verbosity: 'warning' } });
    const result = validateXrpldConfig(config);
    expect(result.warnings.some((w) => w.section === 'presets' && w.value === 'sentry' && w.message.includes('ips_fixed'))).toBe(true);
  });

  it('no sentry warning when ips_fixed is provided', () => {
    const config = makeConfig({
      presets: { network: 'mainnet', role: 'sentry', size: 'medium', verbosity: 'warning' },
      ips_fixed: ['1.2.3.4 51235'],
    });
    const result = validateXrpldConfig(config);
    expect(result.warnings.some((w) => w.section === 'presets' && w.value === 'sentry')).toBe(false);
  });

  it('warns when role=clio and gRPC port is not on 0.0.0.0', () => {
    const config = makeConfig({
      presets: { network: 'mainnet', role: 'clio', size: 'medium', verbosity: 'warning' },
      server: {
        ports: [
          { name: 'port_peer', port: 51235, ip: '0.0.0.0', protocol: 'peer' },
          { name: 'port_grpc', port: 50051, ip: '127.0.0.1', protocol: 'grpc' },
        ],
      },
    });
    const result = validateXrpldConfig(config);
    expect(result.warnings.some((w) => w.section === 'presets' && w.value === 'clio' && w.message.includes('gRPC'))).toBe(true);
  });

  it('no clio gRPC warning when port is on 0.0.0.0', () => {
    const config = makeConfig({ presets: { network: 'mainnet', role: 'clio', size: 'medium', verbosity: 'warning' } });
    const result = validateXrpldConfig(config);
    expect(result.warnings.some((w) => w.section === 'presets' && w.value === 'clio' && w.message.includes('gRPC'))).toBe(false);
  });

  it('role=stock does not produce role-specific warnings', () => {
    const config = makeConfig({ presets: { network: 'mainnet', role: 'stock', size: 'medium', verbosity: 'warning' } });
    const result = validateXrpldConfig(config);
    const roleWarnings = result.warnings.filter((w) => w.section === 'presets' && w.field === 'role');
    expect(roleWarnings).toHaveLength(0);
  });
});

// #endregion -- Preset Validation ---------------------

// #region -- ValidationEntry structure ----------------

describe('ValidationEntry structure', () => {
  it('each entry has section, field, value, message, severity', () => {
    const config = makeConfig({ node_db: { type: 'BadDB', path: '' } });
    const result = validateXrpldConfig(config);
    expect(result.errors.length).toBeGreaterThan(0);
    const e = result.errors[0];
    expect(e).toHaveProperty('section');
    expect(e).toHaveProperty('field');
    expect(e).toHaveProperty('value');
    expect(e).toHaveProperty('message');
    expect(e).toHaveProperty('severity');
    expect(e.severity).toBe('error');
  });
});

// #endregion -- ValidationEntry structure -------------
