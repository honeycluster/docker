import type {
  XrpldInput,
  XrpldPortConfig,
  ValidationEntry,
  ValidationResult,
} from './types/xrpld-input.js';
import { VALID_ROLES } from './defaults/roles.js';
import { VALID_SIZES } from './defaults/sizes.js';
import { VALID_LOG_LEVELS } from './defaults/verbosity.js';

// #region -- Helpers ----------------------------------

function entry(
  section: string,
  field: string,
  value: unknown,
  message: string,
  severity: 'error' | 'warning',
): ValidationEntry {
  return { section, field, value, message, severity };
}

function isIntegerString(v: string): boolean {
  return /^-?\d+$/.test(v);
}

function isPowerOf2(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0;
}

// #endregion -- Helpers -------------------------------

// #region -- Port Validation --------------------------

function validatePorts(config: XrpldInput, errors: ValidationEntry[], warnings: ValidationEntry[]): void {
  const ports = config.server?.ports;
  if (!ports || ports.length === 0) return;

  const seenPorts = new Map<number, string>();
  let peerCount = 0;

  for (const port of ports) {
    // Port number range
    if (port.port < 1 || port.port > 65535 || !Number.isInteger(port.port)) {
      errors.push(entry('server', 'port', port.port, `Port ${port.name}: port number must be an integer between 1 and 65535`, 'error'));
    }

    // Duplicate ports
    const existing = seenPorts.get(port.port);
    if (existing) {
      errors.push(entry('server', 'port', port.port, `Port ${port.name}: duplicate port number ${port.port} (also used by ${existing})`, 'error'));
    } else {
      seenPorts.set(port.port, port.name);
    }

    // Count peer ports
    const protocols = port.protocol.split(',').map((p) => p.trim());
    if (protocols.includes('peer')) {
      peerCount++;
    }

    // Mixed protocols: ws/wss should not be mixed with http/https/peer in same port
    const hasWs = protocols.some((p) => p === 'ws' || p === 'wss');
    const hasHttp = protocols.some((p) => p === 'http' || p === 'https');
    const hasPeer = protocols.includes('peer');
    if (hasWs && (hasHttp || hasPeer)) {
      errors.push(entry('server', 'protocol', port.protocol, `Port ${port.name}: ws/wss cannot be mixed with http/https/peer`, 'error'));
    }

    // Warn on well-known ports
    if (port.port === 80 || port.port === 443) {
      warnings.push(entry('server', 'port', port.port, `Port ${port.name}: using well-known port ${port.port}`, 'warning'));
    }

    // Warn on admin IP 0.0.0.0 or ::
    if (port.admin === '0.0.0.0' || port.admin === '::') {
      warnings.push(entry('server', 'admin', port.admin, `Port ${port.name}: admin bound to ${port.admin} exposes admin interface to all IPs`, 'warning'));
    }
  }

  // Must have exactly one peer port
  if (peerCount === 0) {
    errors.push(entry('server', 'protocol', undefined, 'No peer port defined — at least one port must use protocol=peer', 'error'));
  }
  if (peerCount > 1) {
    errors.push(entry('server', 'protocol', peerCount, `Multiple peer ports defined (${peerCount}) — only one peer port is allowed`, 'error'));
  }
}

// #endregion -- Port Validation -----------------------

// #region -- Network Validation -----------------------

function validateNetwork(config: XrpldInput, errors: ValidationEntry[]): void {
  if (config.network_id !== undefined) {
    const validNames = ['main', 'testnet', 'devnet'];
    if (!validNames.includes(config.network_id)) {
      const num = Number(config.network_id);
      if (!Number.isInteger(num) || num < 0 || num > 4294967295) {
        errors.push(entry('network', 'network_id', config.network_id, 'network_id must be 0-4294967295 or main/testnet/devnet', 'error'));
      }
    }
  }

  if (config.node_size !== undefined) {
    const validSizes = ['tiny', 'small', 'medium', 'large', 'huge'];
    if (!validSizes.includes(config.node_size)) {
      errors.push(entry('node', 'node_size', config.node_size, 'node_size must be one of tiny, small, medium, large, huge', 'error'));
    }
  }
}

// #endregion -- Network Validation --------------------

// #region -- Database Validation ----------------------

