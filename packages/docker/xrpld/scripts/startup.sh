#!/bin/bash
# Startup for xrpld/rippled (CONFIG_FILE from defaults.sh; use /opt/xrpl/etc/xrpld.cfg)

BIN="${RIPPLE_BIN:-/opt/xrpl/bin/xrpld}"

# Function to start xrpld/rippled
# @param config_file string Path to xrpld.cfg (optional, defaults to CONFIG_FILE from defaults.sh)
# @param extra_args string Additional arguments to pass to xrpld/rippled (optional)
start() {
    local config_file="${1:-${CONFIG_FILE:-/opt/xrpl/etc/xrpld.cfg}}"
    local extra_args="${2:-}"
    
    if [ ! -f "$config_file" ]; then
        log_error "Configuration file not found: $config_file"
        return 1
    fi

    if ! command -v "$BIN" >/dev/null 2>&1 && [ ! -x "$BIN" ]; then
        log_error "xrpld/rippled binary not found or not executable: $BIN"
        return 1
    fi
    
    log_info "Starting rippled with config: $config_file"
    
    local cmd_args=("--conf" "$config_file")
    if [ -n "$extra_args" ]; then
        read -ra extra_array <<< "$extra_args"
        cmd_args+=("${extra_array[@]}")
    fi
    
    exec "$BIN" "${cmd_args[@]}"
}

# Function to check if xrpld/rippled is running
# @return 0 if running, 1 if not running
is_running() {
    if pgrep -f "$BIN" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to reload xrpld/rippled configuration
reload() {
    if ! is_running; then
        log_error "xrpld/rippled is not running, cannot reload"
        return 1
    fi
    log_error "xrpld/rippled does not support config reload; restart the container to apply config changes"
    return 1
}