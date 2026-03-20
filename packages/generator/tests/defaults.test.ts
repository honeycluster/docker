import { describe, it, expect } from 'vitest';
import { getNetworkDefaults, resolveXrpldConfig } from '../src/defaults/xrpld.js';

// #region getNetworkDefaults

describe('getNetworkDefaults', () => {
  it('returns mainnet defaults', () => {
    const defaults = getNetworkDefaults('mainnet');
    expect(defaults.network_id).toBe('0');
    expect(defaults.vl?.validator_list_sites).toEqual([
      'https://vl.ripple.com',
    ]);
    expect(defaults.vl?.validator_list_keys).toEqual([
      'ED2677ABFFD1B33AC6FBC3062B71F1E8397C1505E1C42C64D11AD1B28FF73F4734',
    ]);
    expect(defaults.ips).toBeUndefined();
  });

  it('returns testnet defaults', () => {
    const defaults = getNetworkDefaults('testnet');
    expect(defaults.network_id).toBe('1');
    expect(defaults.ips).toEqual(['s.altnet.rippletest.net 51235']);
    expect(defaults.vl?.validator_list_sites).toEqual([
      'https://vl.altnet.rippletest.net',
    ]);
    expect(defaults.vl?.validator_list_keys).toEqual([
      'ED264807102805220DA0F312E71FC2C69E1552C9C5790F6C25E3729DEB573D5860',
    ]);
  });

  it('returns devnet defaults', () => {
    const defaults = getNetworkDefaults('devnet');
    expect(defaults.network_id).toBe('2');
    expect(defaults.ips).toEqual(['s.devnet.rippletest.net 51235']);
    expect(defaults.vl?.validator_list_sites).toEqual([
      'https://vl.devnet.rippletest.net',
    ]);
    expect(defaults.vl?.validator_list_keys).toEqual([
      'EDBB54B0D9AEE071BB37784AF5A9E7CC49AC7A0EFCE868C54532BCB966B9CFC13B',
    ]);
  });
});

// #endregion

// #region resolveXrpldConfig

describe('resolveXrpldConfig', () => {
  it('returns common defaults when no input provided', () => {
    const config = resolveXrpldConfig();
    expect(config.network).toBe('mainnet');
    expect(config.node_db?.type).toBe('NuDB');
    expect(config.node_db?.path).toBe('/var/lib/xrpld/db/nudb');
    expect(config.node_db?.online_delete).toBe(512);
    expect(config.node_db?.advisory_delete).toBe(0);
    expect(config.database_path).toBe('/var/lib/xrpld/db');
    expect(config.debug_logfile).toBe('/var/log/xrpld/debug.log');
    expect(config.ssl_verify).toBe('1');
    expect(config.sntp_servers).toEqual(['pool.ntp.org']);
    expect(config.peer_private).toBe('0');
    expect(config.fetch_depth).toBe('full');
    expect(config.ledger_history).toBe('256');
    expect(config.rpc_startup).toEqual([
      { command: 'log_level', severity: 'warning' },
    ]);
  });

  it('includes default ports', () => {
    const config = resolveXrpldConfig();
    const ports = config.server?.ports;
    expect(ports).toHaveLength(4);
    expect(ports?.[0]).toMatchObject({
      name: 'port_peer',
      port: 51235,
      protocol: 'peer',
    });
    expect(ports?.[1]).toMatchObject({
      name: 'port_rpc_admin_local',
      port: 5005,
      admin: '127.0.0.1',
      protocol: 'http',
    });
    expect(ports?.[2]).toMatchObject({
      name: 'port_ws_admin_local',
      port: 6006,
      admin: '127.0.0.1',
      protocol: 'ws',
    });
    expect(ports?.[3]).toMatchObject({
      name: 'port_grpc',
      port: 50051,
      secure_gateway: '127.0.0.1',
    });
  });

  it('applies mainnet network defaults', () => {
    const config = resolveXrpldConfig({ network: 'mainnet' });
    expect(config.network_id).toBe('0');
    expect(config.vl?.validator_list_sites).toEqual([
      'https://vl.ripple.com',
    ]);
  });

  it('applies testnet network defaults', () => {
    const config = resolveXrpldConfig({ network: 'testnet' });
    expect(config.network_id).toBe('1');
    expect(config.ips).toEqual(['s.altnet.rippletest.net 51235']);
    expect(config.vl?.validator_list_sites).toEqual([
      'https://vl.altnet.rippletest.net',
    ]);
  });

  it('applies devnet network defaults', () => {
    const config = resolveXrpldConfig({ network: 'devnet' });
    expect(config.network_id).toBe('2');
    expect(config.ips).toEqual(['s.devnet.rippletest.net 51235']);
    expect(config.vl?.validator_list_sites).toEqual([
      'https://vl.devnet.rippletest.net',
    ]);
  });

  it('user overrides win over network defaults', () => {
    const config = resolveXrpldConfig({
      network: 'testnet',
      network_id: '42',
      ips: ['my-custom-peer 51235'],
    });
    expect(config.network_id).toBe('42');
    expect(config.ips).toEqual(['my-custom-peer 51235']);
    // VL should still come from testnet defaults
    expect(config.vl?.validator_list_sites).toEqual([
      'https://vl.altnet.rippletest.net',
    ]);
  });

  it('user overrides win over common defaults', () => {
    const config = resolveXrpldConfig({
      ssl_verify: '0',
      debug_logfile: '/custom/debug.log',
      ledger_history: 'full',
    });
    expect(config.ssl_verify).toBe('0');
    expect(config.debug_logfile).toBe('/custom/debug.log');
    expect(config.ledger_history).toBe('full');
  });

  it('deep merges nested objects', () => {
    const config = resolveXrpldConfig({
      node_db: {
        type: 'RocksDB',
        path: '/custom/db',
      },
    });
    // User values override
    expect(config.node_db?.type).toBe('RocksDB');
    expect(config.node_db?.path).toBe('/custom/db');
    // Common defaults should not survive a merge because user replaced the whole object
    // Actually with deep merge, the online_delete from common should survive
    expect(config.node_db?.online_delete).toBe(512);
    expect(config.node_db?.advisory_delete).toBe(0);
  });

  it('user can override ports array entirely', () => {
    const customPorts = [
      { name: 'my_peer', port: 9999, ip: '0.0.0.0', protocol: 'peer' },
    ];
    const config = resolveXrpldConfig({
      server: { ports: customPorts },
    });
    expect(config.server?.ports).toHaveLength(1);
    expect(config.server?.ports[0].name).toBe('my_peer');
  });

  it('user can override VL within a network', () => {
    const config = resolveXrpldConfig({
      network: 'mainnet',
      vl: {
        validator_list_sites: ['https://custom-vl.example.com'],
        validator_list_keys: ['DEADBEEF'],
      },
    });
    expect(config.vl?.validator_list_sites).toEqual([
      'https://custom-vl.example.com',
    ]);
    expect(config.vl?.validator_list_keys).toEqual(['DEADBEEF']);
  });

  it('defaults to mainnet when network not specified', () => {
    const config = resolveXrpldConfig({});
    expect(config.network).toBe('mainnet');
    expect(config.network_id).toBe('0');
  });

  it('preserves user fields not in defaults', () => {
    const config = resolveXrpldConfig({
      validator_token: 'my-token',
      node_size: 'huge',
      workers: 8,
    });
    expect(config.validator_token).toBe('my-token');
    expect(config.node_size).toBe('huge');
    expect(config.workers).toBe(8);
  });
});

// #endregion
