// #region Types

export type Network = 'MAINNET' | 'TESTNET' | 'DEVNET';

export type Size = 'DEFAULT' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'HUGE' | 'FULL';

export interface XrpldConfig {
  // Paths
  CONFIG_DIR: string;
  CONFIG_FILE: string;
  VALIDATORS_FILE: string;

  // Ports
  PORT_PEER: string;
  PORT_RPC: string;
  PORT_WSS: string;
  PORT_GRPC: string;
  PORT_RPC_ADMIN_LOCAL: string;
  PORT_WSS_ADMIN_LOCAL: string;

  // Admin
  ADMIN_IPS: string;

  // SSL input variables
  RIPPLE_CERTS_DIR: string;
  SSL_GENERATE: string;
  SSL_GENERATE_OVERWRITE: string;
  SSL_CERT_CN: string;
  SSL_CERT_DAYS: string;
  SSL_CERT_SUBJ: string;
  SSL_CHAIN_ENABLED: string;
  SSL_CERT_PATH: string;

  // SSL-derived (computed by buildSslDerived)
  PORT_RPC_PROTOCOL: string;
  PORT_WSS_PROTOCOL: string;
  SSL_VERIFY: string;
  SSL_LINES: string;

  // Network / Size
  NETWORK: Network;
  SIZE: Size;
  NETWORK_ID: string;
  LEDGER_RETENTION: string;

  // Validator
  VALIDATOR_LIST_SITES: string;
  VALIDATOR_LIST_KEYS: string;

  // Optional section variables
  NODE_SIZE_SECTION: string;
  VALIDATION_QUORUM_SECTION: string;
  PEERS_MAX_SECTION: string;
  VALIDATION_SEED_SECTION: string;
  VALIDATORS_SITE_SECTION: string;
  IPS_SECTION: string;
  IPS_FIXED_SECTION: string;
  REPORTING_SECTION: string;
  LEDGER_TX_TABLES_SECTION: string;

  // Debug
  DEBUG_LOGFILE: string;

  // Fetch / Ledger
  FETCH_DEPTH: string;
  LEDGER_HISTORY: string;

  // SNTP
  SNTP_SERVERS: string;

  // Node DB
  NODE_DB_TYPE: string;
  NODE_DB_PATH: string;
  NODE_DB_ADVISORY_DELETE: string;
  NODE_DB_ONLINE_DELETE: string;
  NODE_DB_OPTIONS: string;

  // Database
  DATABASE_PATH: string;
  DATABASE_PATH_FULL: string;

  // RPC
  RPC_STARTUP_CMDS: string;

  // Peer
  PEER_PRIVATE: string;

  // ETL / Reporting
  ETL_SOURCE_GRPC_PORT: string;
  ETL_SOURCE_WS_PORT: string;
  ETL_SOURCE_IP: string;
  REPORTING_MODE: string;

  // Postgres
  PG_CONNINFO: string;
  USE_TX_TABLES: string;

  // Optional input variables (used for section building)
  NODE_SIZE: string;
  VALIDATION_QUORUM: string;
  PEERS_MAX: string;
  VALIDATION_SEED: string;
  VALIDATORS_SITE: string;
  IPS: string;
  IPS_FIXED: string;
}

// #endregion

// #region Network Defaults

export interface NetworkDefaults {
  NETWORK_ID: string;
  IPS: string;
  VALIDATOR_LIST_SITES: string;
  VALIDATOR_LIST_KEYS: string;
}

export const NETWORK_DEFAULTS: Record<Network, NetworkDefaults> = {
  MAINNET: {
    NETWORK_ID: '0',
    IPS: '',
    VALIDATOR_LIST_SITES: 'https://unl.xrplf.org',
    VALIDATOR_LIST_KEYS:
      'ED42AEC58B701EEBB77356FFFEC26F83C1F0407263530F068C7C73D392C7E06FD1',
  },
  TESTNET: {
    NETWORK_ID: 'testnet',
    IPS: 's.altnet.rippletest.net 51235',
    VALIDATOR_LIST_SITES: 'https://vl.altnet.rippletest.net',
    VALIDATOR_LIST_KEYS:
      'ED264807102805220DA0F312E71FC2C69E1552C9C5790F6C25E3729DEB573D5860',
  },
  DEVNET: {
    NETWORK_ID: 'devnet',
    IPS: 's.devnet.rippletest.net 51235',
    VALIDATOR_LIST_SITES: 'https://vl.devnet.rippletest.net',
    VALIDATOR_LIST_KEYS:
      'EDBB54B0D9AEE071BB37784AF5A9E7CC49AC7A0EFCE868C54532BCB966B9CFC13B',
  },
};

