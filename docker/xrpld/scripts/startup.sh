#!/bin/bash
# Startup for rippled (CONFIG_FILE from defaults.sh; use /etc/opt/ripple/rippled.cfg)

BIN="${RIPPLE_BIN:-/opt/xrpl/bin/rippled}"

# Function to start rippled
# @param config_file string Path to rippled.cfg (optional, defaults to CONFIG_FILE from defaults.sh)
# @param extra_args string Additional arguments to pass to rippled (optional)
start() {
    local config_file="${1:-${CONFIG_FILE:-/opt/xrpl/etc/xrpld.cfg}}"
    local extra_args="${2:-}"
    
    if [ ! -f "$config_file" ]; then
        log_error "Configuration file not found: $config_file"
        return 1
    fi
    
    if ! command -v "$BIN" >/dev/null 2>&1 && [ ! -x "$BIN" ]; then
        log_error "rippled binary not found or not executable: $BIN"
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

# Function to check if nginx is running
# @return 0 if running, 1 if not running
is_running() {
    if pgrep -f "$BIN" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to reload nginx configuration
# Sends HUP signal to nginx master process
reload() {
    if ! is_nginx_running; then
        log_error "Rippled is not running, cannot reload"
        return 1
    fi
    
    log_info "Reloading Rippled configuration"
    
    # Find nginx master process
    local master_pid=$(pgrep -f "$BIN.*master" | head -1)
    
    if [ -z "$master_pid" ]; then
        log_error "Could not find Rippled master process"
        return 1
    fi
    
    # Send HUP signal to reload configuration
    kill -HUP "$master_pid"
    
    if [ $? -eq 0 ]; then
        log_info "Rippled configuration reloaded successfully"
        return 0
    else
        log_error "Failed to reload Rippled configuration"
        return 1
    fi
}