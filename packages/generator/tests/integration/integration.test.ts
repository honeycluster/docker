import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { generateXrpldConfig } from '../../src/generators/xrpld.js';
import { resolveXrpldConfig } from '../../src/defaults/xrpld.js';
import { renderXrpldCfg } from '../../src/renderers/cfg-renderer.js';
import { validateXrpldConfig } from '../../src/validation.js';
import { parseCfgFile } from '../../src/parsers/cfg-parser.js';
import { parseTextFile } from '../../src/parsers/env-parser.js';
import { parseJsonFile } from '../../src/parsers/json-parser.js';
import type { XrpldInput } from '../../src/types/xrpld-input.js';

const EXPECTED_DIR = join(import.meta.dirname, 'expected');
const FIXTURES_DIR = join(import.meta.dirname, 'fixtures');

function readExpected(filename: string): string {
  return readFileSync(join(EXPECTED_DIR, filename), 'utf-8');
}

function readFixture(filename: string): string {
  return readFileSync(join(FIXTURES_DIR, filename), 'utf-8');
}

// #region Network Config Generation

describe('network config generation', () => {
  it('generates mainnet config matching expected output', () => {
    const result = generateXrpldConfig({ presets: { network: 'mainnet' } });
    expect(result.config).toBe(readExpected('xrpld-mainnet.cfg'));
  });

  it('generates testnet config matching expected output', () => {
    const result = generateXrpldConfig({ presets: { network: 'testnet' } });
    expect(result.config).toBe(readExpected('xrpld-testnet.cfg'));
  });

  it('generates devnet config matching expected output', () => {
    const result = generateXrpldConfig({ presets: { network: 'devnet' } });
    expect(result.config).toBe(readExpected('xrpld-devnet.cfg'));
  });

  it('default config matches explicit mainnet config', () => {
    const defaultResult = generateXrpldConfig({});
    const mainnetResult = generateXrpldConfig({ presets: { network: 'mainnet' } });
    expect(defaultResult.config).toBe(mainnetResult.config);
    expect(defaultResult.config).toBe(readExpected('xrpld-default.cfg'));
  });

  it('mainnet cfg contains correct network_id and VL sections', () => {
    const result = generateXrpldConfig({ presets: { network: 'mainnet' } });
    expect(result.config).toContain('[network_id]\n0');
    expect(result.config).not.toContain('[ips]');
  });

  it('testnet cfg contains correct network_id and ips', () => {
    const result = generateXrpldConfig({ presets: { network: 'testnet' } });
    expect(result.config).toContain('[network_id]\n1');
    expect(result.config).toContain('[ips]\ns.altnet.rippletest.net 51235');
  });

  it('devnet cfg contains correct network_id and ips', () => {
    const result = generateXrpldConfig({ presets: { network: 'devnet' } });
    expect(result.config).toContain('[network_id]\n2');
    expect(result.config).toContain('[ips]\ns.devnet.rippletest.net 51235');
  });
});

// #endregion

// #region Custom Ports

describe('custom ports config', () => {
  it('generates config with custom ports matching expected output', () => {
    const input = parseJsonFile(readFixture('xrpld-custom-ports.json'));
    const result = generateXrpldConfig(input);
    expect(result.config).toBe(readExpected('xrpld-custom-ports.cfg'));
  });

  it('custom ports appear in server section and port sections', () => {
    const result = generateXrpldConfig({
      presets: { network: 'mainnet' },
      server: {
        ports: [
          { name: 'port_peer', port: 41235, ip: '0.0.0.0', protocol: 'peer' },
          { name: 'port_rpc', port: 41234, ip: '0.0.0.0', protocol: 'http', admin: '127.0.0.1' },
        ],
      },
    });
    expect(result.config).toContain('[server]\nport_peer\nport_rpc');
    expect(result.config).toContain('[port_peer]\nport = 41235');
    expect(result.config).toContain('[port_rpc]\nport = 41234');
  });
});

// #endregion

// #region Advanced Sections

