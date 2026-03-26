// #region -- Port Config ------------------------------

export interface XrpldPortConfig {
  readonly name: string;
  readonly ip?: string;
  readonly port: number;
  readonly protocol: string;
  readonly limit?: number;
  readonly admin?: string;
  readonly admin_user?: string;
  readonly admin_password?: string;
  readonly secure_gateway?: string;
  readonly ssl_key?: string;
  readonly ssl_cert?: string;
  readonly ssl_chain?: string;
  readonly ssl_ciphers?: string;
  readonly send_queue_limit?: number;
  readonly user?: string;
  readonly password?: string;
  readonly permessage_deflate?: boolean;
  readonly client_max_window_bits?: number;
  readonly server_max_window_bits?: number;
  readonly client_no_context_takeover?: boolean;
  readonly server_no_context_takeover?: boolean;
  readonly compress_level?: number;
  readonly memory_level?: number;
}

// #endregion -- Port Config ---------------------------

// #region -- Database Configs -------------------------

export interface XrpldNodeDbConfig {
  readonly type: string;
  readonly path: string;
  readonly online_delete?: number;
  readonly advisory_delete?: number;
  readonly fast_load?: number;
  readonly earliest_seq?: number;
  readonly delete_batch?: number;
  readonly back_off_milliseconds?: number;
  readonly age_threshold_seconds?: number;
  readonly recovery_wait_seconds?: number;
  readonly nudb_block_size?: number;
}

export interface XrpldImportDbConfig {
  readonly type?: string;
  readonly path?: string;
  readonly online_delete?: number;
  readonly advisory_delete?: number;
}

export interface XrpldSqliteConfig {
  readonly ledger_page_size?: number;
  readonly transaction_page_size?: number;
  readonly account_page_size?: number;
}

// #endregion -- Database Configs ----------------------

// #region -- Network Configs --------------------------

export interface XrpldOverlayConfig {
  readonly ip_limit?: number;
  readonly max_unknown_time?: number;
  readonly max_peers_per_ip?: number;
  readonly connect_timeout?: number;
  readonly handshake_timeout?: number;
}

export interface XrpldTransactionQueueConfig {
  readonly ledgers_in_queue?: number;
  readonly minimum_queue_size?: number;
  readonly retry_sequence_percent?: number;
  readonly minimum_escalation_multiplier?: number;
  readonly minimum_txn_in_ledger?: number;
  readonly minimum_txn_in_ledger_standalone?: number;
  readonly target_txn_in_ledger?: number;
  readonly maximum_txn_in_ledger?: number;
  readonly maximum_txn_per_account?: number;
  readonly minimum_last_ledger_buffer?: number;
  readonly zero_basefee_transaction_feelevel?: number;
  readonly normal_consensus_increase_percent?: number;
  readonly slow_consensus_decrease_percent?: number;
}

export interface XrpldVotingConfig {
  readonly reference_fee?: number;
  readonly account_reserve?: number;
  readonly owner_reserve?: number;
}

export interface XrpldCrawlConfig {
  readonly overlay?: number;
  readonly server?: number;
  readonly counts?: number;
  readonly unl?: number;
}

export interface XrpldReduceRelayConfig {
  readonly vp_enable?: number;
  readonly vp_squelch?: number;
  readonly tx_enable?: number;
  readonly tx_limit?: number;
}

export interface XrpldInsightConfig {
  readonly server?: string;
  readonly address?: string;
  readonly port?: number;
}

export interface XrpldPerfConfig {
  readonly peer_disconnect_interval?: number;
  readonly peer_signal_interval?: number;
}

// #endregion -- Network Configs -----------------------

// #region -- Validator List Config --------------------

export interface XrpldVlConfig {
  readonly validator_list_sites?: ReadonlyArray<string>;
  readonly validator_list_keys?: ReadonlyArray<string>;
  readonly validator_list_key_sources?: ReadonlyArray<string>;
}

// #endregion -- Validator List Config -----------------

// #region -- Preset Types -----------------------------

export type NodeRole = 'stock' | 'validator' | 'ephemeral' | 'sentry' | 'clio' | 'feature' | 'hub';

export type NodeSize = 'tiny' | 'small' | 'medium' | 'large' | 'huge';

export type LogLevel = 'silent' | 'fatal' | 'error' | 'warning' | 'info' | 'debug' | 'trace';

