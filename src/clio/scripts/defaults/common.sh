#!/bin/bash
# Default environment variable values for Clio server.
# Override via environment variables. All are exported for envsubst and child processes.
# See docs/CONFIGURATION.md for full config reference.

# ---------------------------------------------------------------------------
# Paths: CONFIG_DIR (config root), CONFIG_FILE
# ---------------------------------------------------------------------------
export CONFIG_DIR="${CONFIG_DIR:-/opt/clio}"
export CONFIG_FILE="${CONFIG_FILE:-$CONFIG_DIR/etc/config.json}"

# ---------------------------------------------------------------------------
# SSL input variables (used by ssl.sh and build_ssl_derived)
# CLIO_CERTS_DIR: overridable; SSL_CERT_PATH set by user or ssl.sh when generating/found.
# ---------------------------------------------------------------------------
export CLIO_CERTS_DIR="${CLIO_CERTS_DIR:-$CONFIG_DIR/certs}"
export SSL_GENERATE="${SSL_GENERATE:-0}"
export SSL_GENERATE_OVERWRITE="${SSL_GENERATE_OVERWRITE:-0}"
export SSL_CERT_CN="${SSL_CERT_CN:-localhost}"
export SSL_CERT_DAYS="${SSL_CERT_DAYS:-365}"
export SSL_CERT_SUBJ="${SSL_CERT_SUBJ:-}"
export SSL_CHAIN_ENABLED="${SSL_CHAIN_ENABLED:-0}"

# SSL-derived: paths for config.json ssl_cert_file / ssl_key_file (empty when no SSL)
build_ssl_derived() {
    if [ -n "${SSL_CERT_PATH}" ]; then
        export SSL_CERT_FILE="${SSL_CERT_PATH}/clio.crt"
        export SSL_KEY_FILE="${SSL_CERT_PATH}/clio.pem"
    else
        export SSL_CERT_FILE=""
        export SSL_KEY_FILE=""
    fi
}

# ---------------------------------------------------------------------------
# database.type, database.cassandra.* (CONFIGURATION.md)
# ---------------------------------------------------------------------------
export DATABASE_TYPE="${DATABASE_TYPE:-cassandra}"
export CASSANDRA_CONTACT_POINTS="${CASSANDRA_CONTACT_POINTS:-127.0.0.1}"
export CASSANDRA_PORT="${CASSANDRA_PORT:-9042}"
export CASSANDRA_KEYSPACE="${CASSANDRA_KEYSPACE:-clio}"
export CASSANDRA_REPLICATION_FACTOR="${CASSANDRA_REPLICATION_FACTOR:-1}"
export CASSANDRA_TABLE_PREFIX="${CASSANDRA_TABLE_PREFIX:-}"
export CASSANDRA_MAX_WRITE_REQUESTS_OUTSTANDING="${CASSANDRA_MAX_WRITE_REQUESTS_OUTSTANDING:-25000}"
export CASSANDRA_MAX_READ_REQUESTS_OUTSTANDING="${CASSANDRA_MAX_READ_REQUESTS_OUTSTANDING:-30000}"
export CASSANDRA_THREADS="${CASSANDRA_THREADS:-8}"
export CASSANDRA_PROVIDER="${CASSANDRA_PROVIDER:-cassandra}"
export CASSANDRA_CORE_CONNECTIONS_PER_HOST="${CASSANDRA_CORE_CONNECTIONS_PER_HOST:-1}"
export CASSANDRA_WRITE_BATCH_SIZE="${CASSANDRA_WRITE_BATCH_SIZE:-20}"
export CASSANDRA_USERNAME="${CASSANDRA_USERNAME:-}"
export CASSANDRA_PASSWORD="${CASSANDRA_PASSWORD:-}"

# ---------------------------------------------------------------------------
# etl_sources.[]: ETL source (rippled) IP and ports (CONFIGURATION.md)
# ---------------------------------------------------------------------------
export ETL_SOURCE_IP="${ETL_SOURCE_IP:-127.0.0.1}"
export ETL_SOURCE_WS_PORT="${ETL_SOURCE_WS_PORT:-6006}"
export ETL_SOURCE_GRPC_PORT="${ETL_SOURCE_GRPC_PORT:-50051}"

