import type { XrpldInput, XrpldPortConfig } from '../types/xrpld-input.js';

// #region Key Map

/**
 * Maps SCREAMING_SNAKE_CASE keys to nested XrpldInput paths.
 * Single source of truth for supported flat keys.
 */
const KEY_MAP: Record<string, string> = {
  // Meta
  NETWORK: 'network',

  // Single-value sections
  DATABASE_PATH: 'database_path',
  DEBUG_LOGFILE: 'debug_logfile',
  SSL_VERIFY: 'ssl_verify',
  SSL_VERIFY_FILE: 'ssl_verify_file',
  SSL_VERIFY_DIR: 'ssl_verify_dir',
  NODE_SIZE: 'node_size',
  LEDGER_HISTORY: 'ledger_history',
  FETCH_DEPTH: 'fetch_depth',
  PEER_PRIVATE: 'peer_private',
  NETWORK_ID: 'network_id',
  NETWORK_QUORUM: 'network_quorum',
  FEE_DEFAULT: 'fee_default',
  WORKERS: 'workers',
  IO_WORKERS: 'io_workers',
  PREFETCH_WORKERS: 'prefetch_workers',
  SWEEP_INTERVAL: 'sweep_interval',
  PATH_SEARCH: 'path_search',
  PATH_SEARCH_OLD: 'path_search_old',
  PATH_SEARCH_FAST: 'path_search_fast',
  PATH_SEARCH_MAX: 'path_search_max',
  PEERS_MAX: 'peers_max',
  PEERS_IN_MAX: 'peers_in_max',
  PEERS_OUT_MAX: 'peers_out_max',
  MAX_TRANSACTIONS: 'max_transactions',
  COMPRESSION: 'compression',
  SIGNING_SUPPORT: 'signing_support',
  BETA_RPC_API: 'beta_rpc_api',
  LEDGER_REPLAY: 'ledger_replay',
  WEBSOCKET_PING_FREQUENCY: 'websocket_ping_frequency',
  SERVER_DOMAIN: 'server_domain',
  ELB_SUPPORT: 'elb_support',
  AMENDMENT_MAJORITY_TIME: 'amendment_majority_time',
  RPC_ALLOW_REMOTE: 'rpc_allow_remote',
  VALIDATORS_FILE: 'validators_file',
  VALIDATION_SEED: 'validation_seed',
  VALIDATOR_TOKEN: 'validator_token',
  VALIDATOR_KEY_REVOCATION: 'validator_key_revocation',
  NODE_SEED: 'node_seed',
  RELAY_PROPOSALS: 'relay_proposals',
  RELAY_VALIDATIONS: 'relay_validations',

  // node_db nested
  NODE_DB_TYPE: 'node_db.type',
  NODE_DB_PATH: 'node_db.path',
  NODE_DB_ONLINE_DELETE: 'node_db.online_delete',
  NODE_DB_ADVISORY_DELETE: 'node_db.advisory_delete',
  NODE_DB_FAST_LOAD: 'node_db.fast_load',
  NODE_DB_EARLIEST_SEQ: 'node_db.earliest_seq',
  NODE_DB_DELETE_BATCH: 'node_db.delete_batch',
  NODE_DB_BACK_OFF_MILLISECONDS: 'node_db.back_off_milliseconds',
  NODE_DB_AGE_THRESHOLD_SECONDS: 'node_db.age_threshold_seconds',
  NODE_DB_RECOVERY_WAIT_SECONDS: 'node_db.recovery_wait_seconds',
  NODE_DB_NUDB_BLOCK_SIZE: 'node_db.nudb_block_size',

  // overlay nested
  OVERLAY_IP_LIMIT: 'overlay.ip_limit',
  OVERLAY_MAX_UNKNOWN_TIME: 'overlay.max_unknown_time',
  OVERLAY_MAX_PEERS_PER_IP: 'overlay.max_peers_per_ip',
  OVERLAY_CONNECT_TIMEOUT: 'overlay.connect_timeout',
  OVERLAY_HANDSHAKE_TIMEOUT: 'overlay.handshake_timeout',

  // transaction_queue nested
  TRANSACTION_QUEUE_LEDGERS_IN_QUEUE: 'transaction_queue.ledgers_in_queue',
  TRANSACTION_QUEUE_MINIMUM_QUEUE_SIZE: 'transaction_queue.minimum_queue_size',
  TRANSACTION_QUEUE_RETRY_SEQUENCE_PERCENT: 'transaction_queue.retry_sequence_percent',
  TRANSACTION_QUEUE_MINIMUM_ESCALATION_MULTIPLIER: 'transaction_queue.minimum_escalation_multiplier',
  TRANSACTION_QUEUE_MINIMUM_TXN_IN_LEDGER: 'transaction_queue.minimum_txn_in_ledger',
  TRANSACTION_QUEUE_MINIMUM_TXN_IN_LEDGER_STANDALONE: 'transaction_queue.minimum_txn_in_ledger_standalone',
  TRANSACTION_QUEUE_TARGET_TXN_IN_LEDGER: 'transaction_queue.target_txn_in_ledger',
  TRANSACTION_QUEUE_MAXIMUM_TXN_IN_LEDGER: 'transaction_queue.maximum_txn_in_ledger',
  TRANSACTION_QUEUE_MAXIMUM_TXN_PER_ACCOUNT: 'transaction_queue.maximum_txn_per_account',
  TRANSACTION_QUEUE_MINIMUM_LAST_LEDGER_BUFFER: 'transaction_queue.minimum_last_ledger_buffer',
  TRANSACTION_QUEUE_ZERO_BASEFEE_TRANSACTION_FEELEVEL: 'transaction_queue.zero_basefee_transaction_feelevel',
  TRANSACTION_QUEUE_NORMAL_CONSENSUS_INCREASE_PERCENT: 'transaction_queue.normal_consensus_increase_percent',
  TRANSACTION_QUEUE_SLOW_CONSENSUS_DECREASE_PERCENT: 'transaction_queue.slow_consensus_decrease_percent',

  // voting nested
  VOTING_REFERENCE_FEE: 'voting.reference_fee',
  VOTING_ACCOUNT_RESERVE: 'voting.account_reserve',
  VOTING_OWNER_RESERVE: 'voting.owner_reserve',

  // crawl nested
  CRAWL_OVERLAY: 'crawl.overlay',
  CRAWL_SERVER: 'crawl.server',
  CRAWL_COUNTS: 'crawl.counts',
  CRAWL_UNL: 'crawl.unl',

  // reduce_relay nested
  REDUCE_RELAY_VP_ENABLE: 'reduce_relay.vp_enable',
  REDUCE_RELAY_VP_SQUELCH: 'reduce_relay.vp_squelch',
  REDUCE_RELAY_TX_ENABLE: 'reduce_relay.tx_enable',
  REDUCE_RELAY_TX_LIMIT: 'reduce_relay.tx_limit',

  // insight nested
  INSIGHT_SERVER: 'insight.server',
  INSIGHT_ADDRESS: 'insight.address',
  INSIGHT_PORT: 'insight.port',

  // perf nested
  PERF_PEER_DISCONNECT_INTERVAL: 'perf.peer_disconnect_interval',
  PERF_PEER_SIGNAL_INTERVAL: 'perf.peer_signal_interval',

  // sqlite nested
  SQLITE_LEDGER_PAGE_SIZE: 'sqlite.ledger_page_size',
  SQLITE_TRANSACTION_PAGE_SIZE: 'sqlite.transaction_page_size',
  SQLITE_ACCOUNT_PAGE_SIZE: 'sqlite.account_page_size',

  // import_db nested
  IMPORT_DB_TYPE: 'import_db.type',
  IMPORT_DB_PATH: 'import_db.path',
  IMPORT_DB_ONLINE_DELETE: 'import_db.online_delete',
  IMPORT_DB_ADVISORY_DELETE: 'import_db.advisory_delete',

  // vl nested
  VL_VALIDATOR_LIST_SITES: 'vl.validator_list_sites',
  VL_VALIDATOR_LIST_KEYS: 'vl.validator_list_keys',

  // List sections (comma-separated)
  SNTP_SERVERS: 'sntp_servers',
  IPS: 'ips',
  IPS_FIXED: 'ips_fixed',
  CLUSTER_NODES: 'cluster_nodes',
  AMENDMENTS: 'amendments',
  VETO_AMENDMENTS: 'veto_amendments',
  VALIDATORS: 'validators',
};

