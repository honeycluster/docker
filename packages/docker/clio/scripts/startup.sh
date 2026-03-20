#!/bin/bash
# Startup for clio_server (CONFIG_FILE defaults to /opt/clio/etc/config.json)

BIN="${CLIO_BIN:-/opt/clio/bin/clio_server}"

start() {
    local config_file="${1:-${CONFIG_FILE:-/opt/clio/etc/config.json}}"
    local extra_args="${2:-}"

    if [ ! -f "$config_file" ]; then
        log_error "Configuration file not found: $config_file"
        return 1
    fi

    if [ ! -x "$BIN" ] && ! command -v "$BIN" >/dev/null 2>&1; then
        log_error "clio_server not found or not executable: $BIN"
        return 1
    fi

    log_info "Starting clio_server with config: $config_file"

    local cmd_args=("--conf" "$config_file")
    if [ -n "$extra_args" ]; then
        read -ra extra_array <<< "$extra_args"
        cmd_args+=("${extra_array[@]}")
    fi

    exec "$BIN" "${cmd_args[@]}"
}

is_running() {
    if pgrep -f "$BIN" >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

reload() {
    if ! is_running; then
        log_error "clio_server is not running, cannot reload"
        return 1
    fi
    log_error "clio_server does not support config reload; restart the container to apply config changes"
    return 1
}
