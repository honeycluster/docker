# xrpld Config Description

This document provides a list of all available xrpld configuration sections and parameters in detail.

> [!NOTE]
> xrpld uses an INI-style configuration format with `[section]` headers.
> Parameters within sections use `key = value` syntax.
> Some sections (like `[server]`) contain a list of port names rather than key/value pairs.
> Flags use `0` for false/no/off and `1` for true/yes/on unless otherwise noted.

---

## 1. Server

### [server]

- **Required**: True
- **Type**: list of port names
- **Default value**: None
- **Description**: A list of port names that define the listening ports for the xrpld server. Each name listed here must have a corresponding `[<name>]` section that configures that port. Port names must start with a letter and contain only letters and numbers (not case-sensitive). Key/value pairs in this section apply as defaults to all listening ports unless overridden in the individual port section. At least one server port must be defined to accept incoming connections.

### [server] ssl_key

- **Required**: False
- **Type**: string (file path)
- **Default value**: None
- **Description**: Path to the SSL key file in PEM format. Applies as a default to all listening ports unless overridden in a specific port section.

### [server] ssl_cert

- **Required**: False
- **Type**: string (file path)
- **Default value**: None
- **Description**: Path to the SSL certificate file in PEM format. Applies as a default to all listening ports unless overridden in a specific port section.

---

### Port Configuration — [\<port_name\>]

Each port listed in `[server]` must have a corresponding section with the following keys:

### \<port\>.ip

- **Required**: True
- **Type**: string (IP address)
- **Default value**: None
- **Constraints**: Must be a valid IP address.
- **Description**: The IP address of the network interface to bind to. Use `0.0.0.0` to bind to all IPv4 interfaces, or `::` to bind to all IPv4 and IPv6 interfaces. When using `::`, incoming IPv4 connections will appear as mapped IPv4 addresses.

### \<port\>.port

- **Required**: True
- **Type**: integer
- **Default value**: None
- **Constraints**: The minimum value is `1`. The maximum value is `65535`.
- **Description**: The port number to use for this listening port.

### \<port\>.protocol

- **Required**: True
- **Type**: comma-separated list
- **Default value**: None
- **Constraints**: The value must be one or more of: `http`, `https`, `ws`, `wss`, `peer`.
- **Description**: A comma-separated list of protocols to support on this port. Only one port may support the `peer` protocol. A port cannot mix websocket (`ws`/`wss`) and non-websocket (`http`/`https`) protocols, but `ws` and `wss` may be combined. If no port supports `peer`, the server cannot receive incoming peer connections or become a superpeer.

### \<port\>.limit

- **Required**: False
- **Type**: integer
- **Default value**: `0` (unlimited)
- **Constraints**: The minimum value is `0`.
- **Description**: Limits the number of connected clients the port will accept. Once the limit is reached, new connections are refused until other clients disconnect. Set to `0` or omit for unlimited connections.

### \<port\>.user

- **Required**: False
- **Type**: string
- **Default value**: None
- **Description**: Username for HTTP Basic Authentication on HTTP/S requests. If either `user` or `password` is empty, no credentials are required. When acting as a client, xrpld supplies these credentials for outbound HTTP/S requests.

### \<port\>.password

- **Required**: False
- **Type**: string
- **Default value**: None
- **Description**: Password for HTTP Basic Authentication on HTTP/S requests. Used in conjunction with `user`.

### \<port\>.admin

- **Required**: False
- **Type**: comma-separated list of IPs/subnets
- **Default value**: None (admin commands disabled)
- **Description**: A comma-separated list of IP addresses or subnets (in CIDR "slash" notation, e.g. `10.0.0.0/8`) granted administrative command access. Commands may be issued over `http`, `https`, `ws`, or `wss`. Both IPv4 and IPv6 are supported. A common value is `127.0.0.1` for localhost-only access. **Security Warning**: Using `0.0.0.0` or `::` allows access from any IP and can compromise server security.

### \<port\>.admin_user

- **Required**: False
- **Type**: string
- **Default value**: None
- **Description**: Username required in the submitted JSON for administrative command requests on HTTP/S, WS, or WSS interfaces. Has no effect if admin commands are disabled for the port.

### \<port\>.admin_password

- **Required**: False
- **Type**: string
- **Default value**: None
- **Description**: Password required in the submitted JSON for administrative command requests. Used in conjunction with `admin_user`.

