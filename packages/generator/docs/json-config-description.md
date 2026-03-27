# xrpld JSON Config Description

This document provides a list of all available JSON configuration properties for the xrpld config generator in detail.

> [!NOTE]
> Dot notation in configuration key names represents nested fields.
> For example, **presets.network** refers to the _network_ field inside the _presets_ object.
> If a key name includes "[]", it indicates that the nested field is an array (e.g., `server.ports.[]`).
>
> The generator uses a preset-based merge system. Defaults are resolved in this order:
> **common < size < role < verbosity < network < user input**.
> User-provided values always take highest priority.

---

## Presets

Presets provide sensible defaults for common deployment scenarios. All preset fields are optional — when omitted, the generator uses its own defaults.

### presets.network

- **Required**: False
- **Type**: string
- **Default value**: `mainnet`
- **Constraints**: The value must be one of: `mainnet`, `testnet`, `devnet`.
- **Description**: The XRP Ledger network this node connects to. Sets the appropriate `network_id`, validator list sites/keys, and seed peer IPs. Mainnet uses `network_id: 0` with VL sites at `vl.ripple.com` and `unl.xrplf.org`. Testnet uses `network_id: 1` with seed IP `s.altnet.rippletest.net 51235`. Devnet uses `network_id: 2` with seed IP `s.devnet.rippletest.net 51235`.

### presets.role

- **Required**: False
- **Type**: string
- **Default value**: `stock`
- **Constraints**: The value must be one of: `stock`, `validator`, `ephemeral`, `sentry`, `clio`, `feature`, `hub`.
- **Description**: The operational role of the node. Each role configures appropriate defaults:
  - `stock` — General-purpose node with no special defaults.
  - `validator` — Sets `peer_private=1`, restricts ports to peer + admin-local only. Warns if no `validator_token` is configured.
  - `ephemeral` — No special defaults; for short-lived nodes.
  - `sentry` — Sets `peer_private=0`. Warns if `ips_fixed` is not configured (should point to the validator it protects).
  - `clio` — Sets `ledger_history=full`, adds gRPC port bound to `0.0.0.0` with `secure_gateway=0.0.0.0`.
  - `feature` — Sets `amendment_majority_time=5 minutes` for fast amendment testing.
  - `hub` — Sets `peer_private=0` for maximum connectivity.

### presets.size

- **Required**: False
- **Type**: string
- **Default value**: `medium`
- **Constraints**: The value must be one of: `tiny`, `small`, `medium`, `large`, `huge`.
- **Description**: Tunes the node for expected load and available resources. Each size sets `node_db`, `ledger_history`, `peers_max`, and optionally `workers`/`io_workers`:

| Size   | online_delete | ledger_history | peers_max | workers | io_workers |
| ------ | ------------- | -------------- | --------- | ------- | ---------- |
| tiny   | 256           | 256            | 10        | —       | —          |
| small  | 256           | 256            | 15        | —       | —          |
| medium | 512           | 512            | 21        | —       | —          |
| large  | 2048          | 2048           | 50        | 4       | 2          |
| huge   | 8192          | full           | 300       | 8       | 4          |

All sizes use NuDB at `/var/lib/xrpld/db/nudb` with `advisory_delete=0`.

### presets.verbosity

- **Required**: False
- **Type**: string
- **Default value**: `warning`
- **Constraints**: The value must be one of: `silent`, `fatal`, `error`, `warning`, `info`, `debug`, `trace`.
- **Description**: Sets the server log level via an `rpc_startup` command. Maps to the `log_level` RPC command with the corresponding severity.

---

## Server

### server.ports.[]

- **Required**: False (defaults provided by role/common presets)
- **Type**: array of port configuration objects
- **Default value**: Six default ports (see below)
- **Description**: Defines the listening ports for the xrpld server. When provided, this completely replaces the default port list. Use `port_overrides` instead if you only need to modify specific ports.

**Default ports (common preset):**

| Name                 | Port  | IP        | Protocol   | Notes                    |
| -------------------- | ----- | --------- | ---------- | ------------------------ |
| port_peer            | 51235 | 0.0.0.0   | peer       | —                        |
| port_rpc             | 5005  | 0.0.0.0   | http,https | —                        |
| port_rpc_admin_local | 5006  | 127.0.0.1 | http       | admin=127.0.0.1          |
| port_wss             | 6005  | 0.0.0.0   | ws,wss     | —                        |
| port_ws_admin_local  | 6006  | 127.0.0.1 | ws         | admin=127.0.0.1          |
| port_grpc            | 50051 | 0.0.0.0   | grpc       | secure_gateway=127.0.0.1 |

### server.ports.[].name

- **Required**: True
- **Type**: string
- **Default value**: None
- **Constraints**: Must start with a letter and contain only letters and numbers.
- **Description**: A unique identifier for the port. Used as the section name in the generated `.cfg` file and as the key for `port_overrides`.

