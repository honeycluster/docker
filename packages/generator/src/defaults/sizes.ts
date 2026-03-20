import type { NodeSize, XrpldInput } from '../types/xrpld-input.js';

// #region -- Size Preset Defaults -------------------------

export const VALID_SIZES: ReadonlySet<string> = new Set<string>([
  'tiny',
  'small',
  'medium',
  'large',
  'huge',
]);

const BASE_NODE_DB = {
  type: 'NuDB',
  path: '/var/lib/xrpld/db/nudb',
  advisory_delete: 0,
} as const;

const SIZE_MAP: Record<NodeSize, Partial<XrpldInput>> = {
  tiny: {
    node_size: 'tiny',
    node_db: { ...BASE_NODE_DB, online_delete: 256 },
    ledger_history: '256',
    peers_max: 10,
  },
  small: {
    node_size: 'small',
    node_db: { ...BASE_NODE_DB, online_delete: 256 },
    ledger_history: '256',
    peers_max: 15,
  },
  medium: {
    node_size: 'medium',
    node_db: { ...BASE_NODE_DB, online_delete: 512 },
    ledger_history: '512',
    peers_max: 21,
  },
  large: {
    node_size: 'large',
    node_db: { ...BASE_NODE_DB, online_delete: 2048 },
    ledger_history: '2048',
    peers_max: 50,
    workers: 4,
    io_workers: 2,
  },
  huge: {
    node_size: 'huge',
    node_db: { ...BASE_NODE_DB, online_delete: 8192 },
    ledger_history: 'full',
    peers_max: 300,
    workers: 8,
    io_workers: 4,
  },
};

/**
 * Get size-specific default configuration values.
 * @param size - Target node size
 * @returns Partial XrpldInput with size-specific defaults (node_size, node_db, ledger_history, peers_max, workers)
 */
export function getSizeDefaults(size: NodeSize): Partial<XrpldInput> {
  return SIZE_MAP[size];
}

// #endregion -- Size Preset Defaults ----------------------
