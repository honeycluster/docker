#!/bin/bash
# Validation functions for Clio server

# Track validation errors
VALIDATION_ERRORS=0

# ---------------------------------------------------------------------------
# Default value lookup (defaults/common.sh, config/defaults.sh)
# ---------------------------------------------------------------------------
# Returns the default value for VAR if defined as VAR="${VAR:-default}" or export VAR="${VAR:-default}"; otherwise empty.
_get_default_value() {
    local var_name="$1"
    local defaults_file=""

    for candidate in "${SCRIPTS_DIR}/defaults/common.sh" "${SCRIPTS_DIR}/config/defaults.sh" "${SCRIPTS_DIR}/defaults.sh"; do
        if [ -n "$SCRIPTS_DIR" ] && [ -f "${candidate}" ]; then
            defaults_file="${candidate}"
            break
        fi
    done

    [ -n "$defaults_file" ] || { echo ""; return 1; }

    # Match: VAR="..." or export VAR="..." with ${VAR:-...}
    local default_line
    default_line=$(grep -E "^(export[[:space:]]+)?${var_name}=\"\${${var_name}:-" "$defaults_file" 2>/dev/null | head -1)
    [ -z "$default_line" ] && default_line=$(grep -E "^(export[[:space:]]+)?${var_name}='\${${var_name}:-" "$defaults_file" 2>/dev/null | head -1)

    if [ -z "$default_line" ]; then
        echo ""
        return 1
    fi

    local default_value
    default_value=$(echo "$default_line" | sed -n "s/.*:-\([^}]*\)}.*/\1/p" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    [[ "$default_value" =~ ^\".*\"$ ]] && default_value=$(echo "$default_value" | sed 's/^"\(.*\)"$/\1/')
    [[ "$default_value" =~ ^\'.*\'$ ]] && default_value=$(echo "$default_value" | sed "s/^'\(.*\)'$/\1/")

    while [[ "$default_value" =~ \$\{([^}]+)\} ]]; do
        local ref_var="${BASH_REMATCH[1]}"
        [ -n "${!ref_var}" ] && default_value=$(echo "$default_value" | sed "s/\${${ref_var}}/${!ref_var}/") || break
    done

    echo "$default_value"
    return 0
}

# Function to apply default value if variable is unset
_apply_default_if_unset() {
    local var_name="$1"
    local var_value="${!var_name}"
    
    # If variable is already set (non-empty), nothing to do
    if [ -n "$var_value" ]; then
        return 0
    fi
    
    # Check if default exists in defaults (e.g. defaults/common.sh)
    # Note: defaults are already sourced, so if var is empty, it means either:
    # 1. Default is empty string (optional variable) - VAR="${VAR:-}"
    # 2. No default exists - no line for VAR in defaults
    # We check the file to see which case it is
    local default_value
    if default_value=$(_get_default_value "$var_name"); then
        # Default exists in defaults.sh (return code 0)
        if [ -n "$default_value" ]; then
            # Non-empty default - apply it and log
            eval "export ${var_name}=\"${default_value}\""
            log_info "Using default value for '$var_name': '$default_value'"
        fi
        # If default is empty string, variable is optional - no error, no log needed
        return 0
    fi
    
    # No default found in defaults
    return 1
}

# Function to validate a required variable
validate_required() {
    local var_name="$1"
    local var_value="${!var_name}"
    
    # First, try to apply default if unset
    if [ -z "$var_value" ]; then
        if _apply_default_if_unset "$var_name"; then
            # Default was applied, get the new value
            var_value="${!var_name}"
        else
            # No default available, this is an error
            log_error "Required environment variable '$var_name' is not set and has no default value"
            VALIDATION_ERRORS=$((VALIDATION_ERRORS + 1))
            return 1
        fi
    fi
    
    return 0
}

# Function to validate a port number
validate_port() {
    local var_name="$1"
    local port_value="${!var_name}"
    
    # Apply default if unset
    if [ -z "$port_value" ]; then
        _apply_default_if_unset "$var_name"
        port_value="${!var_name}"
    fi
    
    if [ -z "$port_value" ]; then
        return 0  # Optional port (no default and not set)
    fi
    
    # Check if it's a number
    if ! [[ "$port_value" =~ ^[0-9]+$ ]]; then
        log_error "Invalid port number for '$var_name': '$port_value' (must be numeric)"
        VALIDATION_ERRORS=$((VALIDATION_ERRORS + 1))
        return 1
    fi
    
    # Check if port is in valid range (1-65535)
    if [ "$port_value" -lt 1 ] || [ "$port_value" -gt 65535 ]; then
        log_error "Invalid port number for '$var_name': '$port_value' (must be between 1 and 65535)"
        VALIDATION_ERRORS=$((VALIDATION_ERRORS + 1))
        return 1
    fi
    
    return 0
}

# Function to validate a directory path (checks if it exists or can be created)
validate_directory() {
    local var_name="$1"
    local dir_path="${!var_name}"
    local must_exist="${2:-false}"
    
    if [ -z "$dir_path" ]; then
        return 0  # Optional directory
    fi
    
    if [ "$must_exist" = "true" ] && [ ! -d "$dir_path" ]; then
        log_error "Required directory '$var_name' does not exist: '$dir_path'"
        VALIDATION_ERRORS=$((VALIDATION_ERRORS + 1))
        return 1
    fi
    
    # Check if parent directory exists and is writable (for creating new directories)
    local parent_dir=$(dirname "$dir_path")
    if [ ! -d "$parent_dir" ]; then
        log_error "Parent directory for '$var_name' does not exist: '$parent_dir'"
        VALIDATION_ERRORS=$((VALIDATION_ERRORS + 1))
        return 1
    fi
    
    if [ ! -w "$parent_dir" ]; then
        log_error "Parent directory for '$var_name' is not writable: '$parent_dir'"
        VALIDATION_ERRORS=$((VALIDATION_ERRORS + 1))
        return 1
    fi
    
    return 0
}

# Function to validate a file path exists
validate_file() {
    local var_name="$1"
    local file_path="${!var_name}"
    
    if [ -z "$file_path" ]; then
        return 0  # Optional file
    fi
    
    if [ ! -f "$file_path" ]; then
        log_error "Required file '$var_name' does not exist: '$file_path'"
        VALIDATION_ERRORS=$((VALIDATION_ERRORS + 1))
        return 1
    fi
    
    return 0
}

# Function to validate a boolean value
validate_boolean() {
    local var_name="$1"
    local var_value="${!var_name}"
    
    if [ -z "$var_value" ]; then
        return 0  # Optional boolean
    fi
    
    case "$var_value" in
        true|false|on|off|1|0|yes|no)
            return 0
            ;;
        *)
            log_warn "Invalid boolean value for '$var_name': '$var_value' (expected: true/false/on/off/1/0/yes/no)"
            return 0  # Warning only, not an error
            ;;
    esac
}

# Function to validate a URL format
validate_url() {
    local var_name="$1"
    local url_value="${!var_name}"
    
    if [ -z "$url_value" ]; then
        return 0  # Optional URL
    fi
    
    # Basic URL validation (starts with http://, https://, ws://, or wss://)
    if ! [[ "$url_value" =~ ^(http|https|ws|wss):// ]]; then
        log_warn "URL format for '$var_name' may be invalid: '$url_value' (should start with http://, https://, ws://, or wss://)"
        return 0  # Warning only
    fi
    
    return 0
}

# Function to validate that a command/tool exists
validate_command() {
    local command="$1"
    local description="${2:-$command}"
    
    if ! command -v "$command" &> /dev/null; then
        log_error "Required command '$description' is not available"
        VALIDATION_ERRORS=$((VALIDATION_ERRORS + 1))
        return 1
    fi
    
    return 0
}

# Function to validate DNS resolver format (optional)
validate_dns_resolver() {
    local resolver="${DNS_RESOLVER}"
    [ -z "$resolver" ] && return 0
    local valid=true
    for ip in $resolver; do
        [[ "$ip" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]] || { valid=false; break; }
    done
    [ "$valid" = "false" ] && log_warn "DNS resolver format may be invalid: '$resolver' (expected IP or space-separated IPs)"
    return 0
}

# ---------------------------------------------------------------------------
# Main validation function (Clio)
# ---------------------------------------------------------------------------
validate_inputs() {
    log_info "Validating inputs and prerequisites..."

    # Required commands
    validate_command "envsubst" "envsubst (gettext-base)"

    # Required: CONFIG_DIR (defaults in common.sh; inject output -> CONFIG_DIR/etc/config.json)
    validate_required "CONFIG_DIR"
    validate_directory "CONFIG_DIR" "false"

    # Clio server and ETL ports
    validate_port "SERVER_PORT"
    validate_port "CASSANDRA_PORT"
    validate_port "ETL_SOURCE_WS_PORT"
    validate_port "ETL_SOURCE_GRPC_PORT"

    # Booleans
    validate_boolean "SSL_GENERATE"
    validate_boolean "SSL_GENERATE_OVERWRITE"
    validate_boolean "ALLOW_NO_ETL"
    validate_boolean "SERVER_LOCAL_ADMIN"
    validate_boolean "READ_ONLY"
    validate_boolean "PROMETHEUS_ENABLED"

    # Optional directories (when set)
    validate_directory "CLIO_CERTS_DIR" "false"
    validate_directory "LOG_DIRECTORY" "false"

    if [ $VALIDATION_ERRORS -eq 0 ]; then
        log_info "Input validation passed"
        return 0
    else
        log_error "Input validation failed with $VALIDATION_ERRORS error(s)"
        return 1
    fi
}
