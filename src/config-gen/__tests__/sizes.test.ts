import { describe, it, expect } from 'vitest';
import { getSizeDefaults, VALID_SIZES } from '../defaults/sizes.js';
import type { NodeSize } from '../types/xrpld-input.js';

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
    expect(VALID_SIZES.has('extra-large')).toBe(false);
    expect(VALID_SIZES.has('')).toBe(false);
  });
});

describe('getSizeDefaults', () => {
  const NUDB_BASE = {
    type: 'NuDB',
    path: '/var/lib/xrpld/db/nudb',
    advisory_delete: 0,
  };

  it('returns correct defaults for tiny', () => {
    const result = getSizeDefaults('tiny');
    expect(result).toEqual({
      node_size: 'tiny',
      node_db: { ...NUDB_BASE, online_delete: 256 },
      ledger_history: '256',
      peers_max: 10,
    });
  });

  it('returns correct defaults for small', () => {
    const result = getSizeDefaults('small');
    expect(result).toEqual({
      node_size: 'small',
      node_db: { ...NUDB_BASE, online_delete: 256 },
      ledger_history: '512',
      peers_max: 15,
    });
  });

  it('returns correct defaults for medium', () => {
    const result = getSizeDefaults('medium');
    expect(result).toEqual({
      node_size: 'medium',
      node_db: { ...NUDB_BASE, online_delete: 512 },
      ledger_history: '1024',
      peers_max: 21,
    });
  });

  it('returns correct defaults for large', () => {
    const result = getSizeDefaults('large');
    expect(result).toEqual({
      node_size: 'large',
      node_db: { ...NUDB_BASE, online_delete: 2048 },
      ledger_history: '4096',
      peers_max: 50,
      workers: 4,
      io_workers: 2,
    });
  });

  it('returns correct defaults for huge', () => {
    const result = getSizeDefaults('huge');
    expect(result).toEqual({
      node_size: 'huge',
      node_db: { ...NUDB_BASE, online_delete: 8192 },
      ledger_history: 'full',
      peers_max: 300,
      workers: 8,
      io_workers: 4,
    });
  });

  it('all sizes use NuDB at /var/lib/xrpld/db/nudb with advisory_delete=0', () => {
    const sizes: NodeSize[] = ['tiny', 'small', 'medium', 'large', 'huge'];
    for (const size of sizes) {
      const result = getSizeDefaults(size);
      expect(result.node_db?.type).toBe('NuDB');
      expect(result.node_db?.path).toBe('/var/lib/xrpld/db/nudb');
      expect(result.node_db?.advisory_delete).toBe(0);
    }
  });

  it('each size returns a valid Partial<XrpldInput> with required fields', () => {
    const sizes: NodeSize[] = ['tiny', 'small', 'medium', 'large', 'huge'];
    for (const size of sizes) {
      const result = getSizeDefaults(size);
      expect(result.node_size).toBe(size);
      expect(result.node_db).toBeDefined();
      expect(result.ledger_history).toBeDefined();
      expect(result.peers_max).toBeGreaterThan(0);
    }
  });

  it('only large and huge have workers and io_workers', () => {
    expect(getSizeDefaults('tiny').workers).toBeUndefined();
    expect(getSizeDefaults('small').workers).toBeUndefined();
    expect(getSizeDefaults('medium').workers).toBeUndefined();
    expect(getSizeDefaults('large').workers).toBe(4);
    expect(getSizeDefaults('large').io_workers).toBe(2);
    expect(getSizeDefaults('huge').workers).toBe(8);
    expect(getSizeDefaults('huge').io_workers).toBe(4);
  });
});