describe('advanced sections config', () => {
  it('generates config with advanced sections matching expected output', () => {
    const input = parseJsonFile(readFixture('xrpld-advanced.json'));
    const result = generateXrpldConfig(input);
    expect(result.config).toBe(readExpected('xrpld-advanced.cfg'));
  });

  it('advanced config contains overlay section', () => {
    const result = generateXrpldConfig({
      presets: { network: 'mainnet' },
      overlay: { ip_limit: 5, max_unknown_time: 300 },
    });
    expect(result.config).toContain('[overlay]');
    expect(result.config).toContain('ip_limit=5');
    expect(result.config).toContain('max_unknown_time=300');
  });

  it('advanced config contains transaction_queue section', () => {
    const result = generateXrpldConfig({
      presets: { network: 'mainnet' },
      transaction_queue: { ledgers_in_queue: 20, minimum_queue_size: 2000 },
    });
    expect(result.config).toContain('[transaction_queue]');
    expect(result.config).toContain('ledgers_in_queue=20');
  });

  it('advanced config contains voting section', () => {
    const result = generateXrpldConfig({
      presets: { network: 'mainnet' },
      voting: { reference_fee: 10, account_reserve: 10000000 },
    });
    expect(result.config).toContain('[voting]');
    expect(result.config).toContain('reference_fee=10');
    expect(result.config).toContain('account_reserve=10000000');
  });

  it('advanced config contains reduce_relay section', () => {
    const result = generateXrpldConfig({
      presets: { network: 'mainnet' },
      reduce_relay: { vp_enable: 1, tx_enable: 1, tx_limit: 300 },
    });
    expect(result.config).toContain('[reduce_relay]');
    expect(result.config).toContain('vp_enable=1');
    expect(result.config).toContain('tx_limit=300');
  });

  it('advanced config contains crawl section', () => {
    const result = generateXrpldConfig({
      presets: { network: 'mainnet' },
      crawl: { overlay: 1, server: 1, counts: 1, unl: 1 },
    });
    expect(result.config).toContain('[crawl]');
    expect(result.config).toContain('overlay=1');
  });

  it('advanced config contains sqlite section', () => {
    const result = generateXrpldConfig({
      presets: { network: 'mainnet' },
      sqlite: { ledger_page_size: 4096, transaction_page_size: 4096 },
    });
    expect(result.config).toContain('[sqlite]');
    expect(result.config).toContain('ledger_page_size=4096');
  });
});

// #endregion

// #region Validators.txt

describe('validators.txt generation', () => {
  it('mainnet validators.txt matches expected output', () => {
    const result = generateXrpldConfig({ presets: { network: 'mainnet' } });
    expect(result.validatorsTxt).toBe(readExpected('xrpld-mainnet-validators.txt'));
  });

  it('testnet validators.txt matches expected output', () => {
    const result = generateXrpldConfig({ presets: { network: 'testnet' } });
    expect(result.validatorsTxt).toBe(readExpected('xrpld-testnet-validators.txt'));
  });

  it('devnet validators.txt matches expected output', () => {
    const result = generateXrpldConfig({ presets: { network: 'devnet' } });
    expect(result.validatorsTxt).toBe(readExpected('xrpld-devnet-validators.txt'));
  });

  it('mainnet validators.txt contains ripple VL site and key', () => {
    const result = generateXrpldConfig({ presets: { network: 'mainnet' } });
    expect(result.validatorsTxt).toContain('[validator_list_sites]');
    expect(result.validatorsTxt).toContain('https://vl.ripple.com');
    expect(result.validatorsTxt).toContain('[validator_list_keys]');
    expect(result.validatorsTxt).toContain(
      'ED2677ABFFD1B33AC6FBC3062B71F1E8397C1505E1C42C64D11AD1B28FF73F4734',
    );
  });

  it('testnet validators.txt contains altnet VL site', () => {
    const result = generateXrpldConfig({ presets: { network: 'testnet' } });
    expect(result.validatorsTxt).toContain('https://vl.altnet.rippletest.net');
    expect(result.validatorsTxt).toContain(
      'ED264807102805220DA0F312E71FC2C69E1552C9C5790F6C25E3729DEB573D5860',
    );
  });

  it('devnet validators.txt contains devnet VL site', () => {
    const result = generateXrpldConfig({ presets: { network: 'devnet' } });
    expect(result.validatorsTxt).toContain('https://vl.devnet.rippletest.net');
    expect(result.validatorsTxt).toContain(
      'EDBB54B0D9AEE071BB37784AF5A9E7CC49AC7A0EFCE868C54532BCB966B9CFC13B',
    );
  });

  it('each network has different validator keys', () => {
    const mn = generateXrpldConfig({ presets: { network: 'mainnet' } });
    const tn = generateXrpldConfig({ presets: { network: 'testnet' } });
    const dn = generateXrpldConfig({ presets: { network: 'devnet' } });
    expect(mn.validatorsTxt).not.toBe(tn.validatorsTxt);
    expect(tn.validatorsTxt).not.toBe(dn.validatorsTxt);
    expect(mn.validatorsTxt).not.toBe(dn.validatorsTxt);
  });
});