/** Keys whose values are comma-separated lists */
const LIST_KEYS = new Set([
  'sntp_servers',
  'ips',
  'ips_fixed',
  'cluster_nodes',
  'amendments',
  'veto_amendments',
  'validators',
  'vl.validator_list_sites',
  'vl.validator_list_keys',
]);

/** Keys whose values should be parsed as numbers */
const NUMERIC_KEYS = new Set([
  'network_quorum',
  'fee_default',
  'workers',
  'io_workers',
  'prefetch_workers',
  'sweep_interval',
  'path_search',
  'path_search_old',
  'path_search_fast',
  'path_search_max',
  'peers_max',
  'peers_in_max',
  'peers_out_max',
  'max_transactions',
  'websocket_ping_frequency',
  'node_db.online_delete',
  'node_db.advisory_delete',
  'node_db.fast_load',
  'node_db.earliest_seq',
  'node_db.delete_batch',
  'node_db.back_off_milliseconds',
  'node_db.age_threshold_seconds',
  'node_db.recovery_wait_seconds',
  'node_db.nudb_block_size',
  'overlay.ip_limit',
  'overlay.max_unknown_time',
  'overlay.max_peers_per_ip',
  'overlay.connect_timeout',
  'overlay.handshake_timeout',
  'transaction_queue.ledgers_in_queue',
  'transaction_queue.minimum_queue_size',
  'transaction_queue.retry_sequence_percent',
  'transaction_queue.minimum_escalation_multiplier',
  'transaction_queue.minimum_txn_in_ledger',
  'transaction_queue.minimum_txn_in_ledger_standalone',
  'transaction_queue.target_txn_in_ledger',
  'transaction_queue.maximum_txn_in_ledger',
  'transaction_queue.maximum_txn_per_account',
  'transaction_queue.minimum_last_ledger_buffer',
  'transaction_queue.zero_basefee_transaction_feelevel',
  'transaction_queue.normal_consensus_increase_percent',
  'transaction_queue.slow_consensus_decrease_percent',
  'voting.reference_fee',
  'voting.account_reserve',
  'voting.owner_reserve',
  'crawl.overlay',
  'crawl.server',
  'crawl.counts',
  'crawl.unl',
  'reduce_relay.vp_enable',
  'reduce_relay.vp_squelch',
  'reduce_relay.tx_enable',
  'reduce_relay.tx_limit',
  'insight.port',
  'perf.peer_disconnect_interval',
  'perf.peer_signal_interval',
  'sqlite.ledger_page_size',
  'sqlite.transaction_page_size',
  'sqlite.account_page_size',
  'import_db.online_delete',
  'import_db.advisory_delete',
]);

