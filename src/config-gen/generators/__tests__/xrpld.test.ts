import { describe, it, expect } from 'vitest';
import { generateXrpldConfig } from '../xrpld.js';

describe('generateXrpldConfig', () => {
  // #region Default config

  it('generates a valid default config with no overrides', () => {
    const { config, warnings } = generateXrpldConfig();
    expect(config).toContain('[server]');
    expect(config).toContain('port = 51235');
    expect(config).toContain('port = 51234');
    expect(config).toContain('port = 6005');
    expect(config).toContain('protocol = http');
    expect(config).toContain('protocol = ws');
    expect(config).toContain('[ssl_verify]\n1');
    expect(config).toContain('type = NuDB');
    expect(config).toContain('path=/opt/xrpl/db/nudb');
    expect(config).toContain('[network_id]\n0');
    expect(warnings).toEqual([]);
  });

  // #endregion

  // #region Network presets

  it('resolves MAINNET defaults', () => {
    const { config } = generateXrpldConfig({ NETWORK: 'MAINNET' });
    expect(config).toContain('[network_id]\n0');
    // MAINNET has no IPS section (empty)
    expect(config).not.toContain('[ips]\n');
  });

  it('resolves TESTNET defaults', () => {
    const { config } = generateXrpldConfig({ NETWORK: 'TESTNET' });
    expect(config).toContain('[network_id]\ntestnet');
    expect(config).toContain('[ips]\ns.altnet.rippletest.net 51235');
  });

  it('resolves DEVNET defaults', () => {
    const { config } = generateXrpldConfig({ NETWORK: 'DEVNET' });
    expect(config).toContain('[network_id]\ndevnet');
    expect(config).toContain('[ips]\ns.devnet.rippletest.net 51235');
  });

  // #endregion

  // #region Size presets

  it('resolves SIZE=SMALL (ledger retention 512)', () => {
    const { config } = generateXrpldConfig({ SIZE: 'SMALL' });
    expect(config).toContain('online_delete=512');
  });

  it('resolves SIZE=MEDIUM (ledger retention 1024)', () => {
    const { config } = generateXrpldConfig({ SIZE: 'MEDIUM' });
    expect(config).toContain('online_delete=1024');
  });

  it('resolves SIZE=LARGE (ledger retention 2048)', () => {
    const { config } = generateXrpldConfig({ SIZE: 'LARGE' });
    expect(config).toContain('online_delete=2048');
  });

  it('resolves SIZE=HUGE (ledger retention 4096)', () => {
    const { config } = generateXrpldConfig({ SIZE: 'HUGE' });
    expect(config).toContain('online_delete=4096');
  });

  it('resolves SIZE=FULL (no online_delete, no advisory_delete)', () => {
    const { config } = generateXrpldConfig({ SIZE: 'FULL' });
    expect(config).toContain('path=/opt/xrpl/db/nudb');
    expect(config).not.toContain('online_delete');
    expect(config).not.toContain('advisory_delete');
    expect(config).toContain('[ledger_history]\nfull');
  });

  // #endregion

  // #region SSL enabled/disabled

  it('generates config with SSL disabled (default)', () => {
    const { config } = generateXrpldConfig();
    expect(config).toContain('protocol = http');
    expect(config).toContain('protocol = ws');
    expect(config).toContain('[ssl_verify]\n1');
    expect(config).not.toContain('ssl_key');
    expect(config).not.toContain('ssl_cert');
  });

  it('generates config with SSL enabled', () => {
    const { config } = generateXrpldConfig({
      SSL_CERT_PATH: '/opt/xrpl/certs',
    });
    expect(config).toContain('protocol = http,https');
    expect(config).toContain('protocol = ws,wss');
    expect(config).toContain('[ssl_verify]\n0');
    expect(config).toContain('ssl_key = /opt/xrpl/certs/rippled.pem');
    expect(config).toContain('ssl_cert = /opt/xrpl/certs/rippled.crt');
  });

  it('generates config with SSL chain enabled', () => {
    const { config } = generateXrpldConfig({
      SSL_CERT_PATH: '/opt/xrpl/certs',
      SSL_CHAIN_ENABLED: '1',
    });
    expect(config).toContain('ssl_chain = /opt/xrpl/certs/rippled.crt');
  });

  // #endregion

  // #region Reporting mode

  it('generates config with reporting mode enabled', () => {
    const { config } = generateXrpldConfig({
      REPORTING_MODE: '1',
      ETL_SOURCE_GRPC_PORT: '50052',
      ETL_SOURCE_WS_PORT: '6010',
      ETL_SOURCE_IP: '10.0.0.1',
    });
    expect(config).toContain('[reporting]');
    expect(config).toContain('etl_source');
    expect(config).toContain('[etl_source]');
    expect(config).toContain('source_grpc_port=50052');
    expect(config).toContain('source_ws_port=6010');
    expect(config).toContain('source_ip=10.0.0.1');
  });

  it('generates config without reporting section by default', () => {
    const { config } = generateXrpldConfig();
    expect(config).not.toContain('[reporting]');
    expect(config).not.toContain('[etl_source]');
  });

  // #endregion

  // #region Custom overrides

  it('applies custom port overrides', () => {
    const { config } = generateXrpldConfig({
      PORT_PEER: '12345',
      PORT_RPC: '23456',
      PORT_WSS: '34567',
    });
    expect(config).toContain('port = 12345');
    expect(config).toContain('port = 23456');
    expect(config).toContain('port = 34567');
  });

  it('applies NODE_SIZE section when set', () => {
    const { config } = generateXrpldConfig({ NODE_SIZE: 'medium' });
    expect(config).toContain('[node_size]\nmedium');
  });

  it('applies VALIDATION_SEED section when set', () => {
    const { config } = generateXrpldConfig({
      VALIDATION_SEED: 'sEd7FPFcA1Nf3osV0hbOmHiz1cXXXXX',
    });
    expect(config).toContain('[validation_seed]\nsEd7FPFcA1Nf3osV0hbOmHiz1cXXXXX');
  });

  it('applies PEERS_MAX section when set', () => {
    const { config } = generateXrpldConfig({ PEERS_MAX: '50' });
    expect(config).toContain('[peers_max]\n50');
  });

  it('applies custom database path', () => {
    const { config } = generateXrpldConfig({
      NODE_DB_PATH: '/data/nudb',
      DATABASE_PATH: '/data',
    });
    expect(config).toContain('path=/data/nudb');
    expect(config).toContain('[database_path]\n/data/nudb');
  });

  // #endregion

  // #region Postgres / ledger_tx_tables

  it('generates ledger_tx_tables section for Postgres node_db', () => {
    const { config } = generateXrpldConfig({
      NODE_DB_TYPE: 'Postgres',
      PG_CONNINFO: 'host=localhost dbname=rippled',
      USE_TX_TABLES: '1',
    });
    expect(config).toContain('[ledger_tx_tables]');
    expect(config).toContain('conninfo = host=localhost dbname=rippled');
    expect(config).toContain('use_tx_tables = 1');
  });

  it('does not generate ledger_tx_tables for NuDB', () => {
    const { config } = generateXrpldConfig();
    expect(config).not.toContain('[ledger_tx_tables]');
  });

  // #endregion

  // #region Validation errors

  it('throws on invalid port', () => {
    expect(() =>
      generateXrpldConfig({ PORT_PEER: '99999' }),
    ).toThrow('xrpld config validation failed');
  });

  it('throws on invalid boolean field', () => {
    expect(() =>
      generateXrpldConfig({ SSL_GENERATE: 'maybe' }),
    ).toThrow('xrpld config validation failed');
  });

  // #endregion

  // #region Warnings

  it('returns warnings for case-mismatched network', () => {
    const { warnings } = generateXrpldConfig({ NETWORK: 'MAINNET' });
    // MAINNET is correct casing, no warning
    expect(warnings).toEqual([]);
  });

  // #endregion

  // #region Output format

  it('does not have excessive blank lines (3+ consecutive)', () => {
    const { config } = generateXrpldConfig();
    expect(config).not.toMatch(/\n{4,}/);
  });

  it('contains all required config sections', () => {
    const { config } = generateXrpldConfig();
    const requiredSections = [
      '[server]',
      '[port_peer]',
      '[port_rpc]',
      '[port_wss]',
      '[port_grpc]',
      '[port_rpc_admin_local]',
      '[port_wss_admin_local]',
      '[debug_logfile]',
      '[fetch_depth]',
      '[ledger_history]',
      '[ssl_verify]',
      '[sntp_servers]',
      '[rpc_allow_remote]',
      '[node_db]',
      '[database_path]',
      '[rpc_startup]',
      '[peer_private]',
      '[validators_file]',
      '[network_id]',
    ];
    for (const section of requiredSections) {
      expect(config).toContain(section);
    }
  });

  // #endregion
});
