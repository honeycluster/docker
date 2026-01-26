#!/bin/bash
# Shutdown handling functions

# Function to handle graceful shutdown
shutdown() {
    log_info "Received shutdown signal, gracefully stopping nginx..."
    /usr/local/openresty/nginx/sbin/nginx -s quit
    exit 0
}

# Trap signals for graceful shutdown
trap shutdown SIGTERM SIGINT
