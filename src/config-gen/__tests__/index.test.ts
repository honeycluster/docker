import { describe, it, expect } from 'vitest';
import {
  generateXrpldConfigFromInput,
  generateXrpldConfig,
  parseEnvFile,
  parseJsonFile,
  validateXrpldInputs,
} from '../index.js';

// #region Export verification

describe('config-gen index exports', () => {
  it('exports generateXrpldConfigFromInput', () => {
    expect(typeof generateXrpldConfigFromInput).toBe('function');
  });

  it('exports generateXrpldConfig', () => {
    expect(typeof generateXrpldConfig).toBe('function');
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

// #region Input merging edge cases

describe('input merging', () => {
  it('works with only env input', () => {
    const result = generateXrpldConfigFromInput({
      env: 'NETWORK=TESTNET',
    });
    expect(result.config).toContain('network_id');
  });

  it('works with empty input object', () => {
    const result = generateXrpldConfigFromInput({});
    expect(result.config.length).toBeGreaterThan(0);
  });
});

// #endregion
