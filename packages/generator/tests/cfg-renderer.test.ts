import { describe, it, expect } from 'vitest';
import {
  renderSingleValueSection,
  renderKeyValueSection,
  renderListSection,
  renderPortSection,
  renderServerSection,
  renderXrpldCfg,
} from '../src/renderers/cfg-renderer.js';
import { resolveXrpldConfig } from '../src/defaults/xrpld.js';
import type { XrpldPortConfig, XrpldInput } from '../src/types/xrpld-input.js';

// #region renderSingleValueSection

describe('renderSingleValueSection', () => {
  it('renders a string value', () => {
    expect(renderSingleValueSection('debug_logfile', '/var/log/debug.log'))
      .toBe('[debug_logfile]\n/var/log/debug.log\n');
  });

  it('renders a numeric value', () => {
    expect(renderSingleValueSection('workers', 4))
      .toBe('[workers]\n4\n');
  });

  it('returns empty string for undefined', () => {
    expect(renderSingleValueSection('debug_logfile', undefined)).toBe('');
  });

  it('renders zero as a valid value', () => {
    expect(renderSingleValueSection('peer_private', 0))
      .toBe('[peer_private]\n0\n');
  });

  it('renders empty string value', () => {
    expect(renderSingleValueSection('node_size', ''))
      .toBe('[node_size]\n\n');
  });
});

// #endregion

// #region renderKeyValueSection

describe('renderKeyValueSection', () => {
  it('renders key=value pairs', () => {
    const result = renderKeyValueSection('node_db', {
      type: 'NuDB',
      path: '/var/lib/xrpld/db/nudb',
      online_delete: 512,
    });
    expect(result).toBe(
      '[node_db]\ntype=NuDB\npath=/var/lib/xrpld/db/nudb\nonline_delete=512\n',
    );
  });

  it('omits undefined keys', () => {
    const result = renderKeyValueSection('node_db', {
      type: 'NuDB',
      path: undefined,
      online_delete: 512,
    });
    expect(result).toBe('[node_db]\ntype=NuDB\nonline_delete=512\n');
  });

  it('returns empty string for undefined input', () => {
    expect(renderKeyValueSection('node_db', undefined)).toBe('');
  });

  it('returns empty string when all keys are undefined', () => {
    expect(renderKeyValueSection('node_db', {
      type: undefined,
      path: undefined,
    })).toBe('');
  });

  it('renders zero values', () => {
    const result = renderKeyValueSection('node_db', {
      advisory_delete: 0,
    });
    expect(result).toBe('[node_db]\nadvisory_delete=0\n');
  });
});

// #endregion

// #region renderListSection

describe('renderListSection', () => {
  it('renders string items', () => {
    const result = renderListSection('sntp_servers', ['pool.ntp.org', 'time.google.com']);
    expect(result).toBe('[sntp_servers]\npool.ntp.org\ntime.google.com\n');
  });

  it('returns empty string for undefined', () => {
    expect(renderListSection('sntp_servers', undefined)).toBe('');
  });

  it('returns empty string for empty array', () => {
    expect(renderListSection('sntp_servers', [])).toBe('');
  });

  it('renders object items as JSON', () => {
    const result = renderListSection('rpc_startup', [
      { command: 'log_level', severity: 'warning' },
    ]);
    expect(result).toBe(
      '[rpc_startup]\n{"command":"log_level","severity":"warning"}\n',
    );
  });

  it('renders single item list', () => {
    const result = renderListSection('ips', ['s.altnet.rippletest.net 51235']);
    expect(result).toBe('[ips]\ns.altnet.rippletest.net 51235\n');
  });
});

// #endregion

// #region renderPortSection

describe('renderPortSection', () => {
  it('renders all port fields as key = value', () => {
    const port: XrpldPortConfig = {
      name: 'port_peer',
      port: 51235,
      ip: '0.0.0.0',
      protocol: 'peer',
    };
    const result = renderPortSection(port);
    expect(result).toContain('[port_peer]');
    expect(result).toContain('port = 51235');
    expect(result).toContain('ip = 0.0.0.0');
    expect(result).toContain('protocol = peer');
    expect(result).not.toContain('name =');
  });

  it('omits name from the body', () => {
    const port: XrpldPortConfig = {
      name: 'port_rpc',
      port: 5005,
      ip: '127.0.0.1',
      protocol: 'http',
      admin: '127.0.0.1',
    };
    const result = renderPortSection(port);
    expect(result).not.toContain('name =');
    expect(result).toContain('[port_rpc]');
    expect(result).toContain('admin = 127.0.0.1');
  });

  it('renders port with secure_gateway', () => {
    const port: XrpldPortConfig = {
      name: 'port_grpc',
      port: 50051,
      ip: '127.0.0.1',
      protocol: 'grpc',
      secure_gateway: '127.0.0.1',
    };
    const result = renderPortSection(port);
    expect(result).toContain('secure_gateway = 127.0.0.1');
  });

  it('omits undefined optional fields', () => {
    const port: XrpldPortConfig = {
      name: 'port_peer',
      port: 51235,
      protocol: 'peer',
    };
    const result = renderPortSection(port);
    expect(result).not.toContain('ip =');
    expect(result).not.toContain('admin =');
  });
});

// #endregion

// #region renderServerSection