// #endregion

// #region Round-trip CFG Parse

describe('round-trip cfg parsing', () => {
  it('parses xrpld-example.cfg — key sections parse correctly', () => {
    const exampleCfg = readFileSync(
      join(import.meta.dirname, '../../../../examples/rippled/cfg/xrpld-example.cfg'),
      'utf-8',
    );
    const parsed = parseCfgFile(exampleCfg);

    // Server ports
    expect(parsed.server).toBeDefined();
    expect(parsed.server!.ports).toBeDefined();
    const portNames = parsed.server!.ports.map((p) => p.name);
    expect(portNames).toContain('port_rpc_admin_local');
    expect(portNames).toContain('port_peer');
    expect(portNames).toContain('port_ws_admin_local');

    // Port details
    const peerPort = parsed.server!.ports.find((p) => p.name === 'port_peer');
    expect(peerPort?.port).toBe(51235);
    expect(peerPort?.ip).toBe('0.0.0.0');
    expect(peerPort?.protocol).toBe('peer');

    const rpcPort = parsed.server!.ports.find((p) => p.name === 'port_rpc_admin_local');
    expect(rpcPort?.port).toBe(5005);
    expect(rpcPort?.admin).toBe('127.0.0.1');

    // node_db
    expect(parsed.node_db).toBeDefined();
    expect(parsed.node_db!.type).toBe('NuDB');
    expect(parsed.node_db!.path).toBe('/var/lib/xrpld/db/nudb');
    expect(parsed.node_db!.online_delete).toBe(512);
    expect(parsed.node_db!.advisory_delete).toBe(0);

    // Single-value sections
    expect(parsed.database_path).toBe('/var/lib/xrpld/db');
    expect(parsed.debug_logfile).toBe('/var/log/xrpld/debug.log');
    expect(parsed.ssl_verify).toBe(1);
    expect(parsed.validators_file).toBe('validators.txt');

    // List sections
    expect(parsed.rpc_startup).toBeDefined();
    expect(parsed.rpc_startup).toHaveLength(1);
    expect((parsed.rpc_startup![0] as Record<string, string>).command).toBe('log_level');
  });

  it('generated mainnet cfg can be re-parsed to match key fields', () => {
    const result = generateXrpldConfig({ presets: { network: 'mainnet' } });
    const parsed = parseCfgFile(result.config);

    expect(parsed.network_id).toBe(0);
    expect(parsed.ssl_verify).toBe(1);
    expect(parsed.database_path).toBe('/var/lib/xrpld/db');
    expect(parsed.debug_logfile).toBe('/var/log/xrpld/debug.log');
    expect(parsed.ledger_history).toBe(256);
    expect(parsed.fetch_depth).toBe('full');
    expect(parsed.peer_private).toBe(0);

    // node_db
    expect(parsed.node_db?.type).toBe('NuDB');
    expect(parsed.node_db?.path).toBe('/var/lib/xrpld/db/nudb');
    expect(parsed.node_db?.online_delete).toBe(512);

    // Ports
    expect(parsed.server?.ports).toHaveLength(4);
    const peerPort = parsed.server?.ports.find((p) => p.name === 'port_peer');
    expect(peerPort?.port).toBe(51235);
    expect(peerPort?.protocol).toBe('peer');
  });

  it('generated testnet cfg can be re-parsed with correct network_id and ips', () => {
    const result = generateXrpldConfig({ presets: { network: 'testnet' } });
    const parsed = parseCfgFile(result.config);
    expect(parsed.network_id).toBe(1);
    expect(parsed.ips).toContain('s.altnet.rippletest.net 51235');
  });
});

// #endregion

// #region Text File / JSON Equivalence