export interface XrpldPresets {
  readonly network?: 'mainnet' | 'testnet' | 'devnet';
  readonly role?: NodeRole;
  readonly size?: NodeSize;
  readonly verbosity?: LogLevel;
}

// #endregion -- Preset Types --------------------------

// #region -- Main Input -------------------------------

export interface XrpldInput {
  readonly presets?: XrpldPresets;

  // Server
  readonly server?: {
    readonly ports: ReadonlyArray<XrpldPortConfig>;
  };
  readonly server_comment?: string;
  readonly port_overrides?: Readonly<Record<string, Partial<Omit<XrpldPortConfig, 'name'>>>>;

  // Database
  readonly node_db?: XrpldNodeDbConfig;
  readonly database_path?: string;
  readonly import_db?: XrpldImportDbConfig;
  readonly sqlite?: XrpldSqliteConfig;

  // Logging
  readonly debug_logfile?: string;

  // SSL
  readonly ssl_verify?: string;
  readonly ssl_verify_file?: string;
  readonly ssl_verify_dir?: string;
  readonly ssl_cert_email?: string;
  readonly ssl_cert_validity_days?: number;

  // Time
  readonly sntp_servers?: ReadonlyArray<string>;

  // Node
  readonly node_size?: string;
  readonly ledger_history?: string;
  readonly fetch_depth?: string;

  // Peer
  readonly peer_private?: string;
  readonly network_id?: string;
  readonly network_quorum?: number;

  // RPC
  readonly rpc_startup?: ReadonlyArray<Record<string, string>>;
  readonly rpc_allow_remote?: string;

  // Validators
  readonly validators_file?: string;
  readonly validation_seed?: string;
  readonly validator_token?: string;
  readonly validator_key_revocation?: string;
  readonly validators?: ReadonlyArray<string>;
  readonly vl?: XrpldVlConfig;

  // Peers
  readonly ips?: ReadonlyArray<string>;
  readonly ips_fixed?: ReadonlyArray<string>;
  readonly peers_max?: number;
  readonly peers_in_max?: number;
  readonly peers_out_max?: number;

  // Overlay
  readonly overlay?: XrpldOverlayConfig;
  readonly compression?: string;
  readonly node_seed?: string;
  readonly cluster_nodes?: ReadonlyArray<string>;

  // Transactions
  readonly max_transactions?: number;
  readonly transaction_queue?: XrpldTransactionQueueConfig;

  // Relay
  readonly relay_proposals?: string;
  readonly relay_validations?: string;

  // Voting
  readonly voting?: XrpldVotingConfig;

  // Path finding
  readonly path_search?: number;
  readonly path_search_old?: number;
  readonly path_search_fast?: number;
  readonly path_search_max?: number;

  // Fees
  readonly fee_default?: number;

  // Workers
  readonly workers?: number;
  readonly io_workers?: number;
  readonly prefetch_workers?: number;
  readonly sweep_interval?: number;

  // Amendments
  readonly amendments?: ReadonlyArray<string>;
  readonly amendment_majority_time?: string;
  readonly veto_amendments?: ReadonlyArray<string>;

  // Protocol
  readonly signing_support?: string;
  readonly beta_rpc_api?: string;
  readonly ledger_replay?: string;
  readonly websocket_ping_frequency?: number;
  readonly server_domain?: string;
  readonly elb_support?: string;

  // Advanced
  readonly crawl?: XrpldCrawlConfig;
  readonly reduce_relay?: XrpldReduceRelayConfig;
  readonly insight?: XrpldInsightConfig;
  readonly perf?: XrpldPerfConfig;
}

// #endregion -- Main Input ----------------------------

// #region -- Result Types -----------------------------

export interface XrpldGeneratorResult {
  readonly config: string;
  readonly validatorsTxt: string;
  readonly warnings: ReadonlyArray<string>;
  readonly sslCertRequired: boolean;
}

export interface ValidationEntry {
  readonly section: string;
  readonly field: string;
  readonly value: unknown;
  readonly message: string;
  readonly severity: 'error' | 'warning';
}

export interface ValidationResult {
  readonly errors: ReadonlyArray<ValidationEntry>;
  readonly warnings: ReadonlyArray<ValidationEntry>;
}

// #endregion -- Result Types --------------------------
