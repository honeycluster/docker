# Configuration Options

All options are **overridable via environment variables**. The **envt** image applies them at startup via envsubst from `/opt/xrpl/templates` into `/opt/xrpl/etc`. The **base** and **slim** images do not run injection; set options by editing your own `xrpld.cfg` / `validators.txt` or by using a custom entrypoint.

---

## Network and Size

These are the primary configuration options that determine network behavior and resource usage.

### Network

| Variable | Default | Allowable Values | Description |
|----------|---------|------------------|-------------|
| `NETWORK` | `MAINNET` | `MAINNET`, `TESTNET`, `DEVNET` | Selects network-specific defaults. Sets `NETWORK_ID`, `VALIDATOR_LIST_SITES`, `VALIDATOR_LIST_KEYS`, and `IPS` (for testnet/devnet). |

**Network-specific defaults:**

| Variable | Mainnet | Testnet | Devnet |
|----------|---------|---------|--------|
| `NETWORK_ID` | `0` | `testnet` | `devnet` |
| `VALIDATOR_LIST_SITES` | `https://unl.xrplf.org` | `https://vl.altnet.rippletest.net` | `https://vl.devnet.rippletest.net` |
| `VALIDATOR_LIST_KEYS` | `ED42AEC58B701EEBB77356FFFEC26F83C1F0407263530F068C7C73D392C7E06FD1` | `ED264807102805220DA0F312E71FC2C69E1552C9C5790F6C25E3729DEB573D5860` | `EDBB54B0D9AEE071BB37784AF5A9E7CC49AC7A0EFCE868C54532BCB966B9CFC13B` |
| `IPS` | — | `s.altnet.rippletest.net 51235` | `s.devnet.rippletest.net 51235` |

### Size

| Variable | Default | Allowable Values | Description |
|----------|---------|------------------|-------------|
| `SIZE` | `DEFAULT` | `DEFAULT`, `SMALL`, `MEDIUM`, `LARGE`, `HUGE`, `FULL` | Determines ledger retention and node size configuration. `FULL` disables `online_delete`/`advisory_delete` and sets `[fetch_depth]`/`[ledger_history]` to `full`. |
| `LEDGER_RETENTION` | Set from `SIZE` | Numeric (e.g., `512`, `1024`, `2048`, `4096`) or `full` | Ledger history depth / `online_delete` value. Automatically set by `SIZE` but can be overridden directly. |
| `NODE_SIZE` | — | `tiny`, `small`, `medium`, `large`, `huge` | Optional. If set, emits `[node_size]` section with this value. Independent of `SIZE`. |

**Size to Ledger Retention mapping:**

| SIZE | LEDGER_RETENTION (default) |
|------|----------------------------|
| `DEFAULT` | `512` |
| `SMALL` | `512` |
| `MEDIUM` | `1024` |
| `LARGE` | `2048` |
| `HUGE` | `4096` |
| `FULL` | `full` |

**Size behavior:**
- `SIZE=FULL`: Sets `FETCH_DEPTH=full`, `LEDGER_HISTORY=full`, and omits `online_delete`/`advisory_delete` from `[node_db]`.
- Other sizes: `FETCH_DEPTH=full`, `LEDGER_HISTORY` from `LEDGER_RETENTION`, and includes `online_delete`/`advisory_delete` in `[node_db]`.

---

## Overriding and Mount Location

- **Override:** Set the corresponding **environment variable** when running the container (e.g. `-e NETWORK=DEVNET`, `-e SIZE=MEDIUM`). These take precedence over built‑in defaults.
- **Config mount:** To supply your own **config files** (`xrpld.cfg`, `validators.txt`), mount them (or their parent directory) at **`/opt/xrpl/etc`**.
  - **Envt:** The entrypoint runs template injection **into** `/opt/xrpl/etc` on each start. Files you place there will be **overwritten** unless you change or replace the entrypoint.
  - **Base and slim:** These images do **not** run injection. Mounting `/opt/xrpl/etc` with your own files is supported; they will **not** be overwritten.

---

## Paths

| Variable | Default | Description |
|----------|---------|-------------|
| `CONFIG_DIR` | `/opt/xrpl` | Config root. Templates (envt only) live at `CONFIG_DIR/templates`; resolved configs at `CONFIG_DIR/etc`. |
| `CONFIG_FILE` | `$CONFIG_DIR/etc/xrpld.cfg` | Path to `xrpld.cfg` used by `rippled --conf`. |
| `VALIDATORS_FILE` | `$CONFIG_DIR/etc/validators.txt` | Path to `validators.txt`. |

---

