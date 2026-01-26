#!/bin/bash
# Default environment variable values for xrpld/rippled.
# Override via environment variables. All are exported for envsubst and child processes.
# Optional [sections] are built as compound vars (e.g. SSL_LINES); empty when not applicable.

# ---------------------------------------------------------------------------
# Paths: CONFIG_DIR (config root), CONFIG_FILE, VALIDATORS_FILE
# ---------------------------------------------------------------------------
export CONFIG_DIR="${CONFIG_DIR:-/opt/xrpl}"
export CONFIG_FILE="${CONFIG_FILE:-$CONFIG_DIR/etc/xrpld.cfg}"
export VALIDATORS_FILE="${VALIDATORS_FILE:-$CONFIG_DIR/etc/validators.txt}"

# ---------------------------------------------------------------------------
# Ports: peer, rpc, wss, grpc, rpc_admin_local, wss_admin_local
# ---------------------------------------------------------------------------
export PORT_PEER="${PORT_PEER:-51235}"
export PORT_RPC="${PORT_RPC:-51234}"
export PORT_WSS="${PORT_WSS:-6005}"
export PORT_GRPC="${PORT_GRPC:-50051}"
export PORT_RPC_ADMIN_LOCAL="${PORT_RPC_ADMIN_LOCAL:-5005}"
export PORT_WSS_ADMIN_LOCAL="${PORT_WSS_ADMIN_LOCAL:-6006}"

# ---------------------------------------------------------------------------
# Admin: allowed IPs. Protocol (http/https, ws/wss) derived in build_ssl_derived after ssl.sh
# ---------------------------------------------------------------------------
export ADMIN_IPS="${ADMIN_IPS:-127.0.0.1}"

# ---------------------------------------------------------------------------
# SSL input variables (used by ssl.sh and build_ssl_derived)
# Certs dir: CONFIG_DIR/certs; overridable via RIPPLE_CERTS_DIR.
# SSL_CERT_PATH: set by user to use existing certs, or set by ssl.sh when
# generating (SSL_GENERATE=1) or when existing rippled.pem/rippled.crt found.
# ---------------------------------------------------------------------------
export RIPPLE_CERTS_DIR="${RIPPLE_CERTS_DIR:-$CONFIG_DIR/certs}"
export SSL_GENERATE="${SSL_GENERATE:-0}"
export SSL_GENERATE_OVERWRITE="${SSL_GENERATE_OVERWRITE:-0}"
export SSL_CERT_CN="${SSL_CERT_CN:-localhost}"
export SSL_CERT_DAYS="${SSL_CERT_DAYS:-365}"
export SSL_CERT_SUBJ="${SSL_CERT_SUBJ:-}"
export SSL_CHAIN_ENABLED="${SSL_CHAIN_ENABLED:-0}"

# SSL-derived (SSL_LINES, PORT_RPC_PROTOCOL, PORT_WSS_PROTOCOL, SSL_VERIFY) are
# built by build_ssl_derived() after ssl.sh runs. Call: build_ssl_derived
build_ssl_derived() {
    PORT_RPC_PROTOCOL="$([ -n "${SSL_CERT_PATH}" ] && echo "http,https" || echo "http")"
    PORT_WSS_PROTOCOL="$([ -n "${SSL_CERT_PATH}" ] && echo "ws,wss" || echo "ws")"
    SSL_VERIFY="$([ -n "${SSL_CERT_PATH}" ] && echo "0" || echo "1")"
    SSL_LINES=""
    if [ -n "${SSL_CERT_PATH}" ]; then
        SSL_LINES="ssl_key = ${SSL_CERT_PATH}/rippled.pem
ssl_cert = ${SSL_CERT_PATH}/rippled.crt"
        if [ -n "${SSL_CHAIN_ENABLED}" ] && [ "${SSL_CHAIN_ENABLED}" != "0" ]; then
            SSL_LINES="${SSL_LINES}
ssl_chain = ${SSL_CERT_PATH}/rippled.crt"
        fi
    fi
    export PORT_RPC_PROTOCOL PORT_WSS_PROTOCOL SSL_VERIFY SSL_LINES
}

# ---------------------------------------------------------------------------
# Optional [node_size]: tiny, small, medium, large, huge
# ---------------------------------------------------------------------------
NODE_SIZE_SECTION=""
if [ -n "${NODE_SIZE}" ]; then
NODE_SIZE_SECTION="[node_size]
${NODE_SIZE}"
fi
export NODE_SIZE_SECTION

# ---------------------------------------------------------------------------
# Debug logfile path
# ---------------------------------------------------------------------------
export DEBUG_LOGFILE="${DEBUG_LOGFILE:-/opt/xrpl/log/debug.log}"

# ---------------------------------------------------------------------------
# Optional [validation_quorum]
# ---------------------------------------------------------------------------
VALIDATION_QUORUM_SECTION=""
if [ -n "${VALIDATION_QUORUM}" ]; then
VALIDATION_QUORUM_SECTION="[validation_quorum]
${VALIDATION_QUORUM}"
fi
export VALIDATION_QUORUM_SECTION

# ---------------------------------------------------------------------------
# Optional [peers_max]
# ---------------------------------------------------------------------------
PEERS_MAX_SECTION=""
if [ -n "${PEERS_MAX}" ]; then
PEERS_MAX_SECTION="[peers_max]
${PEERS_MAX}"
fi
export PEERS_MAX_SECTION

