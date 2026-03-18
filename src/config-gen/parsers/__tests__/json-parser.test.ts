import { describe, it, expect } from 'vitest';
import { parseJsonFile, JsonParseException } from '../json-parser.js';

describe('parseJsonFile', () => {
  it('parses flat key-value object', () => {
    const result = parseJsonFile('{"PORT_RPC": "5005", "NETWORK": "MAINNET"}');
    expect(result).toEqual({ PORT_RPC: '5005', NETWORK: 'MAINNET' });
  });

  it('flattens nested objects with underscore separator', () => {
    const result = parseJsonFile('{"ssl": {"certFile": "/path/cert.pem"}}');
    expect(result).toEqual({ SSL_CERT_FILE: '/path/cert.pem' });
  });

  it('converts camelCase keys to SCREAMING_SNAKE_CASE', () => {
    const result = parseJsonFile('{"portRpc": "5005", "sslGenerate": "1"}');
    expect(result).toEqual({ PORT_RPC: '5005', SSL_GENERATE: '1' });
  });

  it('preserves SCREAMING_SNAKE_CASE keys', () => {
    const result = parseJsonFile('{"PORT_RPC": "5005"}');
    expect(result).toEqual({ PORT_RPC: '5005' });
  });

  it('converts numeric values to strings', () => {
    const result = parseJsonFile('{"PORT_RPC": 5005}');
    expect(result).toEqual({ PORT_RPC: '5005' });
  });

  it('converts boolean values to strings', () => {
    const result = parseJsonFile('{"SSL_GENERATE": true}');
    expect(result).toEqual({ SSL_GENERATE: 'true' });
  });

  it('converts null to empty string', () => {
    const result = parseJsonFile('{"FOO": null}');
    expect(result).toEqual({ FOO: '' });
  });

  it('serializes arrays as JSON strings', () => {
    const result = parseJsonFile('{"PEERS": ["peer1", "peer2"]}');
    expect(result).toEqual({ PEERS: '["peer1","peer2"]' });
  });

  it('handles deeply nested objects', () => {
    const input = JSON.stringify({
      database: {
        cassandra: {
          host: 'localhost',
          port: 9042,
        },
      },
    });
    const result = parseJsonFile(input);
    expect(result).toEqual({
      DATABASE_CASSANDRA_HOST: 'localhost',
      DATABASE_CASSANDRA_PORT: '9042',
    });
  });

  it('handles empty object', () => {
    const result = parseJsonFile('{}');
    expect(result).toEqual({});
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

  it('handles mixed flat and nested input', () => {
    const input = JSON.stringify({
      NETWORK: 'MAINNET',
      ssl: {
        generate: '1',
        certCn: 'localhost',
      },
      PORT_PEER: '51235',
    });
    const result = parseJsonFile(input);
    expect(result).toEqual({
      NETWORK: 'MAINNET',
      SSL_GENERATE: '1',
      SSL_CERT_CN: 'localhost',
      PORT_PEER: '51235',
    });
  });
});
