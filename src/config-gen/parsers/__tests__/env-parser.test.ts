import { describe, it, expect } from 'vitest';
import { parseEnvFile, EnvParseException } from '../env-parser.js';

describe('parseEnvFile', () => {
  it('parses basic KEY=VALUE pairs', () => {
    const result = parseEnvFile('FOO=bar\nBAZ=qux');
    expect(result).toEqual({ FOO: 'bar', BAZ: 'qux' });
  });

  it('skips blank lines', () => {
    const result = parseEnvFile('FOO=bar\n\n\nBAZ=qux');
    expect(result).toEqual({ FOO: 'bar', BAZ: 'qux' });
  });

  it('skips comment lines', () => {
    const result = parseEnvFile('# This is a comment\nFOO=bar\n# Another comment');
    expect(result).toEqual({ FOO: 'bar' });
  });

  it('handles double-quoted values', () => {
    const result = parseEnvFile('FOO="hello world"');
    expect(result).toEqual({ FOO: 'hello world' });
  });

  it('handles single-quoted values', () => {
    const result = parseEnvFile("FOO='hello world'");
    expect(result).toEqual({ FOO: 'hello world' });
  });

  it('handles empty values', () => {
    const result = parseEnvFile('FOO=');
    expect(result).toEqual({ FOO: '' });
  });

  it('handles empty quoted values', () => {
    const result = parseEnvFile('FOO=""');
    expect(result).toEqual({ FOO: '' });
  });

  it('handles values with equals signs', () => {
    const result = parseEnvFile('FOO=bar=baz');
    expect(result).toEqual({ FOO: 'bar=baz' });
  });

  it('strips inline comments for unquoted values', () => {
    const result = parseEnvFile('FOO=bar # this is a comment');
    expect(result).toEqual({ FOO: 'bar' });
  });

  it('preserves hash in quoted values', () => {
    const result = parseEnvFile('FOO="bar # not a comment"');
    expect(result).toEqual({ FOO: 'bar # not a comment' });
  });

  it('handles values with spaces', () => {
    const result = parseEnvFile('FOO=hello world');
    expect(result).toEqual({ FOO: 'hello world' });
  });

  it('handles underscore-prefixed keys', () => {
    const result = parseEnvFile('_FOO=bar');
    expect(result).toEqual({ _FOO: 'bar' });
  });

  it('throws on missing equals sign', () => {
    expect(() => parseEnvFile('INVALID_LINE')).toThrow(EnvParseException);
    expect(() => parseEnvFile('INVALID_LINE')).toThrow('Line 1');
  });

  it('throws on empty variable name', () => {
    expect(() => parseEnvFile('=value')).toThrow(EnvParseException);
    expect(() => parseEnvFile('=value')).toThrow('Line 1');
  });

  it('throws on invalid variable name', () => {
    expect(() => parseEnvFile('123BAD=value')).toThrow(EnvParseException);
    expect(() => parseEnvFile('123BAD=value')).toThrow("Invalid variable name '123BAD'");
  });

  it('reports correct line number for errors', () => {
    try {
      parseEnvFile('GOOD=value\n\nBAD LINE');
    } catch (e) {
      expect(e).toBeInstanceOf(EnvParseException);
      expect((e as EnvParseException).line).toBe(3);
    }
  });

  it('handles a complete .env file', () => {
    const env = `
# Network config
NETWORK=MAINNET
PORT_PEER=51235
PORT_RPC=5005

# SSL
SSL_GENERATE=1
SSL_CERT_CN="localhost"
`;
    const result = parseEnvFile(env);
    expect(result).toEqual({
      NETWORK: 'MAINNET',
      PORT_PEER: '51235',
      PORT_RPC: '5005',
      SSL_GENERATE: '1',
      SSL_CERT_CN: 'localhost',
    });
  });
});
