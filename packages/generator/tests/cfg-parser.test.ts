import { describe, it, expect } from 'vitest';
import { parseCfgFile } from '../src/parsers/cfg-parser.js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('parseCfgFile', () => {
  describe('single-value sections', () => {
    it('parses a single-value string section', () => {
      const cfg = `[database_path]\n/var/lib/rippled/db\n`;
      const result = parseCfgFile(cfg);
      expect(result.database_path).toBe('/var/lib/rippled/db');
    });

    it('parses a single-value numeric section as number', () => {
      const cfg = `[ssl_verify]\n1\n`;
      const result = parseCfgFile(cfg);
      expect(result.ssl_verify).toBe(1);
    });

    it('parses debug_logfile', () => {
      const cfg = `[debug_logfile]\n/var/log/rippled/debug.log\n`;
      const result = parseCfgFile(cfg);
      expect(result.debug_logfile).toBe('/var/log/rippled/debug.log');
    });

    it('parses validators_file', () => {
      const cfg = `[validators_file]\nvalidators.txt\n`;
      const result = parseCfgFile(cfg);
      expect(result.validators_file).toBe('validators.txt');
    });

    it('parses node_size', () => {
      const cfg = `[node_size]\nmedium\n`;
      const result = parseCfgFile(cfg);
      expect(result.node_size).toBe('medium');
    });

    it('parses ledger_history', () => {
      const cfg = `[ledger_history]\nfull\n`;
      const result = parseCfgFile(cfg);
      expect(result.ledger_history).toBe('full');
    });

    it('parses network_id', () => {
      const cfg = `[network_id]\n0\n`;
      const result = parseCfgFile(cfg);
      expect(result.network_id).toBe(0);
    });
  });

  describe('key-value sections', () => {
    it('parses node_db key-value pairs', () => {
      const cfg = `[node_db]\ntype=NuDB\npath=/var/lib/rippled/db/nudb\nonline_delete=512\nadvisory_delete=0\n`;
      const result = parseCfgFile(cfg);
      expect(result.node_db).toEqual({
        type: 'NuDB',
        path: '/var/lib/rippled/db/nudb',
        online_delete: 512,
        advisory_delete: 0,
      });
    });

    it('parses key=value with spaces around equals', () => {
      const cfg = `[node_db]\ntype = NuDB\npath = /var/lib/rippled/db/nudb\n`;
      const result = parseCfgFile(cfg);
      expect(result.node_db).toEqual({
        type: 'NuDB',
        path: '/var/lib/rippled/db/nudb',
      });
    });

    it('parses overlay section', () => {
      const cfg = `[overlay]\nip_limit=5\nmax_unknown_time=300\n`;
      const result = parseCfgFile(cfg);
      expect(result.overlay).toEqual({
        ip_limit: 5,
        max_unknown_time: 300,
      });
    });

    it('parses transaction_queue section', () => {
      const cfg = `[transaction_queue]\nledgers_in_queue=20\nminimum_queue_size=10\n`;
      const result = parseCfgFile(cfg);
      expect(result.transaction_queue).toEqual({
        ledgers_in_queue: 20,
        minimum_queue_size: 10,
      });
    });

    it('parses voting section', () => {
      const cfg = `[voting]\nreference_fee=10\naccount_reserve=10000000\nowner_reserve=2000000\n`;
      const result = parseCfgFile(cfg);
      expect(result.voting).toEqual({
        reference_fee: 10,
        account_reserve: 10000000,
        owner_reserve: 2000000,
      });
    });

    it('parses crawl section', () => {
      const cfg = `[crawl]\noverlay=1\nserver=1\ncounts=0\nunl=1\n`;
      const result = parseCfgFile(cfg);
      expect(result.crawl).toEqual({
        overlay: 1,
        server: 1,
        counts: 0,
        unl: 1,
      });
    });

    it('parses vl section', () => {
      const cfg = `[vl]\nvalidator_list_sites=https://vl.ripple.com\nvalidator_list_keys=ED2677ABFFD1B33AC6FBC3062B71F1E8397C1505E1C42C64D11AD1B28FF73F4734\n`;
      const result = parseCfgFile(cfg);
      expect(result.vl).toEqual({
        validator_list_sites: 'https://vl.ripple.com',
        validator_list_keys: 'ED2677ABFFD1B33AC6FBC3062B71F1E8397C1505E1C42C64D11AD1B28FF73F4734',
      });
    });
  });

  describe('list sections', () => {
    it('parses sntp_servers list', () => {
      const cfg = `[sntp_servers]\npool.ntp.org\ntime.google.com\n`;
      const result = parseCfgFile(cfg);
      expect(result.sntp_servers).toEqual(['pool.ntp.org', 'time.google.com']);
    });

    it('parses ips list', () => {
      const cfg = `[ips]\nr.ripple.com 51235\ns.altnet.rippletest.net 51235\n`;
      const result = parseCfgFile(cfg);
      expect(result.ips).toEqual([
        'r.ripple.com 51235',
        's.altnet.rippletest.net 51235',
      ]);
    });

    it('parses ips_fixed list', () => {
      const cfg = `[ips_fixed]\n192.168.1.1 51235\n10.0.0.1 51235\n`;
      const result = parseCfgFile(cfg);
      expect(result.ips_fixed).toEqual([
        '192.168.1.1 51235',
        '10.0.0.1 51235',
      ]);
    });

    it('parses rpc_startup with JSON objects', () => {
      const cfg = `[rpc_startup]\n{ "command": "log_level", "severity": "warning" }\n`;
      const result = parseCfgFile(cfg);
      expect(result.rpc_startup).toEqual([
        { command: 'log_level', severity: 'warning' },
      ]);
    });

    it('parses cluster_nodes list', () => {
      const cfg = `[cluster_nodes]\nnGJk7YjKzByCiA2uJ3B5VMBzt2ST3FFQzLP1S7h2xyGPHRBBLjp3\nnHBe4vg96CaN4MiiG4HhzmioEeGEjBiuam3Z9PSkcRMiJeXqD6mR\n`;
      const result = parseCfgFile(cfg);
      expect(result.cluster_nodes).toEqual([
        'nGJk7YjKzByCiA2uJ3B5VMBzt2ST3FFQzLP1S7h2xyGPHRBBLjp3',
        'nHBe4vg96CaN4MiiG4HhzmioEeGEjBiuam3Z9PSkcRMiJeXqD6mR',
      ]);
    });

    it('parses amendments list', () => {
      const cfg = `[amendments]\n42426C4D4F1009EE67080A9B7965B44656D7714D104A72F9B4369F97ABF044EE\nDA1BD556B42D85EA9C84066D028D7DCD6E8EECE8\n`;
      const result = parseCfgFile(cfg);
      expect(result.amendments).toEqual([
        '42426C4D4F1009EE67080A9B7965B44656D7714D104A72F9B4369F97ABF044EE',
        'DA1BD556B42D85EA9C84066D028D7DCD6E8EECE8',
      ]);
    });

    it('parses veto_amendments list', () => {
      const cfg = `[veto_amendments]\nC4483A1896170C66C098DEA5B0E024309C60DC960DE5F01A2C462B03A1B29EE6\n`;
      const result = parseCfgFile(cfg);
      expect(result.veto_amendments).toEqual([
        'C4483A1896170C66C098DEA5B0E024309C60DC960DE5F01A2C462B03A1B29EE6',
      ]);
    });
  });

  describe('port section parsing', () => {
    it('parses [server] section and port definitions', () => {
      const cfg = `[server]
port_peer
port_rpc

[port_peer]
port = 51235
ip = 0.0.0.0
protocol = peer

[port_rpc]
port = 5005
ip = 127.0.0.1
admin = 127.0.0.1
protocol = http
`;
      const result = parseCfgFile(cfg);
      expect(result.server).toBeDefined();
      expect(result.server!.ports).toHaveLength(2);

      const peer = result.server!.ports[0];
      expect(peer.name).toBe('port_peer');
      expect(peer.port).toBe(51235);
      expect(peer.ip).toBe('0.0.0.0');
      expect(peer.protocol).toBe('peer');

      const rpc = result.server!.ports[1];
      expect(rpc.name).toBe('port_rpc');
      expect(rpc.port).toBe(5005);
      expect(rpc.ip).toBe('127.0.0.1');
      expect(rpc.admin).toBe('127.0.0.1');
      expect(rpc.protocol).toBe('http');
    });

    it('parses port with send_queue_limit', () => {
      const cfg = `[server]
port_ws

[port_ws]
port = 6006
ip = 127.0.0.1
admin = 127.0.0.1
protocol = ws
send_queue_limit = 500
`;
      const result = parseCfgFile(cfg);
      const ws = result.server!.ports[0];
      expect(ws.name).toBe('port_ws');
      expect((ws as unknown as Record<string, unknown>).send_queue_limit).toBe(500);
    });

    it('parses port with secure_gateway', () => {
      const cfg = `[server]
port_grpc

[port_grpc]
port = 50051
ip = 127.0.0.1
secure_gateway = 127.0.0.1
`;
      const result = parseCfgFile(cfg);
      const grpc = result.server!.ports[0];
      expect(grpc.name).toBe('port_grpc');
      expect(grpc.port).toBe(50051);
      expect(grpc.secure_gateway).toBe('127.0.0.1');
    });
  });

  describe('comment and whitespace handling', () => {
    it('ignores comment lines', () => {
      const cfg = `# This is a comment
[database_path]
# Another comment
/var/lib/rippled/db
# Trailing comment
`;
      const result = parseCfgFile(cfg);
      expect(result.database_path).toBe('/var/lib/rippled/db');
    });

    it('ignores blank lines', () => {
      const cfg = `

[database_path]

/var/lib/rippled/db

[ssl_verify]

1

`;
      const result = parseCfgFile(cfg);
      expect(result.database_path).toBe('/var/lib/rippled/db');
      expect(result.ssl_verify).toBe(1);
    });

    it('handles empty input', () => {
      const result = parseCfgFile('');
      expect(result).toEqual({});
    });

    it('handles input with only comments', () => {
      const result = parseCfgFile('# Just comments\n# Nothing here\n');
      expect(result).toEqual({});
    });
  });

  describe('multi-section cfg', () => {
    it('parses a complete multi-section config', () => {
      const cfg = `[server]
port_rpc_admin_local
port_peer
port_ws_admin_local

[port_rpc_admin_local]
port = 5005
ip = 127.0.0.1
admin = 127.0.0.1
protocol = http

[port_peer]
port = 51235
ip = 0.0.0.0
protocol = peer

[port_ws_admin_local]
port = 6006
ip = 127.0.0.1
admin = 127.0.0.1
protocol = ws

[node_db]
type=NuDB
path=/var/lib/rippled/db/nudb
online_delete=512
advisory_delete=0

[database_path]
/var/lib/rippled/db

[debug_logfile]
/var/log/rippled/debug.log

[validators_file]
validators.txt

[rpc_startup]
{ "command": "log_level", "severity": "warning" }

[ssl_verify]
1

[sntp_servers]
pool.ntp.org
time.google.com
`;
      const result = parseCfgFile(cfg);

      // Server/ports
      expect(result.server!.ports).toHaveLength(3);
      expect(result.server!.ports[0].name).toBe('port_rpc_admin_local');
      expect(result.server!.ports[1].name).toBe('port_peer');
      expect(result.server!.ports[2].name).toBe('port_ws_admin_local');

      // node_db
      expect(result.node_db).toEqual({
        type: 'NuDB',
        path: '/var/lib/rippled/db/nudb',
        online_delete: 512,
        advisory_delete: 0,
      });

      // Single values
      expect(result.database_path).toBe('/var/lib/rippled/db');
      expect(result.debug_logfile).toBe('/var/log/rippled/debug.log');
      expect(result.validators_file).toBe('validators.txt');
      expect(result.ssl_verify).toBe(1);

      // Lists
      expect(result.rpc_startup).toEqual([
        { command: 'log_level', severity: 'warning' },
      ]);
      expect(result.sntp_servers).toEqual(['pool.ntp.org', 'time.google.com']);
    });
  });

  describe('integration: example cfg file', () => {
    it('parses the xrpld-example.cfg file correctly', () => {
      const cfgPath = resolve(
        import.meta.dirname ?? __dirname,
        '../../../examples/rippled/cfg/xrpld-example.cfg',
      );
      const content = readFileSync(cfgPath, 'utf-8');
      const result = parseCfgFile(content);

      // Server section
      expect(result.server).toBeDefined();
      expect(result.server!.ports.length).toBeGreaterThanOrEqual(3);

      // Port names should include these
      const portNames = result.server!.ports.map((p) => p.name);
      expect(portNames).toContain('port_rpc_admin_local');
      expect(portNames).toContain('port_peer');
      expect(portNames).toContain('port_ws_admin_local');

      // port_peer
      const peerPort = result.server!.ports.find((p) => p.name === 'port_peer');
      expect(peerPort).toBeDefined();
      expect(peerPort!.port).toBe(51235);
      expect(peerPort!.ip).toBe('0.0.0.0');
      expect(peerPort!.protocol).toBe('peer');

      // port_rpc_admin_local
      const rpcPort = result.server!.ports.find((p) => p.name === 'port_rpc_admin_local');
      expect(rpcPort).toBeDefined();
      expect(rpcPort!.port).toBe(5005);
      expect(rpcPort!.admin).toBe('127.0.0.1');

      // node_db
      expect(result.node_db).toBeDefined();
      expect(result.node_db!.type).toBe('NuDB');
      expect(result.node_db!.path).toBe('/var/lib/xrpld/db/nudb');
      expect(result.node_db!.online_delete).toBe(512);

      // Single-value sections
      expect(result.database_path).toBe('/var/lib/xrpld/db');
      expect(result.debug_logfile).toBe('/var/log/xrpld/debug.log');
      expect(result.validators_file).toBe('validators.txt');
      expect(result.ssl_verify).toBe(1);

      // rpc_startup
      expect(result.rpc_startup).toBeDefined();
      expect(result.rpc_startup!.length).toBeGreaterThanOrEqual(1);
      expect(result.rpc_startup![0]).toEqual({
        command: 'log_level',
        severity: 'warning',
      });
    });
  });
});
