#!/bin/bash
# Shutdown handling for clio_server

shutdown() {
    log_info "Received shutdown signal, stopping clio_server..."
    if [ -n "${CLIO_PID:-}" ]; then
        kill -TERM "$CLIO_PID" 2>/dev/null || true
        wait "$CLIO_PID" 2>/dev/null || true
    fi
    exit 0
}

trap shutdown SIGTERM SIGINT
