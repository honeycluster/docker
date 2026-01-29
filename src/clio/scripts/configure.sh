#!/bin/bash
# Main execution logic for Clio: validation, envsubst injection, then config.json in CONFIG_DIR/etc

configure() {
    log_info "Starting Clio container entrypoint..."

    # Validate inputs first
    if ! validate_inputs; then
        log_error "Input validation failed, exiting..."
        exit 1
    fi

    # Check for envsubst
    check_envsubst

    # Inject variables into configuration files (templates -> CONFIG_DIR/etc, e.g. config.json)
    local conf_source_dir="${CONFIG_DIR}/templates"

    if [ -d "$conf_source_dir" ] && [ -n "$(find "$conf_source_dir" -type f ! -name "README.md" 2>/dev/null | head -1)" ]; then
        log_info "Found templates directory, injecting variables into config (config.json)"
        inject "$conf_source_dir" "$CONFIG_DIR/etc"
    else
        log_warn "No templates directory found, using existing configuration files without variable injection"
    fi

    log_info "Configuration complete"
}