function validateDatabase(config: XrpldInput, errors: ValidationEntry[], warnings: ValidationEntry[]): void {
  if (config.node_db) {
    const db = config.node_db;

    if (db.type !== 'NuDB' && db.type !== 'RocksDB') {
      errors.push(entry('node_db', 'type', db.type, 'node_db.type must be NuDB or RocksDB', 'error'));
    }

    if (!db.path) {
      errors.push(entry('node_db', 'path', db.path, 'node_db.path is required', 'error'));
    }

    if (db.online_delete !== undefined && db.online_delete < 256) {
      errors.push(entry('node_db', 'online_delete', db.online_delete, 'node_db.online_delete must be >= 256', 'error'));
    }

    if (db.nudb_block_size !== undefined) {
      if (!isPowerOf2(db.nudb_block_size) || db.nudb_block_size < 4096 || db.nudb_block_size > 32768) {
        errors.push(entry('node_db', 'nudb_block_size', db.nudb_block_size, 'node_db.nudb_block_size must be a power of 2 between 4096 and 32768', 'error'));
      }
    }

    if (db.earliest_seq !== undefined && db.earliest_seq < 1) {
      errors.push(entry('node_db', 'earliest_seq', db.earliest_seq, 'node_db.earliest_seq must be >= 1', 'error'));
    }

    // RocksDB without online_delete
    if (db.type === 'RocksDB' && db.online_delete === undefined) {
      warnings.push(entry('node_db', 'online_delete', undefined, 'RocksDB without online_delete may grow indefinitely', 'warning'));
    }
  }

  if (!config.database_path) {
    errors.push(entry('database', 'database_path', config.database_path, 'database_path is required', 'error'));
  }

  // ledger_history
  if (config.ledger_history !== undefined) {
    const lh = config.ledger_history;
    if (lh !== 'full' && lh !== 'none') {
      if (!isIntegerString(lh) || Number(lh) < 0) {
        errors.push(entry('ledger', 'ledger_history', lh, 'ledger_history must be a non-negative integer, "full", or "none"', 'error'));
      }
    }

    // ledger_history <= online_delete
    if (config.node_db?.online_delete !== undefined && lh !== 'full' && lh !== 'none' && isIntegerString(lh)) {
      if (Number(lh) > config.node_db.online_delete) {
        errors.push(entry('ledger', 'ledger_history', lh, `ledger_history (${lh}) must be <= online_delete (${config.node_db.online_delete})`, 'error'));
      }
    }

    // Warning: very large ledger_history with non-default sqlite
    if (isIntegerString(lh) && Number(lh) > 10000000 && config.sqlite) {
      warnings.push(entry('ledger', 'ledger_history', lh, 'ledger_history > 10,000,000 with custom sqlite settings may cause performance issues', 'warning'));
    }
  }

  // fetch_depth warning
  if (config.fetch_depth !== undefined && config.fetch_depth !== 'full' && config.fetch_depth !== 'none') {
    if (isIntegerString(config.fetch_depth) && Number(config.fetch_depth) < 128) {
      warnings.push(entry('network', 'fetch_depth', config.fetch_depth, 'fetch_depth < 128 may cause sync issues', 'warning'));
    }
  }

  // sqlite constraints
  if (config.sqlite) {
    const sq = config.sqlite;
    if (sq.ledger_page_size !== undefined && sq.ledger_page_size < 512) {
      errors.push(entry('sqlite', 'ledger_page_size', sq.ledger_page_size, 'sqlite.ledger_page_size must be >= 512', 'error'));
    }
    if (sq.transaction_page_size !== undefined && sq.transaction_page_size < 512) {
      errors.push(entry('sqlite', 'transaction_page_size', sq.transaction_page_size, 'sqlite.transaction_page_size must be >= 512', 'error'));
    }
    if (sq.account_page_size !== undefined && sq.account_page_size < 512) {
      errors.push(entry('sqlite', 'account_page_size', sq.account_page_size, 'sqlite.account_page_size must be >= 512', 'error'));
    }
  }
}

// #endregion -- Database Validation -------------------

// #region -- Protocol Validation ----------------------

