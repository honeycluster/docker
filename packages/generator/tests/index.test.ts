import { describe, it, expect } from 'vitest';
import {
  generateXrpldConfig,
  parseCfgFile,
  parseTextFile,
  parseJsonFile,
  validateXrpldConfig,
  getNetworkDefaults,
  resolveXrpldConfig,
} from '../src/index.js';

// #region -- Export verification ----------------------

describe('config-gen index exports', () => {
  it('exports generateXrpldConfig', () => {
    expect(typeof generateXrpldConfig).toBe('function');
  });

  it('exports parseCfgFile', () => {
    expect(typeof parseCfgFile).toBe('function');
  });

  it('exports parseTextFile', () => {
    expect(typeof parseTextFile).toBe('function');
  });

  it('exports parseJsonFile', () => {
    expect(typeof parseJsonFile).toBe('function');
  });

  it('exports validateXrpldConfig', () => {
    expect(typeof validateXrpldConfig).toBe('function');
  });

  it('exports getNetworkDefaults', () => {
    expect(typeof getNetworkDefaults).toBe('function');
  });

  it('exports resolveXrpldConfig', () => {
    expect(typeof resolveXrpldConfig).toBe('function');
  });
});

// #endregion -- Export verification -------------------

// #region -- generateXrpldConfig smoke test -----------

describe('generateXrpldConfig smoke test', () => {
  it('generates default config', () => {
    const result = generateXrpldConfig({});
    expect(typeof result.config).toBe('string');
    expect(result.config.length).toBeGreaterThan(0);
    expect(result.config).toContain('[server]');
    expect(typeof result.validatorsTxt).toBe('string');
    expect(Array.isArray(result.warnings)).toBe(true);
  });

  it('generates config for each network', () => {
    for (const network of ['mainnet', 'testnet', 'devnet'] as const) {
      const result = generateXrpldConfig({ presets: { network } });
      expect(result.config).toContain('[network_id]');
    }
  });
});

// #endregion -- generateXrpldConfig smoke test --------
