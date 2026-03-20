import { describe, it, expect } from 'vitest';
import { getRoleDefaults, VALID_ROLES } from '../defaults/roles.js';
import type { NodeRole } from '../types/xrpld-input.js';

describe('VALID_ROLES', () => {
  it('contains all 7 role values', () => {
    expect(VALID_ROLES.size).toBe(7);
    expect(VALID_ROLES.has('stock')).toBe(true);
    expect(VALID_ROLES.has('validator')).toBe(true);
    expect(VALID_ROLES.has('ephemeral')).toBe(true);
    expect(VALID_ROLES.has('sentry')).toBe(true);
    expect(VALID_ROLES.has('clio')).toBe(true);
    expect(VALID_ROLES.has('feature')).toBe(true);
    expect(VALID_ROLES.has('hub')).toBe(true);
  });

  it('rejects invalid roles', () => {
    expect(VALID_ROLES.has('admin')).toBe(false);
    expect(VALID_ROLES.has('')).toBe(false);
  });
});

describe('getRoleDefaults', () => {
  it('stock returns empty object', () => {
    const result = getRoleDefaults('stock');
    expect(result).toEqual({});
  });

  it('validator sets peer_private=1 and 3 ports (no gRPC)', () => {
    const result = getRoleDefaults('validator');
    expect(result.peer_private).toBe('1');
    expect(result.server?.ports).toHaveLength(3);
    const portNames = result.server?.ports.map((p) => p.name);
    expect(portNames).toContain('port_peer');
    expect(portNames).toContain('port_rpc_admin_local');
    expect(portNames).toContain('port_ws_admin_local');
    expect(portNames).not.toContain('port_grpc');
  });

  it('ephemeral returns empty object', () => {
    const result = getRoleDefaults('ephemeral');
    expect(result).toEqual({});
  });

  it('sentry sets peer_private=0', () => {
    const result = getRoleDefaults('sentry');
    expect(result).toEqual({ peer_private: '0' });
  });

  it('clio sets ledger_history=full and 4 ports with gRPC on 0.0.0.0', () => {
    const result = getRoleDefaults('clio');
    expect(result.ledger_history).toBe('full');
    expect(result.server?.ports).toHaveLength(4);
    const grpcPort = result.server?.ports.find((p) => p.name === 'port_grpc');
    expect(grpcPort?.ip).toBe('0.0.0.0');
    expect(grpcPort?.secure_gateway).toBe('0.0.0.0');
  });

  it('feature sets amendment_majority_time to 5 minutes', () => {
    const result = getRoleDefaults('feature');
    expect(result).toEqual({ amendment_majority_time: '5 minutes' });
  });

  it('hub sets peer_private=0', () => {
    const result = getRoleDefaults('hub');
    expect(result).toEqual({ peer_private: '0' });
  });

  it('role presets do NOT set node_size, node_db, online_delete, or worker counts', () => {
    const roles: NodeRole[] = [
      'stock',
      'validator',
      'ephemeral',
      'sentry',
      'clio',
      'feature',
      'hub',
    ];
    for (const role of roles) {
      const result = getRoleDefaults(role);
      expect(result.node_size).toBeUndefined();
      expect(result.node_db).toBeUndefined();
      expect(result.workers).toBeUndefined();
      expect(result.io_workers).toBeUndefined();
    }
  });

  it('each role returns a valid Partial<XrpldInput>', () => {
    const roles: NodeRole[] = [
      'stock',
      'validator',
      'ephemeral',
      'sentry',
      'clio',
      'feature',
      'hub',
    ];
    for (const role of roles) {
      const result = getRoleDefaults(role);
      expect(typeof result).toBe('object');
      expect(result).not.toBeNull();
    }
  });
});
