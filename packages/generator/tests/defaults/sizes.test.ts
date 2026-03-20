import { describe, it, expect } from 'vitest';
import { getSizeDefaults, VALID_SIZES } from '../../src/defaults/sizes.js';
import type { NodeSize } from '../../src/types/xrpld-input.js';

describe('VALID_SIZES', () => {
  it('contains all 5 size values', () => {
    expect(VALID_SIZES.size).toBe(5);
    expect(VALID_SIZES.has('tiny')).toBe(true);
    expect(VALID_SIZES.has('small')).toBe(true);
    expect(VALID_SIZES.has('medium')).toBe(true);
    expect(VALID_SIZES.has('large')).toBe(true);
    expect(VALID_SIZES.has('huge')).toBe(true);
  });

  it('rejects invalid sizes', () => {
    expect(VALID_SIZES.has('micro')).toBe(false);
    expect(VALID_SIZES.has('')).toBe(false);
  });
});

describe('getSizeDefaults', () => {
  const BASE_DB = {
    type: 'NuDB',
    path: '/var/lib/xrpld/db/nudb',
    advisory_delete: 0,
  };

  it('returns tiny defaults', () => {
    const result = getSizeDefaults('tiny');
    expect(result.node_size).toBe('tiny');
    expect(result.node_db).toEqual({ ...BASE_DB, online_delete: 256 });
    expect(result.ledger_history).toBe('256');
    expect(result.peers_max).toBe(10);
    expect(result.workers).toBeUndefined();
    expect(result.io_workers).toBeUndefined();
  });

  it('returns small defaults', () => {
    const result = getSizeDefaults('small');
    expect(result.node_size).toBe('small');
    expect(result.node_db).toEqual({ ...BASE_DB, online_delete: 256 });
    expect(result.ledger_history).toBe('512');
    expect(result.peers_max).toBe(15);
    expect(result.workers).toBeUndefined();
    expect(result.io_workers).toBeUndefined();
  });

  it('returns medium defaults', () => {
    const result = getSizeDefaults('medium');
    expect(result.node_size).toBe('medium');
    expect(result.node_db).toEqual({ ...BASE_DB, online_delete: 512 });
    expect(result.ledger_history).toBe('1024');
    expect(result.peers_max).toBe(21);
    expect(result.workers).toBeUndefined();
    expect(result.io_workers).toBeUndefined();
  });

  it('returns large defaults', () => {
    const result = getSizeDefaults('large');
    expect(result.node_size).toBe('large');
    expect(result.node_db).toEqual({ ...BASE_DB, online_delete: 2048 });
    expect(result.ledger_history).toBe('4096');
    expect(result.peers_max).toBe(50);
    expect(result.workers).toBe(4);
    expect(result.io_workers).toBe(2);
  });

  it('returns huge defaults', () => {
    const result = getSizeDefaults('huge');
    expect(result.node_size).toBe('huge');
    expect(result.node_db).toEqual({ ...BASE_DB, online_delete: 8192 });
    expect(result.ledger_history).toBe('full');
    expect(result.peers_max).toBe(300);
    expect(result.workers).toBe(8);
    expect(result.io_workers).toBe(4);
  });

  it('all sizes use NuDB at /var/lib/xrpld/db/nudb with advisory_delete=0', () => {
    const sizes: ReadonlyArray<NodeSize> = ['tiny', 'small', 'medium', 'large', 'huge'];
    for (const size of sizes) {
      const result = getSizeDefaults(size);
      expect(result.node_db?.type).toBe('NuDB');
      expect(result.node_db?.path).toBe('/var/lib/xrpld/db/nudb');
      expect(result.node_db?.advisory_delete).toBe(0);
    }
  });

  it('each size returns a valid Partial<XrpldInput>', () => {
    const sizes: ReadonlyArray<NodeSize> = ['tiny', 'small', 'medium', 'large', 'huge'];
    for (const size of sizes) {
      const result = getSizeDefaults(size);
      expect(result).toBeDefined();
      expect(typeof result.node_size).toBe('string');
      expect(typeof result.peers_max).toBe('number');
      expect(result.node_db).toBeDefined();
      expect(typeof result.ledger_history).toBe('string');
    }
  });
});