function validateProtocol(config: XrpldInput, errors: ValidationEntry[], warnings: ValidationEntry[]): void {
  // ssl_verify 0/1
  if (config.ssl_verify !== undefined && config.ssl_verify !== '0' && config.ssl_verify !== '1') {
    errors.push(entry('ssl', 'ssl_verify', config.ssl_verify, 'ssl_verify must be 0 or 1', 'error'));
  }

  // ssl_verify=0 warning
  if (config.ssl_verify === '0') {
    warnings.push(entry('ssl', 'ssl_verify', '0', 'ssl_verify=0 disables SSL verification', 'warning'));
  }

  // validation_seed + validator_token mutually exclusive
  if (config.validation_seed && config.validator_token) {
    errors.push(entry('validators', 'validation_seed', config.validation_seed, 'validation_seed and validator_token are mutually exclusive', 'error'));
  }

  // No validator_token and no validation_seed warning
  if (!config.validator_token && !config.validation_seed) {
    warnings.push(entry('validators', 'validator_token', undefined, 'No validator_token or validation_seed configured — node will not validate', 'warning'));
  }

  // compression true/false
  if (config.compression !== undefined && config.compression !== 'true' && config.compression !== 'false') {
    errors.push(entry('protocol', 'compression', config.compression, 'compression must be true or false', 'error'));
  }

  // signing_support true/false
  if (config.signing_support !== undefined) {
    if (config.signing_support !== 'true' && config.signing_support !== 'false') {
      errors.push(entry('protocol', 'signing_support', config.signing_support, 'signing_support must be true or false', 'error'));
    }
    if (config.signing_support === 'true') {
      warnings.push(entry('protocol', 'signing_support', 'true', 'signing_support=true is deprecated', 'warning'));
    }
  }

  // peer_private 0/1
  if (config.peer_private !== undefined && config.peer_private !== '0' && config.peer_private !== '1') {
    errors.push(entry('peer', 'peer_private', config.peer_private, 'peer_private must be 0 or 1', 'error'));
  }

  // beta_rpc_api 0/1
  if (config.beta_rpc_api !== undefined && config.beta_rpc_api !== '0' && config.beta_rpc_api !== '1') {
    errors.push(entry('protocol', 'beta_rpc_api', config.beta_rpc_api, 'beta_rpc_api must be 0 or 1', 'error'));
  }

  // ledger_replay 0/1
  if (config.ledger_replay !== undefined && config.ledger_replay !== '0' && config.ledger_replay !== '1') {
    errors.push(entry('protocol', 'ledger_replay', config.ledger_replay, 'ledger_replay must be 0 or 1', 'error'));
  }

  // relay_proposals / relay_validations
  const validRelay = ['all', 'trusted', 'drop_untrusted'];
  if (config.relay_proposals !== undefined && !validRelay.includes(config.relay_proposals)) {
    errors.push(entry('relay', 'relay_proposals', config.relay_proposals, 'relay_proposals must be all, trusted, or drop_untrusted', 'error'));
  }
  if (config.relay_validations !== undefined && !validRelay.includes(config.relay_validations)) {
    errors.push(entry('relay', 'relay_validations', config.relay_validations, 'relay_validations must be all, trusted, or drop_untrusted', 'error'));
  }

  // max_transactions 100-1000
  if (config.max_transactions !== undefined) {
    if (config.max_transactions < 100 || config.max_transactions > 1000) {
      errors.push(entry('transactions', 'max_transactions', config.max_transactions, 'max_transactions must be between 100 and 1000', 'error'));
    }
  }

  // workers/io_workers/prefetch_workers 1-1024
  for (const field of ['workers', 'io_workers', 'prefetch_workers'] as const) {
    const val = config[field];
    if (val !== undefined && (val < 1 || val > 1024)) {
      errors.push(entry('workers', field, val, `${field} must be between 1 and 1024`, 'error'));
    }
  }

  // sweep_interval 10-600
  if (config.sweep_interval !== undefined) {
    if (config.sweep_interval < 10 || config.sweep_interval > 600) {
      errors.push(entry('node', 'sweep_interval', config.sweep_interval, 'sweep_interval must be between 10 and 600', 'error'));
    }
  }

  // path_search non-negative
  for (const field of ['path_search', 'path_search_old', 'path_search_fast', 'path_search_max'] as const) {
    const val = config[field];
    if (val !== undefined && val < 0) {
      errors.push(entry('path', field, val, `${field} must be non-negative`, 'error'));
    }
  }

}

// #endregion -- Protocol Validation -------------------

// #region -- Overlay Validation -----------------------

