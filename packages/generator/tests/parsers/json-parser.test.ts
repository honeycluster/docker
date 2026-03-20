import { describe, it, expect } from 'vitest';
import { parseJsonFile, JsonParseException } from '../../src/parsers/json-parser.js';

describe('parseJsonFile', () => {
  it('parses nested structure directly', () => {
    const input = JSON.stringify({
      network: 'mainnet',
      node_db: { type: 'NuDB', path: '/var/lib/xrpld/db/nudb' },
    });
    const result = parseJsonFile(input);
    expect(result).toEqual({
      network: 'mainnet',
      node_db: { type: 'NuDB', path: '/var/lib/xrpld/db/nudb' },
    });
  });

  it('preserves arrays as-is', () => {
    const input = JSON.stringify({
      sntp_servers: ['pool.ntp.org', 'time.google.com'],
    });
    const result = parseJsonFile(input);
    expect(result.sntp_servers).toEqual(['pool.ntp.org', 'time.google.com']);
  });

  it('preserves server with ports array', () => {
    const input = JSON.stringify({
      server: {
        ports: [
          { name: 'port_peer', port: 51235, ip: '0.0.0.0', protocol: 'peer' },
        ],
      },
    });
    const result = parseJsonFile(input);
    expect(result.server?.ports).toHaveLength(1);
    expect(result.server?.ports[0].name).toBe('port_peer');
  });

  it('preserves numeric values', () => {
    const result = parseJsonFile('{"workers": 4, "fee_default": 10}');
    expect(result.workers).toBe(4);
    expect(result.fee_default).toBe(10);
  });

  it('preserves string values', () => {
    const result = parseJsonFile('{"ssl_verify": "1", "node_size": "medium"}');
    expect(result.ssl_verify).toBe('1');
    expect(result.node_size).toBe('medium');
  });

  it('handles empty object', () => {
    const result = parseJsonFile('{}');
    expect(result).toEqual({});
  });

  it('preserves nested key-value sections', () => {
    const input = JSON.stringify({
      overlay: { ip_limit: 5, connect_timeout: 30 },
      voting: { reference_fee: 10, account_reserve: 10000000 },
    });
    const result = parseJsonFile(input);
    expect(result.overlay?.ip_limit).toBe(5);
    expect(result.voting?.reference_fee).toBe(10);
  });

  it('preserves vl config', () => {
    const input = JSON.stringify({
      vl: {
        validator_list_sites: ['https://vl.ripple.com'],
        validator_list_keys: ['ED2677ABFFD1B33AC6FBC3062B71F1E8397C1505E1C42C64D11AD1B28FF73F4734'],
      },
    });
    const result = parseJsonFile(input);
    expect(result.vl?.validator_list_sites).toEqual(['https://vl.ripple.com']);
  });

  it('throws on invalid JSON', () => {
    expect(() => parseJsonFile('{bad json}')).toThrow(JsonParseException);
    expect(() => parseJsonFile('{bad json}')).toThrow('Invalid JSON');
  });

  it('throws on JSON array at root', () => {
    expect(() => parseJsonFile('[1, 2, 3]')).toThrow(JsonParseException);
    expect(() => parseJsonFile('[1, 2, 3]')).toThrow('Expected a JSON object at root');
  });

  it('throws on primitive JSON at root', () => {
    expect(() => parseJsonFile('"just a string"')).toThrow(JsonParseException);
    expect(() => parseJsonFile('"just a string"')).toThrow('Expected a JSON object at root');
  });

  it('throws on null JSON at root', () => {
    expect(() => parseJsonFile('null')).toThrow(JsonParseException);
  });
});