# ---------------------------------------------------------------------------
# [fetch_depth] and [ledger_history]
# SIZE=FULL: both "full". Otherwise fetch_depth=full, ledger_history from LEDGER_RETENTION (config/defaults.sh)
# ---------------------------------------------------------------------------
if [ "${SIZE}" = "FULL" ]; then
    export FETCH_DEPTH="${FETCH_DEPTH:-full}"
    export LEDGER_HISTORY="${LEDGER_HISTORY:-full}"
else
    export FETCH_DEPTH="${FETCH_DEPTH:-full}"
    export LEDGER_HISTORY="${LEDGER_HISTORY:-${LEDGER_RETENTION:-512}}"
fi

# ---------------------------------------------------------------------------
# [sntp_servers]
# ---------------------------------------------------------------------------
export SNTP_SERVERS="${SNTP_SERVERS:-pool.ntp.org}"

# ---------------------------------------------------------------------------
# [node_db] NuDB path and options
# SIZE=FULL: path only (no online_delete or advisory_delete).
# Otherwise: path, advisory_delete, online_delete (from LEDGER_RETENTION, default 512).
# ---------------------------------------------------------------------------
export NODE_DB_TYPE="${NODE_DB_TYPE:-NuDB}"
export NODE_DB_PATH="${NODE_DB_PATH:-/opt/xrpl/db/nudb}"

if [ "${SIZE}" = "FULL" ]; then
    NODE_DB_OPTIONS="path=${NODE_DB_PATH}"
else
    export NODE_DB_ADVISORY_DELETE="${NODE_DB_ADVISORY_DELETE:-0}"
    export NODE_DB_ONLINE_DELETE="${NODE_DB_ONLINE_DELETE:-${LEDGER_RETENTION:-512}}"
    NODE_DB_OPTIONS="path=${NODE_DB_PATH}
advisory_delete=${NODE_DB_ADVISORY_DELETE}
online_delete=${NODE_DB_ONLINE_DELETE}"
fi
export NODE_DB_OPTIONS

# ---------------------------------------------------------------------------
# [database_path] and DATABASE_PATH_FULL (path + type lowercase)
# ---------------------------------------------------------------------------
DB_TYPE_LOWER="$(echo "${NODE_DB_TYPE}" | tr '[:upper:]' '[:lower:]')"
export DATABASE_PATH="${DATABASE_PATH:-/opt/xrpl/db}"
export DATABASE_PATH_FULL="${DATABASE_PATH}/${DB_TYPE_LOWER}"

# ---------------------------------------------------------------------------
# Optional [ledger_tx_tables] when NODE_DB_TYPE=Postgres
# ---------------------------------------------------------------------------
LEDGER_TX_TABLES_SECTION=""
if [ "${NODE_DB_TYPE}" = "Postgres" ]; then
LEDGER_TX_TABLES_SECTION="[ledger_tx_tables]
conninfo = ${PG_CONNINFO:-}
use_tx_tables = ${USE_TX_TABLES:-0}"
fi
export LEDGER_TX_TABLES_SECTION

# ---------------------------------------------------------------------------
# [rpc_startup] JSON array of RPC commands to run at startup
# ---------------------------------------------------------------------------
export RPC_STARTUP_CMDS="${RPC_STARTUP_CMDS:-{ \"command\": \"log_level\", \"severity\": \"info\" }}"

# ---------------------------------------------------------------------------
# Optional [validation_seed]
# ---------------------------------------------------------------------------
VALIDATION_SEED_SECTION=""
if [ -n "${VALIDATION_SEED}" ]; then
VALIDATION_SEED_SECTION="[validation_seed]
${VALIDATION_SEED}"
fi
export VALIDATION_SEED_SECTION

# ---------------------------------------------------------------------------
# [peer_private]: 0 or 1
# ---------------------------------------------------------------------------
export PEER_PRIVATE="${PEER_PRIVATE:-0}"

# ---------------------------------------------------------------------------
# Optional [validators_site]
# ---------------------------------------------------------------------------
VALIDATORS_SITE_SECTION=""
if [ -n "${VALIDATORS_SITE}" ]; then
VALIDATORS_SITE_SECTION="[validators_site]
${VALIDATORS_SITE}"
fi
export VALIDATORS_SITE_SECTION

# ---------------------------------------------------------------------------
# Optional [ips]: newline-separated peer list
# ---------------------------------------------------------------------------
IPS_SECTION=""
if [ -n "${IPS}" ]; then
IPS_SECTION="[ips]
${IPS}"
fi
export IPS_SECTION

# ---------------------------------------------------------------------------
# Optional [ips_fixed]
# ---------------------------------------------------------------------------
IPS_FIXED_SECTION=""
if [ -n "${IPS_FIXED}" ]; then
IPS_FIXED_SECTION="[ips_fixed]
${IPS_FIXED}"
fi
export IPS_FIXED_SECTION

# ---------------------------------------------------------------------------
# Optional [reporting] / [etl_source] when REPORTING_MODE is set
# ---------------------------------------------------------------------------
REPORTING_SECTION=""
if [ -n "${REPORTING_MODE}" ]; then
REPORTING_SECTION="[reporting]
etl_source

[etl_source]
source_grpc_port=${ETL_SOURCE_GRPC_PORT:-50051}
source_ws_port=${ETL_SOURCE_WS_PORT:-6005}
source_ip=${ETL_SOURCE_IP:-127.0.0.1}"
fi
export REPORTING_SECTION