### \<port\>.secure_gateway

- **Required**: False
- **Type**: comma-separated list of IPs/subnets
- **Default value**: None
- **Description**: A comma-separated list of IP addresses or subnets (CIDR notation). When set, allows the specified addresses to pass HTTP headers (`X-User` and `X-Forwarded-For`) containing username and remote IP for each session. A non-empty `X-User` header lifts resource controls (e.g. "tooBusy" errors) but does not grant admin command access. If an IP appears in both `admin` and `secure_gateway`, it is treated as `admin`.

### \<port\>.ssl_key

- **Required**: False
- **Type**: string (file path)
- **Default value**: None
- **Description**: Path to the SSL key file in PEM format for this port. If no SSL files are specified and secure protocols are selected, xrpld generates an internal self-signed certificate.

### \<port\>.ssl_cert

- **Required**: False
- **Type**: string (file path)
- **Default value**: None
- **Description**: Path to the SSL certificate file in PEM format. Not needed if the chain includes it. Use `ssl_chain` if your certificate includes intermediates.

### \<port\>.ssl_chain

- **Required**: False
- **Type**: string (file path)
- **Default value**: None
- **Description**: Path to the SSL certificate chain file. The chain may include the end certificate. Required if the certificate includes intermediate certificates.

### \<port\>.ssl_ciphers

- **Required**: False
- **Type**: string (OpenSSL cipher list format)
- **Default value**: Automatic modern cipher suite
- **Description**: Controls the ciphers supported over SSL on the port. If unspecified, xrpld configures a modern, widely supported cipher suite. Only modify with specific reason and cryptographic expertise.

### \<port\>.send_queue_limit

- **Required**: False
- **Type**: integer
- **Default value**: `100`
- **Constraints**: The minimum value is `1`. The maximum value is `65535`.
- **Description**: A WebSocket will disconnect when its send queue exceeds this limit. A larger value may help with erratic disconnects but may adversely affect server performance.

### \<port\>.permessage_deflate

- **Required**: False
- **Type**: flag (0 or 1)
- **Default value**: None
- **Description**: Enables or disables permessage-deflate extension negotiations for WebSocket connections. When enabled, clients may request the extension and the server will offer it in response.

### \<port\>.client_max_window_bits

