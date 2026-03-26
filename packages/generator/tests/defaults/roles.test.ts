import { describe, it, expect } from 'vitest';
import { getRoleDefaults, VALID_ROLES } from '../../src/defaults/roles.js';
import type { NodeRole } from '../../src/types/xrpld-input.js';

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
  it('returns empty object for stock (current behavior preserved)', () => {
    const result = getRoleDefaults('stock');
    expect(result).toEqual({});
  });

  it('returns validator defaults with peer_private=1 and 3 ports (no gRPC)', () => {
    const result = getRoleDefaults('validator');
    expect(result.peer_private).toBe('1');
    expect(result.server?.ports).toHaveLength(3);
    const portNames = result.server?.ports.map((p) => p.name);
    expect(portNames).toContain('port_peer');
    expect(portNames).toContain('port_rpc_admin_local');
    expect(portNames).toContain('port_ws_admin_local');
    expect(portNames).not.toContain('port_grpc');
    expect(portNames).not.toContain('port_rpc');
    expect(portNames).not.toContain('port_wss');
  });

  it('returns validator defaults with server_comment warning', () => {
    const result = getRoleDefaults('validator');
    expect(result.server_comment).toContain('WARNING');
    expect(result.server_comment).toContain('admin-local');
    expect(result.server_comment).toBe(
      '# WARNING: Exposing RPC/WS ports publicly on a validator can compromise network security. Only admin-local ports are enabled by default.',
    );
  });

  it('validator safe ports use localhost IP and admin bindings', () => {
    const result = getRoleDefaults('validator');
    const ports = result.server?.ports ?? [];

    const peer = ports.find((p) => p.name === 'port_peer')!;
    expect(peer.port).toBe(51235);
    expect(peer.ip).toBe('0.0.0.0');

    const rpcAdmin = ports.find((p) => p.name === 'port_rpc_admin_local')!;
    expect(rpcAdmin.port).toBe(5006);
    expect(rpcAdmin.ip).toBe('127.0.0.1');
    expect(rpcAdmin.admin).toBe('127.0.0.1');
    expect(rpcAdmin.protocol).toBe('http');

    const wsAdmin = ports.find((p) => p.name === 'port_ws_admin_local')!;
    expect(wsAdmin.port).toBe(6006);
    expect(wsAdmin.ip).toBe('127.0.0.1');
    expect(wsAdmin.admin).toBe('127.0.0.1');
    expect(wsAdmin.protocol).toBe('ws');
  });

  it('returns empty object for ephemeral (resource tuning handled by size)', () => {
    const result = getRoleDefaults('ephemeral');
    expect(result).toEqual({});
  });

  it('returns sentry defaults with peer_private=0', () => {
    const result = getRoleDefaults('sentry');
    expect(result.peer_private).toBe('0');
  });

  it('returns clio defaults with ledger_history=full and 6 ports with gRPC on 0.0.0.0', () => {
    const result = getRoleDefaults('clio');
    expect(result.ledger_history).toBe('full');
    expect(result.server?.ports).toHaveLength(6);
    const grpcPort = result.server?.ports.find((p) => p.name === 'port_grpc');
    expect(grpcPort).toBeDefined();
    expect(grpcPort?.ip).toBe('0.0.0.0');
    expect(grpcPort?.secure_gateway).toBe('0.0.0.0');
  });

  it('returns feature defaults with amendment_majority_time', () => {
    const result = getRoleDefaults('feature');
    expect(result.amendment_majority_time).toBe('5 minutes');
  });

  it('returns hub defaults with peer_private=0', () => {
    const result = getRoleDefaults('hub');
    expect(result.peer_private).toBe('0');
  });

  it('role presets do NOT set node_size, node_db, online_delete, or worker counts', () => {
    const roles: ReadonlyArray<NodeRole> = [
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
    const roles: ReadonlyArray<NodeRole> = [
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
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    }
  });
});
