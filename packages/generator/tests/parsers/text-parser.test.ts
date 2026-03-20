import { describe, it, expect } from 'vitest';
import { parseTextFile, TextParseException } from '../../src/parsers/env-parser.js';
import { parseJsonFile } from '../../src/parsers/json-parser.js';

describe('parseTextFile', () => {
  // #region -- Single-value keys -----------------------

  describe('single-value keys', () => {
    it('parses NETWORK meta-field', () => {
      const result = parseTextFile('NETWORK=mainnet');
      expect(result.presets?.network).toBe('mainnet');
    });

    it('parses PRESET_NETWORK as alias for NETWORK', () => {
      const result = parseTextFile('PRESET_NETWORK=testnet');
      expect(result.presets?.network).toBe('testnet');
    });

    it('parses PRESET_ROLE to presets.role', () => {
      const result = parseTextFile('PRESET_ROLE=validator');
      expect(result.presets?.role).toBe('validator');
    });

    it('parses PRESET_SIZE to presets.size', () => {
      const result = parseTextFile('PRESET_SIZE=large');
      expect(result.presets?.size).toBe('large');
    });

    it('parses PRESET_VERBOSITY to presets.verbosity', () => {
      const result = parseTextFile('PRESET_VERBOSITY=debug');
      expect(result.presets?.verbosity).toBe('debug');
    });

    it('parses all PRESET_* keys together', () => {
      const result = parseTextFile([
        'PRESET_NETWORK=testnet',
        'PRESET_ROLE=validator',
        'PRESET_SIZE=large',
        'PRESET_VERBOSITY=info',
      ].join('\n'));
      expect(result.presets).toEqual({
        network: 'testnet',
        role: 'validator',
        size: 'large',
        verbosity: 'info',
      });
    });

    it('NETWORK backwards compat maps to presets.network', () => {
      const result = parseTextFile('NETWORK=mainnet');
      expect(result.presets?.network).toBe('mainnet');
    });

    it('parses top-level string fields', () => {
      const result = parseTextFile([
        'NETWORK_ID=0',
        'DEBUG_LOGFILE=/var/log/debug.log',
        'SSL_VERIFY=1',
        'NODE_SIZE=medium',
        'DATABASE_PATH=/var/lib/xrpld/db',
      ].join('\n'));
      expect(result.network_id).toBe('0');
      expect(result.debug_logfile).toBe('/var/log/debug.log');
      expect(result.ssl_verify).toBe('1');
      expect(result.node_size).toBe('medium');
      expect(result.database_path).toBe('/var/lib/xrpld/db');
    });

    it('parses numeric fields as numbers', () => {
      const result = parseTextFile([
        'WORKERS=4',
        'IO_WORKERS=2',
        'FEE_DEFAULT=10',
        'SWEEP_INTERVAL=60',
      ].join('\n'));
      expect(result.workers).toBe(4);
      expect(result.io_workers).toBe(2);
      expect(result.fee_default).toBe(10);
      expect(result.sweep_interval).toBe(60);
    });
  });

  // #endregion -- Single-value keys --------------------

  // #region -- Nested key-value keys ------------------

  describe('nested key-value mapping', () => {
    it('parses NODE_DB_* to node_db nested object', () => {
      const result = parseTextFile([
        'NODE_DB_TYPE=NuDB',
        'NODE_DB_PATH=/var/lib/xrpld/db/nudb',
        'NODE_DB_ONLINE_DELETE=512',
      ].join('\n'));
      expect(result.node_db).toEqual({
        type: 'NuDB',
        path: '/var/lib/xrpld/db/nudb',
        online_delete: 512,
      });
    });

    it('parses OVERLAY_* to overlay nested object', () => {
      const result = parseTextFile([
        'OVERLAY_IP_LIMIT=5',
        'OVERLAY_CONNECT_TIMEOUT=30',
      ].join('\n'));
      expect(result.overlay).toEqual({
        ip_limit: 5,
        connect_timeout: 30,
      });
    });

    it('parses VOTING_* to voting nested object', () => {
      const result = parseTextFile([
        'VOTING_REFERENCE_FEE=10',
        'VOTING_ACCOUNT_RESERVE=10000000',
        'VOTING_OWNER_RESERVE=2000000',
      ].join('\n'));
      expect(result.voting).toEqual({
        reference_fee: 10,
        account_reserve: 10000000,
        owner_reserve: 2000000,
      });
    });

    it('parses TRANSACTION_QUEUE_* to transaction_queue nested object', () => {
      const result = parseTextFile([
        'TRANSACTION_QUEUE_LEDGERS_IN_QUEUE=20',
        'TRANSACTION_QUEUE_MINIMUM_QUEUE_SIZE=5',
      ].join('\n'));
      expect(result.transaction_queue).toEqual({
        ledgers_in_queue: 20,
        minimum_queue_size: 5,
      });
    });

    it('parses CRAWL_* to crawl nested object', () => {
      const result = parseTextFile([
        'CRAWL_OVERLAY=1',
        'CRAWL_SERVER=1',
      ].join('\n'));
      expect(result.crawl).toEqual({
        overlay: 1,
        server: 1,
      });
    });

    it('parses REDUCE_RELAY_* to reduce_relay nested object', () => {
      const result = parseTextFile([
        'REDUCE_RELAY_VP_ENABLE=1',
        'REDUCE_RELAY_TX_LIMIT=200',
      ].join('\n'));
      expect(result.reduce_relay).toEqual({
        vp_enable: 1,
        tx_limit: 200,
      });
    });

    it('parses SQLITE_* to sqlite nested object', () => {
      const result = parseTextFile([
        'SQLITE_LEDGER_PAGE_SIZE=4096',
        'SQLITE_TRANSACTION_PAGE_SIZE=4096',
      ].join('\n'));
      expect(result.sqlite).toEqual({
        ledger_page_size: 4096,
        transaction_page_size: 4096,
      });
    });

    it('parses IMPORT_DB_* to import_db nested object', () => {
      const result = parseTextFile([
        'IMPORT_DB_TYPE=NuDB',
        'IMPORT_DB_PATH=/var/lib/xrpld/db/import',
      ].join('\n'));
      expect(result.import_db).toEqual({
        type: 'NuDB',
        path: '/var/lib/xrpld/db/import',
      });
    });

    it('parses INSIGHT_* to insight nested object', () => {
      const result = parseTextFile([
        'INSIGHT_SERVER=statsd',
        'INSIGHT_ADDRESS=127.0.0.1',
        'INSIGHT_PORT=8125',
      ].join('\n'));
      expect(result.insight).toEqual({
        server: 'statsd',
        address: '127.0.0.1',
        port: 8125,
      });
    });

    it('parses PERF_* to perf nested object', () => {
      const result = parseTextFile([
        'PERF_PEER_DISCONNECT_INTERVAL=60',
        'PERF_PEER_SIGNAL_INTERVAL=30',
      ].join('\n'));
      expect(result.perf).toEqual({
        peer_disconnect_interval: 60,
        peer_signal_interval: 30,
      });
    });
  });

  // #endregion -- Nested key-value keys ---------------

  // #region -- List keys ------------------------------

  describe('comma-separated lists', () => {
    it('parses SNTP_SERVERS as list', () => {
      const result = parseTextFile('SNTP_SERVERS=pool.ntp.org,time.google.com');
      expect(result.sntp_servers).toEqual(['pool.ntp.org', 'time.google.com']);
    });

    it('parses IPS as list', () => {
      const result = parseTextFile('IPS=r.ripple.com 51235,s1.ripple.com 51235');
      expect(result.ips).toEqual(['r.ripple.com 51235', 's1.ripple.com 51235']);
    });

    it('parses IPS_FIXED as list', () => {
      const result = parseTextFile('IPS_FIXED=10.0.0.1 51235');
      expect(result.ips_fixed).toEqual(['10.0.0.1 51235']);
    });

    it('parses CLUSTER_NODES as list', () => {
      const result = parseTextFile('CLUSTER_NODES=nHU123,nHU456');
      expect(result.cluster_nodes).toEqual(['nHU123', 'nHU456']);
    });

    it('parses AMENDMENTS as list', () => {
      const result = parseTextFile('AMENDMENTS=ABC123,DEF456');
      expect(result.amendments).toEqual(['ABC123', 'DEF456']);
    });

    it('parses VETO_AMENDMENTS as list', () => {
      const result = parseTextFile('VETO_AMENDMENTS=ABC123');
      expect(result.veto_amendments).toEqual(['ABC123']);
    });

    it('parses VL_VALIDATOR_LIST_SITES as nested list', () => {
      const result = parseTextFile('VL_VALIDATOR_LIST_SITES=https://vl.ripple.com,https://vl2.ripple.com');
      expect(result.vl?.validator_list_sites).toEqual(['https://vl.ripple.com', 'https://vl2.ripple.com']);
    });

    it('parses VL_VALIDATOR_LIST_KEYS as nested list', () => {
      const result = parseTextFile('VL_VALIDATOR_LIST_KEYS=ED2677ABC');
      expect(result.vl?.validator_list_keys).toEqual(['ED2677ABC']);
    });

    it('trims whitespace around comma-separated items', () => {
      const result = parseTextFile('SNTP_SERVERS=pool.ntp.org , time.google.com , time.aws.com');
      expect(result.sntp_servers).toEqual(['pool.ntp.org', 'time.google.com', 'time.aws.com']);
    });

    it('filters out empty items from lists', () => {
      const result = parseTextFile('SNTP_SERVERS=pool.ntp.org,,time.google.com,');
      expect(result.sntp_servers).toEqual(['pool.ntp.org', 'time.google.com']);
    });
  });

  // #endregion -- List keys ---------------------------

  // #region -- Port parsing ---------------------------

  describe('indexed port entries', () => {
    it('parses PORT_0_* as port config', () => {
      const result = parseTextFile([
        'PORT_0_NAME=port_peer',
        'PORT_0_PORT=51235',
        'PORT_0_IP=0.0.0.0',
        'PORT_0_PROTOCOL=peer',
      ].join('\n'));
      expect(result.server?.ports).toHaveLength(1);
      expect(result.server?.ports[0]).toEqual({
        name: 'port_peer',
        port: 51235,
        ip: '0.0.0.0',
        protocol: 'peer',
      });
    });

    it('parses multiple ports in order', () => {
      const result = parseTextFile([
        'PORT_0_NAME=port_peer',
        'PORT_0_PORT=51235',
        'PORT_0_PROTOCOL=peer',
        'PORT_1_NAME=port_rpc',
        'PORT_1_PORT=5005',
        'PORT_1_PROTOCOL=http',
        'PORT_1_ADMIN=127.0.0.1',
      ].join('\n'));
      expect(result.server?.ports).toHaveLength(2);
      expect(result.server?.ports[0].name).toBe('port_peer');
      expect(result.server?.ports[1].name).toBe('port_rpc');
      expect(result.server?.ports[1].admin).toBe('127.0.0.1');
    });

    it('parses numeric port fields as numbers', () => {
      const result = parseTextFile([
        'PORT_0_NAME=port_peer',
        'PORT_0_PORT=51235',
        'PORT_0_PROTOCOL=peer',
        'PORT_0_LIMIT=100',
        'PORT_0_SEND_QUEUE_LIMIT=1000',
      ].join('\n'));
      expect(result.server?.ports[0].port).toBe(51235);
      expect(result.server?.ports[0].limit).toBe(100);
      expect(result.server?.ports[0].send_queue_limit).toBe(1000);
    });

    it('sorts ports by index', () => {
      const result = parseTextFile([
        'PORT_2_NAME=port_ws',
        'PORT_2_PORT=6006',
        'PORT_2_PROTOCOL=ws',
        'PORT_0_NAME=port_peer',
        'PORT_0_PORT=51235',
        'PORT_0_PROTOCOL=peer',
      ].join('\n'));
      expect(result.server?.ports[0].name).toBe('port_peer');
      expect(result.server?.ports[1].name).toBe('port_ws');
    });
  });

  // #endregion -- Port parsing ------------------------

  // #region -- Comments and whitespace ----------------

  describe('comments and whitespace', () => {
    it('skips comment lines', () => {
      const result = parseTextFile([
        '# This is a comment',
        'NETWORK_ID=0',
        '# Another comment',
      ].join('\n'));
      expect(result.network_id).toBe('0');
    });

    it('skips blank lines', () => {
      const result = parseTextFile([
        'NETWORK_ID=0',
        '',
        '',
        'NODE_SIZE=medium',
      ].join('\n'));
      expect(result.network_id).toBe('0');
      expect(result.node_size).toBe('medium');
    });

    it('handles quoted values', () => {
      const result = parseTextFile('DEBUG_LOGFILE="/var/log/xrpld/debug.log"');
      expect(result.debug_logfile).toBe('/var/log/xrpld/debug.log');
    });

    it('strips inline comments from unquoted values', () => {
      const result = parseTextFile('NETWORK_ID=0 # mainnet');
      expect(result.network_id).toBe('0');
    });
  });

  // #endregion -- Comments and whitespace -------------

  // #region -- Error handling -------------------------

  describe('error handling', () => {
    it('throws on missing equals sign', () => {
      expect(() => parseTextFile('INVALID_LINE')).toThrow(TextParseException);
      expect(() => parseTextFile('INVALID_LINE')).toThrow('Line 1');
    });

    it('throws on empty variable name', () => {
      expect(() => parseTextFile('=value')).toThrow(TextParseException);
      expect(() => parseTextFile('=value')).toThrow('Line 1');
    });

    it('throws on lowercase keys', () => {
      expect(() => parseTextFile('lowercase=value')).toThrow(TextParseException);
      expect(() => parseTextFile('lowercase=value')).toThrow("Invalid variable name 'lowercase'");
    });

    it('throws on unknown keys', () => {
      expect(() => parseTextFile('UNKNOWN_KEY_XYZ=value')).toThrow(TextParseException);
      expect(() => parseTextFile('UNKNOWN_KEY_XYZ=value')).toThrow("Unknown key 'UNKNOWN_KEY_XYZ'");
    });

    it('reports correct line number for errors', () => {
      try {
        parseTextFile('NETWORK_ID=0\n\nBAD_LINE');
      } catch (e) {
        expect(e).toBeInstanceOf(TextParseException);
        expect((e as TextParseException).line).toBe(3);
      }
    });
  });

  // #endregion -- Error handling ----------------------

  // #region -- Equivalence with JSON ------------------

  describe('text file produces identical XrpldInput as equivalent JSON', () => {
    it('matches for a comprehensive config', () => {
      const textInput = [
        'NETWORK=mainnet',
        'NODE_DB_TYPE=NuDB',
        'NODE_DB_PATH=/var/lib/xrpld/db/nudb',
        'NODE_DB_ONLINE_DELETE=512',
        'DATABASE_PATH=/var/lib/xrpld/db',
        'DEBUG_LOGFILE=/var/log/xrpld/debug.log',
        'SSL_VERIFY=1',
        'NETWORK_ID=0',
        'NODE_SIZE=medium',
        'WORKERS=4',
        'SNTP_SERVERS=pool.ntp.org,time.google.com',
        'OVERLAY_IP_LIMIT=5',
        'VOTING_REFERENCE_FEE=10',
      ].join('\n');

      const jsonInput = JSON.stringify({
        presets: { network: 'mainnet' },
        node_db: { type: 'NuDB', path: '/var/lib/xrpld/db/nudb', online_delete: 512 },
        database_path: '/var/lib/xrpld/db',
        debug_logfile: '/var/log/xrpld/debug.log',
        ssl_verify: '1',
        network_id: '0',
        node_size: 'medium',
        workers: 4,
        sntp_servers: ['pool.ntp.org', 'time.google.com'],
        overlay: { ip_limit: 5 },
        voting: { reference_fee: 10 },
      });

      const textResult = parseTextFile(textInput);
      const jsonResult = parseJsonFile(jsonInput);

      expect(textResult).toEqual(jsonResult);
    });
  });

  // #endregion -- Equivalence with JSON ---------------

  // #region -- Complete file --------------------------

  describe('complete text file', () => {
    it('parses a full configuration file', () => {
      const content = [
        '# XRPLD Configuration',
        'NETWORK=mainnet',
        '',
        '# Database',
        'NODE_DB_TYPE=NuDB',
        'NODE_DB_PATH=/var/lib/xrpld/db/nudb',
        'NODE_DB_ONLINE_DELETE=512',
        'DATABASE_PATH=/var/lib/xrpld/db',
        '',
        '# Logging',
        'DEBUG_LOGFILE=/var/log/xrpld/debug.log',
        '',
        '# Network',
        'NETWORK_ID=0',
        'SSL_VERIFY=1',
        'NODE_SIZE=medium',
        'LEDGER_HISTORY=256',
        'FETCH_DEPTH=full',
        'PEER_PRIVATE=0',
        '',
        '# NTP',
        'SNTP_SERVERS=pool.ntp.org',
        '',
        '# Ports',
        'PORT_0_NAME=port_peer',
        'PORT_0_PORT=51235',
        'PORT_0_IP=0.0.0.0',
        'PORT_0_PROTOCOL=peer',
        'PORT_1_NAME=port_rpc',
        'PORT_1_PORT=5005',
        'PORT_1_IP=127.0.0.1',
        'PORT_1_PROTOCOL=http',
        'PORT_1_ADMIN=127.0.0.1',
        '',
        '# Validators',
        'VL_VALIDATOR_LIST_SITES=https://vl.ripple.com',
        'VL_VALIDATOR_LIST_KEYS=ED2677ABFFD1B33AC6FBC3062B71F1E8397C1505E1C42C64D11AD1B28FF73F4734',
      ].join('\n');

      const result = parseTextFile(content);

      expect(result.presets?.network).toBe('mainnet');
      expect(result.node_db?.type).toBe('NuDB');
      expect(result.node_db?.path).toBe('/var/lib/xrpld/db/nudb');
      expect(result.node_db?.online_delete).toBe(512);
      expect(result.database_path).toBe('/var/lib/xrpld/db');
      expect(result.debug_logfile).toBe('/var/log/xrpld/debug.log');
      expect(result.network_id).toBe('0');
      expect(result.ssl_verify).toBe('1');
      expect(result.node_size).toBe('medium');
      expect(result.ledger_history).toBe('256');
      expect(result.fetch_depth).toBe('full');
      expect(result.peer_private).toBe('0');
      expect(result.sntp_servers).toEqual(['pool.ntp.org']);
      expect(result.server?.ports).toHaveLength(2);
      expect(result.server?.ports[0].name).toBe('port_peer');
      expect(result.server?.ports[1].admin).toBe('127.0.0.1');
      expect(result.vl?.validator_list_sites).toEqual(['https://vl.ripple.com']);
      expect(result.vl?.validator_list_keys).toEqual(['ED2677ABFFD1B33AC6FBC3062B71F1E8397C1505E1C42C64D11AD1B28FF73F4734']);
    });
  });

  // #endregion -- Complete file -----------------------
});
