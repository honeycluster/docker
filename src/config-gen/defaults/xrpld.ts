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

// #region Legacy API (used by generators/xrpld.ts until US-003 replaces it)

type LegacyNetwork = 'MAINNET' | 'TESTNET' | 'DEVNET';
type LegacySize = 'DEFAULT' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'HUGE' | 'FULL';

interface NetworkDefaultsLegacy {
  NETWORK_ID: string;
  IPS: string;
  VALIDATOR_LIST_SITES: string;
  VALIDATOR_LIST_KEYS: string;
}

const NETWORK_DEFAULTS_LEGACY: Record<LegacyNetwork, NetworkDefaultsLegacy> = {
  MAINNET: {
    NETWORK_ID: '0',
    IPS: '',
    VALIDATOR_LIST_SITES: 'https://unl.xrplf.org',
    VALIDATOR_LIST_KEYS: 'ED42AEC58B701EEBB77356FFFEC26F83C1F0407263530F068C7C73D392C7E06FD1',
  },
  TESTNET: {
    NETWORK_ID: 'testnet',
    IPS: 's.altnet.rippletest.net 51235',
    VALIDATOR_LIST_SITES: 'https://vl.altnet.rippletest.net',
    VALIDATOR_LIST_KEYS: 'ED264807102805220DA0F312E71FC2C69E1552C9C5790F6C25E3729DEB573D5860',
  },
  DEVNET: {
    NETWORK_ID: 'devnet',
    IPS: 's.devnet.rippletest.net 51235',
    VALIDATOR_LIST_SITES: 'https://vl.devnet.rippletest.net',
    VALIDATOR_LIST_KEYS: 'EDBB54B0D9AEE071BB37784AF5A9E7CC49AC7A0EFCE868C54532BCB966B9CFC13B',
  },
};

const LEDGER_RETENTION_BY_SIZE: Record<LegacySize, string> = {
  DEFAULT: '512', SMALL: '512', MEDIUM: '1024', LARGE: '2048', HUGE: '4096', FULL: 'full',
};

function buildSslDerived(sslCertPath: string, sslChainEnabled: string) {
  if (sslCertPath) {
    let sslLines = `ssl_key = ${sslCertPath}/rippled.pem\nssl_cert = ${sslCertPath}/rippled.crt`;
    if (sslChainEnabled && sslChainEnabled !== '0') sslLines += `\nssl_chain = ${sslCertPath}/rippled.crt`;
    return { PORT_RPC_PROTOCOL: 'http,https', PORT_WSS_PROTOCOL: 'ws,wss', SSL_VERIFY: '0', SSL_LINES: sslLines };
  }
  return { PORT_RPC_PROTOCOL: 'http', PORT_WSS_PROTOCOL: 'ws', SSL_VERIFY: '1', SSL_LINES: '' };
}

function buildNodeSizeSection(v: string) { return v ? `[node_size]\n${v}` : ''; }
function buildValidationQuorumSection(v: string) { return v ? `[validation_quorum]\n${v}` : ''; }
function buildPeersMaxSection(v: string) { return v ? `[peers_max]\n${v}` : ''; }
function buildValidationSeedSection(v: string) { return v ? `[validation_seed]\n${v}` : ''; }
function buildValidatorsSiteSection(v: string) { return v ? `[validators_site]\n${v}` : ''; }
function buildIpsSection(v: string) { return v ? `[ips]\n${v}` : ''; }
function buildIpsFixedSection(v: string) { return v ? `[ips_fixed]\n${v}` : ''; }

function buildReportingSection(mode: string, grpc: string, ws: string, ip: string) {
  if (!mode) return '';
  return `[reporting]\netl_source\n\n[etl_source]\nsource_grpc_port=${grpc || '50051'}\nsource_ws_port=${ws || '6005'}\nsource_ip=${ip || '127.0.0.1'}`;
}