- **Required**: False
- **Type**: integer
- **Default value**: None
- **Constraints**: The minimum value is `9`. The maximum value is `15`.
- **Description**: Controls the client maximum window bits for permessage-deflate. See [RFC 7692](https://tools.ietf.org/html/rfc7692).

### \<port\>.server_max_window_bits

- **Required**: False
- **Type**: integer
- **Default value**: None
- **Constraints**: The minimum value is `9`. The maximum value is `15`.
- **Description**: Controls the server maximum window bits for permessage-deflate. See [RFC 7692](https://tools.ietf.org/html/rfc7692).

### \<port\>.client_no_context_takeover

- **Required**: False
- **Type**: flag (0 or 1)
- **Default value**: None
- **Description**: Controls client no-context-takeover for permessage-deflate. See [RFC 7692](https://tools.ietf.org/html/rfc7692).

### \<port\>.server_no_context_takeover

- **Required**: False
- **Type**: flag (0 or 1)
- **Default value**: None
- **Description**: Controls server no-context-takeover for permessage-deflate. See [RFC 7692](https://tools.ietf.org/html/rfc7692).

### \<port\>.compress_level

- **Required**: False
- **Type**: integer
- **Default value**: `3`
- **Constraints**: The minimum value is `0`. The maximum value is `9`.
- **Description**: Determines the amount of WebSocket compression. `0` is least compression, `9` is most. Levels 1-3 use a fast algorithm; levels 4-9 use a more compact but CPU-intensive algorithm.

### \<port\>.memory_level

- **Required**: False
- **Type**: integer
- **Default value**: None
- **Constraints**: The minimum value is `1`. The maximum value is `9`.
- **Description**: Determines the relative amount of memory used for intermediate compression data. Higher values can give better compression ratios at the cost of higher memory and CPU usage.

---

### [rpc_startup]

- **Required**: False
- **Type**: list of JSON objects
- **Default value**: None
- **Description**: A list of RPC commands to run at server startup. Each entry is a JSON object specifying the command and its parameters.
- **Example**: `{ "command": "log_level", "severity": "warning" }`

### [websocket_ping_frequency]

- **Required**: False
- **Type**: integer (seconds)
- **Default value**: None
- **Description**: The number of seconds to wait before sending a WebSocket ping message. Ping messages determine if the remote end of the connection is still available.

### [server_domain]

- **Required**: False
- **Type**: string (domain name)
- **Default value**: None
- **Description**: The domain under which a TOML file applicable to this server can be found. The TOML should contain a reference to this server by public key in the `[nodes]` array. Note that a server may misrepresent its domain.

---

## 2. Peer Protocol

### [compression]

- **Required**: False
- **Type**: boolean (`true` or `false`)
- **Default value**: `false`
- **Description**: Enables or disables compression for peer-to-peer communications. Compression saves bandwidth at the cost of greater CPU usage. The server automatically compresses communications with peers that also have compression enabled. See [Enable Link Compression](https://xrpl.org/enable-link-compression.html).

### [ips]

- **Required**: False
- **Type**: list of hostnames/IPs
- **Default value**: Built-in starter list (includes `r.ripple.com 51235`, `sahyadri.isrdc.in 51235`, `hubs.xrpkuwait.com 51235`, `hub.xrpl-commons.org 51235`)
- **Description**: List of hostnames or IP addresses where the Ripple protocol is served. One address per line, with an optional port after a space. If no port is specified, the default port `2459` is used. Many servers still use the legacy port `51235`.

### [ips_fixed]

- **Required**: False
- **Type**: list of hostnames/IPs with ports
- **Default value**: None
- **Description**: List of IP addresses or hostnames to which xrpld should always attempt to maintain peer connections. Useful for manually forming private networks (e.g., connecting a validator through a public-facing server or building cluster peers). A port must be specified after a space.

### [peer_private]

- **Required**: False
- **Type**: flag (0 or 1)
- **Default value**: `0`
- **Description**: Controls whether the server requests peers to broadcast its address. `0` = normal outbound peer connections (address is broadcast). `1` = request peers not to broadcast address; only connect to configured peers.

### [peers_max]

- **Required**: False
- **Type**: integer
- **Default value**: Implementation-defined
- **Description**: The largest number of desired peer connections (incoming or outgoing). Cluster and fixed peers do not count towards this total. Implementation-defined lower limits are enforced for security.

### [node_seed]

- **Required**: False
- **Type**: string (seed or passphrase)
- **Default value**: Auto-generated
- **Description**: Used for clustering. Forces a particular node seed or key. The format is the same as `validation_seed`. To obtain a seed, use the `validation_create` command.

### [cluster_nodes]

- **Required**: False
- **Type**: list of node public keys
- **Default value**: None
- **Description**: Extends full trust to the listed nodes by their public keys. Should only be used for nodes under common administration. Node public keys start with `n`. A name can be appended after a space for identification.

### [max_transactions]

- **Required**: False
- **Type**: integer
- **Default value**: `250`
- **Constraints**: The minimum value is `100`. The maximum value is `1000`.
- **Description**: Configures the maximum number of transactions to have in the job queue.

### [overlay]

Configuration parameters for the peer-to-peer overlay.

### [overlay] public_ip

- **Required**: False
- **Type**: string (IPv4 address)
- **Default value**: None
- **Description**: If the server has a known, fixed public IPv4 address, specify it here in dotted decimal notation. Peers use this to reject attempts to proxy connections to or from this server.

### [overlay] ip_limit

- **Required**: False
- **Type**: integer
- **Default value**: Auto-configured
- **Description**: Maximum number of incoming peer connections allowed from a single non-private (RFC 1918) IP address. Hard and soft upper limits are enforced to prevent a single host from consuming all inbound slots.

### [overlay] max_unknown_time

- **Required**: False
- **Type**: integer (seconds)
- **Default value**: `600`
- **Constraints**: The minimum value is `300`. The maximum value is `1800`.
- **Description**: Maximum time in seconds that an outbound connection is allowed to stay in the "unknown" tracking state.

### [overlay] max_diverged_time

- **Required**: False
- **Type**: integer (seconds)
- **Default value**: `300`
- **Constraints**: The minimum value is `60`. The maximum value is `900`.
- **Description**: Maximum time in seconds that an outbound connection is allowed to stay in the "diverged" tracking state.

---

### [transaction_queue] (EXPERIMENTAL)

> [!WARNING]
> This section is experimental and should not be used in production configurations.

### [transaction_queue] ledgers_in_queue

- **Required**: False
- **Type**: integer
- **Default value**: `20`
- **Description**: The queue is limited to this number of average ledgers' worth of transactions. If the queue fills up, transactions with the lowest fee levels are dropped when higher-fee transactions are added.

### [transaction_queue] minimum_queue_size

- **Required**: False
- **Type**: integer
- **Default value**: `2000`
- **Description**: The queue will always hold at least this number of transactions, regardless of recent ledger sizes or `ledgers_in_queue`.

### [transaction_queue] retry_sequence_percent

- **Required**: False
- **Type**: integer (percentage)
- **Default value**: `25`
- **Description**: When a client replaces a transaction in the queue (same sequence number), the new transaction's fee must be more than this percentage higher than the original's fee, or meet the current open ledger fee.

### [transaction_queue] minimum_escalation_multiplier

- **Required**: False
- **Type**: integer
- **Default value**: `500`
- **Description**: At ledger close, the median fee level of transactions in that ledger is used as a multiplier in escalation calculations. This minimum ensures escalation is significant.

### [transaction_queue] minimum_txn_in_ledger

- **Required**: False
- **Type**: integer
- **Default value**: `5`
- **Description**: Minimum number of transactions allowed into the ledger at the minimum required fee before fee escalation begins.

### [transaction_queue] minimum_txn_in_ledger_standalone

- **Required**: False
- **Type**: integer
- **Default value**: `1000`
- **Description**: Same as `minimum_txn_in_ledger` but applies when xrpld is running in standalone mode.

### [transaction_queue] target_txn_in_ledger

- **Required**: False
- **Type**: integer
- **Default value**: `50`
- **Description**: The target number of transactions allowed at minimum fee that the queue works toward as long as consensus stays healthy. The limit grows quickly to this number and stays above it. If consensus is unhealthy, the limit is clamped to this value or lower.

### [transaction_queue] maximum_txn_in_ledger

- **Required**: False
- **Type**: integer
- **Default value**: None (no maximum)
- **Description**: Optional maximum number of transactions allowed at minimum fee before escalation. If unspecified, no maximum is enforced.

### [transaction_queue] normal_consensus_increase_percent

- **Required**: False
- **Type**: integer (percentage)
- **Default value**: `20`
- **Description**: When the ledger has more transactions than expected and performance is good, the expected ledger size is updated to the previous size plus this percentage.

### [transaction_queue] slow_consensus_decrease_percent

- **Required**: False
- **Type**: integer (percentage)
- **Default value**: `50`
- **Description**: When consensus takes longer than appropriate, the expected ledger size is updated to the minimum of the previous ledger size or the expected size minus this percentage.

### [transaction_queue] maximum_txn_per_account

- **Required**: False
- **Type**: integer
- **Default value**: `10`
- **Description**: Maximum number of transactions one account can have in the queue at any given time.

### [transaction_queue] minimum_last_ledger_buffer

- **Required**: False
- **Type**: integer
- **Default value**: `2`
- **Description**: If a transaction has a `LastLedgerSequence`, it must be at least this much larger than the current open ledger sequence number.

### [transaction_queue] zero_basefee_transaction_feelevel

- **Required**: False
- **Type**: integer
- **Default value**: `256000`
- **Description**: Transactions with a 0 base fee (e.g. SetRegularKey password recovery) are treated as having this fee level to avoid dealing with infinite fee levels.

---

## 3. Protocol

### [relay_proposals]

- **Required**: False
- **Type**: string
- **Default value**: `trusted`
- **Constraints**: The value must be one of: `all`, `trusted`, `drop_untrusted`.
- **Description**: Controls relay and processing behavior for proposals from validators not on the server's UNL. `all` = relay and process all. `trusted` = relay only trusted, but process all locally. `drop_untrusted` = relay only trusted, do not process untrusted.

### [relay_validations]

- **Required**: False
- **Type**: string
- **Default value**: `all`
- **Constraints**: The value must be one of: `all`, `trusted`, `drop_untrusted`.
- **Description**: Controls relay and processing behavior for validations from validators not on the server's UNL. `all` = relay and process all. `trusted` = relay only trusted, but process all locally. `drop_untrusted` = relay only trusted, do not process untrusted.

### [ledger_history]

- **Required**: False
- **Type**: integer or string
- **Default value**: `256`
- **Constraints**: Must be less than or equal to `online_delete` (if used). Special values: `none`, `full`.
- **Description**: The number of past ledgers to acquire on server startup and the minimum to maintain while running. Set to `none` for servers that don't need to serve clients. Set to `full` for complete history.

### [fetch_depth]

- **Required**: False
- **Type**: integer or string
- **Default value**: `full`
- **Constraints**: Values below `128` are not recommended. Values below `32` can harm network stability.
- **Description**: The number of past ledgers to serve to other peers requesting historical data. Set to `full` for no limit. Servers requiring low latency may restrict this value.

### [validation_seed]

- **Required**: False
- **Type**: string (seed or passphrase)
- **Default value**: None
- **Description**: The validation seed used to generate the validation public/private key pair. Required if the server performs validation and `validator_token` is not used. Obtain a seed using the `validation_create` command.

### [validator_token]

- **Required**: False
- **Type**: string (base64-encoded blob)
- **Default value**: None
- **Description**: An alternative to `[validation_seed]` that allows xrpld to perform validation without storing validator keys on the network-connected server. Contains a single base64-encoded token generated by an external tool.

### [validator_key_revocation]

- **Required**: False
- **Type**: string (base64-encoded blob)
- **Default value**: None
- **Description**: If a validator's secret key has been compromised, this field contains a revocation (base64-encoded blob) that notifies peers it is no longer safe to trust the revoked key. Generated by an external tool.

### [validators_file]

- **Required**: False
- **Type**: string (file path)
- **Default value**: None
- **Description**: Path or name of a file that determines the nodes to always accept as validators. The file should contain `[validators]` and/or `[validator_list_sites]` and `[validator_list_keys]` entries. Unless an absolute path is specified, the path is relative to the folder containing `xrpld.cfg`.

### [path_search]

- **Required**: False
- **Type**: integer
- **Default value**: `2`
- **Description**: Default search aggressiveness when searching for paths. Higher values use exponentially more resources. Recommended value for advanced pathfinding: `7`.

### [path_search_fast]

- **Required**: False
- **Type**: integer
- **Default value**: `2`
- **Description**: Minimum search aggressiveness for path searching. Recommended value for advanced pathfinding: `2`.

### [path_search_max]

- **Required**: False
- **Type**: integer
- **Default value**: `3`
- **Description**: Maximum search aggressiveness for path searching. Set to `0` to disable pathfinding entirely and avoid expensive bookkeeping. Recommended value for advanced pathfinding: `10`.

### [path_search_old]

- **Required**: False
- **Type**: integer
- **Default value**: `2`
- **Description**: Search aggressiveness for clients using legacy pathfinding interfaces. Recommended value for advanced pathfinding: `7`.

### [fee_default]

- **Required**: False
- **Type**: integer (drops)
- **Default value**: Internal default
- **Description**: The base cost of a transaction in drops. Used when the server has no other source of fee information, such as when signing transactions offline.

### [workers]

- **Required**: False
- **Type**: integer
- **Default value**: Number of CPU threads + 2 (networked); `1` (standalone)
- **Description**: Number of threads for processing work submitted by peers and clients.

### [io_workers]

- **Required**: False
- **Type**: integer
- **Default value**: Implementation-defined
- **Description**: Number of threads for processing raw inbound and outbound I/O.

### [prefetch_workers]

- **Required**: False
- **Type**: integer
- **Default value**: Implementation-defined
- **Description**: Number of threads for performing nodestore prefetching.

### [network_id]

- **Required**: False
- **Type**: integer or string
- **Default value**: None (not explicitly tracking a network)
- **Constraints**: Unsigned integer `0` to `4294967295`, or a well-known name.
- **Description**: Specifies the network this server is configured to connect to and track. The server will not establish connections with servers explicitly configured for another network. Well-known names: `main` (0), `testnet` (1), `devnet` (2).

### [ledger_replay]

- **Required**: False
- **Type**: flag (0 or 1)
- **Default value**: `0`
- **Description**: Enables or disables the ledger replay feature. When enabled, the server downloads only the ledger header and transactions (instead of the full ledger) and rebuilds the ledger by applying transactions to the parent ledger.

---

## 4. HTTPS Client

### [ssl_verify]

- **Required**: False
- **Type**: flag (0 or 1)
- **Default value**: `1`
- **Description**: Controls whether HTTPS client connections verify certificates. `0` = certificates are not verified. `1` = certificates are checked. Setting to `0` may be useful for development with self-signed certificates.

### [ssl_verify_file]

- **Required**: False
- **Type**: string (file path)
- **Default value**: None
- **Description**: Path to the certificate verification file for HTTPS client requests.

### [ssl_verify_dir]

- **Required**: False
- **Type**: string (directory path)
- **Default value**: None
- **Description**: Path to a file or directory containing root certificates the server will accept for verifying HTTP servers. Used only for outbound HTTPS client connections.

---

## 5. Database

### [node_db]

The primary persistent datastore for xrpld, including transaction metadata, account states, and ledger headers.

### [node_db] type

- **Required**: True
- **Type**: string
- **Default value**: None
- **Constraints**: The value must be one of: `NuDB`, `RocksDB`.
- **Description**: The backend database type. `NuDB` is a high-performance database optimized for xrpld and SSDs — it maintains speed regardless of history size. `RocksDB` is an alternative for systems without SSDs — its performance degrades with more data, so online delete is recommended. Spinning disks are not recommended for either type. See [Capacity Planning](https://xrpl.org/capacity-planning.html#node-db-type).

### [node_db] path

- **Required**: True
- **Type**: string (directory path)
- **Default value**: None
- **Description**: Location to store the database files. Partial paths are relative to the location of the `xrpld.cfg` file.

### [node_db] fast_load

- **Required**: False
- **Type**: flag (0 or 1)
- **Default value**: `0`
- **Description**: If set, loads the last persisted ledger from disk upon process start before syncing to the network. Likely to improve performance if sufficient IOPS capacity is available.

### [node_db] earliest_seq

- **Required**: False
- **Type**: integer
- **Default value**: `32570`
- **Constraints**: The minimum value is `1`.
- **Description**: The earliest allowed ledger sequence. Default matches the XRP Ledger mainnet's earliest sequence. Alternate networks may set a different value.

### [node_db] online_delete

- **Required**: False
- **Type**: integer
- **Default value**: None (disabled)
- **Constraints**: The minimum value is `256`. Must be greater than or equal to `ledger_history`.
- **Description**: Enables automatic purging of older ledger information. Maintains at least this number of ledger records online.

### [node_db] nudb_block_size

- **Required**: False
- **Type**: integer
- **Default value**: `4096`
- **Constraints**: Must be a power of 2 between `4096` and `32768`.
- **Description**: **EXPERIMENTAL.** Block size in bytes for NuDB storage (NuDB only). `4096` is optimal for most standard SSDs. `8192`-`16384` may improve performance on high-end NVMe SSDs and copy-on-write filesystems (ZFS, Btrfs). `32768` is for high-performance enterprise scenarios. **Cannot be changed after database creation without a full rebuild.** Performance testing is recommended before deploying non-default values.

### [node_db] advisory_delete

- **Required**: False
- **Type**: flag (0 or 1)
- **Default value**: `0`
- **Description**: Only relevant when `online_delete` is defined. When enabled (`1`), the administrative RPC call `can_delete` is required to enable online deletion. Automatic deletion does not run if the last deletion was on a ledger greater than the current `can_delete` setting.

### [node_db] delete_batch

- **Required**: False
- **Type**: integer
- **Default value**: `100`
- **Description**: Only relevant when `online_delete` is defined. Controls the maximum size of each batch when automatically purging SQLite records. Larger batches lock databases longer, which may cause the node to lose sync.

### [node_db] back_off_milliseconds

- **Required**: False
- **Type**: integer (milliseconds)
- **Default value**: `100`
- **Description**: Only relevant when `online_delete` is defined. Number of milliseconds to wait between online_delete batches to allow other functions to catch up.

### [node_db] age_threshold_seconds

- **Required**: False
- **Type**: integer (seconds)
- **Default value**: `60`
- **Description**: Only relevant when `online_delete` is defined. The online delete process only runs if the latest validated ledger is younger than this number of seconds.

### [node_db] recovery_wait_seconds

- **Required**: False
- **Type**: integer (seconds)
- **Default value**: `5`
- **Description**: Only relevant when `online_delete` is defined. The online delete process checks periodically that xrpld is in sync and the validated ledger is fresh. If not, it sleeps for this number of seconds before rechecking.

### [import_db]

- **Required**: False
- **Type**: section (same format as `[node_db]`)
- **Default value**: None
- **Description**: Settings for performing a one-time import. Used with the `--import` command line option to migrate the specified database into the current `[node_db]` database.

### [database_path]

- **Required**: False
- **Type**: string (directory path)
- **Default value**: `db` (relative to `xrpld.cfg` location)
- **Description**: Path to the bookkeeping SQLite databases. The server creates and maintains 4-5 SQLite databases at this location. Partial paths are relative to the xrpld executable location.

### [sqlite]

Optional tuning settings for the SQLite databases.

> [!WARNING]
> These settings can significantly affect data integrity, particularly in systemic failure scenarios. Leave at defaults unless experiencing performance issues. A warning is logged on startup if `ledger_history` exceeds 10,000,000 ledgers and settings are less safe than default.

### [sqlite] safety_level

- **Required**: False
- **Type**: string
- **Default value**: `high`
- **Constraints**: The value must be one of: `high`, `low`.
- **Description**: `high` tunes SQLite for maximum reliability (`journal_mode=wal`, `synchronous=normal`, `temp_store=file`). `low` trades reliability for speed (`journal_mode=memory`, `synchronous=off`, `temp_store=memory`). Cannot be combined with individual `journal_mode`, `synchronous`, or `temp_store` settings.

### [sqlite] journal_mode

- **Required**: False
- **Type**: string
- **Default value**: `wal`
- **Constraints**: The value must be one of: `delete`, `truncate`, `persist`, `memory`, `wal`, `off`.
- **Description**: Controls the journal mode for database transactions. `wal` (write-ahead log) is the default. `memory` saves disk I/O but risks corruption if xrpld crashes during a transaction. Cannot be combined with `safety_level`. See [SQLite docs](https://www.sqlite.org/pragma.html#pragma_journal_mode).

### [sqlite] synchronous

- **Required**: False
- **Type**: string
- **Default value**: `normal`
- **Constraints**: The value must be one of: `off`, `normal`, `full`, `extra`.
- **Description**: Controls synchronous mode. `normal` works well with `wal` journal mode. `off` increases speed but risks data corruption if the host crashes before writing to disk. Cannot be combined with `safety_level`. See [SQLite docs](https://www.sqlite.org/pragma.html#pragma_synchronous).

### [sqlite] temp_store

- **Required**: False
- **Type**: string
- **Default value**: `file`
- **Constraints**: The value must be one of: `default`, `file`, `memory`.
- **Description**: Controls where temporary database tables and indices are stored. Cannot be combined with `safety_level`. See [SQLite docs](https://www.sqlite.org/pragma.html#pragma_temp_store).

### [sqlite] page_size

- **Required**: False
- **Type**: integer
- **Default value**: `4096`
- **Constraints**: Must be a power of 2 between `512` and `65536`.
- **Description**: The page size in bytes for the `transaction.db` file. See [SQLite docs](https://www.sqlite.org/pragma.html#pragma_page_size).

### [sqlite] journal_size_limit

- **Required**: False
- **Type**: integer
- **Default value**: `1582080`
- **Description**: Limits the size of the journal for the `transaction.db` file. When the limit is reached, older entries are deleted. See [SQLite docs](https://www.sqlite.org/pragma.html#pragma_journal_size_limit).

---

## 6. Diagnostics

### [debug_logfile]

- **Required**: False
- **Type**: string (file path)
- **Default value**: None (no debug log)
- **Description**: Specifies where the debug logfile is kept. Unless an absolute path is specified, the path is relative to the directory containing the configuration file.

### [insight]

Configuration for the Beast Insight stats collection module.

### [insight] server

- **Required**: False
- **Type**: string
- **Default value**: None (statistics not collected)
- **Constraints**: Currently only `statsd` is supported.
- **Description**: The server type to send metrics to. When set to `statsd`, sends UDP packets to a StatsD daemon. If missing or unknown, statistics are not collected. See [StatsD spec](https://github.com/b/statsd_spec).

### [insight] address

- **Required**: False (required when `server=statsd`)
- **Type**: string (IP:port)
- **Default value**: None
- **Description**: The UDP address and port of the listening StatsD server, in `n.n.n.n:port` format.

### [insight] prefix

- **Required**: False
- **Type**: string
- **Default value**: None
- **Description**: A string prepended to each collected metric. Used to distinguish between different running instances of xrpld.

### [perf]

Configuration for performance logging.

### [perf] perf_log

- **Required**: False
- **Type**: string (file path)
- **Default value**: None (performance logging disabled)
- **Description**: Pathname of the performance log file. A relative pathname logs relative to the configuration directory. Required to enable performance logging. Writes JSON-formatted performance data periodically.

### [perf] log_interval

- **Required**: False
- **Type**: integer (seconds)
- **Default value**: `1`
- **Description**: Number of seconds between writing to the performance log.

---

## 7. Voting

### [voting]

Settings used during voting ledgers. These become part of the instance's vote during consensus.

### [voting] reference_fee

- **Required**: False
- **Type**: integer (drops)
- **Default value**: Internal default
- **Description**: The cost of the reference transaction fee in drops. The reference transaction is the simplest form (an XRP payment between two parties). Do not change without understanding the consequences.

### [voting] account_reserve

- **Required**: False
- **Type**: integer (drops)
- **Default value**: Internal default
- **Description**: The account reserve requirement in drops. The portion of an account's XRP balance at or below the reserve may only be spent on transaction fees, not transferred out. Do not change without understanding the consequences.

### [voting] owner_reserve

- **Required**: False
- **Type**: integer (drops)
- **Default value**: Internal default
- **Description**: The owner reserve in drops — the amount of XRP reserved per ledger item owned by the account (trust lines, open orders, tickets). Do not change without understanding the consequences.

---

## 8. Misc Settings

### [node_size]

- **Required**: False
- **Type**: string
- **Default value**: Auto-determined based on RAM and CPU cores
- **Constraints**: The value must be one of: `tiny`, `small`, `medium`, `large`, `huge`.
- **Description**: Tunes the server based on expected load and available memory. The server auto-determines this based on RAM and CPU cores:

| RAM     | 1 Core | 2-3 Cores | 4+ Cores |
| ------- | ------ | --------- | -------- |
| < ~8GB  | tiny   | tiny      | tiny     |
| < ~12GB | tiny   | small     | small    |
| < ~16GB | tiny   | small     | medium   |
| < ~24GB | tiny   | small     | large    |
| < ~32GB | tiny   | small     | huge     |

### [signing_support]

- **Required**: False
- **Type**: boolean (`true` or `false`)
- **Default value**: `false`
- **Description**: Controls whether the server accepts `sign` and `sign_for` commands from remote users. Discouraged even over secure protocols because it requires sending the signing secret to the server. Has no effect on command-line `sign`/`sign_for` options.

### [crawl]

Controls what data is reported through the `/crawl` endpoint. See [Peer Crawler](https://xrpl.org/peer-crawler.html).

### [crawl] (top-level flag)

- **Required**: False
- **Type**: flag (0 or 1)
- **Default value**: `1`
- **Description**: Enable or disable access to `/crawl` requests entirely.

### [crawl] overlay

- **Required**: False
- **Type**: flag (0 or 1)
- **Default value**: `1`
- **Description**: Report information about connected peers, similar to the `peers` RPC API.

### [crawl] server

- **Required**: False
- **Type**: flag (0 or 1)
- **Default value**: `1`
- **Description**: Report information about the local server, similar to the `server_state` RPC API.

### [crawl] counts

- **Required**: False
- **Type**: flag (0 or 1)
- **Default value**: `0`
- **Description**: Report local server health counters, similar to the `get_counts` RPC API.

### [crawl] unl

- **Required**: False
- **Type**: flag (0 or 1)
- **Default value**: `1`
- **Description**: Report validator list information, similar to the `validators` and `validator_list_sites` RPC APIs.

### [vl]

Controls what data is reported through the `/vl` endpoint.

### [vl] enable

- **Required**: False
- **Type**: flag (0 or 1)
- **Default value**: `1`
- **Description**: Enable or disable access to `/vl` requests.

### [beta_rpc_api]

- **Required**: False
- **Type**: flag (0 or 1)
- **Default value**: `0`
- **Description**: Enable or disable the beta API version for JSON-RPC and WebSocket. The beta API contains breaking changes not ready for public consumption.