// #endregion

// #region Port Parsing

const PORT_KEY_RE = /^PORT_(\d+)_(.+)$/;

/** Port field keys whose values should be numeric */
const PORT_NUMERIC_FIELDS = new Set([
  'port', 'limit', 'send_queue_limit', 'compress_level', 'memory_level',
  'client_max_window_bits', 'server_max_window_bits',
]);

/** Port field keys whose values should be boolean */
const PORT_BOOLEAN_FIELDS = new Set([
  'permessage_deflate', 'client_no_context_takeover', 'server_no_context_takeover',
]);

function parsePortEntries(entries: Map<number, Record<string, string>>): ReadonlyArray<XrpldPortConfig> {
  const indices = [...entries.keys()].sort((a, b) => a - b);
  const ports: XrpldPortConfig[] = [];

  for (const idx of indices) {
    const raw = entries.get(idx)!;
    const port: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(raw)) {
      const fieldName = key.toLowerCase();
      if (PORT_NUMERIC_FIELDS.has(fieldName)) {
        port[fieldName] = Number(value);
      } else if (PORT_BOOLEAN_FIELDS.has(fieldName)) {
        port[fieldName] = value === 'true' || value === '1';
      } else {
        port[fieldName] = value;
      }
    }

    ports.push(port as unknown as XrpldPortConfig);
  }

  return ports;
}

// #endregion

// #region Nested Path Assignment

function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split('.');
  let current = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current) || typeof current[part] !== 'object' || current[part] === null) {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }

  current[parts[parts.length - 1]] = value;
}

// #endregion

// #region Parser