function buildLedgerTxTablesSection(dbType: string, conninfo: string, txTables: string) {
  if (dbType !== 'Postgres') return '';
  return `[ledger_tx_tables]\nconninfo = ${conninfo || ''}\nuse_tx_tables = ${txTables || '0'}`;
}

function buildNodeDbOptions(size: LegacySize, path: string, advisory: string, online: string, retention: string) {
  if (size === 'FULL') return `path=${path}`;
  return `path=${path}\nadvisory_delete=${advisory || '0'}\nonline_delete=${online || retention || '512'}`;
}

export function getXrpldDefaults(overrides: Partial<Record<string, string>> = {}): Record<string, string> {
  const network = (overrides.NETWORK || 'MAINNET') as LegacyNetwork;
  const size = (overrides.SIZE || 'DEFAULT') as LegacySize;
  const configDir = overrides.CONFIG_DIR || '/opt/xrpl';
  const ledgerRetention = overrides.LEDGER_RETENTION || LEDGER_RETENTION_BY_SIZE[size] || '512';
  const netDefaults = NETWORK_DEFAULTS_LEGACY[network] || NETWORK_DEFAULTS_LEGACY.MAINNET;
  const nodeDbType = overrides.NODE_DB_TYPE || 'NuDB';
  const nodeDbPath = overrides.NODE_DB_PATH || '/opt/xrpl/db/nudb';
  const databasePath = overrides.DATABASE_PATH || '/opt/xrpl/db';
  const sslCertPath = overrides.SSL_CERT_PATH || '';
  const sslChainEnabled = overrides.SSL_CHAIN_ENABLED || '0';
  const ssl = buildSslDerived(sslCertPath, sslChainEnabled);
  const nodeSize = overrides.NODE_SIZE || '';
  const validationQuorum = overrides.VALIDATION_QUORUM || '';
  const peersMax = overrides.PEERS_MAX || '';
  const validationSeed = overrides.VALIDATION_SEED || '';
  const validatorsSite = overrides.VALIDATORS_SITE || '';
  const reportingMode = overrides.REPORTING_MODE || '';
  const ips = overrides.IPS ?? netDefaults.IPS;
  const ipsFixed = overrides.IPS_FIXED || '';
  const nodeDbAdvisoryDelete = overrides.NODE_DB_ADVISORY_DELETE || '0';
  const nodeDbOnlineDelete = overrides.NODE_DB_ONLINE_DELETE || ledgerRetention;
  const pgConninfo = overrides.PG_CONNINFO || '';
  const useTxTables = overrides.USE_TX_TABLES || '0';
  const etlGrpc = overrides.ETL_SOURCE_GRPC_PORT || '50051';
  const etlWs = overrides.ETL_SOURCE_WS_PORT || '6005';
  const etlIp = overrides.ETL_SOURCE_IP || '127.0.0.1';

  return {
    CONFIG_DIR: configDir, CONFIG_FILE: overrides.CONFIG_FILE || `${configDir}/etc/xrpld.cfg`,
    VALIDATORS_FILE: overrides.VALIDATORS_FILE || `${configDir}/etc/validators.txt`,
    PORT_PEER: overrides.PORT_PEER || '51235', PORT_RPC: overrides.PORT_RPC || '51234',
    PORT_WSS: overrides.PORT_WSS || '6005', PORT_GRPC: overrides.PORT_GRPC || '50051',
    PORT_RPC_ADMIN_LOCAL: overrides.PORT_RPC_ADMIN_LOCAL || '5005',
    PORT_WSS_ADMIN_LOCAL: overrides.PORT_WSS_ADMIN_LOCAL || '6006',
    ADMIN_IPS: overrides.ADMIN_IPS || '127.0.0.1',
    RIPPLE_CERTS_DIR: overrides.RIPPLE_CERTS_DIR || `${configDir}/certs`,
    SSL_GENERATE: overrides.SSL_GENERATE || '0', SSL_GENERATE_OVERWRITE: overrides.SSL_GENERATE_OVERWRITE || '0',
    SSL_CERT_CN: overrides.SSL_CERT_CN || 'localhost', SSL_CERT_DAYS: overrides.SSL_CERT_DAYS || '365',
    SSL_CERT_SUBJ: overrides.SSL_CERT_SUBJ || '', SSL_CHAIN_ENABLED: sslChainEnabled, SSL_CERT_PATH: sslCertPath,
    PORT_RPC_PROTOCOL: ssl.PORT_RPC_PROTOCOL, PORT_WSS_PROTOCOL: ssl.PORT_WSS_PROTOCOL,
    SSL_VERIFY: ssl.SSL_VERIFY, SSL_LINES: ssl.SSL_LINES,
    NETWORK: network, SIZE: size, NETWORK_ID: overrides.NETWORK_ID || netDefaults.NETWORK_ID,
    LEDGER_RETENTION: ledgerRetention,
    VALIDATOR_LIST_SITES: overrides.VALIDATOR_LIST_SITES || netDefaults.VALIDATOR_LIST_SITES,
    VALIDATOR_LIST_KEYS: overrides.VALIDATOR_LIST_KEYS || netDefaults.VALIDATOR_LIST_KEYS,
    NODE_SIZE_SECTION: buildNodeSizeSection(nodeSize),
    VALIDATION_QUORUM_SECTION: buildValidationQuorumSection(validationQuorum),
    PEERS_MAX_SECTION: buildPeersMaxSection(peersMax),
    VALIDATION_SEED_SECTION: buildValidationSeedSection(validationSeed),
    VALIDATORS_SITE_SECTION: buildValidatorsSiteSection(validatorsSite),
    IPS_SECTION: buildIpsSection(ips), IPS_FIXED_SECTION: buildIpsFixedSection(ipsFixed),
    REPORTING_SECTION: buildReportingSection(reportingMode, etlGrpc, etlWs, etlIp),
    LEDGER_TX_TABLES_SECTION: buildLedgerTxTablesSection(nodeDbType, pgConninfo, useTxTables),
    DEBUG_LOGFILE: overrides.DEBUG_LOGFILE || '/opt/xrpl/log/debug.log',
    FETCH_DEPTH: overrides.FETCH_DEPTH || 'full',
    LEDGER_HISTORY: overrides.LEDGER_HISTORY || (size === 'FULL' ? 'full' : ledgerRetention),
    SNTP_SERVERS: overrides.SNTP_SERVERS || 'pool.ntp.org',
    NODE_DB_TYPE: nodeDbType, NODE_DB_PATH: nodeDbPath,
    NODE_DB_ADVISORY_DELETE: nodeDbAdvisoryDelete, NODE_DB_ONLINE_DELETE: nodeDbOnlineDelete,
    NODE_DB_OPTIONS: buildNodeDbOptions(size, nodeDbPath, nodeDbAdvisoryDelete, nodeDbOnlineDelete, ledgerRetention),
    DATABASE_PATH: databasePath, DATABASE_PATH_FULL: `${databasePath}/${nodeDbType.toLowerCase()}`,
    RPC_STARTUP_CMDS: overrides.RPC_STARTUP_CMDS || '{ "command": "log_level", "severity": "info" }',
    PEER_PRIVATE: overrides.PEER_PRIVATE || '0',
    ETL_SOURCE_GRPC_PORT: etlGrpc, ETL_SOURCE_WS_PORT: etlWs, ETL_SOURCE_IP: etlIp,
    REPORTING_MODE: reportingMode, PG_CONNINFO: pgConninfo, USE_TX_TABLES: useTxTables,
    NODE_SIZE: nodeSize, VALIDATION_QUORUM: validationQuorum, PEERS_MAX: peersMax,
    VALIDATION_SEED: validationSeed, VALIDATORS_SITE: validatorsSite, IPS: ips, IPS_FIXED: ipsFixed,
  };
}

// #endregion