describe('text file and JSON input equivalence', () => {
  it('text file input produces same cfg as equivalent JSON input', () => {
    const textContent = readFixture('xrpld-text-input.txt');
    const textInput = parseTextFile(textContent);

    const jsonInput = {
      presets: { network: 'mainnet' as const },
      node_size: 'medium',
      node_db: {
        type: 'NuDB',
        path: '/var/lib/xrpld/db/nudb',
        online_delete: 512,
      },
      database_path: '/var/lib/xrpld/db',
      debug_logfile: '/var/log/xrpld/debug.log',
      ssl_verify: '1',
      sntp_servers: ['pool.ntp.org'],
      peer_private: '0',
      fetch_depth: 'full',
      ledger_history: '256',
    };

    const textResult = generateXrpldConfig(textInput);
    const jsonResult = generateXrpldConfig(jsonInput);

    expect(textResult.config).toBe(jsonResult.config);
    expect(textResult.validatorsTxt).toBe(jsonResult.validatorsTxt);
  });
});

// #endregion

// #region Validation Error Cases

describe('validation catches intentionally bad configs', () => {
  it('rejects invalid port number', () => {
    expect(() =>
      generateXrpldConfig({
        presets: { network: 'mainnet' },
        server: {
          ports: [{ name: 'port_peer', port: 99999, ip: '0.0.0.0', protocol: 'peer' }],
        },
      }),
    ).toThrow('port number must be an integer between 1 and 65535');
  });

  it('rejects invalid node_db type', () => {
    expect(() =>
      generateXrpldConfig({
        presets: { network: 'mainnet' },
        node_db: { type: 'BadDB' as 'NuDB', path: '/data' },
      }),
    ).toThrow('node_db.type must be NuDB or RocksDB');
  });

  it('rejects mutually exclusive validation_seed and validator_token', () => {
    expect(() =>
      generateXrpldConfig({
        presets: { network: 'mainnet' },
        validation_seed: 'seed123',
        validator_token: 'token456',
      }),
    ).toThrow('mutually exclusive');
  });

  it('rejects missing node_db path', () => {
    expect(() =>
      generateXrpldConfig({
        presets: { network: 'mainnet' },
        node_db: { type: 'NuDB', path: '' },
      }),
    ).toThrow('node_db.path is required');
  });

  it('rejects invalid range for max_transactions', () => {
    expect(() =>
      generateXrpldConfig({
        presets: { network: 'mainnet' },
        max_transactions: 50,
      }),
    ).toThrow('max_transactions must be between 100 and 1000');
  });

  it('rejects online_delete < 256', () => {
    expect(() =>
      generateXrpldConfig({
        presets: { network: 'mainnet' },
        node_db: { type: 'NuDB', path: '/data', online_delete: 100 },
      }),
    ).toThrow('online_delete must be >= 256');
  });

  it('rejects duplicate port numbers', () => {
    expect(() =>
      generateXrpldConfig({
        presets: { network: 'mainnet' },
        server: {
          ports: [
            { name: 'port_a', port: 51235, ip: '0.0.0.0', protocol: 'peer' },
            { name: 'port_b', port: 51235, ip: '0.0.0.0', protocol: 'http' },
          ],
        },
      }),
    ).toThrow('duplicate port number');
  });

  it('rejects no peer port', () => {
    expect(() =>
      generateXrpldConfig({
        presets: { network: 'mainnet' },
        server: {
          ports: [
            { name: 'port_rpc', port: 5005, ip: '127.0.0.1', protocol: 'http' },
          ],
        },
      }),
    ).toThrow('No peer port defined');
  });

  it('rejects invalid node_size', () => {
    expect(() =>
      generateXrpldConfig({
        presets: { network: 'mainnet' },
        node_size: 'massive' as 'huge',
      }),
    ).toThrow('node_size must be one of');
  });
});

// #endregion

// #region Warnings Pass-through

describe('warnings pass through in generator result', () => {
  it('default config generates validator warning', () => {
    const result = generateXrpldConfig({ presets: { network: 'mainnet' } });
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings.some((w) => w.includes('validator'))).toBe(true);
  });

  it('config with validator_token has fewer warnings', () => {
    const withToken = generateXrpldConfig({
      presets: { network: 'mainnet' },
      validator_token: 'mytoken',
    });
    const withoutToken = generateXrpldConfig({ presets: { network: 'mainnet' } });
    expect(withToken.warnings.length).toBeLessThan(withoutToken.warnings.length);
  });

  it('ssl_verify=0 generates warning', () => {
    const result = generateXrpldConfig({
      presets: { network: 'mainnet' },
      ssl_verify: '0',
    });
    expect(result.warnings.some((w) => w.includes('ssl_verify'))).toBe(true);
  });
});

// #endregion
