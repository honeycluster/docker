#!/bin/bash
# Main execution logic

# Configure logrotate from templates using inject; output to /etc/logrotate.d (as "xrpld")
configure_logrotate() {
    local source_dir="${CONFIG_DIR}/templates/logrotate"
    local output_dir="/etc/logrotate.d"

    if [ ! -d "$source_dir" ]; then
        log_warn "Logrotate template directory not found at $source_dir, skipping logrotate configuration"
        return 0
    fi

    if [ -z "$(find "$source_dir" -type f ! -name "README.md" 2>/dev/null | head -1)" ]; then
        log_warn "No logrotate template files in $source_dir, skipping"
        return 0
    fi

    mkdir -p "$output_dir"
    inject "$source_dir" "$output_dir"

    # Rename xrpld.template -> xrpld so logrotate uses the expected config name (overwrites existing)
    if [ -f "${output_dir}/xrpld.template" ]; then
        mv -f "${output_dir}/xrpld.template" "${output_dir}/xrpld"
        log_info "Logrotate configuration written to ${output_dir}/xrpld"
    fi
}

# Main execution
configure() {
    log_info "Starting rippled container entrypoint..."

    # Validate inputs first
    if ! validate_inputs; then
        log_error "Input validation failed, exiting..."
        exit 1
    fi

    # Check for envsubst
    check_envsubst

    # Inject variables into configuration files
    # The conf subdirectory contains all configuration files that need variable injection
    # Files are processed from the conf subdirectory and output to CONFIG_DIR
    local conf_source_dir="${CONFIG_DIR}/templates"

    if [ -d "$conf_source_dir" ] && [ -n "$(find "$conf_source_dir" -type f ! -name "README.md" 2>/dev/null | head -1)" ]; then
        log_info "Found conf directory, injecting variables into all configuration files"
        inject "$conf_source_dir" "$CONFIG_DIR/etc"
    else
        log_warn "No conf directory found, using existing configuration files without variable injection"
    fi

    # Configure logrotate
    configure_logrotate



    log_info "Configuration complete"
}
