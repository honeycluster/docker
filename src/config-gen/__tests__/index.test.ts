import { describe, it, expect } from 'vitest';
import {
  generateXrpldConfigFromInput,
  generateClioConfigFromInput,
  generateXrpldConfig,
  generateClioConfig,
  parseEnvFile,
  parseJsonFile,
  validateXrpldInputs,
  validateClioInputs,
} from '../index.js';

// #region Export verification

describe('config-gen index exports', () => {
  it('exports generateXrpldConfigFromInput', () => {
    expect(typeof generateXrpldConfigFromInput).toBe('function');
  });

  it('exports generateClioConfigFromInput', () => {
    expect(typeof generateClioConfigFromInput).toBe('function');
  });

  it('exports generateXrpldConfig', () => {
    expect(typeof generateXrpldConfig).toBe('function');
  });

  it('exports generateClioConfig', () => {
    expect(typeof generateClioConfig).toBe('function');
  });

  it('exports parseEnvFile', () => {
    expect(typeof parseEnvFile).toBe('function');
  });

  it('exports parseJsonFile', () => {
    expect(typeof parseJsonFile).toBe('function');
  });

  it('exports validateXrpldInputs', () => {
    expect(typeof validateXrpldInputs).toBe('function');
  });

  it('exports validateClioInputs', () => {
    expect(typeof validateClioInputs).toBe('function');
  });
});

// #endregion

// #region generateXrpldConfigFromInput

describe('generateXrpldConfigFromInput', () => {
  it('generates default config with no input', () => {
    const result = generateXrpldConfigFromInput();
    expect(result).toHaveProperty('config');
    expect(result).toHaveProperty('warnings');
    expect(typeof result.config).toBe('string');
    expect(Array.isArray(result.warnings)).toBe(true);
    expect(result.config.length).toBeGreaterThan(0);
  });

  it('accepts overrides directly', () => {
    const result = generateXrpldConfigFromInput({
      overrides: { PORT_PEER: '51235' },
    });
    expect(result.config).toContain('port = 51235');
  });

  it('accepts .env content string', () => {
    const envContent = 'PORT_PEER=51235\nNETWORK=TESTNET';
    const result = generateXrpldConfigFromInput({ env: envContent });
    expect(result.config).toContain('port = 51235');
  });

  it('accepts JSON content string', () => {
    const jsonContent = JSON.stringify({ PORT_PEER: '51235' });
    const result = generateXrpldConfigFromInput({ json: jsonContent });
    expect(result.config).toContain('port = 51235');
  });

  it('JSON overrides env values', () => {
    const envContent = 'PORT_PEER=11111';
    const jsonContent = JSON.stringify({ PORT_PEER: '22222' });
    const result = generateXrpldConfigFromInput({
      env: envContent,
      json: jsonContent,
    });
    expect(result.config).toContain('port = 22222');
  });

  it('overrides take highest priority', () => {
    const envContent = 'PORT_PEER=11111';
    const jsonContent = JSON.stringify({ PORT_PEER: '22222' });
    const result = generateXrpldConfigFromInput({
      env: envContent,
      json: jsonContent,
      overrides: { PORT_PEER: '33333' },
    });
    expect(result.config).toContain('port = 33333');
  });

  it('throws on invalid input', () => {
    expect(() =>
      generateXrpldConfigFromInput({
        overrides: { PORT_PEER: 'not-a-number' },
      }),
    ).toThrow('validation failed');
  });

  it('returns warnings array', () => {
    const result = generateXrpldConfigFromInput();
    expect(Array.isArray(result.warnings)).toBe(true);
  });
});

// #endregion

// #region generateClioConfigFromInput

describe('generateClioConfigFromInput', () => {
  it('generates default config with no input', () => {
    const result = generateClioConfigFromInput();
    expect(result).toHaveProperty('config');
    expect(result).toHaveProperty('warnings');
    expect(typeof result.config).toBe('string');
    expect(result.config.length).toBeGreaterThan(0);
    // Should be valid JSON
    expect(() => JSON.parse(result.config)).not.toThrow();
  });

  it('accepts overrides directly', () => {
    const result = generateClioConfigFromInput({
      overrides: { SERVER_PORT: '51233' },
    });
    const parsed = JSON.parse(result.config);
    expect(parsed.server.port).toBe(51233);
  });

  it('accepts .env content string', () => {
    const envContent = 'SERVER_PORT=51233';
    const result = generateClioConfigFromInput({ env: envContent });
    const parsed = JSON.parse(result.config);
    expect(parsed.server.port).toBe(51233);
  });

  it('accepts JSON content string', () => {
    const jsonContent = JSON.stringify({ SERVER_PORT: '51233' });
    const result = generateClioConfigFromInput({ json: jsonContent });
    const parsed = JSON.parse(result.config);
    expect(parsed.server.port).toBe(51233);
  });

  it('JSON overrides env values', () => {
    const envContent = 'SERVER_PORT=11111';
    const jsonContent = JSON.stringify({ SERVER_PORT: '22222' });
    const result = generateClioConfigFromInput({
      env: envContent,
      json: jsonContent,
    });
    const parsed = JSON.parse(result.config);
    expect(parsed.server.port).toBe(22222);
  });

  it('overrides take highest priority', () => {
    const result = generateClioConfigFromInput({
      env: 'SERVER_PORT=11111',
      json: JSON.stringify({ SERVER_PORT: '22222' }),
      overrides: { SERVER_PORT: '33333' },
    });
    const parsed = JSON.parse(result.config);
    expect(parsed.server.port).toBe(33333);
  });

  it('throws on invalid input', () => {
    expect(() =>
      generateClioConfigFromInput({
        overrides: { SERVER_PORT: 'bad' },
      }),
    ).toThrow('validation failed');
  });
});

// #endregion

// #region Input merging edge cases

describe('input merging', () => {
  it('works with only env input', () => {
    const result = generateXrpldConfigFromInput({
      env: 'NETWORK=TESTNET',
    });
    expect(result.config).toContain('network_id');
  });

  it('works with only json input', () => {
    const result = generateClioConfigFromInput({
      json: JSON.stringify({ LOG_LEVEL: 'debug' }),
    });
    const parsed = JSON.parse(result.config);
    expect(parsed.log.level).toBe('debug');
  });

  it('works with only overrides input', () => {
    const result = generateClioConfigFromInput({
      overrides: { LOG_LEVEL: 'error' },
    });
    const parsed = JSON.parse(result.config);
    expect(parsed.log.level).toBe('error');
  });

  it('works with empty input object', () => {
    const result = generateXrpldConfigFromInput({});
    expect(result.config.length).toBeGreaterThan(0);
  });
});

// #endregion
