import { describe, it, expect } from 'vitest';
import {
  parseEnvFile,
  parseJsonFile,
  validateXrpldInputs,
  getNetworkDefaults,
  resolveXrpldConfig,
  renderXrpldCfg,
} from '../index.js';

// #region Export verification

describe('config-gen index exports', () => {
  it('exports parseEnvFile', () => {
    expect(typeof parseEnvFile).toBe('function');
  });

  it('exports parseJsonFile', () => {
    expect(typeof parseJsonFile).toBe('function');
  });

  it('exports validateXrpldInputs', () => {
    expect(typeof validateXrpldInputs).toBe('function');
  });

  it('exports getNetworkDefaults', () => {
    expect(typeof getNetworkDefaults).toBe('function');
  });

  it('exports resolveXrpldConfig', () => {
    expect(typeof resolveXrpldConfig).toBe('function');
  });

  it('exports renderXrpldCfg', () => {
    expect(typeof renderXrpldCfg).toBe('function');
  });
});

// #endregion

// #region renderXrpldCfg via resolveXrpldConfig

describe('renderXrpldCfg via resolveXrpldConfig', () => {
  it('generates default config', () => {
    const config = resolveXrpldConfig({});
    const cfg = renderXrpldCfg(config);
    expect(typeof cfg).toBe('string');
    expect(cfg.length).toBeGreaterThan(0);
    expect(cfg).toContain('[server]');
  });

  it('generates config for each network', () => {
    for (const network of ['mainnet', 'testnet', 'devnet'] as const) {
      const config = resolveXrpldConfig({ network });
      const cfg = renderXrpldCfg(config);
      expect(cfg).toContain('[network_id]');
    }
  });
});

// #endregion
