import { describe, it, expect } from 'vitest';
import {
  validatePort,
  validateBoolean,
  validateUrl,
  validateRequired,
  validateXrpldInputs,
  validateClioInputs,
} from '../validation.js';

// #region Core Validators

describe('validatePort', () => {
  it('returns null for valid ports', () => {
    expect(validatePort('PORT', '1')).toBeNull();
    expect(validatePort('PORT', '80')).toBeNull();
    expect(validatePort('PORT', '8080')).toBeNull();
    expect(validatePort('PORT', '65535')).toBeNull();
  });

  it('returns null for empty/undefined (optional)', () => {
    expect(validatePort('PORT', undefined)).toBeNull();
    expect(validatePort('PORT', '')).toBeNull();
  });

  it('returns error for port 0', () => {
    const err = validatePort('PORT', '0');
    expect(err).not.toBeNull();
    expect(err!.field).toBe('PORT');
    expect(err!.value).toBe('0');
  });

  it('returns error for port > 65535', () => {
    expect(validatePort('PORT', '65536')).not.toBeNull();
    expect(validatePort('PORT', '99999')).not.toBeNull();
  });

  it('returns error for non-numeric', () => {
    expect(validatePort('PORT', 'abc')).not.toBeNull();
    expect(validatePort('PORT', '80.5')).not.toBeNull();
  });

  it('returns error for negative ports', () => {
    expect(validatePort('PORT', '-1')).not.toBeNull();
  });
});

describe('validateBoolean', () => {
  it('returns null for all valid boolean strings', () => {
    for (const v of ['true', 'false', 'on', 'off', '1', '0', 'yes', 'no']) {
      expect(validateBoolean('FIELD', v)).toBeNull();
    }
  });

  it('is case-insensitive', () => {
    expect(validateBoolean('FIELD', 'TRUE')).toBeNull();
    expect(validateBoolean('FIELD', 'False')).toBeNull();
    expect(validateBoolean('FIELD', 'YES')).toBeNull();
  });

  it('returns null for empty/undefined (optional)', () => {
    expect(validateBoolean('FIELD', undefined)).toBeNull();
    expect(validateBoolean('FIELD', '')).toBeNull();
  });

  it('returns error for invalid values', () => {
    expect(validateBoolean('FIELD', 'maybe')).not.toBeNull();
    expect(validateBoolean('FIELD', '2')).not.toBeNull();
    expect(validateBoolean('FIELD', 'enabled')).not.toBeNull();
  });
});

describe('validateUrl', () => {
  it('returns null for valid URLs', () => {
    expect(validateUrl('URL', 'http://example.com')).toBeNull();
    expect(validateUrl('URL', 'https://example.com/path')).toBeNull();
    expect(validateUrl('URL', 'ws://localhost:8080')).toBeNull();
    expect(validateUrl('URL', 'wss://secure.example.com')).toBeNull();
  });

  it('returns null for empty/undefined (optional)', () => {
    expect(validateUrl('URL', undefined)).toBeNull();
    expect(validateUrl('URL', '')).toBeNull();
  });

  it('returns error for invalid URLs', () => {
    expect(validateUrl('URL', 'ftp://example.com')).not.toBeNull();
    expect(validateUrl('URL', 'not-a-url')).not.toBeNull();
    expect(validateUrl('URL', 'http://')).not.toBeNull();
  });
});

describe('validateRequired', () => {
  it('returns null for non-empty values', () => {
    expect(validateRequired('FIELD', 'value')).toBeNull();
    expect(validateRequired('FIELD', '0')).toBeNull();
  });

  it('returns error for undefined', () => {
    const err = validateRequired('FIELD', undefined);
    expect(err).not.toBeNull();
    expect(err!.field).toBe('FIELD');
    expect(err!.message).toContain('Required');
  });

  it('returns error for empty string', () => {
    expect(validateRequired('FIELD', '')).not.toBeNull();
  });
});

// #endregion

// #region xrpld Validation

