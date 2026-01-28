#!/bin/bash
# Environment variable substitution utilities

# Function to check if envsubst is available
check_envsubst() {
    if ! command -v envsubst &> /dev/null; then
        log_error "envsubst not found. Installing gettext-base..."
        apt-get update -qq && apt-get install -y -qq gettext-base
    fi
}

# Function to generate list of environment variables for envsubst
# This creates a safe list of variables that should be substituted
generate_var_list() {
    # Get all environment variables
    local vars=$(env | cut -d= -f1)
    
    # Filter and format: ${VAR_NAME}
    # Only include variables that match common patterns (uppercase, underscore)
    echo "$vars" | grep -E '^[A-Z][A-Z0-9_]*$' | sed 's/^/${/;s/$/}/' | tr '\n' ' '
}