## Ports

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT_PEER` | `51235` | Peer port. |
| `PORT_RPC` | `51234` | RPC port. |
| `PORT_WSS` | `6005` | WebSocket port. |
| `PORT_GRPC` | `50051` | gRPC port. |
| `PORT_RPC_ADMIN_LOCAL` | `5005` | Local admin RPC port. |
| `PORT_WSS_ADMIN_LOCAL` | `6006` | Local admin WebSocket port. |

---

## Admin and SSL

| Variable | Default | Description |
|----------|---------|-------------|
| `ADMIN_IPS` | `127.0.0.1` | Allowed admin IPs. |
| `RIPPLE_CERTS_DIR` | `$CONFIG_DIR/certs` | Directory for SSL certs. |
| `SSL_GENERATE` | `0` | Set to `1` to generate self‑signed certs in `RIPPLE_CERTS_DIR` if missing. Allowable values: `0` or `1`. |
| `SSL_GENERATE_OVERWRITE` | `0` | Set to `1` to overwrite existing certs when `SSL_GENERATE=1`. Allowable values: `0` or `1`. |
| `SSL_CERT_CN` | `localhost` | CN (Common Name) for generated certs. |
| `SSL_CERT_DAYS` | `365` | Validity in days for generated certs. |
| `SSL_CERT_SUBJ` | — | Full `-subj` for `openssl req`; overrides CN if set. |
| `SSL_CHAIN_ENABLED` | `0` | Set to `1` to add `ssl_chain` in config. Allowable values: `0` or `1`. |
| `SSL_CERT_PATH` | — | If set, use this as the cert directory (skips generation and `RIPPLE_CERTS_DIR` for resolution). |

---

## [fetch_depth] and [ledger_history]

| Variable | Default | Description |
|----------|---------|-------------|
| `FETCH_DEPTH` | `full` | `[fetch_depth]` value. For `SIZE=FULL`, forced to `full`. |
| `LEDGER_HISTORY` | from `LEDGER_RETENTION` or `512` | `[ledger_history]` value. For `SIZE=FULL`, forced to `full`. |

---

## [node_db] and database

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_DB_TYPE` | `NuDB` | Database type. Allowable values: `NuDB`, `Postgres`. When `Postgres`, enables `[ledger_tx_tables]` section. |
| `NODE_DB_PATH` | `/opt/xrpl/db/nudb` | Database path for NuDB. |
| `NODE_DB_ADVISORY_DELETE` | `0` | `advisory_delete` in `[node_db]`. Omitted when `SIZE=FULL`. |
| `NODE_DB_ONLINE_DELETE` | From `LEDGER_RETENTION` or `512` | `online_delete` in `[node_db]`. Omitted when `SIZE=FULL`. |
| `DATABASE_PATH` | `/opt/xrpl/db` | `[database_path]` base directory. |
| `PG_CONNINFO` | — | Postgres connection string when `NODE_DB_TYPE=Postgres`. Required for Postgres. |
| `USE_TX_TABLES` | `0` | `use_tx_tables` when `NODE_DB_TYPE=Postgres`. Set to `1` to enable transaction tables. |

---

## Validators

Network-specific validator defaults are applied when `NETWORK` is set (see Network section above). These can be overridden by setting the variable yourself.

| Variable | Default | Description |
|----------|---------|-------------|
| `VALIDATOR_LIST_SITES` | Set by `NETWORK` | Validator list site URL. Override to use custom validator list. |
| `VALIDATOR_LIST_KEYS` | Set by `NETWORK` | Validator list public key. Override to use custom validator list. |

---

## Optional [sections]

Set the variable to non‑empty to enable; leave unset to omit.

| Variable | Config section | Description |
|----------|----------------|-------------|
| `VALIDATION_QUORUM` | `[validation_quorum]` | Section body. |
| `PEERS_MAX` | `[peers_max]` | Section body. |
| `VALIDATION_SEED` | `[validation_seed]` | Section body. |
| `VALIDATORS_SITE` | `[validators_site]` | Section body. |
| `IPS` | Set by `NETWORK` (testnet/devnet) | Newline‑separated peer list for `[ips]` section. Can be set by network defaults or overridden. |
| `IPS_FIXED` | — | Section body for `[ips_fixed]`. Set to non-empty value to enable. |

---

## Other

| Variable | Default | Description |
|----------|---------|-------------|
| `DEBUG_LOGFILE` | `/opt/xrpl/log/debug.log` | Debug log path. |
| `SNTP_SERVERS` | `pool.ntp.org` | `[sntp_servers]`. |
| `PEER_PRIVATE` | `0` | `[peer_private]`. Allowable values: `0` or `1`. |
| `RPC_STARTUP_CMDS` | `{ "command": "log_level", "severity": "info" }` | JSON array for `[rpc_startup]`. |
| `REPORTING_MODE` | — | If set, adds `[reporting]` and `[etl_source]`. |
| `ETL_SOURCE_GRPC_PORT` | `50051` | Used when `REPORTING_MODE` is set. |
| `ETL_SOURCE_WS_PORT` | `6005` | Used when `REPORTING_MODE` is set. |
| `ETL_SOURCE_IP` | `127.0.0.1` | Used when `REPORTING_MODE` is set. |
| `RIPPLE_BIN` | `/opt/xrpl/bin/rippled` | Binary used by the startup script (`rippled` or path). |

---

## Config mount: `/opt/xrpl/etc`

- **Envt:** The entrypoint writes `xrpld.cfg` and `validators.txt` into `/opt/xrpl/etc` from templates. Mounting `/opt/xrpl/etc` will persist those generated files; anything you put there will be **overwritten** on the next start unless you switch to a non‑injecting entrypoint (base/slim-style) or change the logic.
- **Base and slim:** No injection. Mount `/opt/xrpl/etc` with your own `xrpld.cfg` and `validators.txt`; they will **not** be overwritten.

Example (base or slim; own configs):

```bash
docker run -d \
  -v /host/xrpld.cfg:/opt/xrpl/etc/xrpld.cfg \
  -v /host/validators.txt:/opt/xrpl/etc/validators.txt \
  -v xrpld-db:/opt/xrpl/db \
  -p 51234:51234 -p 6005:6005 \
  honeycluster/xrpld-slim:latest
```
