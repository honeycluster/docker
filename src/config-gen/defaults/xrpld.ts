import type { XrpldInput, XrpldPortConfig } from '../types/xrpld-input.js';

// #region Network Defaults

type NetworkName = 'mainnet' | 'testnet' | 'devnet';

const MAINNET_DEFAULTS: Partial<XrpldInput> = {
  network_id: '0',
  vl: {
    validator_list_sites: ['https://vl.ripple.com'],
    validator_list_keys: [
      'ED2677ABFFD1B33AC6FBC3062B71F1E8397C1505E1C42C64D11AD1B28FF73F4734',
    ],
  },
};

const TESTNET_DEFAULTS: Partial<XrpldInput> = {
  network_id: '1',
  ips: ['s.altnet.rippletest.net 51235'],
  vl: {
    validator_list_sites: ['https://vl.altnet.rippletest.net'],
    validator_list_keys: [
      'ED264807102805220DA0F312E71FC2C69E1552C9C5790F6C25E3729DEB573D5860',
    ],
  },
};

const DEVNET_DEFAULTS: Partial<XrpldInput> = {
  network_id: '2',
  ips: ['s.devnet.rippletest.net 51235'],
  vl: {
    validator_list_sites: ['https://vl.devnet.rippletest.net'],
    validator_list_keys: [
      'EDBB54B0D9AEE071BB37784AF5A9E7CC49AC7A0EFCE868C54532BCB966B9CFC13B',
    ],
  },
};

const NETWORK_MAP: Record<NetworkName, Partial<XrpldInput>> = {
  mainnet: MAINNET_DEFAULTS,
  testnet: TESTNET_DEFAULTS,
  devnet: DEVNET_DEFAULTS,
};

/**
 * Get network-specific default configuration values.
 * @param network - Target network: 'mainnet', 'testnet', or 'devnet'
 * @returns Partial XrpldInput with network-specific defaults (network_id, VL sites/keys, IPs)
 */
export function getNetworkDefaults(
  network: NetworkName,
): Partial<XrpldInput> {
  return NETWORK_MAP[network];
}

// #endregion

// #region Common Defaults

const DEFAULT_PORTS: ReadonlyArray<XrpldPortConfig> = [
  { name: 'port_peer', port: 51235, ip: '0.0.0.0', protocol: 'peer' },
  {
    name: 'port_rpc_admin_local',
    port: 5005,
    ip: '127.0.0.1',
    admin: '127.0.0.1',
    protocol: 'http',
  },
  {
    name: 'port_ws_admin_local',
    port: 6006,
    ip: '127.0.0.1',
    admin: '127.0.0.1',
    protocol: 'ws',
  },
  {
    name: 'port_grpc',
    port: 50051,
    ip: '127.0.0.1',
    protocol: 'grpc',
    secure_gateway: '127.0.0.1',
  },
];

const COMMON_DEFAULTS: Partial<XrpldInput> = {
  server: { ports: DEFAULT_PORTS },
  node_db: {
    type: 'NuDB',
    path: '/var/lib/xrpld/db/nudb',
    online_delete: 512,
    advisory_delete: 0,
  },
  database_path: '/var/lib/xrpld/db',
  debug_logfile: '/var/log/xrpld/debug.log',
  ssl_verify: '1',
  sntp_servers: ['pool.ntp.org'],
  peer_private: '0',
  fetch_depth: 'full',
  ledger_history: '256',
  rpc_startup: [{ command: 'log_level', severity: 'warning' }],
};

// #endregion

// #region Deep Merge

function isPlainObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

function deepMerge<T extends Record<string, unknown>>(
  base: T,
  override: Partial<T>,
): T {
  const result = { ...base } as Record<string, unknown>;
  for (const key of Object.keys(override)) {
    const overrideVal = (override as Record<string, unknown>)[key];
    const baseVal = result[key];
    if (overrideVal === undefined) continue;
    if (isPlainObject(baseVal) && isPlainObject(overrideVal)) {
      result[key] = deepMerge(
        baseVal as Record<string, unknown>,
        overrideVal as Record<string, unknown>,
      );
    } else {
      result[key] = overrideVal;
    }
  }
  return result as T;
}

// #endregion

// #region Resolve Config

/**
 * Resolve a partial xrpld configuration by deep-merging common defaults, network defaults, and user overrides.
 * Merge priority: common < network < user input.
 * @param input - Partial user configuration (user overrides always win)
 * @returns Fully resolved XrpldInput with all defaults applied
 */
export function resolveXrpldConfig(
  input: Partial<XrpldInput> = {},
): XrpldInput {
  const network = input.network ?? 'mainnet';
  const networkDefaults = getNetworkDefaults(network);

  // Merge: common < network < user
  const merged = deepMerge(
    deepMerge(
      COMMON_DEFAULTS as Record<string, unknown>,
      networkDefaults as Record<string, unknown>,
    ),
    input as Record<string, unknown>,
  ) as XrpldInput;

  return { ...merged, network };
}

// #endregion

// #endregion
