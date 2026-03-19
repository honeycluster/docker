import { describe, it, expect } from 'vitest';
import { generateXrpldConfig, validateXrpldConfig } from '../generators/xrpld.js';
import { resolveXrpldConfig } from '../defaults/xrpld.js';

describe('generateXrpldConfig', () => {
  it('returns valid cfg and validators.txt for mainnet', () => {
    const result = generateXrpldConfig({ network: 'mainnet' });

    expect(result.config).toContain('[server]');
    expect(result.config).toContain('[node_db]');
    expect(result.config).toContain('[network_id]');
    expect(result.config).toContain('0');
    expect(result.validatorsTxt).toContain('[validator_list_sites]');
    expect(result.validatorsTxt).toContain('https://vl.ripple.com');
    expect(Array.isArray(result.warnings)).toBe(true);
  });

  it('returns valid cfg and validators.txt for testnet', () => {
    const result = generateXrpldConfig({ network: 'testnet' });

    expect(result.config).toContain('[network_id]');
    expect(result.config).toContain('1');
    expect(result.validatorsTxt).toContain('https://vl.altnet.rippletest.net');
    expect(result.validatorsTxt).toContain('ED264807102805220DA0F312E71FC2C69E1552C9C5790F6C25E3729DEB573D5860');
  });

  it('returns valid cfg and validators.txt for devnet', () => {
    const result = generateXrpldConfig({ network: 'devnet' });

    expect(result.config).toContain('[network_id]');
    expect(result.config).toContain('2');
    expect(result.validatorsTxt).toContain('https://vl.devnet.rippletest.net');
  });

  it('defaults to mainnet when no network specified', () => {
    const result = generateXrpldConfig({});

    expect(result.config).toContain('[network_id]');
    expect(result.validatorsTxt).toContain('https://vl.ripple.com');
  });

  it('applies user overrides', () => {
    const result = generateXrpldConfig({
      network: 'mainnet',
      node_size: 'large',
      ledger_history: 'full',
    });

    expect(result.config).toContain('[node_size]');
    expect(result.config).toContain('large');
    expect(result.config).toContain('[ledger_history]');
    expect(result.config).toContain('full');
  });

  it('includes validators.txt with custom validators', () => {
    const result = generateXrpldConfig({
      network: 'mainnet',
      validators: ['nHBidG3pZK11zQD6kpNDoAhDxH6n8KnyoHmSMzPELCRBAeZcmXLP'],
    });

    expect(result.validatorsTxt).toContain('[validators]');
    expect(result.validatorsTxt).toContain('nHBidG3pZK11zQD6kpNDoAhDxH6n8KnyoHmSMzPELCRBAeZcmXLP');
  });

  it('throws on validation errors (bad node_db type)', () => {
    expect(() =>
      generateXrpldConfig({
        network: 'mainnet',
        node_db: { type: 'BadDB', path: '/tmp/db' },
      }),
    ).toThrow('Validation failed');
  });

  it('throws on validation errors (mutually exclusive fields)', () => {
    expect(() =>
      generateXrpldConfig({
        network: 'mainnet',
        validation_seed: 'seed123',
        validator_token: 'token456',
      }),
    ).toThrow('mutually exclusive');
  });

  it('passes warnings through in result', () => {
    const result = generateXrpldConfig({ network: 'mainnet' });
    expect(Array.isArray(result.warnings)).toBe(true);
  });
});

describe('validateXrpldConfig', () => {
  it('returns empty errors and warnings for valid config', () => {
    const config = resolveXrpldConfig({ network: 'mainnet' });
    const result = validateXrpldConfig(config);

    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('returns error for invalid node_db type', () => {
    const config = resolveXrpldConfig({
      network: 'mainnet',
      node_db: { type: 'InvalidDB', path: '/tmp/db' },
    });
    const result = validateXrpldConfig(config);

    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].field).toBe('type');
    expect(result.errors[0].section).toBe('node_db');
  });

  it('returns error for mutually exclusive validation_seed and validator_token', () => {
    const config = resolveXrpldConfig({
      network: 'mainnet',
      validation_seed: 'seed',
      validator_token: 'token',
    });
    const result = validateXrpldConfig(config);

    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((e) => e.message.includes('mutually exclusive'))).toBe(true);
  });
});