function validateOverlay(config: XrpldInput, errors: ValidationEntry[]): void {
  if (!config.overlay) return;
  const o = config.overlay;

  if (o.ip_limit !== undefined && (o.ip_limit < 0 || !Number.isInteger(o.ip_limit))) {
    errors.push(entry('overlay', 'ip_limit', o.ip_limit, 'overlay.ip_limit must be a non-negative integer', 'error'));
  }
  if (o.max_unknown_time !== undefined && (o.max_unknown_time < 0 || !Number.isInteger(o.max_unknown_time))) {
    errors.push(entry('overlay', 'max_unknown_time', o.max_unknown_time, 'overlay.max_unknown_time must be a non-negative integer', 'error'));
  }
  if (o.max_peers_per_ip !== undefined && (o.max_peers_per_ip < 0 || !Number.isInteger(o.max_peers_per_ip))) {
    errors.push(entry('overlay', 'max_peers_per_ip', o.max_peers_per_ip, 'overlay.max_peers_per_ip must be a non-negative integer', 'error'));
  }
  if (o.connect_timeout !== undefined && (o.connect_timeout < 0 || !Number.isInteger(o.connect_timeout))) {
    errors.push(entry('overlay', 'connect_timeout', o.connect_timeout, 'overlay.connect_timeout must be a non-negative integer', 'error'));
  }
  if (o.handshake_timeout !== undefined && (o.handshake_timeout < 0 || !Number.isInteger(o.handshake_timeout))) {
    errors.push(entry('overlay', 'handshake_timeout', o.handshake_timeout, 'overlay.handshake_timeout must be a non-negative integer', 'error'));
  }
}

// #endregion -- Overlay Validation --------------------

// #region -- Reduce Relay Validation ------------------

function validateReduceRelay(config: XrpldInput, errors: ValidationEntry[]): void {
  if (!config.reduce_relay) return;
  const rr = config.reduce_relay;

  if (rr.vp_enable !== undefined && rr.vp_enable !== 0 && rr.vp_enable !== 1) {
    errors.push(entry('reduce_relay', 'vp_enable', rr.vp_enable, 'reduce_relay.vp_enable must be 0 or 1', 'error'));
  }
  if (rr.tx_enable !== undefined && rr.tx_enable !== 0 && rr.tx_enable !== 1) {
    errors.push(entry('reduce_relay', 'tx_enable', rr.tx_enable, 'reduce_relay.tx_enable must be 0 or 1', 'error'));
  }
  if (rr.vp_squelch !== undefined && (rr.vp_squelch < 0 || !Number.isInteger(rr.vp_squelch))) {
    errors.push(entry('reduce_relay', 'vp_squelch', rr.vp_squelch, 'reduce_relay.vp_squelch must be a non-negative integer', 'error'));
  }
  if (rr.tx_limit !== undefined && (rr.tx_limit < 0 || !Number.isInteger(rr.tx_limit))) {
    errors.push(entry('reduce_relay', 'tx_limit', rr.tx_limit, 'reduce_relay.tx_limit must be a non-negative integer', 'error'));
  }
}

// #endregion -- Reduce Relay Validation ---------------

// #region -- Voting Validation ------------------------

function validateVoting(config: XrpldInput, errors: ValidationEntry[]): void {
  if (!config.voting) return;
  const v = config.voting;

  if (v.reference_fee !== undefined && (v.reference_fee < 1 || !Number.isInteger(v.reference_fee))) {
    errors.push(entry('voting', 'reference_fee', v.reference_fee, 'voting.reference_fee must be a positive integer', 'error'));
  }
  if (v.account_reserve !== undefined && (v.account_reserve < 1 || !Number.isInteger(v.account_reserve))) {
    errors.push(entry('voting', 'account_reserve', v.account_reserve, 'voting.account_reserve must be a positive integer', 'error'));
  }
  if (v.owner_reserve !== undefined && (v.owner_reserve < 1 || !Number.isInteger(v.owner_reserve))) {
    errors.push(entry('voting', 'owner_reserve', v.owner_reserve, 'voting.owner_reserve must be a positive integer', 'error'));
  }
}

// #endregion -- Voting Validation ---------------------

// #region -- Crawl Validation -------------------------

function validateCrawl(config: XrpldInput, errors: ValidationEntry[]): void {
  if (!config.crawl) return;
  const c = config.crawl;

  for (const field of ['overlay', 'server', 'counts', 'unl'] as const) {
    const val = c[field];
    if (val !== undefined && val !== 0 && val !== 1) {
      errors.push(entry('crawl', field, val, `crawl.${field} must be 0 or 1`, 'error'));
    }
  }
}

