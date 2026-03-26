import { describe, it, expect } from 'vitest';
import { generateXrpldConfig } from '../src/generators/xrpld.js';
import { validateXrpldConfig } from '../src/validation.js';
import { resolveXrpldConfig } from '../src/defaults/xrpld.js';

describe('generateXrpldConfig', () => {
  it('returns valid cfg and validators.txt for mainnet', () => {
    const result = generateXrpldConfig({ presets: { network: 'mainnet' } });

    expect(result.config).toContain('[server]');
    expect(result.config).toContain('[node_db]');
    expect(result.config).toContain('[network_id]');
    expect(result.config).toContain('0');
    expect(result.validatorsTxt).toContain('[validator_list_sites]');
    expect(result.validatorsTxt).toContain('https://vl.ripple.com');
    expect(Array.isArray(result.warnings)).toBe(true);
  });

  it('returns valid cfg and validators.txt for testnet', () => {
    const result = generateXrpldConfig({ presets: { network: 'testnet' } });

    expect(result.config).toContain('[network_id]');
    expect(result.config).toContain('1');
    expect(result.validatorsTxt).toContain('https://vl.altnet.rippletest.net');
    expect(result.validatorsTxt).toContain('ED264807102805220DA0F312E71FC2C69E1552C9C5790F6C25E3729DEB573D5860');
  });

  it('returns valid cfg and validators.txt for devnet', () => {
    const result = generateXrpldConfig({ presets: { network: 'devnet' } });

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
      presets: { network: 'mainnet' },
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
      presets: { network: 'mainnet' },
      validators: ['nHBidG3pZK11zQD6kpNDoAhDxH6n8KnyoHmSMzPELCRBAeZcmXLP'],
    });

    expect(result.validatorsTxt).toContain('[validators]');
    expect(result.validatorsTxt).toContain('nHBidG3pZK11zQD6kpNDoAhDxH6n8KnyoHmSMzPELCRBAeZcmXLP');
  });

  it('throws on validation errors (bad node_db type)', () => {
    expect(() =>
      generateXrpldConfig({
        presets: { network: 'mainnet' },
        node_db: { type: 'BadDB', path: '/tmp/db' },
      }),
    ).toThrow('Validation failed');
  });

  it('throws on validation errors (mutually exclusive fields)', () => {
    expect(() =>
      generateXrpldConfig({
        presets: { network: 'mainnet' },
        validation_seed: 'seed123',
        validator_token: 'token456',
      }),
    ).toThrow('mutually exclusive');
  });

  it('passes warnings through in result', () => {
    const result = generateXrpldConfig({ presets: { network: 'mainnet' } });
    expect(Array.isArray(result.warnings)).toBe(true);
  });

  it('sets sslCertRequired=true for default config with dual-protocol ports', () => {
    const result = generateXrpldConfig({ presets: { network: 'mainnet' } });
    expect(result.sslCertRequired).toBe(true);
  });

  it('sets sslCertRequired=false when all ssl ports have user-provided certs', () => {
    const result = generateXrpldConfig({
      presets: { network: 'mainnet' },
      server: {
        ports: [
          { name: 'port_peer', port: 51235, ip: '0.0.0.0', protocol: 'peer' },
          {
            name: 'port_rpc',
            port: 5005,
            ip: '0.0.0.0',
            protocol: 'http,https',
            ssl_key: '/my/key.pem',
            ssl_cert: '/my/cert.pem',
          },
          {
            name: 'port_wss',
            port: 6005,
            ip: '0.0.0.0',
            protocol: 'ws,wss',
            ssl_key: '/my/key.pem',
            ssl_cert: '/my/cert.pem',
          },
        ],
      },
    });
    expect(result.sslCertRequired).toBe(false);
    expect(result.config).toContain('ssl_key = /my/key.pem');
    expect(result.config).toContain('ssl_cert = /my/cert.pem');
  });

  it('sets sslCertRequired=false for single-protocol ports only', () => {
    const result = generateXrpldConfig({
      presets: { network: 'mainnet' },
      server: {
        ports: [
          { name: 'port_peer', port: 51235, ip: '0.0.0.0', protocol: 'peer' },
          { name: 'port_rpc', port: 5005, ip: '0.0.0.0', protocol: 'http' },
        ],
      },
    });
    expect(result.sslCertRequired).toBe(false);
  });

  it('injects ssl paths into generated config for dual-protocol ports', () => {
    const result = generateXrpldConfig({ presets: { network: 'mainnet' } });
    expect(result.config).toContain('ssl_key = ./certs/server.key');
    expect(result.config).toContain('ssl_cert = ./certs/server.crt');
  });

  it('sets sslCertRequired=false for validator role (no dual-protocol ports)', () => {
    const result = generateXrpldConfig({ presets: { role: 'validator' } });
    expect(result.sslCertRequired).toBe(false);
    expect(result.config).not.toContain('ssl_key');
    expect(result.config).not.toContain('ssl_cert');
  });

  it('applies port_overrides in generated config', () => {
    const result = generateXrpldConfig({
      presets: { network: 'mainnet' },
      port_overrides: { port_rpc: { port: 8080 } },
    });
    expect(result.config).toContain('[port_rpc]\nport = 8080');
  });
});

describe('validateXrpldConfig', () => {
  it('returns no errors for valid config', () => {
    const config = resolveXrpldConfig({ presets: { network: 'mainnet' } });
    const result = validateXrpldConfig(config);

    expect(result.errors).toHaveLength(0);
    // Warnings are expected (e.g., no validator_token configured)
  });

  it('returns error for invalid node_db type', () => {
    const config = resolveXrpldConfig({
      presets: { network: 'mainnet' },
      node_db: { type: 'InvalidDB', path: '/tmp/db' },
    });
    const result = validateXrpldConfig(config);

    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].field).toBe('type');
    expect(result.errors[0].section).toBe('node_db');
  });

  it('returns error for mutually exclusive validation_seed and validator_token', () => {
    const config = resolveXrpldConfig({
      presets: { network: 'mainnet' },
      validation_seed: 'seed',
      validator_token: 'token',
    });
    const result = validateXrpldConfig(config);

    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((e) => e.message.includes('mutually exclusive'))).toBe(true);
  });
});