// #endregion

// #region Size / Ledger Retention

export const LEDGER_RETENTION_BY_SIZE: Record<Size, string> = {
  DEFAULT: '512',
  SMALL: '512',
  MEDIUM: '1024',
  LARGE: '2048',
  HUGE: '4096',
  FULL: 'full',
};

// #endregion

// #region SSL Derived

export interface SslDerived {
  PORT_RPC_PROTOCOL: string;
  PORT_WSS_PROTOCOL: string;
  SSL_VERIFY: string;
  SSL_LINES: string;
}

export function buildSslDerived(
  sslCertPath: string,
  sslChainEnabled: string
): SslDerived {
  if (sslCertPath) {
    let sslLines = `ssl_key = ${sslCertPath}/rippled.pem\nssl_cert = ${sslCertPath}/rippled.crt`;
    if (sslChainEnabled && sslChainEnabled !== '0') {
      sslLines += `\nssl_chain = ${sslCertPath}/rippled.crt`;
    }
    return {
      PORT_RPC_PROTOCOL: 'http,https',
      PORT_WSS_PROTOCOL: 'ws,wss',
      SSL_VERIFY: '0',
      SSL_LINES: sslLines,
    };
  }
  return {
    PORT_RPC_PROTOCOL: 'http',
    PORT_WSS_PROTOCOL: 'ws',
    SSL_VERIFY: '1',
    SSL_LINES: '',
  };
}

// #endregion

// #region Computed Sections

export function buildNodeSizeSection(nodeSize: string): string {
  if (!nodeSize) return '';
  return `[node_size]\n${nodeSize}`;
}

export function buildValidationQuorumSection(
  validationQuorum: string
): string {
  if (!validationQuorum) return '';
  return `[validation_quorum]\n${validationQuorum}`;
}

export function buildPeersMaxSection(peersMax: string): string {
  if (!peersMax) return '';
  return `[peers_max]\n${peersMax}`;
}

export function buildValidationSeedSection(validationSeed: string): string {
  if (!validationSeed) return '';
  return `[validation_seed]\n${validationSeed}`;
}

export function buildValidatorsSiteSection(validatorsSite: string): string {
  if (!validatorsSite) return '';
  return `[validators_site]\n${validatorsSite}`;
}

export function buildIpsSection(ips: string): string {
  if (!ips) return '';
  return `[ips]\n${ips}`;
}

export function buildIpsFixedSection(ipsFixed: string): string {
  if (!ipsFixed) return '';
  return `[ips_fixed]\n${ipsFixed}`;
}

export function buildReportingSection(
  reportingMode: string,
  etlSourceGrpcPort: string,
  etlSourceWsPort: string,
  etlSourceIp: string
): string {
  if (!reportingMode) return '';
  return `[reporting]\netl_source\n\n[etl_source]\nsource_grpc_port=${etlSourceGrpcPort || '50051'}\nsource_ws_port=${etlSourceWsPort || '6005'}\nsource_ip=${etlSourceIp || '127.0.0.1'}`;
}

export function buildLedgerTxTablesSection(
  nodeDbType: string,
  pgConninfo: string,
  useTxTables: string
): string {
  if (nodeDbType !== 'Postgres') return '';
  return `[ledger_tx_tables]\nconninfo = ${pgConninfo || ''}\nuse_tx_tables = ${useTxTables || '0'}`;
}

export function buildNodeDbOptions(
  size: Size,
  nodeDbPath: string,
  nodeDbAdvisoryDelete: string,
  nodeDbOnlineDelete: string,
  ledgerRetention: string
): string {
  if (size === 'FULL') {
    return `path=${nodeDbPath}`;
  }
  const advisoryDelete = nodeDbAdvisoryDelete || '0';
  const onlineDelete = nodeDbOnlineDelete || ledgerRetention || '512';
  return `path=${nodeDbPath}\nadvisory_delete=${advisoryDelete}\nonline_delete=${onlineDelete}`;
}

