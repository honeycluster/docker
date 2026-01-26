#!/bin/bash
# Main execution logic

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

    
    log_info "Configuration complete"
}