### server.ports.[].ip

- **Required**: False
- **Type**: string (IP address)
- **Default value**: None
- **Constraints**: Must be a valid IP address.
- **Description**: The IP address of the network interface to bind to. Use `0.0.0.0` for all IPv4 interfaces, or `::` for all IPv4 and IPv6 interfaces.

### server.ports.[].port

- **Required**: True
- **Type**: integer
- **Default value**: None
- **Constraints**: The minimum value is `1`. The maximum value is `65535`. No duplicate port numbers allowed across all ports.
- **Description**: The port number for this listening port.

### server.ports.[].protocol

- **Required**: True
- **Type**: string (comma-separated)
- **Default value**: None
- **Constraints**: The value must be one or more of: `http`, `https`, `ws`, `wss`, `peer`, `grpc`. Cannot mix `ws`/`wss` with `http`/`https`/`peer` on the same port. Only one port may use `peer`.
- **Description**: The protocol(s) supported on this port. Multiple protocols can be specified as a comma-separated string (e.g. `"http,https"`).

### server.ports.[].limit

- **Required**: False
- **Type**: integer
- **Default value**: None (unlimited)
- **Description**: Maximum number of connected clients. New connections are refused once the limit is reached.

### server.ports.[].admin

- **Required**: False
- **Type**: string (comma-separated IPs/subnets)
- **Default value**: None
- **Description**: IP addresses or subnets granted administrative command access. **Security Warning**: Using `0.0.0.0` or `::` exposes the admin interface to all IPs.

### server.ports.[].admin_user

- **Required**: False
- **Type**: string
- **Default value**: None
- **Description**: Username required in the submitted JSON for administrative command requests.

### server.ports.[].admin_password

- **Required**: False
- **Type**: string
- **Default value**: None
- **Description**: Password required in the submitted JSON for administrative command requests.

### server.ports.[].secure_gateway

- **Required**: False
- **Type**: string (comma-separated IPs/subnets)
- **Default value**: None
- **Description**: IP addresses allowed to pass `X-User` and `X-Forwarded-For` headers. A non-empty `X-User` header lifts resource controls but does not grant admin access.

### server.ports.[].ssl_key

- **Required**: False
- **Type**: string (file path)
- **Default value**: None
- **Description**: Path to the SSL key file in PEM format for this port.

### server.ports.[].ssl_cert

- **Required**: False
- **Type**: string (file path)
- **Default value**: None
- **Description**: Path to the SSL certificate file in PEM format for this port.

### server.ports.[].ssl_chain

- **Required**: False
- **Type**: string (file path)
- **Default value**: None
- **Description**: Path to the SSL certificate chain file for this port. Required if the certificate includes intermediates.

### server.ports.[].ssl_ciphers

- **Required**: False
- **Type**: string (OpenSSL cipher list format)
- **Default value**: None (auto-configured)
- **Description**: Controls the ciphers supported over SSL on this port.

### server.ports.[].user

- **Required**: False
- **Type**: string
- **Default value**: None
- **Description**: Username for HTTP Basic Authentication on this port.

### server.ports.[].password

- **Required**: False
- **Type**: string
- **Default value**: None
- **Description**: Password for HTTP Basic Authentication on this port.

### server.ports.[].send_queue_limit

- **Required**: False
- **Type**: integer
- **Default value**: `100`
- **Constraints**: The minimum value is `1`. The maximum value is `65535`.
- **Description**: A WebSocket will disconnect when its send queue exceeds this limit.

### server.ports.[].permessage_deflate

- **Required**: False
- **Type**: boolean
- **Default value**: None
- **Description**: Enables or disables permessage-deflate extension negotiations for WebSocket connections.

### server.ports.[].client_max_window_bits