// #endregion

// #region Default Config Builder

export function getXrpldDefaults(
  overrides: Partial<Record<string, string>> = {}
): XrpldConfig {
  const network = (overrides.NETWORK || 'MAINNET') as Network;
  const size = (overrides.SIZE || 'DEFAULT') as Size;

  const configDir = overrides.CONFIG_DIR || '/opt/xrpl';
  const ledgerRetention =
    overrides.LEDGER_RETENTION || LEDGER_RETENTION_BY_SIZE[size] || '512';

  // Network-specific defaults
  const netDefaults = NETWORK_DEFAULTS[network] || NETWORK_DEFAULTS.MAINNET;

  // Base defaults (matching common.sh)
  const nodeDbType = overrides.NODE_DB_TYPE || 'NuDB';
  const nodeDbPath = overrides.NODE_DB_PATH || '/opt/xrpl/db/nudb';
  const databasePath = overrides.DATABASE_PATH || '/opt/xrpl/db';
  const dbTypeLower = nodeDbType.toLowerCase();
  const sslCertPath = overrides.SSL_CERT_PATH || '';
  const sslChainEnabled = overrides.SSL_CHAIN_ENABLED || '0';

  // SSL-derived
  const ssl = buildSslDerived(sslCertPath, sslChainEnabled);

  // Optional input variables (from overrides or env, empty by default)
  const nodeSize = overrides.NODE_SIZE || '';
  const validationQuorum = overrides.VALIDATION_QUORUM || '';
  const peersMax = overrides.PEERS_MAX || '';
  const validationSeed = overrides.VALIDATION_SEED || '';
  const validatorsSite = overrides.VALIDATORS_SITE || '';
  const reportingMode = overrides.REPORTING_MODE || '';

  // IPS: network defaults can set IPS, but overrides take priority
  const ips = overrides.IPS ?? netDefaults.IPS;
  const ipsFixed = overrides.IPS_FIXED || '';

  // Computed sections
  const nodeDbAdvisoryDelete = overrides.NODE_DB_ADVISORY_DELETE || '0';
  const nodeDbOnlineDelete =
    overrides.NODE_DB_ONLINE_DELETE || ledgerRetention;
  const pgConninfo = overrides.PG_CONNINFO || '';
  const useTxTables = overrides.USE_TX_TABLES || '0';

  const etlSourceGrpcPort = overrides.ETL_SOURCE_GRPC_PORT || '50051';
  const etlSourceWsPort = overrides.ETL_SOURCE_WS_PORT || '6005';
  const etlSourceIp = overrides.ETL_SOURCE_IP || '127.0.0.1';

  return {
    // Paths
    CONFIG_DIR: configDir,
    CONFIG_FILE: overrides.CONFIG_FILE || `${configDir}/etc/xrpld.cfg`,
    VALIDATORS_FILE:
      overrides.VALIDATORS_FILE || `${configDir}/etc/validators.txt`,

    // Ports
    PORT_PEER: overrides.PORT_PEER || '51235',
    PORT_RPC: overrides.PORT_RPC || '51234',
    PORT_WSS: overrides.PORT_WSS || '6005',
    PORT_GRPC: overrides.PORT_GRPC || '50051',
    PORT_RPC_ADMIN_LOCAL: overrides.PORT_RPC_ADMIN_LOCAL || '5005',
    PORT_WSS_ADMIN_LOCAL: overrides.PORT_WSS_ADMIN_LOCAL || '6006',

    // Admin
    ADMIN_IPS: overrides.ADMIN_IPS || '127.0.0.1',

    // SSL inputs
    RIPPLE_CERTS_DIR: overrides.RIPPLE_CERTS_DIR || `${configDir}/certs`,
    SSL_GENERATE: overrides.SSL_GENERATE || '0',
    SSL_GENERATE_OVERWRITE: overrides.SSL_GENERATE_OVERWRITE || '0',
    SSL_CERT_CN: overrides.SSL_CERT_CN || 'localhost',
    SSL_CERT_DAYS: overrides.SSL_CERT_DAYS || '365',
    SSL_CERT_SUBJ: overrides.SSL_CERT_SUBJ || '',
    SSL_CHAIN_ENABLED: sslChainEnabled,
    SSL_CERT_PATH: sslCertPath,

    // SSL-derived
    PORT_RPC_PROTOCOL: ssl.PORT_RPC_PROTOCOL,
    PORT_WSS_PROTOCOL: ssl.PORT_WSS_PROTOCOL,
    SSL_VERIFY: ssl.SSL_VERIFY,
    SSL_LINES: ssl.SSL_LINES,

    // Network / Size
    NETWORK: network,
    SIZE: size,
    NETWORK_ID: overrides.NETWORK_ID || netDefaults.NETWORK_ID,
    LEDGER_RETENTION: ledgerRetention,

    // Validator
    VALIDATOR_LIST_SITES:
      overrides.VALIDATOR_LIST_SITES || netDefaults.VALIDATOR_LIST_SITES,
    VALIDATOR_LIST_KEYS:
      overrides.VALIDATOR_LIST_KEYS || netDefaults.VALIDATOR_LIST_KEYS,

    // Computed sections
    NODE_SIZE_SECTION: buildNodeSizeSection(nodeSize),
    VALIDATION_QUORUM_SECTION: buildValidationQuorumSection(validationQuorum),
    PEERS_MAX_SECTION: buildPeersMaxSection(peersMax),
    VALIDATION_SEED_SECTION: buildValidationSeedSection(validationSeed),
    VALIDATORS_SITE_SECTION: buildValidatorsSiteSection(validatorsSite),
    IPS_SECTION: buildIpsSection(ips),
    IPS_FIXED_SECTION: buildIpsFixedSection(ipsFixed),
    REPORTING_SECTION: buildReportingSection(
      reportingMode,
      etlSourceGrpcPort,
      etlSourceWsPort,
      etlSourceIp
    ),
    LEDGER_TX_TABLES_SECTION: buildLedgerTxTablesSection(
      nodeDbType,
      pgConninfo,
      useTxTables
    ),

    // Debug
    DEBUG_LOGFILE: overrides.DEBUG_LOGFILE || '/opt/xrpl/log/debug.log',

    // Fetch / Ledger
    FETCH_DEPTH: overrides.FETCH_DEPTH || 'full',
    LEDGER_HISTORY:
      overrides.LEDGER_HISTORY ||
      (size === 'FULL' ? 'full' : ledgerRetention),

    // SNTP
    SNTP_SERVERS: overrides.SNTP_SERVERS || 'pool.ntp.org',

    // Node DB
    NODE_DB_TYPE: nodeDbType,
    NODE_DB_PATH: nodeDbPath,
    NODE_DB_ADVISORY_DELETE: nodeDbAdvisoryDelete,
    NODE_DB_ONLINE_DELETE: nodeDbOnlineDelete,
    NODE_DB_OPTIONS: buildNodeDbOptions(
      size,
      nodeDbPath,
      nodeDbAdvisoryDelete,
      nodeDbOnlineDelete,
      ledgerRetention
    ),

    // Database
    DATABASE_PATH: databasePath,
    DATABASE_PATH_FULL: `${databasePath}/${dbTypeLower}`,

    // RPC
    RPC_STARTUP_CMDS:
      overrides.RPC_STARTUP_CMDS ||
      '{ "command": "log_level", "severity": "info" }',

    // Peer
    PEER_PRIVATE: overrides.PEER_PRIVATE || '0',

    // ETL / Reporting
    ETL_SOURCE_GRPC_PORT: etlSourceGrpcPort,
    ETL_SOURCE_WS_PORT: etlSourceWsPort,
    ETL_SOURCE_IP: etlSourceIp,
    REPORTING_MODE: reportingMode,

    // Postgres
    PG_CONNINFO: pgConninfo,
    USE_TX_TABLES: useTxTables,

    // Optional input variables
    NODE_SIZE: nodeSize,
    VALIDATION_QUORUM: validationQuorum,
    PEERS_MAX: peersMax,
    VALIDATION_SEED: validationSeed,
    VALIDATORS_SITE: validatorsSite,
    IPS: ips,
    IPS_FIXED: ipsFixed,
  };
}

// #endregion