# ---------------------------------------------------------------------------
# server.* (CONFIGURATION.md)
# ---------------------------------------------------------------------------
export SERVER_IP="${SERVER_IP:-0.0.0.0}"
export SERVER_PORT="${SERVER_PORT:-51233}"
export SERVER_MAX_QUEUE_SIZE="${SERVER_MAX_QUEUE_SIZE:-500}"
export SERVER_ADMIN_PASSWORD="${SERVER_ADMIN_PASSWORD:-}"
export SERVER_LOCAL_ADMIN="${SERVER_LOCAL_ADMIN:-false}"
export SERVER_PROCESSING_POLICY="${SERVER_PROCESSING_POLICY:-parallel}"
export SERVER_PARALLEL_REQUESTS_LIMIT="${SERVER_PARALLEL_REQUESTS_LIMIT:-10}"
export SERVER_WS_MAX_SENDING_QUEUE_SIZE="${SERVER_WS_MAX_SENDING_QUEUE_SIZE:-1500}"

# ---------------------------------------------------------------------------
# allow_no_etl, forwarding, rpc, dos_guard, workers, graceful_period
# ---------------------------------------------------------------------------
export ALLOW_NO_ETL="${ALLOW_NO_ETL:-false}"
export FORWARDING_CACHE_TIMEOUT="${FORWARDING_CACHE_TIMEOUT:-0.25}"
export FORWARDING_REQUEST_TIMEOUT="${FORWARDING_REQUEST_TIMEOUT:-10.0}"
export RPC_CACHE_TIMEOUT="${RPC_CACHE_TIMEOUT:-0.5}"
export DOS_GUARD_MAX_FETCHES="${DOS_GUARD_MAX_FETCHES:-1000000}"
export DOS_GUARD_MAX_CONNECTIONS="${DOS_GUARD_MAX_CONNECTIONS:-20}"
export DOS_GUARD_MAX_REQUESTS="${DOS_GUARD_MAX_REQUESTS:-20}"
export DOS_GUARD_SWEEP_INTERVAL="${DOS_GUARD_SWEEP_INTERVAL:-1}"
export WORKERS="${WORKERS:-8}"
export GRACEFUL_PERIOD="${GRACEFUL_PERIOD:-10.0}"

# ---------------------------------------------------------------------------
# log.* (CONFIGURATION.md)
# ---------------------------------------------------------------------------
export LOG_LEVEL="${LOG_LEVEL:-info}"
export LOG_ENABLE_CONSOLE="${LOG_ENABLE_CONSOLE:-true}"
export LOG_DIRECTORY="${LOG_DIRECTORY:-/opt/clio/log}"
export LOG_ROTATION_SIZE="${LOG_ROTATION_SIZE:-2048}"
export LOG_DIRECTORY_MAX_FILES="${LOG_DIRECTORY_MAX_FILES:-25}"
export LOG_TAG_STYLE="${LOG_TAG_STYLE:-uint}"

# ---------------------------------------------------------------------------
# cache.* (CONFIGURATION.md)
# ---------------------------------------------------------------------------
export CACHE_NUM_DIFFS="${CACHE_NUM_DIFFS:-32}"
export CACHE_NUM_MARKERS="${CACHE_NUM_MARKERS:-48}"
export CACHE_PAGE_FETCH_SIZE="${CACHE_PAGE_FETCH_SIZE:-512}"
export CACHE_LOAD="${CACHE_LOAD:-async}"
export CACHE_FILE_PATH="${CACHE_FILE_PATH:-./cache.bin}"
export CACHE_FILE_MAX_SEQUENCE_AGE="${CACHE_FILE_MAX_SEQUENCE_AGE:-5000}"

# ---------------------------------------------------------------------------
# prometheus, extractor_threads, read_only, api_version
# ---------------------------------------------------------------------------
export PROMETHEUS_ENABLED="${PROMETHEUS_ENABLED:-true}"
export PROMETHEUS_COMPRESS_REPLY="${PROMETHEUS_COMPRESS_REPLY:-true}"
export EXTRACTOR_THREADS="${EXTRACTOR_THREADS:-8}"
export READ_ONLY="${READ_ONLY:-false}"
export API_VERSION_DEFAULT="${API_VERSION_DEFAULT:-1}"
export API_VERSION_MIN="${API_VERSION_MIN:-1}"
export API_VERSION_MAX="${API_VERSION_MAX:-2}"
