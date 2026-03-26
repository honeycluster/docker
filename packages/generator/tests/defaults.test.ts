import { describe, it, expect } from 'vitest';
import { getNetworkDefaults, resolveXrpldConfig } from '../src/defaults/xrpld.js';

// #region -- getNetworkDefaults -----------------------

describe('getNetworkDefaults', () => {
  it('returns mainnet defaults', () => {
    const defaults = getNetworkDefaults('mainnet');
    expect(defaults.network_id).toBe('0');
    expect(defaults.vl?.validator_list_sites).toEqual([
      'https://vl.ripple.com',
      'https://unl.xrplf.org',
    ]);
    expect(defaults.vl?.validator_list_keys).toEqual([
      'ED2677ABFFD1B33AC6FBC3062B71F1E8397C1505E1C42C64D11AD1B28FF73F4734',
      'ED42AEC58B701EEBB77356FFFEC26F83C1F0407263530F068C7C73D392C7E06FD1',
    ]);
    expect(defaults.vl?.validator_list_key_sources).toEqual([
      'vl.ripple.com',
      'unl.xrplf.org',
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

// #endregion -- getNetworkDefaults --------------------

// #region -- resolveXrpldConfig — common defaults -----

describe('resolveXrpldConfig', () => {
  it('returns defaults with medium size + warning verbosity when no input', () => {
    const config = resolveXrpldConfig();
    expect(config.presets).toEqual({
      network: 'mainnet',
      role: 'stock',
      size: 'medium',
      verbosity: 'warning',
    });
    // From common defaults
    expect(config.database_path).toBe('/var/lib/xrpld/db');
    expect(config.debug_logfile).toBe('/var/log/xrpld/debug.log');
    expect(config.ssl_verify).toBe('1');
    expect(config.sntp_servers).toEqual(['pool.ntp.org']);
    expect(config.peer_private).toBe('0');
    expect(config.fetch_depth).toBe('full');
    // From medium size preset
    expect(config.node_db?.type).toBe('NuDB');
    expect(config.node_db?.path).toBe('/var/lib/xrpld/db/nudb');
    expect(config.node_db?.online_delete).toBe(512);
    expect(config.node_db?.advisory_delete).toBe(0);
    expect(config.node_size).toBe('medium');
    expect(config.ledger_history).toBe('512');
    expect(config.peers_max).toBe(21);
    // From warning verbosity preset
    expect(config.rpc_startup).toEqual([
      { command: 'log_level', severity: 'warning' },
    ]);
  });

  it('includes default ports from common defaults', () => {
    const config = resolveXrpldConfig();
    const ports = config.server?.ports;
    expect(ports).toHaveLength(6);
    expect(ports?.[0]).toMatchObject({
      name: 'port_peer',
      port: 51235,
      ip: '0.0.0.0',
      protocol: 'peer',
    });
    expect(ports?.[1]).toMatchObject({
      name: 'port_rpc',
      port: 5005,
      ip: '0.0.0.0',
      protocol: 'http,https',
    });
    expect(ports?.[2]).toMatchObject({
      name: 'port_rpc_admin_local',
      port: 5006,
      ip: '127.0.0.1',
      admin: '127.0.0.1',
      protocol: 'http',
    });
    expect(ports?.[3]).toMatchObject({
      name: 'port_wss',
      port: 6005,
      ip: '0.0.0.0',
      protocol: 'ws,wss',
    });
    expect(ports?.[4]).toMatchObject({
      name: 'port_ws_admin_local',
      port: 6006,
      ip: '127.0.0.1',
      admin: '127.0.0.1',
      protocol: 'ws',
    });
    expect(ports?.[5]).toMatchObject({
      name: 'port_grpc',
      port: 50051,
      ip: '0.0.0.0',
      secure_gateway: '127.0.0.1',
    });
  });

  // #endregion -- resolveXrpldConfig — common defaults -

  // #region -- resolveXrpldConfig — network defaults ---

  it('applies mainnet network defaults', () => {
    const config = resolveXrpldConfig({ presets: { network: 'mainnet' } });
    expect(config.network_id).toBe('0');
    expect(config.vl?.validator_list_sites).toEqual([
      'https://vl.ripple.com',
      'https://unl.xrplf.org',
    ]);
  });

  it('applies testnet network defaults', () => {
    const config = resolveXrpldConfig({ presets: { network: 'testnet' } });
    expect(config.network_id).toBe('1');
    expect(config.ips).toEqual(['s.altnet.rippletest.net 51235']);
    expect(config.vl?.validator_list_sites).toEqual([
      'https://vl.altnet.rippletest.net',
    ]);
  });

  it('applies devnet network defaults', () => {
    const config = resolveXrpldConfig({ presets: { network: 'devnet' } });
    expect(config.network_id).toBe('2');
    expect(config.ips).toEqual(['s.devnet.rippletest.net 51235']);
    expect(config.vl?.validator_list_sites).toEqual([
      'https://vl.devnet.rippletest.net',
    ]);
  });

  it('defaults to mainnet when network not specified', () => {
    const config = resolveXrpldConfig({});
    expect(config.presets?.network).toBe('mainnet');
    expect(config.network_id).toBe('0');
  });

  // #endregion -- resolveXrpldConfig — network defaults

  // #region -- resolveXrpldConfig — user overrides -----

  it('user overrides win over network defaults', () => {
    const config = resolveXrpldConfig({
      presets: { network: 'testnet' },
      network_id: '42',
      ips: ['my-custom-peer 51235'],
    });
    expect(config.network_id).toBe('42');
    expect(config.ips).toEqual(['my-custom-peer 51235']);
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
    expect(config.node_db?.type).toBe('RocksDB');
    expect(config.node_db?.path).toBe('/custom/db');
    // Deep merge preserves online_delete from size preset
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
      presets: { network: 'mainnet' },
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

  // #endregion -- resolveXrpldConfig — user overrides --

  // #region -- resolveXrpldConfig — preset merge pipeline

  it('huge size preset sets node_size, online_delete, peers_max', () => {
    const config = resolveXrpldConfig({ presets: { size: 'huge' } });
    expect(config.node_size).toBe('huge');
    expect(config.node_db?.online_delete).toBe(8192);
    expect(config.peers_max).toBe(300);
    expect(config.ledger_history).toBe('full');
    expect(config.workers).toBe(8);
    expect(config.io_workers).toBe(4);
  });

  it('validator role + large size combines both presets', () => {
    const config = resolveXrpldConfig({
      presets: { role: 'validator', size: 'large' },
    });
    // From large size
    expect(config.node_size).toBe('large');
    expect(config.node_db?.online_delete).toBe(2048);
    expect(config.peers_max).toBe(50);
    expect(config.workers).toBe(4);
    expect(config.io_workers).toBe(2);
    // From validator role (overrides size ports since role > size)
    expect(config.server?.ports).toHaveLength(3);
    expect(config.peer_private).toBe('1');
  });

  it('debug verbosity sets log_level in rpc_startup', () => {
    const config = resolveXrpldConfig({ presets: { verbosity: 'debug' } });
    expect(config.rpc_startup).toEqual([
      { command: 'log_level', severity: 'debug' },
    ]);
  });

  it('testnet + clio role has testnet VL keys + clio ports with gRPC on 0.0.0.0', () => {
    const config = resolveXrpldConfig({
      presets: { network: 'testnet', role: 'clio' },
    });
    // From testnet network
    expect(config.vl?.validator_list_keys).toEqual([
      'ED264807102805220DA0F312E71FC2C69E1552C9C5790F6C25E3729DEB573D5860',
    ]);
    // From clio role
    expect(config.server?.ports).toHaveLength(6);
    const grpcPort = config.server?.ports.find(p => p.protocol === 'grpc');
    expect(grpcPort?.ip).toBe('0.0.0.0');
    expect(grpcPort?.secure_gateway).toBe('0.0.0.0');
    expect(config.ledger_history).toBe('full');
  });

  it('user override wins over size preset: node_size', () => {
    const config = resolveXrpldConfig({
      presets: { size: 'huge' },
      node_size: 'large',
    });
    expect(config.node_size).toBe('large');
  });

  it('user override wins over verbosity preset: rpc_startup', () => {
    const customStartup = [{ command: 'log_level', severity: 'trace' }];
    const config = resolveXrpldConfig({
      presets: { verbosity: 'debug' },
      rpc_startup: customStartup,
    });
    expect(config.rpc_startup).toEqual(customStartup);
  });

  it('resolved config includes presets object with resolved values', () => {
    const config = resolveXrpldConfig({
      presets: { size: 'large', role: 'validator' },
    });
    expect(config.presets).toEqual({
      network: 'mainnet',
      role: 'validator',
      size: 'large',
      verbosity: 'warning',
    });
  });

  it('merge order: role overrides size for overlapping keys', () => {
    // clio role sets ledger_history=full, size medium sets ledger_history=1024
    // role > size in merge order, so role wins
    const config = resolveXrpldConfig({
      presets: { role: 'clio', size: 'medium' },
    });
    expect(config.ledger_history).toBe('full');
  });

  // #endregion -- resolveXrpldConfig — preset merge pipeline

  // #region -- port_overrides ---------------------------

  it('port_overrides changes a single port property without replacing array', () => {
    const config = resolveXrpldConfig({
      port_overrides: { port_rpc: { port: 8080 } },
    });
    // All 6 default ports remain
    expect(config.server?.ports).toHaveLength(6);
    // port_rpc has updated port
    const rpc = config.server?.ports.find((p) => p.name === 'port_rpc');
    expect(rpc?.port).toBe(8080);
    // Other properties unchanged
    expect(rpc?.ip).toBe('0.0.0.0');
    expect(rpc?.protocol).toBe('http,https');
  });

  it('port_overrides can change multiple ports', () => {
    const config = resolveXrpldConfig({
      port_overrides: {
        port_rpc: { port: 8080 },
        port_wss: { port: 8443, ip: '10.0.0.1' },
      },
    });
    const rpc = config.server?.ports.find((p) => p.name === 'port_rpc');
    expect(rpc?.port).toBe(8080);
    const wss = config.server?.ports.find((p) => p.name === 'port_wss');
    expect(wss?.port).toBe(8443);
    expect(wss?.ip).toBe('10.0.0.1');
  });

  it('port_overrides for non-existent port name is ignored', () => {
    const config = resolveXrpldConfig({
      port_overrides: { port_nonexistent: { port: 9999 } },
    });
    expect(config.server?.ports).toHaveLength(6);
    expect(config.server?.ports.every((p) => p.port !== 9999)).toBe(true);
  });

  it('port_overrides does not add new properties to ports', () => {
    const config = resolveXrpldConfig({
      port_overrides: { port_peer: { admin: '127.0.0.1' } },
    });
    const peer = config.server?.ports.find((p) => p.name === 'port_peer');
    expect(peer?.admin).toBe('127.0.0.1');
  });

  // #endregion -- port_overrides -------------------------
});