describe('renderServerSection', () => {
  it('renders server section with port names', () => {
    const ports: XrpldPortConfig[] = [
      { name: 'port_peer', port: 51235, protocol: 'peer' },
      { name: 'port_rpc', port: 5005, protocol: 'http' },
    ];
    const result = renderServerSection(ports);
    expect(result).toBe('[server]\nport_peer\nport_rpc\n');
  });

  it('renders single port', () => {
    const ports: XrpldPortConfig[] = [
      { name: 'port_peer', port: 51235, protocol: 'peer' },
    ];
    const result = renderServerSection(ports);
    expect(result).toBe('[server]\nport_peer\n');
  });
});

// #endregion

// #region renderXrpldCfg

describe('renderXrpldCfg', () => {
  it('renders mainnet resolved config with all expected sections', () => {
    const config = resolveXrpldConfig({ presets: { network: 'mainnet' } });
    const cfg = renderXrpldCfg(config);

    // Header
    expect(cfg).toContain('# xrpld configuration file');

    // Server and ports
    expect(cfg).toContain('[server]');
    expect(cfg).toContain('port_peer');
    expect(cfg).toContain('port_rpc_admin_local');
    expect(cfg).toContain('port_ws_admin_local');
    expect(cfg).toContain('port_grpc');
    expect(cfg).toContain('[port_peer]');
    expect(cfg).toContain('port = 51235');
    expect(cfg).toContain('protocol = peer');

    // Node DB
    expect(cfg).toContain('[node_db]');
    expect(cfg).toContain('type=NuDB');
    expect(cfg).toContain('path=/var/lib/xrpld/db/nudb');
    expect(cfg).toContain('online_delete=512');

    // Single-value sections
    expect(cfg).toContain('[debug_logfile]\n/var/log/xrpld/debug.log');
    expect(cfg).toContain('[database_path]\n/var/lib/xrpld/db');
    expect(cfg).toContain('[ssl_verify]\n1');
    expect(cfg).toContain('[ledger_history]\n512');
    expect(cfg).toContain('[fetch_depth]\nfull');
    expect(cfg).toContain('[peer_private]\n0');
    expect(cfg).toContain('[network_id]\n0');

    // List sections
    expect(cfg).toContain('[sntp_servers]\npool.ntp.org');
    expect(cfg).toContain('[rpc_startup]');

    // VL config
    expect(cfg).toContain('[vl]');
    expect(cfg).toContain('validator_list_sites=https://vl.ripple.com');
  });

  it('renders testnet config with testnet-specific values', () => {
    const config = resolveXrpldConfig({ presets: { network: 'testnet' } });
    const cfg = renderXrpldCfg(config);

    expect(cfg).toContain('[network_id]\n1');
    expect(cfg).toContain('[ips]\ns.altnet.rippletest.net 51235');
    expect(cfg).toContain('validator_list_sites=https://vl.altnet.rippletest.net');
  });

  it('renders devnet config with devnet-specific values', () => {
    const config = resolveXrpldConfig({ presets: { network: 'devnet' } });
    const cfg = renderXrpldCfg(config);

    expect(cfg).toContain('[network_id]\n2');
    expect(cfg).toContain('[ips]\ns.devnet.rippletest.net 51235');
    expect(cfg).toContain('validator_list_sites=https://vl.devnet.rippletest.net');
  });

  it('omits empty sections', () => {
    const config: XrpldInput = {
      presets: { network: 'mainnet' },
      database_path: '/var/lib/xrpld/db',
    };
    const cfg = renderXrpldCfg(config);
    expect(cfg).not.toContain('[server]');
    expect(cfg).not.toContain('[node_db]');
    expect(cfg).toContain('[database_path]');
  });

  it('renders config with custom ports', () => {
    const config = resolveXrpldConfig({
      presets: { network: 'mainnet' },
      server: {
        ports: [
          { name: 'port_peer', port: 41235, ip: '0.0.0.0', protocol: 'peer' },
          { name: 'port_ws', port: 6005, ip: '0.0.0.0', protocol: 'ws' },
        ],
      },
    });
    const cfg = renderXrpldCfg(config);
    expect(cfg).toContain('port = 41235');
    expect(cfg).toContain('port = 6005');
    expect(cfg).toContain('[port_peer]');
    expect(cfg).toContain('[port_ws]');
  });

  it('renders config with advanced sections', () => {
    const config = resolveXrpldConfig({
      presets: { network: 'mainnet' },
      overlay: { ip_limit: 10, max_peers_per_ip: 3 },
      transaction_queue: { ledgers_in_queue: 20, minimum_queue_size: 5 },
      voting: { reference_fee: 10, account_reserve: 10000000 },
      crawl: { overlay: 1, server: 1 },
      reduce_relay: { vp_enable: 1, tx_enable: 1 },
    });
    const cfg = renderXrpldCfg(config);
    expect(cfg).toContain('[overlay]');
    expect(cfg).toContain('ip_limit=10');
    expect(cfg).toContain('[transaction_queue]');
    expect(cfg).toContain('ledgers_in_queue=20');
    expect(cfg).toContain('[voting]');
    expect(cfg).toContain('reference_fee=10');
    expect(cfg).toContain('[crawl]');
    expect(cfg).toContain('[reduce_relay]');
  });

  it('sections are separated by blank lines', () => {
    const config = resolveXrpldConfig({ presets: { network: 'mainnet' } });
    const cfg = renderXrpldCfg(config);
    // Each section ends with \n and sections are joined with \n (so \n\n between them)
    expect(cfg).toContain('\n\n[');
  });
});

// #endregion