describe('validateXrpldInputs', () => {
  it('returns no errors for valid inputs', () => {
    const result = validateXrpldInputs({
      PORT_PEER: '51235',
      PORT_RPC: '51234',
      PORT_WSS: '6005',
      PORT_GRPC: '50051',
      PORT_RPC_ADMIN_LOCAL: '5005',
      PORT_WSS_ADMIN_LOCAL: '6006',
      NETWORK: 'MAINNET',
      SIZE: 'DEFAULT',
      SSL_GENERATE: '0',
      SSL_GENERATE_OVERWRITE: '0',
      SSL_CHAIN_ENABLED: '0',
      PEER_PRIVATE: '0',
      NODE_DB_ADVISORY_DELETE: '0',
    });
    expect(result.errors).toHaveLength(0);
  });

  it('returns errors for invalid ports', () => {
    const result = validateXrpldInputs({
      PORT_PEER: '99999',
      PORT_RPC: 'abc',
    });
    expect(result.errors).toHaveLength(2);
    expect(result.errors[0].field).toBe('PORT_PEER');
    expect(result.errors[1].field).toBe('PORT_RPC');
  });

  it('returns error for invalid network', () => {
    const result = validateXrpldInputs({ NETWORK: 'INVALID' });
    expect(result.errors.some((e) => e.field === 'NETWORK')).toBe(true);
  });

  it('returns error for invalid size', () => {
    const result = validateXrpldInputs({ SIZE: 'TINY' });
    expect(result.errors.some((e) => e.field === 'SIZE')).toBe(true);
  });

  it('returns errors for invalid booleans', () => {
    const result = validateXrpldInputs({
      SSL_GENERATE: 'maybe',
      PEER_PRIVATE: '2',
      NODE_DB_ADVISORY_DELETE: 'nope',
    });
    expect(result.errors).toHaveLength(3);
  });

  it('returns no errors when fields are empty/absent', () => {
    const result = validateXrpldInputs({});
    expect(result.errors).toHaveLength(0);
  });

  it('warns on case-mismatched network', () => {
    const result = validateXrpldInputs({ NETWORK: 'mainnet' });
    // 'mainnet' passes validateNetwork (case-insensitive) but triggers casing warning
    expect(result.warnings.some((w) => w.field === 'NETWORK')).toBe(true);
  });

  it('warns on case-mismatched size', () => {
    const result = validateXrpldInputs({ SIZE: 'small' });
    expect(result.warnings.some((w) => w.field === 'SIZE')).toBe(true);
  });

  it('warns on invalid VALIDATOR_LIST_SITES URL', () => {
    const result = validateXrpldInputs({
      VALIDATOR_LIST_SITES: 'not-a-url',
    });
    expect(result.warnings.some((w) => w.field === 'VALIDATOR_LIST_SITES')).toBe(true);
  });

  it('structured errors have field, value, and message', () => {
    const result = validateXrpldInputs({ PORT_PEER: 'bad' });
    const err = result.errors[0];
    expect(err).toHaveProperty('field');
    expect(err).toHaveProperty('value');
    expect(err).toHaveProperty('message');
    expect(err.field).toBe('PORT_PEER');
    expect(err.value).toBe('bad');
    expect(typeof err.message).toBe('string');
  });
});

// #endregion

// #region Clio Validation

describe('validateClioInputs', () => {
  it('returns no errors for valid inputs', () => {
    const result = validateClioInputs({
      SERVER_PORT: '51233',
      CASSANDRA_PORT: '9042',
      ETL_SOURCE_WS_PORT: '6006',
      ETL_SOURCE_GRPC_PORT: '50051',
      SSL_GENERATE: 'false',
      ALLOW_NO_ETL: 'false',
      SERVER_LOCAL_ADMIN: 'false',
      READ_ONLY: 'false',
      PROMETHEUS_ENABLED: 'true',
    });
    expect(result.errors).toHaveLength(0);
  });

  it('returns errors for invalid ports', () => {
    const result = validateClioInputs({
      SERVER_PORT: '0',
      CASSANDRA_PORT: '-5',
    });
    expect(result.errors).toHaveLength(2);
    expect(result.errors[0].field).toBe('SERVER_PORT');
    expect(result.errors[1].field).toBe('CASSANDRA_PORT');
  });

  it('returns errors for invalid booleans', () => {
    const result = validateClioInputs({
      ALLOW_NO_ETL: 'nah',
      PROMETHEUS_ENABLED: 'enabled',
      READ_ONLY: '3',
    });
    expect(result.errors).toHaveLength(3);
  });

  it('returns no errors when fields are empty/absent', () => {
    const result = validateClioInputs({});
    expect(result.errors).toHaveLength(0);
  });

  it('accepts Clio-style true/false booleans', () => {
    const result = validateClioInputs({
      SSL_GENERATE: 'true',
      ALLOW_NO_ETL: 'false',
      SERVER_LOCAL_ADMIN: 'true',
      READ_ONLY: 'false',
      PROMETHEUS_ENABLED: 'true',
    });
    expect(result.errors).toHaveLength(0);
  });

  it('accepts xrpld-style 0/1 booleans', () => {
    const result = validateClioInputs({
      SSL_GENERATE: '0',
      ALLOW_NO_ETL: '1',
    });
    expect(result.errors).toHaveLength(0);
  });

  it('validates all 4 port fields', () => {
    const result = validateClioInputs({
      SERVER_PORT: 'x',
      CASSANDRA_PORT: 'y',
      ETL_SOURCE_WS_PORT: 'z',
      ETL_SOURCE_GRPC_PORT: 'w',
    });
    expect(result.errors).toHaveLength(4);
    const fields = result.errors.map((e) => e.field);
    expect(fields).toContain('SERVER_PORT');
    expect(fields).toContain('CASSANDRA_PORT');
    expect(fields).toContain('ETL_SOURCE_WS_PORT');
    expect(fields).toContain('ETL_SOURCE_GRPC_PORT');
  });
});

// #endregion