/**
 * Parse a text file with SCREAMING_SNAKE_CASE keys into a Partial<XrpldInput>.
 * Supports: KEY=VALUE, comments (#), blank lines, single/double quoted values.
 * Lists use comma separation. Ports use indexed PREFIX: PORT_0_NAME=peer, PORT_0_PORT=51235.
 */
export function parseTextFile(content: string): Partial<XrpldInput> {
  const result: Record<string, unknown> = {};
  const portEntries = new Map<number, Record<string, string>>();
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const raw = lines[i];
    const trimmed = raw.trim();

    if (trimmed === '' || trimmed.startsWith('#')) {
      continue;
    }

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) {
      throw new TextParseException(`Missing '=' in assignment`, lineNum);
    }

    const key = trimmed.slice(0, eqIndex).trim();
    if (key === '') {
      throw new TextParseException(`Empty variable name`, lineNum);
    }

    if (!/^[A-Z][A-Z0-9_]*$/.test(key)) {
      throw new TextParseException(
        `Invalid variable name '${key}': must match [A-Z][A-Z0-9_]*`,
        lineNum,
      );
    }

    let value = trimmed.slice(eqIndex + 1);

    // Handle quoted values
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    } else {
      // Strip inline comments for unquoted values
      const commentIndex = value.indexOf(' #');
      if (commentIndex !== -1) {
        value = value.slice(0, commentIndex).trimEnd();
      }
    }

    // Check for port entries: PORT_0_NAME, PORT_0_PORT, etc.
    const portMatch = PORT_KEY_RE.exec(key);
    if (portMatch) {
      const portIdx = Number(portMatch[1]);
      const portField = portMatch[2];
      if (!portEntries.has(portIdx)) {
        portEntries.set(portIdx, {});
      }
      portEntries.get(portIdx)![portField] = value;
      continue;
    }

    // Look up in KEY_MAP
    const path = KEY_MAP[key];
    if (path === undefined) {
      throw new TextParseException(`Unknown key '${key}'`, lineNum);
    }

    // Determine the value to assign
    if (LIST_KEYS.has(path)) {
      const items = value.split(',').map(s => s.trim()).filter(s => s !== '');
      setNestedValue(result, path, items);
    } else if (NUMERIC_KEYS.has(path)) {
      const num = Number(value);
      if (!isNaN(num)) {
        setNestedValue(result, path, num);
      } else {
        setNestedValue(result, path, value);
      }
    } else {
      setNestedValue(result, path, value);
    }
  }

  // Add ports if any
  if (portEntries.size > 0) {
    result.server = { ports: parsePortEntries(portEntries) };
  }

  return result as Partial<XrpldInput>;
}

// #endregion

// #region Legacy Compat

export interface EnvParseError {
  line: number;
  message: string;
}

/**
 * Parse a .env file string into key-value pairs.
 * @deprecated Use parseTextFile instead for typed XrpldInput output.
 */
export function parseEnvFile(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const raw = lines[i];
    const trimmed = raw.trim();

    if (trimmed === '' || trimmed.startsWith('#')) {
      continue;
    }

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) {
      throw new EnvParseException(`Missing '=' in assignment`, lineNum);
    }

    const key = trimmed.slice(0, eqIndex).trim();
    if (key === '') {
      throw new EnvParseException(`Empty variable name`, lineNum);
    }

    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      throw new EnvParseException(
        `Invalid variable name '${key}': must contain only letters, digits, and underscores`,
        lineNum,
      );
    }

    let value = trimmed.slice(eqIndex + 1);

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!trimmed.slice(eqIndex + 1).startsWith('"') && !trimmed.slice(eqIndex + 1).startsWith("'")) {
      const commentIndex = value.indexOf(' #');
      if (commentIndex !== -1) {
        value = value.slice(0, commentIndex).trimEnd();
      }
    }

    result[key] = value;
  }

  return result;
}

// #endregion

// #region Errors

export class TextParseException extends Error {
  public readonly line: number;

  constructor(message: string, line: number) {
    super(`Line ${line}: ${message}`);
    this.name = 'TextParseException';
    this.line = line;
  }
}

export class EnvParseException extends Error {
  public readonly line: number;

  constructor(message: string, line: number) {
    super(`Line ${line}: ${message}`);
    this.name = 'EnvParseException';
    this.line = line;
  }
}

// #endregion