// #endregion -- Crawl Validation ----------------------

// #region -- Peer Warnings ----------------------------

function validatePeers(config: XrpldInput, warnings: ValidationEntry[]): void {
  if (config.peer_private === '1' && (!config.ips_fixed || config.ips_fixed.length === 0)) {
    warnings.push(entry('peer', 'ips_fixed', undefined, 'peer_private=1 but no ips_fixed configured — node may not be able to connect to the network', 'warning'));
  }
}

// #endregion -- Peer Warnings -------------------------

// #region -- Preset Validation ------------------------

const VALID_NETWORKS: ReadonlySet<string> = new Set(['mainnet', 'testnet', 'devnet']);

function validatePresets(config: XrpldInput, errors: ValidationEntry[], warnings: ValidationEntry[]): void {
  const presets = config.presets;
  if (!presets) return;

  // Validate preset values
  if (presets.network !== undefined && !VALID_NETWORKS.has(presets.network)) {
    errors.push(entry('presets', 'network', presets.network, `Invalid preset network: '${presets.network}'. Must be one of: mainnet, testnet, devnet`, 'error'));
  }

  if (presets.role !== undefined && !VALID_ROLES.has(presets.role)) {
    errors.push(entry('presets', 'role', presets.role, `Invalid preset role: '${presets.role}'. Must be one of: ${[...VALID_ROLES].join(', ')}`, 'error'));
  }

  if (presets.size !== undefined && !VALID_SIZES.has(presets.size)) {
    errors.push(entry('presets', 'size', presets.size, `Invalid preset size: '${presets.size}'. Must be one of: ${[...VALID_SIZES].join(', ')}`, 'error'));
  }

  if (presets.verbosity !== undefined && !VALID_LOG_LEVELS.has(presets.verbosity)) {
    errors.push(entry('presets', 'verbosity', presets.verbosity, `Invalid preset verbosity: '${presets.verbosity}'. Must be one of: ${[...VALID_LOG_LEVELS].join(', ')}`, 'error'));
  }

  // Role-specific warnings
  if (presets.role === 'validator' && !config.validator_token && !config.validation_seed) {
    warnings.push(entry('presets', 'role', 'validator', 'validator role requires validator_token to participate in consensus', 'warning'));
  }

  if (presets.role === 'sentry' && (!config.ips_fixed || config.ips_fixed.length === 0)) {
    warnings.push(entry('presets', 'role', 'sentry', 'sentry role should have ips_fixed pointing to the validator it protects', 'warning'));
  }

  if (presets.role === 'clio') {
    const grpcPort = config.server?.ports?.find((p) => p.protocol === 'grpc');
    if (grpcPort && grpcPort.ip !== '0.0.0.0') {
      warnings.push(entry('presets', 'role', 'clio', `clio role expects gRPC port bound to 0.0.0.0 but found '${grpcPort.ip ?? 'undefined'}'`, 'warning'));
    }
  }
}

// #endregion -- Preset Validation ---------------------

// #region -- Main Export ------------------------------

/**
 * Validate a resolved xrpld configuration against all rules.
 * Checks ports, network, database, protocol, overlay, reduce_relay, voting, crawl, and peer settings.
 * @param config - Fully resolved XrpldInput to validate
 * @returns ValidationResult with arrays of errors and warnings
 */
export function validateXrpldConfig(config: XrpldInput): ValidationResult {
  const errors: ValidationEntry[] = [];
  const warnings: ValidationEntry[] = [];

  validatePorts(config, errors, warnings);
  validateNetwork(config, errors);
  validateDatabase(config, errors, warnings);
  validateProtocol(config, errors, warnings);
  validateOverlay(config, errors);
  validateReduceRelay(config, errors);
  validateVoting(config, errors);
  validateCrawl(config, errors);
  validatePeers(config, warnings);
  validatePresets(config, errors, warnings);

  // Suppress generic "no validator_token" warning when role-specific validator warning fires
  const hasRoleValidatorWarning = warnings.some(
    (w) => w.section === 'presets' && w.field === 'role' && w.value === 'validator',
  );
  const filteredWarnings = hasRoleValidatorWarning
    ? warnings.filter(
        (w) => !(w.section === 'validators' && w.field === 'validator_token' && w.message.includes('will not validate')),
      )
    : warnings;

  return { errors, warnings: filteredWarnings };
}

// #endregion -- Main Export ---------------------------
