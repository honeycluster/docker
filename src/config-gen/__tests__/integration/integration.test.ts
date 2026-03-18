import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { generateXrpldConfig } from '../../generators/xrpld.js';
import { generateClioConfig } from '../../generators/clio.js';
import { parseEnvFile } from '../../parsers/env-parser.js';
import { parseJsonFile } from '../../parsers/json-parser.js';
import {
  generateXrpldConfigFromInput,
  generateClioConfigFromInput,
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

function loadEnv(name: string): Record<string, string> {
  return parseEnvFile(readFixture(name));
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

  it('generates MAINNET config from .env', () => {
    const overrides = loadEnv('xrpld-mainnet.env');
    const { config } = generateXrpldConfig(overrides);
    const expected = readExpected('xrpld-mainnet.cfg');
    expect(config).toBe(expected);
  });

  it('generates TESTNET config from .env', () => {
    const overrides = loadEnv('xrpld-testnet.env');
    const { config } = generateXrpldConfig(overrides);
    const expected = readExpected('xrpld-testnet.cfg');
    expect(config).toBe(expected);

    // Verify TESTNET-specific values
    expect(config).toContain('network_id]\ntestnet');
    expect(config).toContain('[ips]\ns.altnet.rippletest.net 51235');
  });

  it('generates DEVNET config from .env', () => {
    const overrides = loadEnv('xrpld-devnet.env');
    const { config } = generateXrpldConfig(overrides);
    const expected = readExpected('xrpld-devnet.cfg');
    expect(config).toBe(expected);

    // Verify DEVNET-specific values
    expect(config).toContain('network_id]\ndevnet');
    expect(config).toContain('[ips]\ns.devnet.rippletest.net 51235');
  });

  it('generates SIZE=SMALL config from .env', () => {
    const overrides = loadEnv('xrpld-small.env');
    const { config } = generateXrpldConfig(overrides);
    const expected = readExpected('xrpld-small.cfg');
    expect(config).toBe(expected);

    // SIZE=SMALL uses ledger retention 512
    expect(config).toContain('online_delete=512');
  });

  it('generates SIZE=FULL config from .env', () => {
    const overrides = loadEnv('xrpld-full.env');
    const { config } = generateXrpldConfig(overrides);
    const expected = readExpected('xrpld-full.cfg');
    expect(config).toBe(expected);

    // SIZE=FULL should have full ledger_history and no advisory_delete/online_delete
    expect(config).toContain('[ledger_history]\nfull');
    expect(config).not.toContain('advisory_delete');
    expect(config).not.toContain('online_delete');
  });

  it('generates SSL-enabled config from .env', () => {
    const overrides = loadEnv('xrpld-ssl.env');
    const { config } = generateXrpldConfig(overrides);
    const expected = readExpected('xrpld-ssl.cfg');
    expect(config).toBe(expected);

    // Verify SSL-specific values
    expect(config).toContain('protocol = http,https');
    expect(config).toContain('protocol = ws,wss');
    expect(config).toContain('ssl_key = /opt/xrpl/certs/rippled.pem');
    expect(config).toContain('ssl_cert = /opt/xrpl/certs/rippled.crt');
    expect(config).toContain('ssl_chain = /opt/xrpl/certs/rippled.crt');
    expect(config).toContain('[ssl_verify]\n0');
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

  it('default config matches MAINNET config (MAINNET is the default network)', () => {
    const defaultResult = generateXrpldConfig({});
    const mainnetResult = generateXrpldConfig(loadEnv('xrpld-mainnet.env'));
    expect(defaultResult.config).toBe(mainnetResult.config);
  });
});

// #endregion

// #region Clio Integration Tests

describe('clio integration tests', () => {
  it('generates default config (no overrides)', () => {
    const { config } = generateClioConfig({});
    const expected = readExpected('clio-default.json');
    expect(config).toBe(expected);

    // Default config should be valid JSON
    const parsed = JSON.parse(config);
    expect(parsed.database.type).toBe('cassandra');
    expect(parsed.server.port).toBe(51233);
    expect(parsed.allow_no_etl).toBe(false);
  });

  it('generates SSL-enabled config from .env', () => {
    const overrides = loadEnv('clio-ssl.env');
    const { config } = generateClioConfig(overrides);
    const expected = readExpected('clio-ssl.json');
    expect(config).toBe(expected);

    // Verify SSL paths
    const parsed = JSON.parse(config);
    expect(parsed.ssl_cert_file).toBe('/opt/clio/certs/clio.crt');
    expect(parsed.ssl_key_file).toBe('/opt/clio/certs/clio.pem');
  });

  it('generates custom database/ETL config from JSON', () => {
    const overrides = loadJson('clio-custom.json');
    const { config } = generateClioConfig(overrides);
    const expected = readExpected('clio-custom.json');
    expect(config).toBe(expected);

    // Verify custom values
    const parsed = JSON.parse(config);
    expect(parsed.server.port).toBe(61233);
    expect(parsed.database.cassandra.contact_points).toBe('10.0.0.1');
    expect(parsed.database.cassandra.port).toBe(19042);
    expect(parsed.etl_sources[0].ip).toBe('10.0.0.2');
    expect(parsed.etl_sources[0].ws_port).toBe('7006');
    expect(parsed.etl_sources[0].grpc_port).toBe('60051');
  });

  it('all clio outputs are valid JSON', () => {
    const scenarios = [
      {},
      loadEnv('clio-ssl.env'),
      loadJson('clio-custom.json'),
    ];
    for (const overrides of scenarios) {
      const { config } = generateClioConfig(overrides);
      expect(() => JSON.parse(config)).not.toThrow();
    }
  });
});

// #endregion

// #region Programmatic API Integration Tests

describe('programmatic API integration tests', () => {
  it('generateXrpldConfigFromInput with .env content matches direct generation', () => {
    const envContent = readFixture('xrpld-testnet.env');
    const fromInput = generateXrpldConfigFromInput({ env: envContent });
    const direct = generateXrpldConfig(loadEnv('xrpld-testnet.env'));
    expect(fromInput.config).toBe(direct.config);
  });

  it('generateClioConfigFromInput with .env content matches direct generation', () => {
    const envContent = readFixture('clio-ssl.env');
    const fromInput = generateClioConfigFromInput({ env: envContent });
    const direct = generateClioConfig(loadEnv('clio-ssl.env'));
    expect(fromInput.config).toBe(direct.config);
  });

  it('generateXrpldConfigFromInput with JSON content matches direct generation', () => {
    const jsonContent = readFixture('xrpld-custom-ports.json');
    const fromInput = generateXrpldConfigFromInput({ json: jsonContent });
    const direct = generateXrpldConfig(loadJson('xrpld-custom-ports.json'));
    expect(fromInput.config).toBe(direct.config);
  });

  it('generateClioConfigFromInput with JSON content matches direct generation', () => {
    const jsonContent = readFixture('clio-custom.json');
    const fromInput = generateClioConfigFromInput({ json: jsonContent });
    const direct = generateClioConfig(loadJson('clio-custom.json'));
    expect(fromInput.config).toBe(direct.config);
  });

  it('overrides take priority over .env in generateXrpldConfigFromInput', () => {
    const envContent = readFixture('xrpld-testnet.env');
    const result = generateXrpldConfigFromInput({
      env: envContent,
      overrides: { NETWORK: 'DEVNET' },
    });
    const devnetDirect = generateXrpldConfig(loadEnv('xrpld-devnet.env'));
    expect(result.config).toBe(devnetDirect.config);
  });
});

// #endregion
