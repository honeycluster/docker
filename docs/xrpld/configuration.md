# xrpld Configuration Reference

Complete reference for all `xrpld.cfg` configuration parameters. Parameters are organized by functional section matching the configuration file layout.

---

## Table of Contents

1. [Server](#1-server)
2. [Peer Protocol](#2-peer-protocol)
3. [Protocol](#3-protocol)
4. [HTTPS Client](#4-https-client)
5. [Database](#5-database)
6. [Diagnostics](#6-diagnostics)
7. [Voting](#7-voting)
8. [Misc Settings](#8-misc-settings)

---

## 1. Server

The server section configures listening ports for inbound connections. xrpld supports multiple protocols on configurable "universal" ports.

> At least one server port must be defined to accept incoming network connections.

### `[server]`

A list of port names and optional key/value pairs. Each name references a corresponding `[port_name]` section. Names must start with a letter and contain only letters and numbers (not case-sensitive).

Optional key/value pairs in `[server]` apply as defaults to all ports unless overridden.

**Example:**

```cfg
[server]
port_peer
port_rpc_admin_local
port_ws_admin_local
ssl_key = /etc/ssl/private/server.key
ssl_cert = /etc/ssl/certs/server.crt
```

---

### Port Configuration `[<port_name>]`

Each port listed in `[server]` requires a corresponding section defining its behavior.

### ip

| Field       | Value                                      |
|-------------|--------------------------------------------|
| Required    | Yes                                        |
| Type        | `string` (IP address)                      |
| Default     | _none_                                     |
| Constraints | Valid IPv4 or IPv6 address                 |

IP address of the network interface to bind to. Use `0.0.0.0` for all IPv4 interfaces, or `::` for all IPv4 and IPv6 interfaces.

> If `ip` is `::`, incoming IPv4 connections appear as mapped IPv4 addresses.

### port

| Field       | Value              |
|-------------|--------------------|
| Required    | Yes                |
| Type        | `number`           |
| Default     | _none_             |
| Constraints | `1`..`65535`       |

The port number for this listening port.

### protocol

| Field       | Value                                             |
|-------------|---------------------------------------------------|
| Required    | Yes                                               |
| Type        | `string` (comma-separated list)                   |
| Default     | _none_                                            |
| Constraints | One or more of: `http`, `https`, `ws`, `wss`, `peer`, `grpc` |

Protocols to support on this port.

**Restrictions:**
- Only one port may support the `peer` protocol.
- A port cannot mix websocket (`ws`/`wss`) and non-websocket (`http`/`https`) protocols.
- `ws` and `wss` may coexist on the same port.

### limit

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `number`           |
| Default     | `0` (unlimited)    |
| Constraints | `0`..`65535`       |

Maximum number of connected clients. Once reached, new connections are refused until others disconnect. Set to `0` or omit for unlimited.

### admin

| Field       | Value                                  |
|-------------|----------------------------------------|
| Required    | No                                     |
| Type        | `string` (comma-separated IP list)     |
| Default     | _none_ (admin commands disabled)       |
| Constraints | Valid IP addresses or CIDR subnets     |

Grants administrative command access to the specified IP addresses or subnets. Subnets use slash notation (e.g., `10.0.0.0/8`).

> **Security Warning:** Setting `admin = 0.0.0.0` or `admin = ::` allows access from any IP address.

### secure_gateway

| Field       | Value                                  |
|-------------|----------------------------------------|
| Required    | No                                     |
| Type        | `string` (comma-separated IP list)     |
| Default     | _none_                                 |
| Constraints | Valid IP addresses or CIDR subnets     |

Allows specified addresses to pass `X-User` and `X-Forwarded-For` HTTP headers for session identification. A non-empty `X-User` lifts rate limiting ("tooBusy" errors) but does not grant admin access.

### user / password

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `string`           |
| Default     | _none_             |

HTTP Basic Authentication credentials required for HTTP/S requests. If either field is empty, no credentials are required.

### admin_user / admin_password

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `string`           |
| Default     | _none_             |

Credentials required in submitted JSON for administrative command requests on HTTP/S, WS, or WSS interfaces.

### ssl_key

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `string` (path)    |
| Default     | _auto-generated_   |

Path to the SSL private key file in PEM format. If not specified and secure protocols are selected, xrpld generates an internal self-signed certificate.

### ssl_cert

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `string` (path)    |
| Default     | _auto-generated_   |

Path to the SSL certificate file in PEM format. Not needed if `ssl_chain` includes the end certificate.

### ssl_chain

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `string` (path)    |
| Default     | _none_             |

Path to the certificate chain file. Required if the certificate includes intermediate CAs. May include the end certificate.

### ssl_ciphers

| Field       | Value                          |
|-------------|--------------------------------|
| Required    | No                             |
| Type        | `string`                       |
| Default     | _modern cipher suite_          |

OpenSSL cipher list format string controlling supported SSL ciphers. Only modify with specific cryptographic expertise.

### send_queue_limit

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `number`           |
| Default     | `100`              |
| Constraints | `1`..`65535`       |

WebSocket send queue limit. A WebSocket disconnects when its queue exceeds this value. Larger values may help with erratic disconnects but may impact server performance.

---

### WebSocket Compression Options

These settings configure the optional `permessage-deflate` extension and are meaningful only for ports with WebSocket protocols enabled.

### permessage_deflate

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `boolean`          |
| Default     | _disabled_         |

Enables `permessage-deflate` extension negotiation for WebSocket connections.

### client_max_window_bits / server_max_window_bits

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `number`           |
| Default     | `15`               |
| Constraints | `9`..`15`          |

Controls the LZ77 sliding window size for client/server compression. See [RFC 7692](https://tools.ietf.org/html/rfc7692).

### client_no_context_takeover / server_no_context_takeover

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `boolean`          |
| Default     | `false`            |

When enabled, the compression context is reset between messages. See [RFC 7692](https://tools.ietf.org/html/rfc7692).

### compress_level

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `number`           |
| Default     | `3`                |
| Constraints | `0`..`9`           |

Compression level. `0` = least, `9` = most. Levels 1-3 use a fast algorithm; 4-9 use a more compact but CPU-intensive algorithm.

### memory_level

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `number`           |
| Default     | _implementation default_ |
| Constraints | `1`..`9`           |

Relative amount of memory used for intermediate compression data. Higher values improve compression ratios at the cost of memory and CPU.

---

### `[rpc_startup]`

| Field       | Value                          |
|-------------|--------------------------------|
| Required    | No                             |
| Type        | `array` (JSON command objects)  |
| Default     | _none_                         |

List of RPC commands to execute at server startup.

**Example:**

```cfg
[rpc_startup]
{ "command": "log_level", "severity": "warning" }
{ "command": "log_level", "partition": "ripplecalc", "severity": "trace" }
```

### `[websocket_ping_frequency]`

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `number` (seconds) |
| Default     | _implementation default_ |

Interval in seconds between WebSocket ping messages, used to detect disconnected remote endpoints.

### `[server_domain]`

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `string`           |
| Default     | _none_             |

Domain name where a TOML file for this server can be found. The TOML should reference this server's public key in its `[nodes]` array.

---

## 2. Peer Protocol

Settings controlling the peer-to-peer overlay network used for transaction and validation propagation.

### `[compression]`

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `boolean`          |
| Default     | `false`            |

Enables peer-to-peer link compression. Saves bandwidth at the cost of CPU. Compression is only active between peers that both have it enabled. See [Enable Link Compression](https://xrpl.org/enable-link-compression.html).

### `[ips]`

| Field       | Value                            |
|-------------|----------------------------------|
| Required    | No                               |
| Type        | `array` (host/port strings)      |
| Default     | Built-in starter list            |

List of hostnames or IPs serving the Ripple protocol. One address per line; append a space and port number if not using the default port (2459). Many servers use the legacy port `51235`.

**Example:**

```cfg
[ips]
r.ripple.com 51235
192.168.0.1 2459
```

### `[ips_fixed]`

| Field       | Value                            |
|-------------|----------------------------------|
| Required    | No                               |
| Type        | `array` (host/port strings)      |
| Default     | _none_                           |

Addresses to which xrpld always maintains peer connections. Useful for private networks, validator-to-proxy setups, or clustering. A port must be specified.

### `[peer_private]`

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `boolean` (0/1)    |
| Default     | `0`                |

- `0`: Request peers to broadcast your address (normal operation).
- `1`: Request peers not to broadcast your address. Only connect to configured peers.

### `[peers_max]`

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `number`           |
| Default     | _auto-configured_  |

Maximum number of desired peer connections (incoming + outgoing). Cluster and fixed peers do not count toward this total. Implementation-enforced minimum applies.

### `[node_seed]`

| Field       | Value                                |
|-------------|--------------------------------------|
| Required    | No                                   |
| Type        | `string` (seed phrase or encoded key) |
| Default     | _auto-generated_                     |

Forces a specific node identity for clustering. Format matches `validation_seed`. Use `validation_create` to obtain one.

### `[cluster_nodes]`

| Field       | Value                            |
|-------------|----------------------------------|
| Required    | No                               |
| Type        | `array` (public keys)            |
| Default     | _none_                           |

Public keys (starting with `n`) of nodes to extend full trust to. Only use for nodes under common administration. Optionally add a space and a name after each key.

### `[max_transactions]`

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `number`           |
| Default     | `250`              |
| Constraints | `100`..`1000`      |

Maximum number of transactions in the job queue.

### `[overlay]`

Key/value pairs controlling the peer-to-peer overlay network.

### overlay.ip_limit

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `number`           |
| Default     | _auto-configured_  |

Maximum incoming peer connections from a single non-private (RFC 1918) IP address.

### overlay.max_unknown_time

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `number` (seconds) |
| Default     | `600`              |
| Constraints | `300`..`1800`      |

Maximum time an outbound connection may remain in the "unknown" tracking state.

### overlay.max_diverged_time

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `number` (seconds) |
| Default     | `300`              |
| Constraints | `60`..`900`        |

Maximum time an outbound connection may remain in the "diverged" tracking state.

### overlay.max_peers_per_ip

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `number`           |
| Default     | _auto-configured_  |

Maximum peer connections allowed per IP address.

### overlay.connect_timeout

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `number` (seconds) |
| Default     | _auto-configured_  |

Timeout for outbound peer connection attempts.

### overlay.handshake_timeout

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `number` (seconds) |
| Default     | _auto-configured_  |

Timeout for peer protocol handshake completion.

---

### `[transaction_queue]` (Experimental)

> This section is **experimental** and should not be used in production.

Key/value pairs for tuning transaction queue performance.

### transaction_queue.ledgers_in_queue

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `number`           |
| Default     | `20`               |

Queue capacity in terms of average ledgers' worth of transactions. Lower-fee transactions are dropped when the queue is full.

### transaction_queue.minimum_queue_size

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `number`           |
| Default     | `2000`             |

Minimum transaction capacity regardless of recent ledger sizes or `ledgers_in_queue`.

### transaction_queue.retry_sequence_percent

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `number` (percent) |
| Default     | `25`               |

When replacing a queued transaction (same sequence number), the new fee must exceed the original by at least this percentage, or meet the current open ledger fee.

### transaction_queue.minimum_escalation_multiplier

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `number`           |
| Default     | `500`              |

Minimum fee level multiplier for escalation calculations at ledger close.

### transaction_queue.minimum_txn_in_ledger

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `number`           |
| Default     | `5`                |

Minimum transactions allowed at the minimum fee before escalation kicks in.

### transaction_queue.minimum_txn_in_ledger_standalone

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `number`           |
| Default     | `1000`             |

Same as `minimum_txn_in_ledger` but for standalone mode.

### transaction_queue.target_txn_in_ledger

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `number`           |
| Default     | `50`               |

Target number of transactions at the minimum fee. The limit grows toward this value during healthy consensus. During unhealthy consensus, the limit is clamped at or below this value.

### transaction_queue.maximum_txn_in_ledger

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `number`           |
| Default     | _no maximum_       |

Optional upper limit on transactions at minimum fee before escalation.

### transaction_queue.maximum_txn_per_account

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `number`           |
| Default     | `10`               |

Maximum queued transactions per account.

### transaction_queue.minimum_last_ledger_buffer

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `number`           |
| Default     | `2`                |

A transaction's `LastLedgerSequence` must exceed the current open ledger sequence by at least this amount.

### transaction_queue.zero_basefee_transaction_feelevel

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `number`           |
| Default     | `256000`           |

Fee level assigned to zero-base-fee transactions (e.g., `SetRegularKey` password recovery) to avoid infinite fee level calculations.

### transaction_queue.normal_consensus_increase_percent

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `number` (percent) |
| Default     | `20`               |

When the ledger exceeds expected transaction count during healthy consensus, the expected size increases by this percentage.

### transaction_queue.slow_consensus_decrease_percent

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `number` (percent) |
| Default     | `50`               |

When consensus is slow, the expected ledger size decreases by this percentage.

---

## 3. Protocol

Settings affecting protocol-level behavior including validation, ledger management, and pathfinding.

### `[relay_proposals]`

| Field       | Value                                        |
|-------------|----------------------------------------------|
| Required    | No                                           |
| Type        | `string`                                     |
| Default     | `trusted`                                    |
| Constraints | `all`, `trusted`, `drop_untrusted`           |

Controls relay and processing of proposals from validators not on the server's UNL.

- `all` - Relay and process all proposals
- `trusted` - Relay only trusted, but locally process all
- `drop_untrusted` - Relay only trusted, do not process untrusted

### `[relay_validations]`

| Field       | Value                                        |
|-------------|----------------------------------------------|
| Required    | No                                           |
| Type        | `string`                                     |
| Default     | `all`                                        |
| Constraints | `all`, `trusted`, `drop_untrusted`           |

Controls relay and processing of validations from validators not on the server's UNL. Same options as `relay_proposals`.

### `[ledger_history]`

| Field       | Value                        |
|-------------|------------------------------|
| Required    | No                           |
| Type        | `number` or `string`         |
| Default     | `256`                        |
| Constraints | Integer, `none`, or `full`   |

Number of past ledgers to acquire on startup and maintain while running. Set to `none` for non-client-serving nodes, or `full` for complete history. Must be less than or equal to `online_delete` if used.

### `[fetch_depth]`

| Field       | Value                        |
|-------------|------------------------------|
| Required    | No                           |
| Type        | `number` or `string`         |
| Default     | `full`                       |
| Constraints | Integer or `full`            |

Number of past ledgers to serve to peers. Values below 128 are not recommended; below 32 can harm network stability.

### `[validation_seed]`

| Field       | Value                                |
|-------------|--------------------------------------|
| Required    | No                                   |
| Type        | `string` (seed phrase or encoded key) |
| Default     | _none_ (no validation)               |

Seed used to generate the validation public/private key pair. Use `validation_create` to obtain one.

### `[validator_token]`

| Field       | Value                      |
|-------------|----------------------------|
| Required    | No                         |
| Type        | `string` (base64 blob)     |
| Default     | _none_                     |

Alternative to `validation_seed` that allows validation without storing validator keys on the server. Generated by the external validator key tool.

### `[validator_key_revocation]`

| Field       | Value                      |
|-------------|----------------------------|
| Required    | No                         |
| Type        | `string` (base64 blob)     |
| Default     | _none_                     |

Revocation notice for a compromised validator key. Notifies peers that the revoked key should no longer be trusted.

### `[validators_file]`

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `string` (path)    |
| Default     | _none_             |

Path to a file containing `[validators]`, `[validator_list_sites]`, and `[validator_list_keys]` sections. Relative paths are relative to the `xrpld.cfg` location.

### `[path_search]`

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `number`           |
| Default     | `2`                |

Default search aggressiveness for pathfinding. Resource usage increases exponentially with size. Recommended value for advanced pathfinding: `7`.

### `[path_search_fast]`

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `number`           |
| Default     | `2`                |

Minimum search aggressiveness for pathfinding. Recommended value for advanced pathfinding: `2`.

### `[path_search_max]`

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `number`           |
| Default     | `3`                |

Maximum search aggressiveness for pathfinding. Set to `0` to disable pathfinding entirely. Recommended value for advanced pathfinding: `10`.

### `[path_search_old]`

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `number`           |
| Default     | `2`                |

Search aggressiveness for legacy pathfinding interfaces. Recommended value for advanced pathfinding: `7`.

### `[fee_default]`

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `number` (drops)   |
| Default     | _internal default_ |

Base cost of a transaction in drops. Used when the server has no other source of fee information (e.g., signing transactions offline).

### `[workers]`

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `number`           |
| Default     | _CPU threads + 2_  |

Number of threads for processing peer and client work. Defaults to 1 in standalone mode.

### `[io_workers]`

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `number`           |
| Default     | _auto-configured_  |

Number of threads for raw inbound/outbound I/O processing.

### `[prefetch_workers]`

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `number`           |
| Default     | _auto-configured_  |

Number of threads for nodestore prefetching.

### `[network_id]`

| Field       | Value                                |
|-------------|--------------------------------------|
| Required    | No                                   |
| Type        | `number` or `string`                 |
| Default     | _none_ (no explicit network)         |
| Constraints | `0`..`4294967295` or named network   |

Network identifier. The server will not connect to servers configured for a different network.

| Name      | ID  |
|-----------|-----|
| `main`    | `0` |
| `testnet` | `1` |
| `devnet`  | `2` |

### `[ledger_replay]`

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `boolean` (0/1)    |
| Default     | `0`                |

When enabled, ledger acquisition downloads only headers and transactions, then rebuilds by applying transactions to the parent ledger.

---

## 4. HTTPS Client

Settings for outbound HTTPS connections made by the xrpld server.

### `[ssl_verify]`

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `boolean` (0/1)    |
| Default     | `1`                |

- `0`: HTTPS client connections do not verify certificates.
- `1`: Certificates are verified for HTTPS client connections.

### `[ssl_verify_file]`

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `string` (path)    |
| Default     | _system default_   |

Path to the certificate verification file for outbound HTTPS client requests.

### `[ssl_verify_dir]`

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `string` (path)    |
| Default     | _system default_   |

Path to a directory containing root certificates for verifying outbound HTTPS connections.

---

## 5. Database

xrpld maintains SQLite bookkeeping databases and a NodeDB for current and historical ledger objects.

### `[node_db]`

Primary persistent storage for transaction metadata, account states, and ledger headers.

### node_db.type

| Field       | Value              |
|-------------|--------------------|
| Required    | **Yes**            |
| Type        | `string`           |
| Default     | _none_             |
| Constraints | `NuDB`, `RocksDB`  |

Backend storage engine.

- **NuDB** - High-performance database optimized for SSDs. Maintains speed regardless of history size. Recommended for non-validators with fast SSDs.
- **RocksDB** - General-purpose key/value store. Alternative for systems without SSDs. Performance degrades with data growth; use `online_delete`.

### node_db.path

| Field       | Value              |
|-------------|--------------------|
| Required    | **Yes**            |
| Type        | `string` (path)    |
| Default     | _none_             |

Location to store the database files.

### node_db.online_delete

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `number`           |
| Default     | _disabled_         |
| Constraints | Minimum `256`      |

Enables automatic purging of older ledger records. Maintains at least this many ledger records online. Must be >= `ledger_history`.

### node_db.advisory_delete

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `boolean` (0/1)    |
| Default     | `0`                |

When enabled, the `can_delete` admin RPC call is required to authorize online deletion. Deletion does not run automatically if the last deletion was on a ledger greater than the current `can_delete` setting.

### node_db.fast_load

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `boolean` (0/1)    |
| Default     | `0`                |

When enabled, loads the last persisted ledger from disk before syncing to the network. May improve startup performance if sufficient IOPS capacity is available.

### node_db.earliest_seq

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `number`           |
| Default     | `32570`            |
| Constraints | Minimum `1`        |

Earliest allowed ledger sequence. Default matches the XRP Ledger mainnet. Alternate networks may set a different value.

### node_db.nudb_block_size

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `number`           |
| Default     | `4096`             |
| Constraints | Power of 2, `4096`..`32768` |

**NuDB only.** Block size in bytes for NuDB storage. Cannot be changed after database creation without a full rebuild.

| Block Size | Recommended For |
|------------|----------------|
| `4096`     | Standard SSDs, ext4/NTFS/HFS+ (default, recommended) |
| `8192`-`16384` | High-end NVMe SSDs, ZFS/Btrfs |
| `32768`    | Enterprise environments with abundant RAM |

### node_db.delete_batch

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `number`           |
| Default     | `100`              |

Maximum batch size for SQLite record deletion during online delete. Larger batches hold database locks longer.

### node_db.back_off_milliseconds

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `number` (ms)      |
| Default     | `100`              |

Pause between online delete batches to allow other operations to proceed.

### node_db.age_threshold_seconds

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `number` (seconds) |
| Default     | `60`               |

Online delete only runs if the latest validated ledger is younger than this threshold.

### node_db.recovery_wait_seconds

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `number` (seconds) |
| Default     | `5`                |

Sleep interval between health checks during online delete when the server is out of sync or the validated ledger is stale.

---

### `[database_path]`

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `string` (path)    |
| Default     | `db/` (relative to config) |

Path to the bookkeeping SQLite databases. If omitted, a `db` directory is created alongside `xrpld.cfg`.

---

### `[import_db]`

Settings for one-time database import using the `--import` CLI option. Same key/value format as `[node_db]`.

### import_db.type

| Field       | Value              |
|-------------|--------------------|
| Required    | Yes (if importing) |
| Type        | `string`           |
| Constraints | `NuDB`, `RocksDB`  |

### import_db.path

| Field       | Value              |
|-------------|--------------------|
| Required    | Yes (if importing) |
| Type        | `string` (path)    |

### import_db.online_delete

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `number`           |

### import_db.advisory_delete

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `boolean` (0/1)    |

---

### `[sqlite]`

Tuning settings for SQLite bookkeeping databases.

> **Warning:** These settings affect data integrity. Only modify if experiencing performance issues during normal operation or online delete.

### sqlite.safety_level

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `string`           |
| Default     | `high`             |
| Constraints | `high`, `low`      |

- `high`: `journal_mode=wal`, `synchronous=normal`, `temp_store=file`
- `low`: `journal_mode=memory`, `synchronous=off`, `temp_store=memory`

Cannot be combined with individual `journal_mode`, `synchronous`, or `temp_store` settings.

### sqlite.journal_mode

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `string`           |
| Default     | `wal`              |
| Constraints | `delete`, `truncate`, `persist`, `memory`, `wal`, `off` |

SQLite journal mode. `memory` saves I/O but risks corruption on crash. See [SQLite docs](https://www.sqlite.org/pragma.html#pragma_journal_mode).

### sqlite.synchronous

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `string`           |
| Default     | `normal`           |
| Constraints | `off`, `normal`, `full`, `extra` |

SQLite synchronous mode. `off` is fastest but risks data corruption on host crash. See [SQLite docs](https://www.sqlite.org/pragma.html#pragma_synchronous).

### sqlite.temp_store

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `string`           |
| Default     | `file`             |
| Constraints | `default`, `file`, `memory` |

Where SQLite stores temporary tables and indices. See [SQLite docs](https://www.sqlite.org/pragma.html#pragma_temp_store).

### sqlite.page_size

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `number`           |
| Default     | `4096`             |
| Constraints | Power of 2, `512`..`65536` |

Page size for the transaction.db file. See [SQLite docs](https://www.sqlite.org/pragma.html#pragma_page_size).

### sqlite.journal_size_limit

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `number`           |
| Default     | `1582080`          |

Maximum journal size for transaction.db. Older entries are deleted when the limit is reached. See [SQLite docs](https://www.sqlite.org/pragma.html#pragma_journal_size_limit).

---

## 6. Diagnostics

Settings for logging, metrics, and performance monitoring.

### `[debug_logfile]`

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `string` (path)    |
| Default     | _none_ (no log)    |

Path to the debug log file. Relative paths are relative to the config file directory.

### `[insight]`

Configuration for the stats collection module. Metrics are sent to an external StatsD daemon via UDP.

### insight.server

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `string`           |
| Default     | _none_ (disabled)  |
| Constraints | `statsd`           |

Stats server type. Currently only `statsd` is supported.

### insight.address

| Field       | Value              |
|-------------|--------------------|
| Required    | Yes (if server=statsd) |
| Type        | `string`           |

UDP address and port of the StatsD server in `n.n.n.n:port` format.

### insight.port

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `number`           |

Alternative port specification for the StatsD server.

### insight.prefix

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `string`           |
| Default     | _none_             |

String prepended to each metric to distinguish between running instances.

**Example:**

```cfg
[insight]
server=statsd
address=192.168.0.95:4201
prefix=my_validator
```

---

### `[perf]`

Performance logging configuration. Writes JSON-formatted performance data to a separate log file.

### perf.perf_log

| Field       | Value              |
|-------------|--------------------|
| Required    | Yes (to enable)    |
| Type        | `string` (path)    |
| Default     | _none_ (disabled)  |

Path to the performance log file. Required to enable performance logging.

### perf.log_interval

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `number` (seconds) |
| Default     | `1`                |

Interval between performance log entries.

---

## 7. Voting

Vote settings configure network-wide parameters. A single instance cannot enforce these unilaterally; they become part of the instance's vote during consensus.

### `[voting]`

### voting.reference_fee

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `number` (drops)   |
| Default     | _internal default_ |

Cost of the reference transaction (simplest XRP payment between two parties) in drops.

### voting.account_reserve

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `number` (drops)   |
| Default     | _internal default_ |

Minimum XRP balance that cannot be transferred out of an account (may only be spent on fees).

### voting.owner_reserve

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `number` (drops)   |
| Default     | _internal default_ |

XRP reserved per ledger item owned by the account (trust lines, open orders, tickets, etc.).

---

## 8. Misc Settings

### `[node_size]`

| Field       | Value                                       |
|-------------|---------------------------------------------|
| Required    | No                                          |
| Type        | `string`                                    |
| Default     | _auto-detected_                             |
| Constraints | `tiny`, `small`, `medium`, `large`, `huge`  |

Tunes server resource allocation based on expected load. Auto-detection uses available RAM and CPU cores:

|         | 1 Core | 2-3 Cores | 4+ Cores |
|---------|--------|-----------|----------|
| < 8 GB  | tiny   | tiny      | tiny     |
| < 12 GB | tiny   | small     | small    |
| < 16 GB | tiny   | small     | medium   |
| < 24 GB | tiny   | small     | large    |
| < 32 GB | tiny   | small     | huge     |

### `[signing_support]`

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `boolean`          |
| Default     | `false`            |

Enables `sign` and `sign_for` commands from remote users. Discouraged in production because it requires sending secrets to the server. Has no effect on CLI signing commands.

### `[crawl]`

Controls what data is reported through the `/crawl` endpoint. See [Peer Crawler](https://xrpl.org/peer-crawler.html).

### crawl.overlay

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `boolean` (0/1)    |
| Default     | `1`                |

Report peer connection information (similar to `peers` RPC).

### crawl.server

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `boolean` (0/1)    |
| Default     | `1`                |

Report local server information (similar to `server_state` RPC).

### crawl.counts

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `boolean` (0/1)    |
| Default     | `0`                |

Report server health counters (similar to `get_counts` RPC).

### crawl.unl

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `boolean` (0/1)    |
| Default     | `1`                |

Report validator list information (similar to `validators` and `validator_list_sites` RPC).

### `[beta_rpc_api]`

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `boolean` (0/1)    |
| Default     | `0`                |

Enables the beta API version for JSON-RPC and WebSocket. Contains breaking changes not ready for production.

### `[reduce_relay]`

Controls relay reduction to lower bandwidth usage.

### reduce_relay.vp_enable

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `boolean` (0/1)    |
| Default     | _auto-configured_  |

Enable validation/proposal relay reduction.

### reduce_relay.vp_squelch

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `boolean` (0/1)    |
| Default     | _auto-configured_  |

Enable squelching of redundant validation/proposal messages.

### reduce_relay.tx_enable

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `boolean` (0/1)    |
| Default     | _auto-configured_  |

Enable transaction relay reduction.

### reduce_relay.tx_limit

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `number`           |
| Default     | _auto-configured_  |

Maximum transaction relay count.

### `[sntp_servers]`

| Field       | Value                        |
|-------------|------------------------------|
| Required    | No                           |
| Type        | `array` (hostnames)          |
| Default     | _built-in list_              |

List of SNTP (time) servers for clock synchronization.

### `[amendments]`

| Field       | Value                        |
|-------------|------------------------------|
| Required    | No                           |
| Type        | `array` (amendment hashes)   |
| Default     | _none_                       |

List of amendment hashes this server supports.

### `[veto_amendments]`

| Field       | Value                        |
|-------------|------------------------------|
| Required    | No                           |
| Type        | `array` (amendment hashes)   |
| Default     | _none_                       |

List of amendment hashes this server vetoes.

### `[validators]`

| Field       | Value                        |
|-------------|------------------------------|
| Required    | No                           |
| Type        | `array` (public keys)        |
| Default     | _none_                       |

List of trusted validator public keys, one per line.

### `[elb_support]`

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `boolean` (0/1)    |
| Default     | `0`                |

Enable support for Elastic Load Balancer health checks.

### `[amendment_majority_time]`

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `string`           |
| Default     | _internal default_ |

Duration an amendment must hold majority before activation.

### `[rpc_allow_remote]`

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `boolean` (0/1)    |
| Default     | `0`                |

Allow RPC commands from remote connections.

### `[sweep_interval]`

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `number` (seconds) |
| Default     | _internal default_ |

Interval for sweeping stale data from caches.

---

## Generator SSL Options

These parameters are specific to the `@honeycluster/xrpld-cfg-gen` generator and control automatic SSL certificate generation.

### ssl_cert_email

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `string`           |
| Default     | _none_             |

Email address embedded in the generated self-signed SSL certificate.

### ssl_cert_validity_days

| Field       | Value              |
|-------------|--------------------|
| Required    | No                 |
| Type        | `number`           |
| Default     | `365`              |

Validity period in days for the generated self-signed SSL certificate.
