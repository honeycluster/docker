import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { generateXrpldConfig } from '../../generators/xrpld.js';
import { parseJsonFile } from '../../parsers/json-parser.js';
import {
  generateXrpldConfigFromInput,
} from '../../index.js';

// #region Helpers

const FIXTURES = new URL('./fixtures/', import.meta.url).pathname;
const EXPECTED = new URL('./expected/', import.meta.url).pathname;

function readFixture(name: string): string {
  return readFileSync(`${FIXTURES}${name}`, 'utf-8');
}

function readExpected(name: string): string {
  return readFileSync(`${EXPECTED}${name}`, 'utf-8');
}

function loadJson(name: string): Record<string, string> {
  return parseJsonFile(readFixture(name));
}

// #endregion

// #region xrpld Integration Tests

describe('xrpld integration tests', () => {
  it('generates default config (no overrides)', () => {
    const { config } = generateXrpldConfig({});
    const expected = readExpected('xrpld-default.cfg');
    expect(config).toBe(expected);
  });

  it('generates custom ports config from JSON', () => {
    const overrides = loadJson('xrpld-custom-ports.json');
    const { config } = generateXrpldConfig(overrides);
    const expected = readExpected('xrpld-custom-ports.cfg');
    expect(config).toBe(expected);

    // Verify custom port values
    expect(config).toContain('port = 41235');
    expect(config).toContain('port = 41234');
    expect(config).toContain('port = 4005');
    expect(config).toContain('port = 40051');
  });

  it('generates MAINNET config (default network)', () => {
    const { config } = generateXrpldConfig({ NETWORK: 'MAINNET' });
    expect(config).toContain('[network_id]\n0');
  });

  it('generates TESTNET config', () => {
    const { config } = generateXrpldConfig({ NETWORK: 'TESTNET' });
    expect(config).toContain('network_id]\ntestnet');
    expect(config).toContain('[ips]\ns.altnet.rippletest.net 51235');
  });

  it('generates DEVNET config', () => {
    const { config } = generateXrpldConfig({ NETWORK: 'DEVNET' });
    expect(config).toContain('network_id]\ndevnet');
    expect(config).toContain('[ips]\ns.devnet.rippletest.net 51235');
  });

  it('default config matches explicit MAINNET config', () => {
    const defaultResult = generateXrpldConfig({});
    const mainnetResult = generateXrpldConfig({ NETWORK: 'MAINNET' });
    expect(defaultResult.config).toBe(mainnetResult.config);
  });
});

// #endregion

// #region Programmatic API Integration Tests

describe('programmatic API integration tests', () => {
  it('generateXrpldConfigFromInput with JSON content matches direct generation', () => {
    const jsonContent = readFixture('xrpld-custom-ports.json');
    const fromInput = generateXrpldConfigFromInput({ json: jsonContent });
    const direct = generateXrpldConfig(loadJson('xrpld-custom-ports.json'));
    expect(fromInput.config).toBe(direct.config);
  });

  it('overrides take priority over env', () => {
    const result = generateXrpldConfigFromInput({
      env: 'NETWORK=TESTNET',
      overrides: { NETWORK: 'DEVNET' },
    });
    expect(result.config).toContain('network_id]\ndevnet');
  });
});

// #endregion