- **Required**: False
- **Type**: integer
- **Default value**: None
- **Constraints**: The minimum value is `9`. The maximum value is `15`.
- **Description**: Client maximum window bits for permessage-deflate. See [RFC 7692](https://tools.ietf.org/html/rfc7692).

### server.ports.[].server_max_window_bits

- **Required**: False
- **Type**: integer
- **Default value**: None
- **Constraints**: The minimum value is `9`. The maximum value is `15`.
- **Description**: Server maximum window bits for permessage-deflate. See [RFC 7692](https://tools.ietf.org/html/rfc7692).

### server.ports.[].client_no_context_takeover

- **Required**: False
- **Type**: boolean
- **Default value**: None
- **Description**: Controls client no-context-takeover for permessage-deflate.

### server.ports.[].server_no_context_takeover

- **Required**: False
- **Type**: boolean
- **Default value**: None
- **Description**: Controls server no-context-takeover for permessage-deflate.

### server.ports.[].compress_level

- **Required**: False
- **Type**: integer
- **Default value**: None
- **Constraints**: The minimum value is `0`. The maximum value is `9`.
- **Description**: WebSocket compression level. `0` = least, `9` = most. Levels 1-3 use a fast algorithm; 4-9 use a more compact but CPU-intensive algorithm.

### server.ports.[].memory_level

- **Required**: False
- **Type**: integer
- **Default value**: None
- **Constraints**: The minimum value is `1`. The maximum value is `9`.
- **Description**: Relative amount of memory used for intermediate compression data.

---

### port_overrides

- **Required**: False
- **Type**: object (keyed by port name)
- **Default value**: None
- **Description**: Allows partial modification of individual ports without replacing the entire port list. Keys are port names (e.g. `port_peer`), and values are partial port configuration objects that are merged into the matching port. Any field from the port configuration can be overridden except `name`.

**Example:**

```json
{
  "port_overrides": {
    "port_peer": { "port": 2459 },
    "port_rpc": { "ip": "127.0.0.1", "admin": "127.0.0.1" }
  }
}
```

### server_comment

- **Required**: False
- **Type**: string
- **Default value**: None
- **Description**: A comment string inserted into the generated `[server]` section of the `.cfg` file. Used by role presets to add warnings (e.g. the validator role warns about exposing ports).

---

## Database

### node_db.type

- **Required**: True (when `node_db` is specified)
- **Type**: string
- **Default value**: `NuDB` (from size presets)
- **Constraints**: The value must be one of: `NuDB`, `RocksDB`.
- **Description**: The backend database type. `NuDB` is optimized for SSDs and maintains speed regardless of history size. `RocksDB` is an alternative for non-SSD systems but its performance degrades with more data — using `online_delete` is recommended.

### node_db.path

- **Required**: True (when `node_db` is specified)
- **Type**: string (directory path)
- **Default value**: `/var/lib/xrpld/db/nudb` (from size presets)
- **Description**: Location to store the database files.

### node_db.online_delete

- **Required**: False
- **Type**: integer
- **Default value**: Varies by size preset (256-8192)
- **Constraints**: The minimum value is `256`. Must be greater than or equal to `ledger_history` (when numeric).
- **Description**: Enables automatic purging of older ledger information. Maintains at least this number of ledger records.

### node_db.advisory_delete

- **Required**: False
- **Type**: integer (0 or 1)
- **Default value**: `0` (from size presets)
- **Description**: When enabled (`1`), the `can_delete` RPC call is required before online deletion runs. Only relevant when `online_delete` is defined.

### node_db.fast_load

- **Required**: False
- **Type**: integer (0 or 1)
- **Default value**: None
- **Description**: If set, loads the last persisted ledger from disk on startup before syncing to the network. May improve performance with sufficient IOPS capacity.

### node_db.earliest_seq

- **Required**: False
- **Type**: integer
- **Default value**: None (defaults to `32570` in xrpld)
- **Constraints**: The minimum value is `1`.
- **Description**: The earliest allowed ledger sequence. Default matches XRP Ledger mainnet. Alternate networks may set a different value.

### node_db.delete_batch

- **Required**: False
- **Type**: integer
- **Default value**: None (defaults to `100` in xrpld)
- **Description**: Maximum batch size when automatically purging SQLite records during online delete. Only relevant when `online_delete` is defined.

### node_db.back_off_milliseconds

- **Required**: False
- **Type**: integer
- **Default value**: None (defaults to `100` in xrpld)
- **Description**: Milliseconds to wait between online delete batches. Only relevant when `online_delete` is defined.

### node_db.age_threshold_seconds

- **Required**: False
- **Type**: integer
- **Default value**: None (defaults to `60` in xrpld)
- **Description**: Online delete only runs if the latest validated ledger is younger than this number of seconds. Only relevant when `online_delete` is defined.

### node_db.recovery_wait_seconds

- **Required**: False
- **Type**: integer
- **Default value**: None (defaults to `5` in xrpld)
- **Description**: Seconds to sleep between health checks during online delete. Only relevant when `online_delete` is defined.

### node_db.nudb_block_size

- **Required**: False
- **Type**: integer
- **Default value**: None (defaults to `4096` in xrpld)
- **Constraints**: Must be a power of 2 between `4096` and `32768`.
- **Description**: **Experimental.** Block size in bytes for NuDB storage (NuDB only). Cannot be changed after database creation without a full rebuild.

### database_path

- **Required**: True
- **Type**: string (directory path)
- **Default value**: `/var/lib/xrpld/db`
- **Description**: Path to the bookkeeping SQLite databases. The server creates and maintains 4-5 SQLite databases at this location.

### import_db.type

- **Required**: False
- **Type**: string
- **Default value**: None
- **Constraints**: The value must be one of: `NuDB`, `RocksDB`.
- **Description**: Backend type for the import database. Used with the `--import` command line option for one-time data migration.

### import_db.path

- **Required**: False
- **Type**: string (directory path)
- **Default value**: None
- **Description**: Location of the import database files.

### import_db.online_delete

- **Required**: False
- **Type**: integer
- **Default value**: None
- **Constraints**: The minimum value is `256`.
- **Description**: Online delete setting for the import database.

### import_db.advisory_delete

- **Required**: False
- **Type**: integer (0 or 1)
- **Default value**: None
- **Description**: Advisory delete setting for the import database.

### sqlite.ledger_page_size

- **Required**: False
- **Type**: integer
- **Default value**: None (defaults to `4096` in xrpld)
- **Constraints**: The minimum value is `512`. Must be a power of 2.
- **Description**: Page size in bytes for the ledger SQLite database.

### sqlite.transaction_page_size

- **Required**: False
- **Type**: integer
- **Default value**: None (defaults to `4096` in xrpld)
- **Constraints**: The minimum value is `512`. Must be a power of 2.
- **Description**: Page size in bytes for the transaction SQLite database.

### sqlite.account_page_size

- **Required**: False
- **Type**: integer
- **Default value**: None (defaults to `4096` in xrpld)
- **Constraints**: The minimum value is `512`. Must be a power of 2.
- **Description**: Page size in bytes for the account SQLite database.

---

## Logging

### debug_logfile

- **Required**: False
- **Type**: string (file path)
- **Default value**: `/var/log/xrpld/debug.log`
- **Description**: Path to the debug log file. Unless absolute, the path is relative to the configuration file directory.

---

## SSL / TLS

### ssl_key

- **Required**: False
- **Type**: string (file path)
- **Default value**: None
- **Description**: Path to the SSL key file in PEM format. Applied globally to the `[server]` section as a default for all ports. If no SSL files are specified and secure protocols are used, xrpld generates a self-signed certificate.

### ssl_cert

- **Required**: False
- **Type**: string (file path)
- **Default value**: None
- **Description**: Path to the SSL certificate file in PEM format. Applied globally as a default for all ports.

### ssl_chain

- **Required**: False
- **Type**: string (file path)
- **Default value**: None
- **Description**: Path to the SSL certificate chain file. Required if the certificate includes intermediate certificates.

### ssl_ciphers

- **Required**: False
- **Type**: string (OpenSSL cipher list format)
- **Default value**: None (auto-configured)
- **Description**: Global SSL cipher configuration applied to all ports.

### ssl_verify

- **Required**: False
- **Type**: string
- **Default value**: `1`
- **Constraints**: The value must be one of: `0`, `1`.
- **Description**: Controls whether outbound HTTPS client connections verify certificates. `0` disables verification (a warning is emitted). `1` enables verification.

### ssl_verify_file

- **Required**: False
- **Type**: string (file path)
- **Default value**: None
- **Description**: Path to the certificate verification file for HTTPS client requests.

### ssl_verify_dir

- **Required**: False
- **Type**: string (directory path)
- **Default value**: None
- **Description**: Path to a directory containing root certificates for verifying HTTPS servers.

### ssl_cert_email

- **Required**: False
- **Type**: string (email address)
- **Default value**: None
- **Constraints**: Must be a valid email address format.
- **Description**: Email address to include in auto-generated SSL certificates. Used by the SSL certificate generator.

### ssl_cert_validity_days

- **Required**: False
- **Type**: integer
- **Default value**: None
- **Constraints**: The minimum value is `1`.
- **Description**: Number of days the auto-generated SSL certificate is valid for.

---

## Time Synchronization

### sntp_servers.[]

- **Required**: False
- **Type**: array of strings
- **Default value**: `["pool.ntp.org"]`
- **Description**: List of SNTP server hostnames for time synchronization.

---

## Node Settings

### node_size

- **Required**: False
- **Type**: string
- **Default value**: Set by `presets.size` (default `medium`)
- **Constraints**: The value must be one of: `tiny`, `small`, `medium`, `large`, `huge`.
- **Description**: Tunes the server based on expected load and available memory. Overrides the value set by `presets.size`. See the [presets.size](#presetssize) table for resource allocations.

### ledger_history

- **Required**: False
- **Type**: string
- **Default value**: Set by `presets.size` (default `512`)
- **Constraints**: Must be a non-negative integer, `full`, or `none`. Must be less than or equal to `node_db.online_delete` when both are numeric.
- **Description**: The number of past ledgers to acquire on startup and maintain while running. Set to `full` for complete history, or `none` for servers that don't need to serve clients. A warning is emitted if set above 10,000,000 with custom SQLite settings.

### fetch_depth

- **Required**: False
- **Type**: string
- **Default value**: `full`
- **Constraints**: Must be a non-negative integer, `full`, or `none`. Values below `128` trigger a warning.
- **Description**: The number of past ledgers to serve to peers requesting historical data. Set to `full` for no limit.

---

## Peer Settings

### peer_private

- **Required**: False
- **Type**: string
- **Default value**: `0` (overridden by role: `1` for validator)
- **Constraints**: The value must be one of: `0`, `1`.
- **Description**: `0` = request peers to broadcast your address (normal). `1` = request peers not to broadcast your address; only connect to configured peers. A warning is emitted if set to `1` without `ips_fixed` configured.

### network_id

- **Required**: False
- **Type**: string
- **Default value**: Set by `presets.network` (`0` for mainnet, `1` for testnet, `2` for devnet)
- **Constraints**: Must be `0`-`4294967295` or one of: `main`, `testnet`, `devnet`.
- **Description**: The network this server connects to. Prevents connections to servers configured for a different network.

### network_quorum

- **Required**: False
- **Type**: integer
- **Default value**: None (auto-determined)
- **Description**: The minimum number of trusted validations needed for a consensus ledger.

---

## RPC

### rpc_startup.[]

- **Required**: False
- **Type**: array of JSON objects
- **Default value**: Set by `presets.verbosity` (e.g. `[{ "command": "log_level", "severity": "warning" }]`)
- **Description**: A list of RPC commands to execute at server startup. Each entry is a JSON object with `command` and any additional parameters.

### rpc_allow_remote

- **Required**: False
- **Type**: string
- **Default value**: None
- **Description**: Controls whether RPC commands are allowed from remote connections.

---

## Validators

### validators_file

- **Required**: False
- **Type**: string (file path)
- **Default value**: None
- **Description**: Path to a file containing trusted validator keys. The generator writes a `validators.txt` file with VL sites and keys from the `vl` configuration.

### validation_seed

- **Required**: False
- **Type**: string
- **Default value**: None
- **Constraints**: Mutually exclusive with `validator_token`.
- **Description**: The validation seed used to generate the validation key pair. If neither `validation_seed` nor `validator_token` is provided, the node will not participate in validation (a warning is emitted).

### validator_token

- **Required**: False
- **Type**: string (base64-encoded blob)
- **Default value**: None
- **Constraints**: Mutually exclusive with `validation_seed`.
- **Description**: An alternative to `validation_seed` that allows validation without storing keys on the network-connected server. Preferred over `validation_seed` for production validators.

### validator_key_revocation

- **Required**: False
- **Type**: string (base64-encoded blob)
- **Default value**: None
- **Description**: A revocation blob that notifies peers a validator key is no longer trustworthy.

### validators.[]

- **Required**: False
- **Type**: array of strings
- **Default value**: None
- **Description**: List of trusted validator public keys to include in the `[validators]` section of `validators.txt`.

### vl.validator_list_sites.[]

- **Required**: False
- **Type**: array of strings (URLs)
- **Default value**: Set by `presets.network` (e.g. `["https://vl.ripple.com", "https://unl.xrplf.org"]` for mainnet)
- **Description**: URLs serving recommended validator lists. Written to the `[validator_list_sites]` section of `validators.txt`.

### vl.validator_list_keys.[]

- **Required**: False
- **Type**: array of strings (public keys)
- **Default value**: Set by `presets.network`
- **Description**: Public keys of trusted validator list publishers. Written to the `[validator_list_keys]` section of `validators.txt`. Only lists signed by these keys are accepted.

### vl.validator_list_key_sources.[]

- **Required**: False
- **Type**: array of strings
- **Default value**: Set by `presets.network` (e.g. `["vl.ripple.com", "unl.xrplf.org"]` for mainnet)
- **Description**: Human-readable labels for the corresponding validator list keys. Used as comments in the generated `validators.txt`.

---

## Peers

### ips.[]

- **Required**: False
- **Type**: array of strings (`"host port"`)
- **Default value**: Set by `presets.network` (e.g. `["s.altnet.rippletest.net 51235"]` for testnet)
- **Description**: List of hostnames or IPs where the Ripple protocol is served. One entry per element in format `"hostname port"` or just `"hostname"` (defaults to port 2459).

### ips_fixed.[]

- **Required**: False
- **Type**: array of strings (`"host port"`)
- **Default value**: None
- **Description**: IP addresses or hostnames to always maintain peer connections with. Useful for private networks, validator-sentry setups, or cluster peers. A port must be specified.

### peers_max

- **Required**: False
- **Type**: integer
- **Default value**: Set by `presets.size` (10-300)
- **Description**: The maximum number of desired peer connections (incoming + outgoing). Cluster and fixed peers do not count towards this total.

### peers_in_max

- **Required**: False
- **Type**: integer
- **Default value**: None
- **Description**: Maximum number of incoming peer connections. If not specified, the server manages this automatically within `peers_max`.

### peers_out_max

- **Required**: False
- **Type**: integer
- **Default value**: None
- **Description**: Maximum number of outgoing peer connections. If not specified, the server manages this automatically within `peers_max`.

---

## Overlay

### overlay.ip_limit

- **Required**: False
- **Type**: integer
- **Default value**: None (auto-configured by xrpld)
- **Constraints**: Must be a non-negative integer.
- **Description**: Maximum incoming peer connections from a single non-private (RFC 1918) IP. Hard and soft upper limits are enforced.

### overlay.max_unknown_time

- **Required**: False
- **Type**: integer (seconds)
- **Default value**: None (defaults to `600` in xrpld)
- **Constraints**: Must be a non-negative integer.
- **Description**: Maximum time in seconds an outbound connection may stay in the "unknown" tracking state.

### overlay.max_peers_per_ip

- **Required**: False
- **Type**: integer
- **Default value**: None
- **Constraints**: Must be a non-negative integer.
- **Description**: Maximum number of peer connections allowed from a single IP address.

### overlay.connect_timeout

- **Required**: False
- **Type**: integer (seconds)
- **Default value**: None
- **Constraints**: Must be a non-negative integer.
- **Description**: Connection timeout for outbound peer connections.

### overlay.handshake_timeout

- **Required**: False
- **Type**: integer (seconds)
- **Default value**: None
- **Constraints**: Must be a non-negative integer.
- **Description**: Handshake timeout for peer connections.

### compression

- **Required**: False
- **Type**: string
- **Default value**: None
- **Constraints**: The value must be one of: `true`, `false`.
- **Description**: Enables or disables compression for peer-to-peer communications. Saves bandwidth at the cost of greater CPU usage.

### node_seed

- **Required**: False
- **Type**: string (seed or passphrase)
- **Default value**: None (auto-generated by xrpld)
- **Description**: Forces a particular node seed for clustering. Format is the same as `validation_seed`.

### cluster_nodes.[]

- **Required**: False
- **Type**: array of strings
- **Default value**: None
- **Description**: Node public keys (starting with `n`) to extend full trust to. Only use for nodes under common administration. A name can be appended after a space.

---

## Transactions

### max_transactions

- **Required**: False
- **Type**: integer
- **Default value**: None (defaults to `250` in xrpld)
- **Constraints**: The minimum value is `100`. The maximum value is `1000`.
- **Description**: Maximum number of transactions in the job queue.

### transaction_queue.ledgers_in_queue

- **Required**: False
- **Type**: integer
- **Default value**: None (defaults to `20` in xrpld)
- **Description**: Queue is limited to this number of average ledgers' worth of transactions.

### transaction_queue.minimum_queue_size

- **Required**: False
- **Type**: integer
- **Default value**: None (defaults to `2000` in xrpld)
- **Description**: The queue always holds at least this number of transactions, regardless of `ledgers_in_queue`.

### transaction_queue.retry_sequence_percent

- **Required**: False
- **Type**: integer
- **Default value**: None (defaults to `25` in xrpld)
- **Description**: When replacing a queued transaction (same sequence), the new fee must be this percentage higher.

### transaction_queue.minimum_escalation_multiplier

- **Required**: False
- **Type**: integer
- **Default value**: None (defaults to `500` in xrpld)
- **Description**: Minimum multiplier for fee escalation calculations at ledger close.

### transaction_queue.minimum_txn_in_ledger

- **Required**: False
- **Type**: integer
- **Default value**: None (defaults to `5` in xrpld)
- **Description**: Minimum transactions allowed at minimum fee before escalation.

### transaction_queue.minimum_txn_in_ledger_standalone

- **Required**: False
- **Type**: integer
- **Default value**: None (defaults to `1000` in xrpld)
- **Description**: Same as `minimum_txn_in_ledger` but for standalone mode.

### transaction_queue.target_txn_in_ledger

- **Required**: False
- **Type**: integer
- **Default value**: None (defaults to `50` in xrpld)
- **Description**: Target number of transactions at minimum fee the queue works toward while consensus is healthy.

### transaction_queue.maximum_txn_in_ledger

- **Required**: False
- **Type**: integer
- **Default value**: None (no maximum)
- **Description**: Optional maximum transactions at minimum fee before escalation.

### transaction_queue.maximum_txn_per_account

- **Required**: False
- **Type**: integer
- **Default value**: None (defaults to `10` in xrpld)
- **Description**: Maximum queued transactions per account.

### transaction_queue.minimum_last_ledger_buffer

- **Required**: False
- **Type**: integer
- **Default value**: None (defaults to `2` in xrpld)
- **Description**: Minimum buffer between `LastLedgerSequence` and the current open ledger sequence.

### transaction_queue.zero_basefee_transaction_feelevel

- **Required**: False
- **Type**: integer
- **Default value**: None (defaults to `256000` in xrpld)
- **Description**: Fee level assigned to zero-base-fee transactions (e.g. SetRegularKey password recovery).

### transaction_queue.normal_consensus_increase_percent

- **Required**: False
- **Type**: integer
- **Default value**: None (defaults to `20` in xrpld)
- **Description**: When consensus is healthy and the ledger exceeds expectations, expected size increases by this percentage.

### transaction_queue.slow_consensus_decrease_percent

- **Required**: False
- **Type**: integer
- **Default value**: None (defaults to `50` in xrpld)
- **Description**: When consensus is slow, expected ledger size decreases by this percentage.

---

## Relay

### relay_proposals

- **Required**: False
- **Type**: string
- **Default value**: None (defaults to `trusted` in xrpld)
- **Constraints**: The value must be one of: `all`, `trusted`, `drop_untrusted`.
- **Description**: Controls relay and processing of proposals from validators not on the server's UNL.

### relay_validations

- **Required**: False
- **Type**: string
- **Default value**: None (defaults to `all` in xrpld)
- **Constraints**: The value must be one of: `all`, `trusted`, `drop_untrusted`.
- **Description**: Controls relay and processing of validations from validators not on the server's UNL.

---

## Voting

### voting.reference_fee

- **Required**: False
- **Type**: integer (drops)
- **Default value**: None (xrpld internal default)
- **Constraints**: Must be a positive integer.
- **Description**: The cost of the reference transaction fee in drops. Do not change without understanding the consequences.

### voting.account_reserve

- **Required**: False
- **Type**: integer (drops)
- **Default value**: None (xrpld internal default)
- **Constraints**: Must be a positive integer.
- **Description**: The account reserve requirement in drops. Do not change without understanding the consequences.

### voting.owner_reserve

- **Required**: False
- **Type**: integer (drops)
- **Default value**: None (xrpld internal default)
- **Constraints**: Must be a positive integer.
- **Description**: The owner reserve per ledger item in drops. Do not change without understanding the consequences.

---

## Path Finding

### path_search

- **Required**: False
- **Type**: integer
- **Default value**: None (defaults to `2` in xrpld)
- **Constraints**: Must be non-negative.
- **Description**: Default search aggressiveness for path finding. Higher values use exponentially more resources. Recommended for advanced pathfinding: `7`.

### path_search_old

- **Required**: False
- **Type**: integer
- **Default value**: None (defaults to `2` in xrpld)
- **Constraints**: Must be non-negative.
- **Description**: Search aggressiveness for legacy pathfinding interfaces. Recommended for advanced pathfinding: `7`.

### path_search_fast

- **Required**: False
- **Type**: integer
- **Default value**: None (defaults to `2` in xrpld)
- **Constraints**: Must be non-negative.
- **Description**: Minimum search aggressiveness for path finding. Recommended for advanced pathfinding: `2`.

### path_search_max

- **Required**: False
- **Type**: integer
- **Default value**: None (defaults to `3` in xrpld)
- **Constraints**: Must be non-negative.
- **Description**: Maximum search aggressiveness for path finding. Set to `0` to disable pathfinding. Recommended for advanced pathfinding: `10`.

---

## Fees

### fee_default

- **Required**: False
- **Type**: integer (drops)
- **Default value**: None (xrpld internal default)
- **Description**: Base cost of a transaction in drops. Used when the server has no other fee information source.

---

## Workers

### workers

- **Required**: False
- **Type**: integer
- **Default value**: Set by `presets.size` for large/huge (4/8), otherwise auto-determined by xrpld
- **Constraints**: The minimum value is `1`. The maximum value is `1024`.
- **Description**: Number of threads for processing work submitted by peers and clients.

### io_workers

- **Required**: False
- **Type**: integer
- **Default value**: Set by `presets.size` for large/huge (2/4), otherwise auto-determined by xrpld
- **Constraints**: The minimum value is `1`. The maximum value is `1024`.
- **Description**: Number of threads for processing raw inbound and outbound I/O.

### prefetch_workers

- **Required**: False
- **Type**: integer
- **Default value**: None (auto-determined by xrpld)
- **Constraints**: The minimum value is `1`. The maximum value is `1024`.
- **Description**: Number of threads for performing nodestore prefetching.

### sweep_interval

- **Required**: False
- **Type**: integer (seconds)
- **Default value**: None
- **Constraints**: The minimum value is `10`. The maximum value is `600`.
- **Description**: Interval in seconds for the server to sweep (clean up) internal caches.

---

## Amendments

### amendments.[]

- **Required**: False
- **Type**: array of strings
- **Default value**: None
- **Description**: List of amendment IDs to enable on the server.

### amendment_majority_time

- **Required**: False
- **Type**: string
- **Default value**: None (overridden to `5 minutes` by `feature` role)
- **Description**: How long an amendment must hold a majority before it is enabled. Primarily useful for test networks.

### veto_amendments.[]

- **Required**: False
- **Type**: array of strings
- **Default value**: None
- **Description**: List of amendment IDs the server should vote against.

---

## Protocol

### signing_support

- **Required**: False
- **Type**: string
- **Default value**: None (defaults to `false` in xrpld)
- **Constraints**: The value must be one of: `true`, `false`.
- **Description**: Controls whether the server accepts remote `sign` and `sign_for` commands. **Deprecated** when set to `true` — use a standalone signing tool instead.

### beta_rpc_api

- **Required**: False
- **Type**: string
- **Default value**: None (defaults to `0` in xrpld)
- **Constraints**: The value must be one of: `0`, `1`.
- **Description**: Enables the beta API version for JSON-RPC and WebSocket. Contains breaking changes not ready for production.

### ledger_replay

- **Required**: False
- **Type**: string
- **Default value**: None (defaults to `0` in xrpld)
- **Constraints**: The value must be one of: `0`, `1`.
- **Description**: Enables the ledger replay feature. When enabled, the server downloads only headers and transactions, rebuilding ledgers by applying transactions to parent ledgers.

### websocket_ping_frequency

- **Required**: False
- **Type**: integer (seconds)
- **Default value**: None
- **Description**: Seconds between WebSocket ping messages. Used to detect disconnected clients.

### server_domain

- **Required**: False
- **Type**: string (domain name)
- **Default value**: None
- **Description**: The domain under which a TOML file applicable to this server can be found.

### elb_support

- **Required**: False
- **Type**: string
- **Default value**: None
- **Description**: Enables Elastic Load Balancer support for health checks.

---

## Advanced

### crawl.overlay

- **Required**: False
- **Type**: integer (0 or 1)
- **Default value**: None (defaults to `1` in xrpld)
- **Constraints**: The value must be `0` or `1`.
- **Description**: Report connected peer information via the `/crawl` endpoint.

### crawl.server

- **Required**: False
- **Type**: integer (0 or 1)
- **Default value**: None (defaults to `1` in xrpld)
- **Constraints**: The value must be `0` or `1`.
- **Description**: Report local server information via the `/crawl` endpoint.

### crawl.counts

- **Required**: False
- **Type**: integer (0 or 1)
- **Default value**: None (defaults to `0` in xrpld)
- **Constraints**: The value must be `0` or `1`.
- **Description**: Report server health counters via the `/crawl` endpoint.

### crawl.unl

- **Required**: False
- **Type**: integer (0 or 1)
- **Default value**: None (defaults to `1` in xrpld)
- **Constraints**: The value must be `0` or `1`.
- **Description**: Report validator list information via the `/crawl` endpoint.

### reduce_relay.vp_enable

- **Required**: False
- **Type**: integer (0 or 1)
- **Default value**: None
- **Constraints**: The value must be `0` or `1`.
- **Description**: Enables or disables validation/proposal relay reduction.

### reduce_relay.vp_squelch

- **Required**: False
- **Type**: integer
- **Default value**: None
- **Constraints**: Must be a non-negative integer.
- **Description**: Squelch duration for validation/proposal relay reduction.

### reduce_relay.tx_enable

- **Required**: False
- **Type**: integer (0 or 1)
- **Default value**: None
- **Constraints**: The value must be `0` or `1`.
- **Description**: Enables or disables transaction relay reduction.

### reduce_relay.tx_limit

- **Required**: False
- **Type**: integer
- **Default value**: None
- **Constraints**: Must be a non-negative integer.
- **Description**: Limit for transaction relay reduction.

### insight.server

- **Required**: False
- **Type**: string
- **Default value**: None
- **Constraints**: Currently only `statsd` is supported.
- **Description**: The StatsD server type for metrics collection. If missing, metrics are not collected.

### insight.address

- **Required**: False
- **Type**: string (IP address)
- **Default value**: None
- **Description**: The IP address of the StatsD server.

### insight.port

- **Required**: False
- **Type**: integer
- **Default value**: None
- **Description**: The port of the StatsD server.

### perf.peer_disconnect_interval

- **Required**: False
- **Type**: integer
- **Default value**: None
- **Description**: Interval for peer disconnect performance monitoring.

### perf.peer_signal_interval

- **Required**: False
- **Type**: integer
- **Default value**: None
- **Description**: Interval for peer signal performance monitoring.

---

## Output

The generator produces the following outputs:

| Output            | Description                                                |
| ----------------- | ---------------------------------------------------------- |
| `config`          | The generated `xrpld.cfg` file content                     |
| `validatorsTxt`   | The generated `validators.txt` file with VL sites and keys |
| `warnings`        | Array of warning messages from validation                  |
| `sslCertRequired` | Whether an SSL certificate needs to be generated           |
| `sslEnabled`      | Whether any port uses a secure protocol (https, wss)       |
