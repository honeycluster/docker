#!/bin/bash
# Parse [debug_logfile] from xrpld.cfg and update the logrotate config to match

CONFIG_FILE="${CONFIG_FILE:-/opt/xrpl/etc/xrpld.cfg}"
LOGROTATE_CONF="/etc/logrotate.d/xrpld"
DEFAULT_LOG_DIR="/opt/xrpl/log"

# Read the [debug_logfile] path from a rendered xrpld.cfg
# Format: [debug_logfile]\n/path/to/debug.log
get_log_dir() {
    local config_file="$1"

    if [ ! -f "$config_file" ]; then
        log_warn "Config file not found: $config_file — using default log dir"
        echo "$DEFAULT_LOG_DIR"
        return 0
    fi

    local in_section=0
    while IFS= read -r line; do
        local trimmed="${line#"${line%%[![:space:]]*}"}"
        trimmed="${trimmed%"${trimmed##*[![:space:]]}"}"

        if [ "$trimmed" = "[debug_logfile]" ]; then
            in_section=1
            continue
        fi

        # New section — stop
        if [ $in_section -eq 1 ] && [[ "$trimmed" == \[*\] ]]; then
            break
        fi

        # First non-empty, non-comment line in the section is the log path
        if [ $in_section -eq 1 ] && [ -n "$trimmed" ] && [[ "$trimmed" != \#* ]]; then
            dirname "$trimmed"
            return 0
        fi
    done < "$config_file"

    echo "$DEFAULT_LOG_DIR"
}

# Update the logrotate config with the log directory from xrpld.cfg
configure_logrotate() {
    if [ ! -f "$LOGROTATE_CONF" ]; then
        log_warn "Logrotate config not found at $LOGROTATE_CONF — skipping"
        return 0
    fi

    local log_dir
    log_dir="$(get_log_dir "$CONFIG_FILE")"

    mkdir -p "$log_dir"

    # Replace the glob path on the first line
    sed -i "1s|^[[:space:]]*/[^ {]*\*\.log|${log_dir}/*.log|" "$LOGROTATE_CONF"

    log_info "Logrotate configured for: ${log_dir}/*.log"
}
